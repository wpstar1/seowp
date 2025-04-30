import { executeQuery, initDatabase } from '../lib/db';

// 데이터베이스 테이블 초기화
export async function initializeDatabase() {
  try {
    await initDatabase();
    console.log('PostgreSQL 데이터베이스 초기화 완료');
    return { success: true };
  } catch (error) {
    console.error('PostgreSQL 데이터베이스 초기화 오류:', error);
    return { success: false, error: error.message };
  }
}

// 모든 사용자 가져오기
export async function getAllUsers() {
  try {
    const result = await executeQuery('SELECT * FROM users ORDER BY id DESC');
    return { success: true, data: result.rows };
  } catch (error) {
    console.error('사용자 목록 가져오기 오류:', error);
    return { success: false, error: error.message };
  }
}

// 사용자명으로 사용자 가져오기
export async function getUserByUsername(username) {
  try {
    const result = await executeQuery('SELECT * FROM users WHERE username = $1', [username]);
    return { success: true, data: result.rows[0] };
  } catch (error) {
    console.error('사용자 가져오기 오류:', error);
    
    // 로컬 스토리지 폴백
    try {
      const usersString = localStorage.getItem('smart_content_users');
      if (usersString) {
        const users = JSON.parse(usersString);
        const user = users.find(u => u.username === username);
        if (user) {
          return { 
            success: true, 
            data: {
              id: Date.now(),
              username: user.username,
              password: user.password,
              membershipType: user.membershipType || 'free',
              vipStatus: user.vipStatus || 'none',
              isadmin: user.username === '1111'
            },
            isLocalStorage: true
          };
        }
      }
    } catch (localError) {
      console.error('로컬 스토리지 폴백 오류:', localError);
    }
    
    return { success: false, error: error.message };
  }
}

// 새 사용자 생성
export async function createUser(userData) {
  try {
    const { username, password, email = '' } = userData;
    
    console.log('사용자 생성 시도:', username);
    
    // 컬럼명 수정: membershipType -> membership_type, vipStatus -> vip_status
    const result = await executeQuery(
      'INSERT INTO users (username, password, email, membership_type, vip_status, created_at) VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *',
      [username, password, email, 'regular', 'none']
    );
    
    console.log('사용자 생성 성공:', username);
    
    // 로컬 스토리지 동기화 (폴백)
    try {
      const usersString = localStorage.getItem('smart_content_users');
      const users = usersString ? JSON.parse(usersString) : [];
      
      // 로컬 스토리지에 사용자 추가
      users.push({
        username,
        password,
        membershipType: 'regular',
        vipStatus: 'none',
        createdAt: new Date().toISOString()
      });
      
      localStorage.setItem('smart_content_users', JSON.stringify(users));
      console.log('로컬 스토리지에 사용자 추가:', username);
    } catch (localError) {
      console.error('로컬 스토리지 동기화 실패:', localError);
    }
    
    return { success: true, data: result.rows[0] };
  } catch (error) {
    console.error('사용자 생성 오류:', error);
    
    // 데이터베이스 오류 시 로컬 스토리지만 업데이트
    try {
      const usersString = localStorage.getItem('smart_content_users');
      const users = usersString ? JSON.parse(usersString) : [];
      
      // 이미 존재하는 사용자인지 확인
      const existingUser = users.find(u => u.username === userData.username);
      if (existingUser) {
        return { success: false, error: '이미 존재하는 사용자입니다.' };
      }
      
      // 로컬 스토리지에 사용자 추가
      users.push({
        username: userData.username,
        password: userData.password,
        membershipType: 'regular',
        vipStatus: 'none',
        createdAt: new Date().toISOString()
      });
      
      localStorage.setItem('smart_content_users', JSON.stringify(users));
      console.log('데이터베이스 실패 후 로컬 스토리지만 업데이트:', userData.username);
      
      return { 
        success: true, 
        data: {
          username: userData.username,
          membership_type: 'regular',
          vip_status: 'none'
        },
        isLocalStorage: true
      };
    } catch (localError) {
      console.error('로컬 스토리지 업데이트 실패:', localError);
    }
    
    return { success: false, error: error.message };
  }
}

