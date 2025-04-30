const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 데이터베이스 연결 테스트 함수
async function testDatabaseConnection() {
  try {
    // 간단한 쿼리 실행
    await prisma.$queryRaw`SELECT 1`;
    console.log('데이터베이스 연결 성공!');
    return true;
  } catch (error) {
    console.error('데이터베이스 연결 오류:', error);
    return false;
  }
}

// 테스트 사용자 생성 함수
async function createTestUser() {
  try {
    const user = await prisma.user.create({
      data: {
        username: 'test-user-' + Date.now(),
        password: 'password123',
        membershipType: 'regular'
      }
    });
    console.log('테스트 사용자 생성 성공:', user);
    return user;
  } catch (error) {
    console.error('테스트 사용자 생성 오류:', error);
    return null;
  }
}

// 모든 사용자 조회 함수
async function getAllUsers() {
  try {
    const users = await prisma.user.findMany();
    console.log('모든 사용자 조회 성공:', users);
    return users;
  } catch (error) {
    console.error('사용자 조회 오류:', error);
    return [];
  }
}

// 테스트 실행
async function runTests() {
  const connected = await testDatabaseConnection();
  if (connected) {
    await createTestUser();
    await getAllUsers();
  }
  // 연결 종료
  await prisma.$disconnect();
}

// 테스트 실행
runTests().catch(e => {
  console.error('테스트 실행 오류:', e);
  prisma.$disconnect();
});
