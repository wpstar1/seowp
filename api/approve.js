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
    
    // 승인된 경우 approved-users API에 사용자 추가
    if (isApproved && userId) {
      try {
        // 내부 API 호출 (서버 내부에서)
        const approvedUsersUrl = `${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://seo-beige.vercel.app'}/api/approved-users`;
        
        // fetch API 사용
        const fetchOptions = {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            userId,
            approvalId: requestId,
            approvalStatus: 'approved'
          })
        };
        
        // 비동기 호출 (응답 대기하지 않음)
        fetch(approvedUsersUrl, fetchOptions)
          .then(response => response.json())
          .then(data => console.log('사용자 승인 처리 결과:', data))
          .catch(error => console.error('사용자 승인 처리 중 오류:', error));
          
        console.log('사용자 승인 요청 전송:', approvedUsersUrl);
      } catch (error) {
        console.error('승인 사용자 등록 중 오류:', error);
      }
    }
    
    // 관리자에게 HTML 응답
    if (isApproved) {
      console.log(`승인 처리 완료: ${requestId}`);
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
              <p>5초 후 자동으로 메인 페이지로 이동합니다.</p>
              <a href="https://seo-beige.vercel.app" class="button" id="redirect-btn">메인 페이지로 이동</a>
            </div>
            <script>
              // 5초 후 자동으로 메인 페이지로 리디렉션
              setTimeout(function() {
                window.location.href = 'https://seo-beige.vercel.app';
              }, 5000);
              
              // 버튼 클릭 이벤트
              document.getElementById('redirect-btn').addEventListener('click', function(e) {
                e.preventDefault();
                window.location.href = 'https://seo-beige.vercel.app';
              });
            </script>
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
