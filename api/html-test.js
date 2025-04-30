// 간단한 HTML 반환 테스트 API
module.exports = async (req, res) => {
  try {
    // HTML 직접 반환
    res.setHeader('Content-Type', 'text/html');
    return res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>API 테스트</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; line-height: 1.6; }
            .container { max-width: 800px; margin: 0 auto; background: #f9f9f9; border-radius: 5px; padding: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            h1 { color: #333; }
            pre { background: #eee; padding: 10px; border-radius: 3px; overflow-x: auto; }
            .status { display: inline-block; padding: 5px 10px; border-radius: 3px; color: white; }
            .success { background: green; }
            .error { background: red; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>API가 정상적으로 작동합니다!</h1>
            <p>이 페이지가 보인다면 API 자체는 작동하고 있습니다.</p>
            <p>하지만 MongoDB 연결에는 여전히 문제가 있을 수 있습니다.</p>
            
            <h2>환경 정보</h2>
            <pre>
            {
              "NODE_ENV": "${process.env.NODE_ENV || '설정되지 않음'}",
              "VERCEL_ENV": "${process.env.VERCEL_ENV || '설정되지 않음'}",
              "MONGODB_URI": "${process.env.MONGODB_URI ? '설정됨 (보안상 표시하지 않음)' : '설정되지 않음'}"
            }
            </pre>
            
            <h2>문제 해결 방안</h2>
            <ol>
              <li>Vercel 서버리스 함수는 10-15초 실행 제한이 있어 MongoDB 연결에 충분한 시간을 제공하지 않을 수 있습니다.</li>
              <li>MongoDB Atlas에서 네트워크 접근 설정을 '모든 IP 허용(0.0.0.0/0)'으로 확인해보세요.</li>
              <li>MongoDB Atlas 클러스터가 현재 활성 상태인지 확인해보세요.</li>
            </ol>
          </div>
        </body>
      </html>
    `);
  } catch (error) {
    res.status(500).send(`오류 발생: ${error.message}`);
  }
};
