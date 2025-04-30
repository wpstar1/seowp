// MongoDB 연결 디버깅 전용 API
const { MongoClient } = require('mongodb');

module.exports = async (req, res) => {
  // CORS 헤더
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  try {
    // 환경변수에서 MongoDB URI 가져오기
    const mongoUri = process.env.MONGO_URL || process.env.MONGODB_URI || process.env.DATABASE_URL;
    
    // 디버깅 정보 수집
    const debugInfo = {
      mongoUriExists: !!mongoUri,
      mongoUriLength: mongoUri ? mongoUri.length : 0,
      env: {
        NODE_ENV: process.env.NODE_ENV,
        VERCEL_ENV: process.env.VERCEL_ENV,
        MONGO_URL_exists: !!process.env.MONGO_URL,
        MONGODB_URI_exists: !!process.env.MONGODB_URI,
        DATABASE_URL_exists: !!process.env.DATABASE_URL
      },
      time: new Date().toISOString()
    };
    
    // MongoDB URI가 없으면 오류 반환
    if (!mongoUri) {
      return res.status(400).json({
        success: false,
        message: 'MongoDB URI가 설정되지 않았습니다',
        debug: debugInfo
      });
    }
    
    // MongoDB 연결 시도
    console.log('MongoDB 연결 시도 중...');
    const client = new MongoClient(mongoUri, { 
      useNewUrlParser: true, 
      useUnifiedTopology: true,
      connectTimeoutMS: 5000, // 5초 타임아웃
      socketTimeoutMS: 5000
    });
    
    // 연결 시도
    await client.connect();
    console.log('MongoDB 연결 성공!');
    
    // 데이터베이스 정보 가져오기
    const adminDb = client.db().admin();
    const dbInfo = await adminDb.listDatabases();
    
    // 연결 종료
    await client.close();
    
    // 성공 응답
    return res.status(200).json({
      success: true,
      message: 'MongoDB 연결 성공',
      databases: dbInfo.databases.map(db => db.name),
      debug: debugInfo
    });
    
  } catch (error) {
    // 오류 정보 반환
    return res.status(500).json({
      success: false,
      message: 'MongoDB 연결 오류',
      error: {
        name: error.name,
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }
    });
  }
};
