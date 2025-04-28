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
    const { requestId, action = 'confirm', userId, email, directApply = 'false' } = req.query;
    
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
    const shouldDirectApply = directApply === 'true';
    
    console.log(`VIP 요청 처리 중:`);
    console.log(`- 요청 ID: ${requestId}`);
    console.log(`- 액션: ${action}`);
    console.log(`- 사용자 ID: ${userId || '알 수 없음'}`);
    console.log(`- 이메일: ${email || '알 수 없음'}`);
    console.log(`- 직접 적용: ${shouldDirectApply}`);
    
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
                <a href="https://seo-beige.vercel.app/api/approve?requestId=${requestId}&action=approve&userId=${encodeURIComponent(userId || '')}&email=${encodeURIComponent(email || '')}&directApply=true" class="approve-button">승인하기</a>
                <a href="https://seo-beige.vercel.app/api/approve?requestId=${requestId}&action=reject&userId=${encodeURIComponent(userId || '')}&email=${encodeURIComponent(email || '')}" class="reject-button">거절하기</a>
              </div>
            </div>
          </body>
        </html>
      `);
    }
    
    // 2단계: 승인 처리
    if (isApprove) {
      // 사용자를 직접 VIP로 설정하는 로직
      let successHtml = '';
      
      if (userId) {
        try {
          // 클라이언트 측에서 로컬 스토리지를 업데이트하기 위한 스크립트 제공
          successHtml = `
            <div class="alert success">
              <p><strong>✅ 사용자 [${userId}]의 VIP 승인이 완료되었습니다!</strong></p>
              <p>다음 로그인 시 VIP 상태가 적용됩니다.</p>
            </div>
          `;
        } catch (error) {
          console.error('VIP 업그레이드 직접 적용 오류:', error);
          successHtml = `
            <div class="alert error">
              <p><strong>⚠️ 오류 발생:</strong> ${error.message}</p>
              <p>관리자 페이지에서 직접 VIP로 설정해주세요.</p>
            </div>
          `;
        }
      }
      
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
                padding: 12px 24px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 16px;
                text-decoration: none;
                display: inline-block;
                margin: 10px;
              }
              .user-info {
                background-color: #f9f9f9;
                padding: 10px;
                border-radius: 4px;
                margin: 15px 0;
              }
              .alert {
                padding: 15px;
                margin: 20px 0;
                border-radius: 4px;
                text-align: left;
                line-height: 1.5;
              }
              .success {
                background-color: #e8f5e9;
                border-left: 4px solid #4CAF50;
              }
              .error {
                background-color: #ffebee;
                border-left: 4px solid #f44336;
              }
              .code {
                background-color: #f0f0f0;
                padding: 5px;
                border-radius: 3px;
                font-family: monospace;
              }
            </style>
          </head>
          <body>
            <div class="success-container">
              <h1>VIP 승인 완료!</h1>
              <div class="user-info">
                <p><strong>사용자:</strong> ${userId || '알 수 없음'}</p>
                <p><strong>결제 정보:</strong> ${email || '알 수 없음'}</p>
              </div>
              
              <p>관리자가 VIP 회원 승인을 완료했습니다.</p>
              
              ${successHtml}
              
              <div class="admin-actions">
                <p><strong>아직 VIP 적용이 안 된 경우:</strong></p>
                <p>관리자 계정(1111)으로 로그인하여 '관리자 페이지'에서 이 사용자를 VIP로 설정해주세요.</p>
              </div>
              
              <a href="https://seo-beige.vercel.app" class="button">메인 페이지로 이동</a>
            </div>
            
            <script>
              // VIP 승인 정보 저장
              function storeVipApproval() {
                try {
                  const username = "${userId}";
                  if (!username) {
                    console.error('사용자 아이디가 제공되지 않았습니다.');
                    return;
                  }
                  
                  // 1. 사용자 목록 가져오기
                  const USERS_KEY = 'smart_content_users';
                  let users = [];
                  
                  try {
                    const usersJson = localStorage.getItem(USERS_KEY);
                    if (usersJson) {
                      users = JSON.parse(usersJson);
                      console.log('로컬 스토리지에서 사용자 목록 로드 완료:', users.length);
                    } else {
                      console.warn('로컬 스토리지에 사용자 목록이 없습니다.');
                    }
                  } catch (error) {
                    console.error('사용자 목록 로드 오류:', error);
                  }
                  
                  // 2. 사용자 찾기
                  const userIndex = users.findIndex(user => 
                    user.username.toLowerCase() === username.toLowerCase()
                  );
                  
                  if (userIndex === -1) {
                    console.error('사용자를 찾을 수 없습니다:', username);
                    return;
                  }
                  
                  // 3. VIP로 업그레이드
                  console.log('사용자 찾음, VIP 업그레이드 중:', users[userIndex]);
                  
                  const today = new Date();
                  const expiryDate = new Date(today);
                  expiryDate.setDate(today.getDate() + 30); // 30일 후
                  
                  users[userIndex].membershipType = 'vip';
                  users[userIndex].vipStatus = 'approved';
                  users[userIndex].membershipExpiry = expiryDate.toISOString();
                  users[userIndex].updatedAt = new Date().toISOString();
                  
                  // 4. 저장
                  localStorage.setItem(USERS_KEY, JSON.stringify(users));
                  console.log('VIP 승격 처리 완료:', users[userIndex]);
                  
                  // 5. 승인 정보 저장 (중복 대비)
                  try {
                    const VIP_APPROVED_USERS_KEY = 'smart_content_vip_approved_users';
                    let approvedVipUsers = [];
                    
                    const existingData = localStorage.getItem(VIP_APPROVED_USERS_KEY);
                    if (existingData) {
                      approvedVipUsers = JSON.parse(existingData);
                    }
                    
                    // 이미 승인된 사용자인지 확인
                    const isAlreadyApproved = approvedVipUsers.some(user => 
                      user.username.toLowerCase() === username.toLowerCase()
                    );
                    
                    if (!isAlreadyApproved) {
                      // 승인 목록에 추가
                      approvedVipUsers.push({
                        username: username,
                        approvedAt: new Date().toISOString()
                      });
                      
                      // 저장
                      localStorage.setItem(VIP_APPROVED_USERS_KEY, JSON.stringify(approvedVipUsers));
                      console.log('VIP 승인 목록에 추가 완료:', username);
                    } else {
                      console.log('이미 승인 목록에 존재함:', username);
                    }
                  } catch (error) {
                    console.error('VIP 승인 목록 저장 오류:', error);
                  }
                } catch (error) {
                  console.error('VIP 승인 처리 중 오류 발생:', error);
                }
              }
              
              // 페이지 로드 시 실행
              window.addEventListener('DOMContentLoaded', function() {
                console.log('VIP 승인 페이지 로드됨, 승인 처리 시작...');
                storeVipApproval();
                
                // 3초 후 홈페이지로 자동 이동
                setTimeout(function() {
                  console.log('홈페이지로 이동...');
                  window.location.href = 'https://seo-beige.vercel.app/admin-dashboard?action=vip-upgrade&username=${encodeURIComponent(userId || '')}';
                }, 3000);
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
