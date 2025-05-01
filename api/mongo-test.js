// MongoDB 진단 테스트 API
const { MongoClient } = require('mongodb');

// MongoDB 연결 URL
const MONGODB_URI = "mongodb+srv://seouser:Seopass123@cluster0.8yv7pet.mongodb.net/smart-content-creator?retryWrites=true&w=majority";

module.exports = async (req, res) => {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // OPTIONS 요청 처리 (CORS preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  let client;
  let result = {
    success: false,
    mongodbUri: MONGODB_URI.replace(/\/\/([^:]+):[^@]+@/, "//******:*****@"), // 비밀번호 숨김
    error: null,
    detailedError: null,
    clientInfo: null,
    serverInfo: null,
    timestamp: new Date().toISOString()
  };
  
  try {
    console.log('MongoDB 연결 테스트 시작');
    
    client = new MongoClient(MONGODB_URI, {
      useNewUrlParser: true, 
      useUnifiedTopology: true,
      connectTimeoutMS: 30000,
      serverSelectionTimeoutMS: 30000,
    });
    
    // 연결 시작
    console.log('MongoDB 클라이언트에 연결 시도...');
    await client.connect();
    console.log('MongoDB 클라이언트 연결 성공!');
    
    // 서버 상태 확인
    const admin = client.db().admin();
    const serverStatus = await admin.serverStatus();
    
    result.success = true;
    result.clientInfo = {
      connection: client.topology ? "연결됨" : "연결 안됨",
      readyState: client.topology ? client.topology.s.state : "알 수 없음"
    };
    result.serverInfo = {
      version: serverStatus.version,
      uptime: serverStatus.uptime,
      connections: serverStatus.connections
    };
    
    console.log('MongoDB 테스트 완료: 성공!');
    
  } catch (error) {
    console.error('MongoDB 연결 테스트 실패:', error);
    result.error = error.message;
    
    // 자세한 오류 정보 추가
    result.detailedError = {
      name: error.name,
      code: error.code,
      codeName: error.codeName,
      stack: error.stack
    };
  } finally {
    if (client) {
      await client.close();
      console.log('MongoDB 클라이언트 연결 종료');
    }
  }
  
  return res.status(200).json(result);
};
