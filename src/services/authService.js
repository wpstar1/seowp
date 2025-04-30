import { executeQuery } from '../lib/db';
import { getUserByUsername, createUser, updateVipStatus, checkVipStatus } from './dbService';

// 사용자 로그인 함수
export async function loginUser(username, password) {
  try {
    // 로그인 처리를 위한 데이터베이스 쿼리
    const result = await executeQuery(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );
    
    // 사용자를 찾을 수 없음
    if (!result.rows || result.rows.length === 0) {
      return { success: false, error: '사용자명 또는 비밀번호가 잘못되었습니다.' };
    }
    
    const user = result.rows[0];
    
    // 비밀번호 확인
    if (user.password !== password) {
      return { success: false, error: '사용자명 또는 비밀번호가 잘못되었습니다.' };
    }
    
    console.log('로그인 성공:', username);
    
    // 로그인 시간 업데이트
    await executeQuery('UPDATE users SET updated_at = NOW() WHERE username = $1', [username]);
    
    // 세션 정보 저장
    const sessionId = await createSession(username);
    
    // VIP 상태 확인
    const vipResult = await checkVipStatus(username);
    const isVip = vipResult.success && vipResult.isVip;
    
    // 비밀번호 정보는 제외하고 리턴
    const userData = { ...user };
    delete userData.password;
    
    return { 
      success: true, 
      user: {
        ...userData,
        isVip,
        isAdmin: user.isadmin,
        sessionId
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
    const checkResult = await executeQuery('SELECT * FROM users WHERE username = $1', [username]);
    
    if (checkResult.rows && checkResult.rows.length > 0) {
      return { success: false, error: '이미 사용 중인 사용자명입니다.' };
    }
    
    // 새 사용자 생성
    const userData = {
      username, 
      password,
      email: ''
    };
    
    const result = await createUser(userData);
    
    if (!result.success) {
      throw new Error(result.error || '사용자 등록 중 오류가 발생했습니다.');
    }
    
    return { success: true, message: '회원가입이 완료되었습니다. 로그인해주세요.' };
  } catch (error) {
    console.error('회원가입 오류:', error);
    return { success: false, error: error.message || '회원가입 중 오류가 발생했습니다.' };
  }
}

// 로그아웃 함수
export async function logoutUser(sessionId) {
  try {
    // 세션 정보 삭제
    await deleteSession(sessionId);
    return { success: true };
  } catch (error) {
    console.error('로그아웃 오류:', error);
    return { success: false, error: '로그아웃 중 오류가 발생했습니다.' };
  }
}

// 현재 사용자 정보 가져오기
export async function getCurrentUser(sessionId) {
  try {
    // 세션 정보 확인
    const sessionResult = await getSession(sessionId);
    
    if (!sessionResult.success) {
      return { success: false, error: '로그인된 사용자가 없습니다.' };
    }
    
    const username = sessionResult.data.username;
    
    // 데이터베이스에서 사용자 정보 조회
    const result = await getUserByUsername(username);
    
    if (!result.success) {
      return { success: false, error: '사용자 정보를 찾을 수 없습니다.' };
    }
    
    const user = result.data;
    
    // VIP 상태 확인
    const vipResult = await checkVipStatus(username);
    const isVip = vipResult.success && vipResult.isVip;
    
    // 비밀번호 정보 제외
    const userData = { ...user };
    delete userData.password;
    
    return { 
      success: true, 
      user: {
        ...userData,
        isVip,
        isAdmin: user.isadmin
      } 
    };
  } catch (error) {
    console.error('사용자 정보 조회 오류:', error);
    return { success: false, error: '사용자 정보 조회 중 오류가 발생했습니다.' };
  }
}

// 세션 생성 함수
async function createSession(username) {
  try {
    const sessionId = await executeQuery('INSERT INTO sessions (username) VALUES ($1) RETURNING id', [username]);
    return sessionId.rows[0].id;
  } catch (error) {
    console.error('세션 생성 오류:', error);
    throw error;
  }
}

// 세션 정보 가져오기 함수
async function getSession(sessionId) {
  try {
    const result = await executeQuery('SELECT * FROM sessions WHERE id = $1', [sessionId]);
    if (!result.rows || result.rows.length === 0) {
      return { success: false, error: '세션 정보를 찾을 수 없습니다.' };
    }
    return { success: true, data: result.rows[0] };
  } catch (error) {
    console.error('세션 정보 조회 오류:', error);
    throw error;
  }
}

// 세션 삭제 함수
async function deleteSession(sessionId) {
  try {
    await executeQuery('DELETE FROM sessions WHERE id = $1', [sessionId]);
  } catch (error) {
    console.error('세션 삭제 오류:', error);
    throw error;
  }
}
