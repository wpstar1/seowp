const prisma = require('./prisma');

module.exports = async (req, res) => {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // OPTIONS 요청 처리 (CORS preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    console.log('수동 사용자 추가 API 호출됨');
    
    // GET 요청 처리 - 데이터베이스 상태 확인
    if (req.method === 'GET') {
      try {
        // 데이터베이스 연결 및 상태 확인
        console.log('데이터베이스 연결 테스트 중...');
        const testResult = await prisma.$queryRaw`SELECT 1 as test`;
        console.log('데이터베이스 연결 테스트 결과:', testResult);
        
        // 사용자 수 확인
        const userCount = await prisma.user.count();
        console.log('현재 데이터베이스 사용자 수:', userCount);
        
        // 모든 사용자 가져오기
        const allUsers = await prisma.user.findMany({
          select: {
            id: true,
            username: true,
            membershipType: true,
            vipStatus: true,
            createdAt: true
          }
        });
        
        console.log('모든 사용자 목록:', allUsers);
        
        return res.status(200).json({
          success: true,
          message: '데이터베이스 연결 성공',
          userCount,
          users: allUsers,
          databaseInfo: {
            url: process.env.NEON_DATABASE_URL ? '설정됨 (보안상 표시하지 않음)' : '설정되지 않음',
            provider: 'postgresql'
          }
        });
      } catch (error) {
        console.error('데이터베이스 연결 또는 쿼리 오류:', error);
        return res.status(500).json({
          success: false,
          message: '데이터베이스 연결 오류',
          error: error.message,
          stack: error.stack
        });
      }
    }
    
    // POST 요청 처리 - 사용자 추가
    if (req.method === 'POST') {
      const { username, password } = req.query;
      
      if (!username || !password) {
        return res.status(400).json({
          success: false,
          message: '사용자명과 비밀번호가 필요합니다'
        });
      }
      
      console.log(`사용자 추가 시도: ${username}`);
      
      // 중복 확인
      const existingUser = await prisma.user.findUnique({
        where: { username }
      });
      
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: `이미 존재하는 사용자입니다: ${username}`
        });
      }
      
      // 직접 사용자 생성
      try {
        const newUser = await prisma.user.create({
          data: {
            username,
            password,
            membershipType: 'regular',
            vipStatus: 'none'
          }
        });
        
        console.log('사용자 생성 성공:', newUser);
        
        return res.status(201).json({
          success: true,
          message: `사용자 생성 성공: ${username}`,
          user: {
            id: newUser.id,
            username: newUser.username,
            membershipType: newUser.membershipType,
            createdAt: newUser.createdAt
          }
        });
      } catch (createError) {
        console.error('사용자 생성 오류:', createError);
        return res.status(500).json({
          success: false,
          message: '사용자 생성 중 오류 발생',
          error: createError.message,
          stack: createError.stack
        });
      }
    }
    
    // 지원하지 않는 메소드
    return res.status(405).json({
      success: false,
      message: '지원하지 않는 HTTP 메소드'
    });
  } catch (error) {
    console.error('API 처리 중 오류:', error);
    return res.status(500).json({
      success: false,
      message: '서버 오류',
      error: error.message,
      stack: error.stack
    });
  }
};
