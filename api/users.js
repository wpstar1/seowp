// 사용자 목록 반환 API
const { connectToDatabase } = require('./db');

module.exports = async (req, res) => {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // OPTIONS 요청 처리 (CORS preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // 디버깅 정보
  const debugInfo = {
    method: req.method,
    url: req.url,
    env: {
      MONGO_URL_exists: !!process.env.MONGO_URL,
      DATABASE_URL_exists: !!process.env.DATABASE_URL,
      MONGODB_URI_exists: !!process.env.MONGODB_URI
    },
    time: new Date().toISOString()
  };
  
  try {
    console.log('사용자 목록 API 호출됨');
    
    // MongoDB 연결 시도
    const { db } = await connectToDatabase();
    
    // 연결 실패하면 디버깅 정보 반환
    if (!db) {
      console.log('DB 연결 실패, 로컬 스토리지 모드 활성화');
      return res.status(200).json({
        success: false,
        message: 'MongoDB 연결 실패. 로컬 스토리지를 사용합니다.',
        debug: debugInfo
      });
    }
    
    // 사용자 목록 가져오기 시도
    try {
      const users = await db.collection('users').find({}).toArray();
      console.log(`${users.length}명의 사용자를 찾았습니다.`);
      
      // 비밀번호 필드는 제외하고 반환
      const sanitizedUsers = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      
      return res.status(200).json({
        success: true,
        message: '사용자 목록을 성공적으로 가져왔습니다.',
        users: sanitizedUsers,
        debug: debugInfo
      });
    } catch (dbError) {
      console.error('DB 쿼리 오류:', dbError);
      return res.status(200).json({
        success: false,
        message: '데이터베이스 쿼리 중 오류가 발생했습니다.',
        error: dbError.message,
        debug: debugInfo
      });
    }
  } catch (error) {
    console.error('API 전체 오류:', error);
    return res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.',
      error: error.message,
      debug: debugInfo
    });
  }
};
