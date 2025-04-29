import { createPool } from '@vercel/postgres';

// Vercel Postgres 연결 풀 생성
// 자동으로 환경 변수 DATABASE_URL 또는 DB__DATABASE_URL을 사용합니다
const pool = createPool({
  connectionString: process.env.DATABASE_URL || process.env.DB__DATABASE_URL
});

// 쿼리 실행 함수
export async function executeQuery(query, params = []) {
  try {
    const result = await pool.query(query, params);
    return { success: true, data: result.rows };
  } catch (error) {
    console.error('데이터베이스 쿼리 오류:', error);
    return { success: false, error: error.message };
  }
}

// 사용자 관리 함수
export const usersDB = {
  // 모든 사용자 가져오기
  getAllUsers: async () => {
    return executeQuery('SELECT * FROM users ORDER BY created_at DESC');
  },
  
  // 사용자명으로 사용자 찾기
  getUserByUsername: async (username) => {
    return executeQuery('SELECT * FROM users WHERE username = $1', [username]);
  },
  
  // 새 사용자 생성
  createUser: async (userData) => {
    const { username, password, membershipType = 'basic', vipStatus = 'none' } = userData;
    
    return executeQuery(
      'INSERT INTO users (username, password, membership_type, vip_status, created_at, updated_at) VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING *',
      [username, password, membershipType, vipStatus]
    );
  },
  
  // 사용자 VIP 상태 업데이트
  updateVipStatus: async (username, isVip) => {
    const membershipType = isVip ? 'vip' : 'basic';
    const vipStatus = isVip ? 'approved' : 'none';
    const expiryDate = isVip ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null; // 30일 후
    
    return executeQuery(
      'UPDATE users SET membership_type = $1, vip_status = $2, membership_expiry = $3, updated_at = NOW() WHERE username = $4 RETURNING *',
      [membershipType, vipStatus, expiryDate, username]
    );
  },
  
  // 사용자 데이터 업데이트
  updateUser: async (username, userData) => {
    const { password, savedLinks, previousKeywords } = userData;
    
    return executeQuery(
      'UPDATE users SET password = $1, saved_links = $2, previous_keywords = $3, updated_at = NOW() WHERE username = $4 RETURNING *',
      [password, JSON.stringify(savedLinks || []), JSON.stringify(previousKeywords || []), username]
    );
  }
};

export default pool;
