// Vercel 서버리스 함수 - VIP 승인/거절 처리
// 외부 의존성 제거로 서버리스 환경에서 안정적으로 동작

// Vercel 서버리스 함수 핸들러
module.exports = async (req, res) => {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // OPTIONS 요청 처리 (프리플라이트 요청)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { requestId, action, userId, email } = req.query;
    
    // 파라미터 유효성 검사
    if (!requestId || !action) {
      return res.status(400).send(`
        <html>
          <head>
            <title>오류 발생</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
              body { font-family: Arial, sans-serif; text-align: center; margin-top: 50px; }
              .error { color: red; }
              .container { max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1 class="error">⚠️ 파라미터 오류</h1>
              <p>필수 파라미터가 누락되었습니다.</p>
              <p>필요한 파라미터: requestId, action</p>
            </div>
          </body>
        </html>
      `);
    }
    
    // 간단한 승인/거절 처리
    const isApproved = action === 'approve';
    
    // 로그 기록
    console.log(`VIP 요청 처리: ${isApproved ? '승인' : '거절'}`);
    console.log(`- 요청 ID: ${requestId}`);
    console.log(`- 사용자 ID: ${userId || '알 수 없음'}`);
    console.log(`- 이메일: ${email || '알 수 없음'}`);
    
    // 관리자에게 HTML 응답
    if (isApproved) {
      return res.send(`
        <html>
          <head>
            <title>VIP 회원 승인</title>
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
              <p>이메일: ${email || '알 수 없음'}</p>
              <p>사용자 ID: ${userId || requestId.split('_').pop() || '알 수 없음'}</p>
              <p>승인 시간: ${new Date().toLocaleString()}</p>
              <p>이 창은 닫으셔도 됩니다.</p>
            </div>
          </body>
        </html>
      `);
    } else {
      return res.send(`
        <html>
          <head>
            <title>VIP 회원 거절</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
              body { font-family: Arial, sans-serif; text-align: center; margin-top: 50px; }
              .rejected { color: red; }
              .container { max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1 class="rejected">❌ VIP 승인 거절</h1>
              <p>이메일: ${email || '알 수 없음'}</p>
              <p>사용자 ID: ${userId || requestId.split('_').pop() || '알 수 없음'}</p>
              <p>거절 시간: ${new Date().toLocaleString()}</p>
              <p>이 창은 닫으셔도 됩니다.</p>
            </div>
          </body>
        </html>
      `);
    }
  } catch (error) {
    console.error('처리 중 오류:', error);
    
    return res.status(500).send(`
      <html>
        <head>
          <title>오류 발생</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: Arial, sans-serif; text-align: center; margin-top: 50px; }
            .error { color: red; }
            .container { max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1 class="error">⚠️ 오류 발생</h1>
            <p>처리 중 오류가 발생했습니다: ${error.message}</p>
            <p>관리자에게 문의하세요.</p>
          </div>
        </body>
      </html>
    `);
  }
};
