// 데이터베이스 연결 테스트 API
const { PrismaClient } = require('@prisma/client');

module.exports = async (req, res) => {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // OPTIONS 요청 처리
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    console.log('데이터베이스 연결 테스트 시작');
    
    // 환경 변수 확인
    const dbUrl = process.env.NEON_DATABASE_URL;
    if (!dbUrl) {
      console.error('NEON_DATABASE_URL 환경 변수가 설정되지 않았습니다.');
      return res.status(500).json({ 
        success: false, 
        error: 'DATABASE_URL_MISSING',
        message: '데이터베이스 URL 환경 변수가 설정되지 않았습니다.' 
      });
    }
    
    // URL 마스킹 (로그 보안)
    const maskedUrl = dbUrl.replace(/\/\/[^:]+:[^@]+@/, '//****:****@');
    console.log('데이터베이스 URL:', maskedUrl);
    
    // Prisma 클라이언트 초기화
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: dbUrl
        }
      },
      log: ['query', 'info', 'warn', 'error']
    });
    
    console.log('prisma 클라이언트 생성됨');
    
    // 기본 쿼리 실행
    console.log('데이터베이스 쿼리 실행 시도');
    const result = await prisma.$queryRaw`SELECT 1 as connected`;
    console.log('쿼리 결과:', result);
    
    // 연결 성공
    await prisma.$disconnect();
    return res.status(200).json({
      success: true,
      message: '데이터베이스 연결 성공',
      timestamp: new Date().toISOString(),
      test_result: result
    });
  } catch (error) {
    console.error('데이터베이스 연결 테스트 실패:', error);
    
    // 자세한 오류 정보 반환
    return res.status(500).json({
      success: false,
      error: error.code || 'UNKNOWN_ERROR',
      message: error.message || '알 수 없는 오류가 발생했습니다.',
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  }
};
