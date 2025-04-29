import pool, { executeQuery, usersDB } from '../lib/db';

// 데이터베이스 테이블 초기화
export async function initializeDatabase() {
  try {
    // 사용자 테이블 생성
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        membership_type VARCHAR(50) DEFAULT 'basic',
        vip_status VARCHAR(50) DEFAULT 'none',
        membership_expiry TIMESTAMP WITH TIME ZONE,
        is_admin BOOLEAN DEFAULT FALSE,
        saved_links JSONB DEFAULT '[]',
        previous_keywords JSONB DEFAULT '[]'
      )
    `);
    
    console.log('데이터베이스 테이블 초기화 완료');
    return { success: true };
  } catch (error) {
    console.error('데이터베이스 초기화 오류:', error);
    return { success: false, error: error.message };
  }
}

// 로컬 스토리지 데이터 마이그레이션
export async function migrateLocalStorageData() {
  try {
    if (typeof window === 'undefined') return { success: false, error: '클라이언트 환경에서만 사용 가능합니다.' };
    
    // 로컬 스토리지에서 사용자 데이터 가져오기
    const users = JSON.parse(localStorage.getItem('smart_content_users') || '[]');
    const results = [];
    
    for (const user of users) {
      try {
        // 사용자 데이터 삽입 또는 업데이트
        const result = await executeQuery(`
          INSERT INTO users 
            (username, password, membership_type, vip_status, membership_expiry, is_admin, saved_links, previous_keywords) 
          VALUES 
            ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (username) 
          DO UPDATE SET 
            password = EXCLUDED.password,
            membership_type = EXCLUDED.membership_type,
            vip_status = EXCLUDED.vip_status,
            membership_expiry = EXCLUDED.membership_expiry,
            is_admin = EXCLUDED.is_admin,
            saved_links = EXCLUDED.saved_links,
            previous_keywords = EXCLUDED.previous_keywords,
            updated_at = CURRENT_TIMESTAMP
          RETURNING *
        `, [
          user.username,
          user.password,
          user.membershipType || 'basic',
          user.vipStatus || 'none',
          user.membershipExpiry || null,
          user.username === '1111', // 관리자 계정
          JSON.stringify(user.savedLinks || []),
          JSON.stringify(user.previousKeywords || [])
        ]);
        
        if (result.success) {
          results.push({ username: user.username, success: true });
        } else {
          results.push({ username: user.username, success: false, error: result.error });
        }
      } catch (error) {
        results.push({ username: user.username, success: false, error: error.message });
      }
    }
    
    return { success: true, results };
  } catch (error) {
    console.error('마이그레이션 오류:', error);
    return { success: false, error: error.message };
  }
}

// 사용자 인증 함수
export async function authenticateUser(username, password) {
  try {
    const result = await executeQuery('SELECT * FROM users WHERE username = $1', [username]);
    
    if (!result.success || result.data.length === 0) {
      return { success: false, error: '사용자를 찾을 수 없습니다.' };
    }
    
    const user = result.data[0];
    
    // 비밀번호 확인 (실제로는 해싱된 비밀번호 비교해야 함)
    if (user.password !== password) {
      return { success: false, error: '비밀번호가 일치하지 않습니다.' };
    }
    
    // 로그인 시간 업데이트
    await executeQuery('UPDATE users SET updated_at = NOW() WHERE id = $1', [user.id]);
    
    // 비밀번호 정보는 제외하고 리턴
    delete user.password;
    
    return { success: true, user };
  } catch (error) {
    console.error('인증 오류:', error);
    return { success: false, error: error.message };
  }
}

// VIP 상태 확인
export async function checkVipStatus(username) {
  try {
    // 관리자는 항상 VIP
    if (username === '1111') {
      return { success: true, isVip: true };
    }
    
    const result = await executeQuery(
      'SELECT membership_type, vip_status, membership_expiry FROM users WHERE username = $1', 
      [username]
    );
    
    if (!result.success || result.data.length === 0) {
      return { success: false, error: '사용자를 찾을 수 없습니다.' };
    }
    
    const user = result.data[0];
    
    // VIP 상태 확인
    const isVip = 
      user.membership_type === 'vip' && 
      user.vip_status === 'approved' && 
      (user.membership_expiry ? new Date(user.membership_expiry) > new Date() : false);
    
    return { success: true, isVip };
  } catch (error) {
    console.error('VIP 상태 확인 오류:', error);
    return { success: false, error: error.message };
  }
}

// 사용자 데이터 저장
export async function saveUserData(username, data) {
  try {
    const { links, previousKeywords } = data;
    
    // 사용자 확인
    const userResult = await executeQuery('SELECT id FROM users WHERE username = $1', [username]);
    
    if (!userResult.success || userResult.data.length === 0) {
      return { success: false, error: '사용자를 찾을 수 없습니다.' };
    }
    
    // 사용자 데이터 업데이트
    const updateResult = await executeQuery(
      'UPDATE users SET saved_links = $1, previous_keywords = $2, updated_at = NOW() WHERE username = $3 RETURNING *',
      [JSON.stringify(links || []), JSON.stringify(previousKeywords || []), username]
    );
    
    if (!updateResult.success) {
      return { success: false, error: updateResult.error };
    }
    
    return { success: true, user: updateResult.data[0] };
  } catch (error) {
    console.error('사용자 데이터 저장 오류:', error);
    return { success: false, error: error.message };
  }
}
