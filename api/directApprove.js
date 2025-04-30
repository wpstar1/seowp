const prisma = require('./prisma');

module.exports = async (req, res) => {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // OPTIONS 요청 처리 (CORS preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // GET 요청이 아닌 경우 에러 반환
  if (req.method !== 'GET') {
    return res.status(405).json({ error: '허용되지 않는 메소드입니다.' });
  }
  
  try {
    // 쿼리 파라미터 받기
    const { username, depositName, action = 'approve' } = req.query;
    
    if (!username) {
      return res.status(400).send(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <title>오류</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
              body { font-family: Arial, sans-serif; text-align: center; margin-top: 50px; }
              .error { color: red; }
              .container { max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1 class="error">❌ 오류</h1>
              <p>사용자명이 필요합니다.</p>
            </div>
          </body>
        </html>
      `);
    }
    
    // 사용자 확인
    const user = await prisma.user.findUnique({
      where: { username }
    });
    
    // 사용자가 없는 경우
    if (!user) {
      // 사용자 자동 생성 (텔레그램에서 온 요청은 사용자가 데이터베이스에 없을 수 있음)
      if (action === 'approve' && username && depositName) {
        // 임시 비밀번호 생성 (사용자가 나중에 변경해야 함)
        const tempPassword = Math.random().toString(36).substring(2, 8);
        
        await prisma.user.create({
          data: {
            username,
            password: tempPassword,
            depositName,
            membershipType: 'vip',
            vipStatus: 'approved',
            membershipExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30일 후
          }
        });
        
        return res.status(200).send(`
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="UTF-8">
              <title>VIP 승인 완료</title>
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <style>
                body { font-family: Arial, sans-serif; text-align: center; margin-top: 50px; }
                .success { color: green; }
                .container { max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px; }
                .password { background-color: #f0f0f0; padding: 10px; border-radius: 5px; font-family: monospace; }
              </style>
            </head>
            <body>
              <div class="container">
                <h1 class="success">✅ VIP 승인 완료</h1>
                <p>사용자 <strong>${username}</strong>의 계정이 생성되고 VIP로 승인되었습니다.</p>
                <p>임시 비밀번호:</p>
                <div class="password">${tempPassword}</div>
                <p>사용자에게 이 비밀번호를 전달해주세요.</p>
                <p><a href="/">메인 페이지로 돌아가기</a></p>
              </div>
            </body>
          </html>
        `);
      }
      
      return res.status(404).send(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <title>사용자 없음</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
              body { font-family: Arial, sans-serif; text-align: center; margin-top: 50px; }
              .warning { color: orange; }
              .container { max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1 class="warning">⚠️ 사용자 없음</h1>
              <p>사용자 <strong>${username}</strong>을(를) 찾을 수 없습니다.</p>
              <p><a href="/">메인 페이지로 돌아가기</a></p>
            </div>
          </body>
        </html>
      `);
    }
    
    // VIP 승인 처리
    if (action === 'approve') {
      // 이미 VIP인 경우
      if (user.membershipType === 'vip' && user.vipStatus === 'approved') {
        return res.status(200).send(`
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="UTF-8">
              <title>이미 VIP 회원</title>
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <style>
                body { font-family: Arial, sans-serif; text-align: center; margin-top: 50px; }
                .info { color: blue; }
                .container { max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px; }
              </style>
            </head>
            <body>
              <div class="container">
                <h1 class="info">ℹ️ 이미 VIP 회원</h1>
                <p>사용자 <strong>${username}</strong>은(는) 이미 VIP 회원입니다.</p>
                <p><a href="/">메인 페이지로 돌아가기</a></p>
              </div>
            </body>
          </html>
        `);
      }
      
      // VIP로 업그레이드
      await prisma.user.update({
        where: { username },
        data: {
          membershipType: 'vip',
          vipStatus: 'approved',
          depositName: depositName || user.depositName,
          membershipExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30일 후
        }
      });
      
      return res.status(200).send(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <title>VIP 승인 완료</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
              body { font-family: Arial, sans-serif; text-align: center; margin-top: 50px; }
              .success { color: green; }
              .container { max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1 class="success">✅ VIP 승인 완료</h1>
              <p>사용자 <strong>${username}</strong>의 VIP 승인이 완료되었습니다.</p>
              <p>VIP 기간: 30일</p>
              <p><a href="/">메인 페이지로 돌아가기</a></p>
            </div>
          </body>
        </html>
      `);
    }
    
    // VIP 거절 처리
    else if (action === 'reject') {
      await prisma.user.update({
        where: { username },
        data: {
          vipStatus: 'rejected'
        }
      });
      
      return res.status(200).send(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <title>VIP 거절</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
              body { font-family: Arial, sans-serif; text-align: center; margin-top: 50px; }
              .rejected { color: red; }
              .container { max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1 class="rejected">❌ VIP 거절</h1>
              <p>사용자 <strong>${username}</strong>의 VIP 신청이 거절되었습니다.</p>
              <p><a href="/">메인 페이지로 돌아가기</a></p>
            </div>
          </body>
        </html>
      `);
    }
    
    // 잘못된 액션
    else {
      return res.status(400).send(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <title>잘못된 요청</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
              body { font-family: Arial, sans-serif; text-align: center; margin-top: 50px; }
              .error { color: red; }
              .container { max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1 class="error">❌ 잘못된 요청</h1>
              <p>지원하지 않는 액션입니다.</p>
              <p><a href="/">메인 페이지로 돌아가기</a></p>
            </div>
          </body>
        </html>
      `);
    }
    
  } catch (error) {
    console.error('VIP 승인 처리 중 오류:', error);
    
    return res.status(500).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>서버 오류</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: Arial, sans-serif; text-align: center; margin-top: 50px; }
            .error { color: red; }
            .container { max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1 class="error">❌ 서버 오류</h1>
            <p>VIP 승인 처리 중 오류가 발생했습니다.</p>
            <p>오류 메시지: ${error.message}</p>
            <p><a href="/">메인 페이지로 돌아가기</a></p>
          </div>
        </body>
      </html>
    `);
  }
};
