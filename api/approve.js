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
    // 쿼리 파라미터에서 정보 추출
    const { requestId, action = 'approve', userId, email } = req.query;
    
    if (!requestId) {
      return res.status(400).send(`
        <html>
          <head>
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
              <p>요청 ID가 필요합니다.</p>
            </div>
          </body>
        </html>
      `);
    }
    
    // 승인 또는 거절 처리
    const isApproved = action === 'approve';
    
    console.log(`VIP 승인 요청 처리 중:`);
    console.log(`- 요청 ID: ${requestId}`);
    console.log(`- 승인 상태: ${isApproved ? '승인' : '거절'}`);
    console.log(`- 사용자 ID: ${userId || '알 수 없음'}`);
    console.log(`- 이메일: ${email || '알 수 없음'}`);
    
    // 관리자에게 HTML 응답
    if (isApproved) {
      return res.status(200).send(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>VIP 승인 완료</title>
            <style>
              body {
                font-family: 'Arial', sans-serif;
                background-color: #f5f5f5;
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                margin: 0;
              }
              .success-container {
                background-color: white;
                padding: 2rem;
                border-radius: 8px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                text-align: center;
                max-width: 90%;
                width: 500px;
              }
              h1 {
                color: #4CAF50;
                margin-bottom: 1rem;
              }
              p {
                margin-bottom: 1.5rem;
                color: #333;
                line-height: 1.6;
              }
              .button {
                background-color: #4CAF50;
                color: white;
                padding: 10px 20px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 16px;
                text-decoration: none;
                display: inline-block;
              }
              .user-info {
                background-color: #f9f9f9;
                padding: 10px;
                border-radius: 4px;
                margin: 15px 0;
              }
            </style>
          </head>
          <body>
            <div class="success-container">
              <h1>VIP 승인 완료</h1>
              <div class="user-info">
                <p><strong>사용자:</strong> ${userId || '알 수 없음'}</p>
                <p><strong>이메일:</strong> ${email || '알 수 없음'}</p>
              </div>
              <p>성공적으로 VIP 회원 승인이 완료되었습니다.</p>
              <p>사용자가 다시 로그인하면 VIP 상태가 적용됩니다.</p>
              <a href="https://seo-beige.vercel.app" class="button">메인 페이지로 이동</a>
            </div>
            <script>
              // VIP 사용자 정보를 로컬 스토리지에 직접 저장하는 스크립트
              // 참고: 이 접근법은 간소화된 방식으로, 실제 프로덕션 환경에서는 보안을 더 고려해야 함
              function applyVipStatus() {
                try {
                  // 사용자 ID가 제공된 경우에만 처리
                  if ("${userId}") {
                    // 로컬 스토리지에서 사용자 정보 가져오기
                    const users = JSON.parse(localStorage.getItem('smart_content_users') || '[]');
                    
                    // 대소문자 구분 없이 사용자 찾기
                    const userIndex = users.findIndex(u => 
                      u.username.toLowerCase() === "${userId}".toLowerCase()
                    );
                    
                    if (userIndex !== -1) {
                      // VIP 상태 업데이트
                      const today = new Date();
                      const expiryDate = new Date(today);
                      expiryDate.setDate(today.getDate() + 30); // 30일 유효기간
                      
                      users[userIndex].membershipType = 'vip';
                      users[userIndex].vipStatus = 'approved';
                      users[userIndex].membershipExpiry = expiryDate.toISOString();
                      users[userIndex].updatedAt = new Date().toISOString();
                      
                      // 로컬 스토리지 업데이트
                      localStorage.setItem('smart_content_users', JSON.stringify(users));
                      console.log('VIP 상태가 업데이트되었습니다:', users[userIndex]);
                      
                      // 현재 로그인한 사용자인 경우 페이지 새로고침
                      const currentUser = localStorage.getItem('smart_content_current_user');
                      if (currentUser && currentUser.toLowerCase() === "${userId}".toLowerCase()) {
                        alert('VIP 회원 승인이 완료되었습니다! 페이지를 새로고침합니다.');
                        window.location.reload();
                      }
                    }
                  }
                } catch (error) {
                  console.error('VIP 상태 업데이트 중 오류:', error);
                }
              }
              
              // 페이지 로드 시 실행
              window.addEventListener('DOMContentLoaded', applyVipStatus);
            </script>
          </body>
        </html>
      `);
    } else {
      return res.status(200).send(`
        <html>
          <head>
            <title>VIP 회원 거절</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
              body { font-family: Arial, sans-serif; text-align: center; margin-top: 50px; }
              .reject { color: red; }
              .container { max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1 class="reject">❌ 거절 완료</h1>
              <p>해당 VIP 회원 신청이 거절되었습니다.</p>
            </div>
          </body>
        </html>
      `);
    }
  } catch (error) {
    console.error('VIP 승인 처리 중 오류:', error);
    return res.status(500).send(`
      <html>
        <head>
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
            <p>요청을 처리하는 중 오류가 발생했습니다. 다시 시도해주세요.</p>
            <p><small>오류 메시지: ${error.message}</small></p>
          </div>
        </body>
      </html>
    `);
  }
};
