import { executeQuery } from '../lib/db';
import { saveUserData, checkVipStatus } from './dbService';

// 사용자 로그인 함수
export async function loginUser(username, password) {
  try {
    // 로그인 처리를 위한 데이터베이스 쿼리
    const result = await executeQuery(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );
    
    // 사용자를 찾을 수 없음
    if (!result.success || result.data.length === 0) {
      console.log('로그인 실패: 사용자를 찾을 수 없음', username);
      
      // 로컬 스토리지 폴백: 데이터베이스에 사용자가 없으면 로컬 스토리지 확인
      const localUsers = JSON.parse(localStorage.getItem('smart_content_users') || '[]');
      const localUser = localUsers.find(u => u.username.toLowerCase() === username.toLowerCase());
      
      if (localUser && localUser.password === password) {
        console.log('로컬 스토리지에서 사용자 찾음:', username);
        
        // 로컬 스토리지에 있는 사용자를 데이터베이스에 마이그레이션
        await executeQuery(
          `INSERT INTO users 
            (username, password, membership_type, vip_status, membership_expiry, is_admin, saved_links, previous_keywords) 
          VALUES 
            ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (username) 
          DO NOTHING
          RETURNING *`,
          [
            localUser.username,
            localUser.password,
            localUser.membershipType || 'basic',
            localUser.vipStatus || 'none',
            localUser.membershipExpiry || null,
            localUser.username === '1111',
            JSON.stringify(localUser.savedLinks || []),
            JSON.stringify(localUser.previousKeywords || [])
          ]
        );
        
        // 로컬 스토리지에서 사용자 정보 유지
        localStorage.setItem('smart_content_current_user', username);
        
        // 세션 유지를 위한 만료 시간 설정 (7일)
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 7);
        localStorage.setItem('smart_content_login_expiry', expiryDate.getTime().toString());
        
        return {
          success: true,
          user: {
            username: localUser.username,
            isVip: localUser.membershipType === 'vip' && localUser.vipStatus === 'approved',
            isAdmin: localUser.username === '1111'
          }
        };
      }
      
      return { success: false, error: '사용자명 또는 비밀번호가 잘못되었습니다.' };
    }
    
    const user = result.data[0];
    
    // 비밀번호 확인
    if (user.password !== password) {
      console.log('로그인 실패: 비밀번호 불일치', username);
      return { success: false, error: '사용자명 또는 비밀번호가 잘못되었습니다.' };
    }
    
    console.log('로그인 성공:', username);
    
    // 로그인 시간 업데이트
    await executeQuery('UPDATE users SET updated_at = NOW() WHERE id = $1', [user.id]);
    
    // 로컬 스토리지에 사용자 정보 유지
    localStorage.setItem('smart_content_current_user', username);
    
    // 세션 유지를 위한 만료 시간 설정 (7일)
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 7);
    localStorage.setItem('smart_content_login_expiry', expiryDate.getTime().toString());
    
    // VIP 상태 확인
    const vipResult = await checkVipStatus(username);
    const isVip = vipResult.success && vipResult.isVip;
    
    // 비밀번호 정보는 제외하고 리턴
    delete user.password;
    
    return { 
      success: true, 
      user: {
        ...user,
        isVip,
        isAdmin: user.username === '1111'
      } 
    };
  } catch (error) {
    console.error('로그인 오류:', error);
    return { success: false, error: error.message || '로그인 중 오류가 발생했습니다.' };
  }
}

