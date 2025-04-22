// Vercel 서버리스 함수 - VIP 승인/거절 처리
const admin = require('firebase-admin');
const { handleApproval } = require('../server/telegramBot');

// Firebase 초기화가 되어 있지 않은 경우에만 초기화
let firebaseInitialized = false;
if (!admin.apps.length) {
  // 환경 변수에서 Firebase 설정을 가져와 초기화
  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      // Vercel 환경에서는 환경 변수에 저장된 서비스 계정 정보 사용
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      firebaseInitialized = true;
      console.log('Firebase가 API에서 초기화되었습니다.');
    } else {
      console.warn('FIREBASE_SERVICE_ACCOUNT 환경 변수가 설정되지 않았습니다.');
    }
  } catch (error) {
    console.error('Firebase 초기화 오류:', error);
  }
}

// 간단한 사용자 상태 관리 (Firebase 미사용시)
const userStatusMap = new Map();

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
      return res.status(400).json({ 
        success: false, 
        message: '필수 파라미터가 누락되었습니다.' 
      });
    }
    
    // Firebase가 초기화되지 않은 경우 간단한 대체 로직
    if (!firebaseInitialized) {
      console.log('Firebase가 초기화되지 않아 메모리 기반 상태 관리 사용');
      
      // 테스트용 간단한 로직
      const isApproved = action === 'approve';
      
      if (isApproved) {
        // 테스트용 승인 처리
        userStatusMap.set(userId || requestId.split('_').pop(), {
          membershipType: 'vip',
          email: email || 'unknown@example.com',
          approvedAt: new Date().toISOString(),
          expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        });
        
        // 관리자에게 응답
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
                <p>사용자 ID: ${userId || requestId.split('_').pop()}</p>
                <p>승인 시간: ${new Date().toLocaleString()}</p>
                <p>이 창은 닫으셔도 됩니다.</p>
              </div>
            </body>
          </html>
        `);
      } else {
        // 테스트용 거절 처리
        userStatusMap.set(userId || requestId.split('_').pop(), {
          membershipType: 'regular',
          email: email || 'unknown@example.com',
          rejectedAt: new Date().toISOString()
        });
        
        // 관리자에게 응답
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
                <p>사용자 ID: ${userId || requestId.split('_').pop()}</p>
                <p>거절 시간: ${new Date().toLocaleString()}</p>
                <p>이 창은 닫으셔도 됩니다.</p>
              </div>
            </body>
          </html>
        `);
      }
    }
    
    // Firebase 기반 정상 처리
    const isApproved = action === 'approve';
    await handleApproval(requestId, isApproved);
    
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
              <p>요청 ID: ${requestId}</p>
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
              <p>요청 ID: ${requestId}</p>
              <p>거절 시간: ${new Date().toLocaleString()}</p>
              <p>이 창은 닫으셔도 됩니다.</p>
            </div>
          </body>
        </html>
      `);
    }
  } catch (error) {
    console.error('승인 처리 중 오류:', error);
    
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
