import { createPool } from '@vercel/postgres';

// Vercel PostgreSQL 데이터베이스 연결 설정
let pool;

try {
  // 환경 변수에서 데이터베이스 연결 문자열 가져오기
  const connectionString = "prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcGlfa2V5IjoiNzNhM2QyZDUtNTY3MC00ZDRjLWJkOWMtNjZiZDBhYzJmYmExIiwidGVuYW50X2lkIjoiZTBkNzExNTc3OWI3YjI1Mzg4ZWY5ZmNkMDVmMjEwMzExYjRkYmI3YzhhMTQ1NDZhNjM3ZTBlOGM5NWNkY2QwYiIsImludGVybmFsX3NlY3JldCI6IjFlNDA4YTRhLWU3NDAtNGYzZS04N2E5LTVkOTYxNTMzOTVlMSJ9.vn-V-OBLlzEgWbz91tCJ3yj6k9OoRIXR6XXruCNT7u0";
  
  // 풀 생성
  pool = createPool({
    connectionString,
  });
  
  console.log('데이터베이스 연결 성공');
} catch (error) {
  console.error('데이터베이스 연결 오류:', error);
}

// 쿼리 실행 함수
async function executeQuery(query, params = []) {
  try {
    const client = await pool.connect();
    try {
      const result = await client.query(query, params);
      return result;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('쿼리 실행 오류:', error);
    // 로컬 스토리지로 폴백하는 로직을 여기에 구현
    throw error;
  }
}

// 데이터베이스 초기화
async function initDatabase() {
  try {
    // 사용자 테이블 생성
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        membershipType VARCHAR(50) DEFAULT 'free',
        vipStatus VARCHAR(50) DEFAULT 'none',
        vipExpireDate TIMESTAMP,
        isAdmin BOOLEAN DEFAULT FALSE
      )
    `);
    
    console.log('데이터베이스 테이블 초기화 완료');
    
    // 기본 관리자 계정 추가 (없는 경우)
    const adminResult = await executeQuery('SELECT * FROM users WHERE username = $1', ['1111']);
    
    if (adminResult.rows.length === 0) {
      await executeQuery(
        'INSERT INTO users (username, password, isAdmin, membershipType, vipStatus) VALUES ($1, $2, $3, $4, $5)',
        ['1111', '1111', true, 'vip', 'approved']
      );
      console.log('기본 관리자 계정 생성됨');
    }
  } catch (error) {
    console.error('데이터베이스 초기화 오류:', error);
  }
}

export { executeQuery, initDatabase, pool };
