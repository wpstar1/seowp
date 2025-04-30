// MongoDB 연결 테스트용 API
const { MongoClient } = require('mongodb');

module.exports = async (req, res) => {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  try {
    // 연결 문자열 - 직접 하드코딩
    const uri = 'mongodb+srv://asas83858385:Awotj0421!@cluster0.8yv7pet.mongodb.net/smart-content-creator?retryWrites=true&w=majority&appName=Cluster0';
    
    // 연결 시도 (타임아웃 높임)
    const client = new MongoClient(uri, {
      connectTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 60000,
      maxIdleTimeMS: 120000,
      maxPoolSize: 10
    });
    
    console.log('MongoDB 연결 시도 중...');
    await client.connect();
    console.log('MongoDB 연결 성공!');
    
    // 데이터베이스 선택
    const db = client.db('smart-content-creator');
    
    // 간단한 테스트 수행
    const result = await db.command({ ping: 1 });
    console.log('MongoDB 핑 성공:', result);
    
    // 사용자 컬렉션 확인
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(col => col.name);
    console.log('컬렉션 목록:', collectionNames);
    
    // 연결 종료
    await client.close();
    console.log('MongoDB 연결 종료');
    
    // 성공 응답
    return res.status(200).json({
      success: true,
      message: 'MongoDB 연결 테스트 성공',
      collections: collectionNames
    });
    
  } catch (error) {
    console.error('MongoDB 연결 오류:', error);
    
    // 자세한 오류 정보 반환
    return res.status(500).send(`
      <html>
        <head>
          <title>MongoDB 연결 테스트</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; }
            pre { background: #f4f4f4; padding: 10px; border-radius: 5px; overflow-x: auto; }
            .error { color: red; }
          </style>
        </head>
        <body>
          <h1>MongoDB 연결 테스트 실패</h1>
          <div class="error">
            <h3>오류 메시지:</h3>
            <pre>${error.name}: ${error.message}</pre>
            <h3>스택 트레이스:</h3>
            <pre>${error.stack}</pre>
          </div>
        </body>
      </html>
    `);
  }
};
