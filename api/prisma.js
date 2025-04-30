// Prisma 클라이언트를 서버리스 환경에 최적화하기 위한 설정
const { PrismaClient } = require('@prisma/client');

/**
 * PrismaClient는 핫 리로딩 시 여러 개의 인스턴스가 생성되는 것을 방지하기 위해
 * 글로벌 객체에 캐싱합니다.
 */
const globalForPrisma = global;

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: ['error', 'warn'],
    errorFormat: 'pretty'
  });
};

const prisma = globalForPrisma.prisma || prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// 초기 연결 테스트
async function testConnection() {
  try {
    console.log('Prisma 데이터베이스 연결 테스트 중...');
    const testResult = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('데이터베이스 연결 성공:', testResult);
    return { success: true, result: testResult };
  } catch (error) {
    console.error('데이터베이스 연결 실패:', error.message);
    console.error('데이터베이스 URL:', process.env.MONGODB_URI || process.env.NEON_DATABASE_URL ? '설정됨 (마스킹됨)' : '설정되지 않음');
    return { success: false, error };
  }
}

// 모듈이 처음 로드될 때 연결 테스트 실행
testConnection()
  .then(result => {
    if (!result.success) {
      console.warn('⚠️ 데이터베이스 연결 테스트 실패. API 호출 시 오류가 발생할 수 있습니다.');
    }
  })
  .catch(error => {
    console.error('연결 테스트 중 예외 발생:', error);
  });

// 오류 포착 헬퍼 함수
prisma.$handleError = async (callback) => {
  try {
    return await callback();
  } catch (error) {
    console.error('Prisma 작업 중 오류 발생:', error);
    
    // 연결 오류인 경우 재연결 시도
    if (error.code === 'P1001' || error.code === 'P1017') {
      try {
        console.log('데이터베이스 재연결 시도...');
        await prisma.$disconnect();
        await prisma.$connect();
        console.log('데이터베이스 재연결 성공');
        
        // 재시도
        return await callback();
      } catch (reconnectError) {
        console.error('데이터베이스 재연결 실패:', reconnectError);
        throw reconnectError;
      }
    }
    
    throw error;
  }
};

module.exports = prisma;
