import { createPool } from '@vercel/postgres';

// 로컬 개발 환경을 위한 임시 데이터베이스 에뮬레이션
// 실제 데이터는 로컬 스토리지에 임시 저장됨
const localStorageDB = {
  query: async (queryText, params = []) => {
    console.log('로컬 모드에서 쿼리 실행:', queryText, params);
    
    // 테이블 생성 쿼리는 성공으로 처리
    if (queryText.toLowerCase().includes('create table')) {
      return { rows: [] };
    }
    
    // SELECT 쿼리는 로컬 스토리지 데이터 반환
    if (queryText.toLowerCase().includes('select')) {
      try {
        const localUsers = JSON.parse(localStorage.getItem('smart_content_users') || '[]');
        
        // 사용자명으로 조회하는 경우
        if (params.length > 0 && queryText.includes('username')) {
          const username = params[0];
          const user = localUsers.find(u => u.username === username);
          
          if (user) {
            // DB 스키마에 맞게 변환
            return {
              rows: [{
                id: 1,
                username: user.username,
                password: user.password,
                created_at: user.createdAt || new Date().toISOString(),
                updated_at: new Date().toISOString(),
                membership_type: user.membershipType || 'basic',
                vip_status: user.vipStatus || 'none',
                membership_expiry: user.membershipExpiry || null,
                is_admin: user.username === '1111',
                saved_links: user.savedLinks || [],
                previous_keywords: user.previousKeywords || []
              }]
            };
          }
        }
        
        // 모든 사용자 조회
        return {
          rows: localUsers.map((user, idx) => ({
            id: idx + 1,
            username: user.username,
            password: user.password,
            created_at: user.createdAt || new Date().toISOString(),
            updated_at: new Date().toISOString(),
            membership_type: user.membershipType || 'basic',
            vip_status: user.vipStatus || 'none',
            membership_expiry: user.membershipExpiry || null,
            is_admin: user.username === '1111',
            saved_links: user.savedLinks || [],
            previous_keywords: user.previousKeywords || []
          }))
        };
      } catch (error) {
        console.error('로컬 스토리지 조회 오류:', error);
        return { rows: [] };
      }
    }
    
    // INSERT 또는 UPDATE 쿼리 처리
    if (queryText.toLowerCase().includes('insert') || queryText.toLowerCase().includes('update')) {
      try {
        // 로컬 스토리지에 저장 (단순화된 버전)
        const localUsers = JSON.parse(localStorage.getItem('smart_content_users') || '[]');
        
        // 저장할 사용자 데이터 구성
        if (params.length > 0) {
          const username = params[0]; // 첫 번째 파라미터가 대개 username
          
          // 기존 사용자 찾기
          const existingUserIndex = localUsers.findIndex(u => u.username === username);
          
          if (existingUserIndex >= 0) {
            // 기존 사용자 업데이트
            localUsers[existingUserIndex] = {
              ...localUsers[existingUserIndex],
              // 기타 속성 업데이트 (단순화됨)
              updatedAt: new Date().toISOString()
            };
          } else if (queryText.toLowerCase().includes('insert')) {
            // 새 사용자 추가
            localUsers.push({
              username,
              password: params[1] || '',
              membershipType: params[2] || 'basic',
              vipStatus: params[3] || 'none',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              isAdmin: username === '1111'
            });
          }
          
          localStorage.setItem('smart_content_users', JSON.stringify(localUsers));
          
          return {
            rows: [{
              id: existingUserIndex >= 0 ? existingUserIndex + 1 : localUsers.length,
              username
            }]
          };
        }
      } catch (error) {
        console.error('로컬 스토리지 저장 오류:', error);
      }
      
      return { rows: [] };
    }
    
    // 기본 응답
    return { rows: [] };
  }
};

// 환경에 따라 적절한 데이터베이스 클라이언트 선택
let pool;

try {
  // Vercel Postgres 연결 (배포 환경)
  if (process.env.DATABASE_URL || process.env.DB__DATABASE_URL || process.env.POSTGRES_URL) {
    pool = createPool({
      connectionString: process.env.DATABASE_URL || process.env.DB__DATABASE_URL || process.env.POSTGRES_URL
    });
    console.log('Vercel Postgres 데이터베이스에 연결되었습니다.');
  } else {
    // 로컬 개발 환경
    console.log('데이터베이스 연결 정보가 없습니다. 로컬 스토리지 모드로 전환합니다.');
    pool = localStorageDB;
  }
} catch (error) {
  console.error('데이터베이스 연결 오류:', error);
  // 오류 발생 시 로컬 스토리지 모드로 전환
  pool = localStorageDB;
}

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