// 사용자 등록 함수
export async function registerUser(username, password, confirmPassword) {
  try {
    // 비밀번호 확인
    if (password !== confirmPassword) {
      return { success: false, error: '비밀번호가 일치하지 않습니다.' };
    }
    
    // 사용자명 중복 확인
    const checkResult = await executeQuery('SELECT id FROM users WHERE username = $1', [username]);
    
    if (checkResult.success && checkResult.data.length > 0) {
      return { success: false, error: '이미 사용 중인 사용자명입니다.' };
    }
    
    // 로컬 스토리지에서도 중복 확인
    const localUsers = JSON.parse(localStorage.getItem('smart_content_users') || '[]');
    if (localUsers.some(u => u.username.toLowerCase() === username.toLowerCase())) {
      return { success: false, error: '이미 사용 중인 사용자명입니다.' };
    }
    
    // 새 사용자 생성
    const result = await executeQuery(
      'INSERT INTO users (username, password, is_admin) VALUES ($1, $2, $3) RETURNING *',
      [username, password, username === '1111']
    );
    
    if (!result.success) {
      throw new Error(result.error || '사용자 등록 중 오류가 발생했습니다.');
    }
    
    const user = result.data[0];
    
    // 관리자 계정(1111)은 자동으로 VIP 권한 부여
    if (username === '1111') {
      const expiryDate = new Date();
      expiryDate.setFullYear(expiryDate.getFullYear() + 1); // 1년 유효기간
      
      await executeQuery(
        'UPDATE users SET is_admin = TRUE, membership_type = $1, vip_status = $2, membership_expiry = $3 WHERE username = $4',
        ['vip', 'approved', expiryDate, username]
      );
    }
    
    // 로컬 스토리지에도 사용자 정보 저장
    const newLocalUser = {
      username,
      password,
      membershipType: username === '1111' ? 'vip' : 'basic',
      vipStatus: username === '1111' ? 'approved' : 'none',
      createdAt: new Date().toISOString(),
      savedLinks: [],
      previousKeywords: []
    };
    
    localUsers.push(newLocalUser);
    localStorage.setItem('smart_content_users', JSON.stringify(localUsers));
    
    // 비밀번호 정보는 제외하고 리턴
    delete user.password;
    
    return { 
      success: true, 
      user: {
        ...user,
        isVip: username === '1111',
        isAdmin: username === '1111'
      } 
    };
  } catch (error) {
    console.error('사용자 등록 오류:', error);
    return { success: false, error: error.message || '사용자 등록 중 오류가 발생했습니다.' };
  }
}

// 로그아웃 함수
export function logoutUser() {
  try {
    // 로컬 스토리지에서 현재 사용자 정보 제거
    localStorage.removeItem('smart_content_current_user');
    localStorage.removeItem('smart_content_login_expiry');
    
    return { success: true };
  } catch (error) {
    console.error('로그아웃 오류:', error);
    return { success: false, error: error.message || '로그아웃 중 오류가 발생했습니다.' };
  }
}

// 현재 사용자 정보 가져오기
export async function getCurrentUser() {
  try {
    const username = localStorage.getItem('smart_content_current_user');
    
    if (!username) {
      return { success: false, error: '로그인된 사용자가 없습니다.' };
    }
    
    // 로그인 만료 시간 확인
    const loginExpiry = localStorage.getItem('smart_content_login_expiry');
    const currentTime = new Date().getTime();
    
    if (!loginExpiry || currentTime > parseInt(loginExpiry)) {
      // 로그인 세션이 만료됨
      localStorage.removeItem('smart_content_current_user');
      localStorage.removeItem('smart_content_login_expiry');
      return { success: false, error: '로그인 세션이 만료되었습니다.' };
    }
    
    // 데이터베이스에서 사용자 정보 조회
    const result = await executeQuery('SELECT * FROM users WHERE username = $1', [username]);
    
    // 데이터베이스에 사용자 정보가 없으면 로컬 스토리지 확인
    if (!result.success || result.data.length === 0) {
      console.log('데이터베이스에 사용자 정보가 없음, 로컬 스토리지 확인:', username);
      
      // 로컬 스토리지에서 사용자 정보 확인
      const localUsers = JSON.parse(localStorage.getItem('smart_content_users') || '[]');
      const localUser = localUsers.find(u => u.username.toLowerCase() === username.toLowerCase());
      
      if (localUser) {
        return {
          success: true,
          user: {
            username: localUser.username,
            isVip: localUser.membershipType === 'vip' && localUser.vipStatus === 'approved',
            isAdmin: localUser.username === '1111',
            savedLinks: localUser.savedLinks || [],
            previousKeywords: localUser.previousKeywords || []
          }
        };
      }
      
      return { success: false, error: '사용자 정보를 찾을 수 없습니다.' };
    }
    
    const user = result.data[0];
    
    // VIP 상태 확인
    const vipResult = await checkVipStatus(username);
    const isVip = vipResult.success && vipResult.isVip;
    
    // 비밀번호 정보는 제외하고 리턴
    delete user.password;
    
    return { 
      success: true, 
      user: {
        ...user,
        isVip,
        isAdmin: user.username === '1111'
      } 
    };
  } catch (error) {
    console.error('현재 사용자 정보 조회 오류:', error);
    return { success: false, error: error.message || '사용자 정보 조회 중 오류가 발생했습니다.' };
  }
}
