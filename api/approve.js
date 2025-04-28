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
    const { requestId, action = 'confirm', userId, email } = req.query;
    
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
    
    // 확인 화면, 승인 또는 거절 처리
    const isConfirm = action === 'confirm';
    const isApprove = action === 'approve';
    const isReject = action === 'reject';
    
    console.log(`VIP 요청 처리 중:`);
    console.log(`- 요청 ID: ${requestId}`);
    console.log(`- 액션: ${action}`);
    console.log(`- 사용자 ID: ${userId || '알 수 없음'}`);
    console.log(`- 이메일: ${email || '알 수 없음'}`);
    
    // 1단계: 확인 화면 표시
    if (isConfirm) {
      return res.status(200).send(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>VIP 승인 확인</title>
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
              .confirm-container {
                background-color: white;
                padding: 2rem;
                border-radius: 8px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                text-align: center;
                max-width: 90%;
                width: 500px;
              }
              h1 {
                color: #3f51b5;
                margin-bottom: 1rem;
              }
              h2 {
                color: #555;
                font-size: 1.2rem;
                margin-bottom: 1.5rem;
              }
              p {
                margin-bottom: 1.5rem;
                color: #333;
                line-height: 1.6;
              }
              .button-group {
                display: flex;
                justify-content: center;
                gap: 15px;
                margin-top: 20px;
              }
              .approve-button {
                background-color: #4CAF50;
                color: white;
                padding: 12px 24px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 16px;
                text-decoration: none;
              }
              .reject-button {
                background-color: #f44336;
                color: white;
                padding: 12px 24px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 16px;
                text-decoration: none;
              }
              .user-info {
                background-color: #f9f9f9;
                padding: 15px;
                border-radius: 4px;
                margin: 20px 0;
                text-align: left;
              }
              .warning {
                color: #e65100;
                font-weight: bold;
                margin: 20px 0;
              }
            </style>
          </head>
          <body>
            <div class="confirm-container">
              <h1>VIP 승인 확인</h1>
              <h2>다음 사용자의 VIP 승인 요청이 있습니다</h2>
              
              <div class="user-info">
                <p><strong>사용자 ID:</strong> ${userId || '알 수 없음'}</p>
                <p><strong>결제 정보:</strong> ${email || '알 수 없음'}</p>
                <p><strong>요청 시간:</strong> ${new Date().toLocaleString()}</p>
              </div>
              
              <p class="warning">⚠️ 승인 또는 거절하기 전에 입금 여부를 반드시 확인하세요!</p>
              
              <div class="button-group">
                <a href="https://seo-beige.vercel.app/api/approve?requestId=${requestId}&action=approve&userId=${encodeURIComponent(userId || '')}&email=${encodeURIComponent(email || '')}" class="approve-button">승인하기</a>
                <a href="https://seo-beige.vercel.app/api/approve?requestId=${requestId}&action=reject&userId=${encodeURIComponent(userId || '')}&email=${encodeURIComponent(email || '')}" class="reject-button">거절하기</a>
              </div>
            </div>
          </body>
        </html>
      `);
    }
    
    // 2단계: 승인 처리
    if (isApprove) {
      return res.status(200).send(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>VIP 승인 확인</title>
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
                margin: 10px;
              }
              .final-button {
                background-color: #2E7D32;
                font-weight: bold;
                padding: 12px 24px;
              }
              .user-info {
                background-color: #f9f9f9;
                padding: 10px;
                border-radius: 4px;
                margin: 15px 0;
              }
              .success-message {
                display: none;
                color: #4CAF50;
                font-weight: bold;
                margin: 15px 0;
              }
              .approval-container {
                margin-top: 20px;
              }
            </style>
          </head>
          <body>
            <div class="success-container">
              <h1>VIP 승인 확인</h1>
              <div class="user-info">
                <p><strong>사용자:</strong> ${userId || '알 수 없음'}</p>
                <p><strong>결제 정보:</strong> ${email || '알 수 없음'}</p>
              </div>
              
              <div id="approvalStep">
                <p>VIP 회원 승인을 위해 <strong>최종 승인</strong> 버튼을 클릭해주세요.</p>
                <p>승인 전에 입금 여부를 반드시 확인하세요!</p>
                <div class="approval-container">
                  <button id="finalApproveBtn" class="button final-button">최종 승인</button>
                </div>
              </div>
              
              <div id="successStep" style="display: none;">
                <p class="success-message">성공적으로 VIP 회원 승인이 완료되었습니다.</p>
                <p>사용자가 다시 로그인하면 VIP 상태가 적용됩니다.</p>
                <a href="https://seo-beige.vercel.app" class="button">메인 페이지로 이동</a>
              </div>
            </div>
            
            <script>
              // VIP 사용자 정보를 로컬 스토리지에 직접 저장하는 스크립트
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
                      
                      // UI 업데이트
                      document.getElementById('approvalStep').style.display = 'none';
                      document.getElementById('successStep').style.display = 'block';
                      
                      return true;
                    } else {
                      console.error('해당 사용자를 찾을 수 없습니다:', "${userId}");
                      alert('사용자 정보를 찾을 수 없습니다. 관리자에게 문의하세요.');
                      return false;
                    }
                  }
                  return false;
                } catch (error) {
                  console.error('VIP 상태 업데이트 중 오류:', error);
                  alert('오류가 발생했습니다: ' + error.message);
                  return false;
                }
              }
              
              // 최종 승인 버튼 클릭 이벤트 설정
              document.getElementById('finalApproveBtn').addEventListener('click', function() {
                const success = applyVipStatus();
                if (success) {
                  // 성공 메시지 표시
                  document.getElementById('approvalStep').style.display = 'none';
                  document.getElementById('successStep').style.display = 'block';
                }
              });
            </script>
          </body>
        </html>
      `);
    }
    
    // 거절 처리
    if (isReject) {
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
    
    // 알 수 없는 액션인 경우
    return res.status(400).send(`
      <html>
        <head>
          <title>요청 오류</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: Arial, sans-serif; text-align: center; margin-top: 50px; }
            .error { color: red; }
            .container { max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1 class="error">❓ 알 수 없는 요청</h1>
            <p>지원되지 않는 액션입니다: ${action}</p>
          </div>
        </body>
      </html>
    `);
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
