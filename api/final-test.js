// 최종 MongoDB 연결 테스트 API
const { MongoClient } = require('mongodb');

module.exports = async (req, res) => {
  // CORS 헤더
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // 하드코딩된 테스트용 연결 문자열
  const testUri = "mongodb+srv://seouser:Seopass123@cluster0.8yv7pet.mongodb.net/smart-content-creator?retryWrites=true&w=majority";
  
  try {
    console.log("MongoDB 연결 테스트 시작");
    
    // 연결 시도
    const client = new MongoClient(testUri, { 
      useNewUrlParser: true,
      useUnifiedTopology: true,
      connectTimeoutMS: 30000
    });
    
    console.log("연결 중...");
    await client.connect();
    console.log("연결 성공!");
    
    // 데이터베이스 선택
    const db = client.db('smart-content-creator');
    
    // 컬렉션 생성 시도
    if (!(await db.listCollections({name: 'users'}).hasNext())) {
      await db.createCollection('users');
      console.log("사용자 컬렉션 생성됨");
    }
    
    // 간단한 테스트 문서 생성
    const usersCollection = db.collection('users');
    const testUser = {
      username: 'testuser',
      email: 'test@example.com',
      created: new Date()
    };
    
    await usersCollection.insertOne(testUser);
    console.log("테스트 사용자 추가됨");
    
    // 데이터 확인
    const allUsers = await usersCollection.find({}).toArray();
    
    // 연결 종료
    await client.close();
    
    // 성공 응답
    return res.status(200).json({
      success: true,
      message: 'MongoDB 연결 및 테스트 성공',
      usersCount: allUsers.length,
      testUser
    });
    
  } catch (error) {
    console.error("MongoDB 연결 오류:", error);
    
    return res.status(500).json({
      success: false,
      message: 'MongoDB 연결 오류',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