// VIP 상태 업데이트
export async function updateVipStatus(username, membershipType, vipStatus, expiryDate) {
  try {
    const result = await executeQuery(
      'UPDATE users SET membershipType = $1, vipStatus = $2, vipExpireDate = $3 WHERE username = $4 RETURNING *',
      [membershipType, vipStatus, expiryDate, username]
    );
    
    return { success: true, data: result.rows[0] };
  } catch (error) {
    console.error('VIP 상태 업데이트 오류:', error);
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
    await executeQuery('UPDATE users SET updated_at = NOW() WHERE username = $1', [username]);
    
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
      'SELECT * FROM users WHERE username = $1', 
      [username]
    );
    
    if (!result.success || result.data.length === 0) {
      // IndexedDB에서 사용자를 찾지 못한 경우 로컬 스토리지에서 다시 확인
      try {
        const localUsers = JSON.parse(localStorage.getItem('smart_content_users') || '[]');
        const localUser = localUsers.find(u => u.username === username);
        
        if (localUser) {
          const isVip = 
            localUser.membershipType === 'vip' && 
            localUser.vipStatus === 'approved' && 
            (localUser.membershipExpiry ? new Date(localUser.membershipExpiry) > new Date() : false);
          
          return { success: true, isVip };
        }
      } catch (localError) {
        console.error('로컬 스토리지 VIP 상태 확인 오류:', localError);
      }
      
      return { success: false, error: '사용자를 찾을 수 없습니다.' };
    }
    
    const user = result.data[0];
    
    // VIP 상태 확인
    const isVip = 
      user.membershipType === 'vip' && 
      user.vipStatus === 'approved' && 
      (user.membershipExpiry ? new Date(user.membershipExpiry) > new Date() : false);
    
    return { success: true, isVip };
  } catch (error) {
    console.error('VIP 상태 확인 오류:', error);
    
    // 오류 발생 시 로컬 스토리지 폴백
    try {
      const localUsers = JSON.parse(localStorage.getItem('smart_content_users') || '[]');
      const localUser = localUsers.find(u => u.username === username);
      
      if (localUser) {
        const isVip = 
          localUser.membershipType === 'vip' && 
          localUser.vipStatus === 'approved' && 
          (localUser.membershipExpiry ? new Date(localUser.membershipExpiry) > new Date() : false);
        
        return { success: true, isVip };
      }
    } catch (localError) {
      console.error('로컬 스토리지 VIP 상태 확인 오류:', localError);
    }
    
    return { success: false, error: error.message };
  }
}

// 사용자 데이터 저장
export async function saveUserData(username, data) {
  try {
    const { links, previousKeywords } = data;
    
    // 사용자 확인
    const userResult = await executeQuery('SELECT * FROM users WHERE username = $1', [username]);
    
    if (!userResult.success || userResult.data.length === 0) {
      return { success: false, error: '사용자를 찾을 수 없습니다.' };
    }
    
    const user = userResult.data[0];
    
    // 사용자 데이터 업데이트
    const updateResult = await executeQuery(
      'UPDATE users SET password = $1, saved_links = $2, previous_keywords = $3, updated_at = NOW() WHERE username = $4 RETURNING *',
      [user.password, JSON.stringify(links || []), JSON.stringify(previousKeywords || []), username]
    );
    
    if (!updateResult.success) {
      return { success: false, error: updateResult.error };
    }
    
    // 로컬 스토리지도 업데이트 (백업 및 동기화)
    try {
      const localUsers = JSON.parse(localStorage.getItem('smart_content_users') || '[]');
      const userIndex = localUsers.findIndex(u => u.username === username);
      
      if (userIndex !== -1) {
        localUsers[userIndex] = {
          ...localUsers[userIndex],
          savedLinks: links || [],
          previousKeywords: previousKeywords || [],
          updatedAt: new Date().toISOString()
        };
      } else {
        localUsers.push({
          username,
          password: user.password,
          membershipType: user.membershipType,
          vipStatus: user.vipStatus,
          membershipExpiry: user.membershipExpiry,
          createdAt: user.createdAt,
          updatedAt: new Date().toISOString(),
          savedLinks: links || [],
          previousKeywords: previousKeywords || [],
          isAdmin: username === '1111'
        });
      }
      
      localStorage.setItem('smart_content_users', JSON.stringify(localUsers));
    } catch (localError) {
      console.error('로컬 스토리지 업데이트 오류:', localError);
    }
    
    return { success: true, user: updateResult.data[0] };
  } catch (error) {
    console.error('사용자 데이터 저장 오류:', error);
    return { success: false, error: error.message };
  }
}
