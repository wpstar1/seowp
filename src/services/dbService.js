// 데이터베이스 서비스
import { supabase } from '../lib/supabase';

// 데이터베이스 테이블 초기화
export async function initializeDatabase() {
  try {
    // Supabase 초기화
    await supabase.from('users').select('*');
    console.log('데이터베이스 초기화 완료');
    return { success: true };
  } catch (error) {
    console.error('데이터베이스 초기화 오류:', error);
    return { success: false, error: error.message };
  }
}

// 사용자 생성 함수
export async function createUser(userData) {
  try {
    const { username, password, email } = userData;
    
    // 1. Supabase 인증을 통한 사용자 생성
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });
    
    if (authError) {
      // 로컬 스토리지 폴백
      return createLocalUser(userData);
    }
    
    // 2. 사용자 테이블에 추가 정보 저장
    const { data, error } = await supabase
      .from('users')
      .insert([
        { 
          username, 
          email,
          user_id: authData.user.id,
          created_at: new Date().toISOString(),
          is_admin: username === '1111',
          membership_type: username === '1111' ? 'vip' : 'free',
          vip_status: username === '1111' ? 'approved' : 'none'
        }
      ])
      .select();
    
    if (error) {
      console.error('사용자 데이터 저장 오류:', error);
      // 로컬 스토리지 폴백
      return createLocalUser(userData);
    }
    
    // Supabase에서 사용자 생성 성공
    const user = {
      username: data[0].username,
      email: data[0].email,
      isAdmin: data[0].is_admin,
      membershipType: data[0].membership_type,
      vipStatus: data[0].vip_status,
      createdAt: data[0].created_at
    };
    
    return { success: true, user };
  } catch (error) {
    console.error('사용자 생성 중 오류 발생:', error);
    
    // 로컬 스토리지 폴백
    return createLocalUser(userData);
  }
}

// 로컬 스토리지에 사용자 생성 (폴백)
function createLocalUser(userData) {
  try {
    const { username, password, email } = userData;
    
    // 이미 존재하는 사용자 확인
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const existingUser = users.find(u => u.username === username);
    
    if (existingUser) {
      return { success: false, message: '이미 존재하는 사용자입니다.' };
    }
    
    // 새 사용자 생성
    const newUser = {
      _id: `user_${Date.now()}`,
      username,
      password,
      email,
      createdAt: new Date().toISOString(),
      isAdmin: username === '1111',
      membershipType: username === '1111' ? 'vip' : 'free',
      vipStatus: username === '1111' ? 'approved' : 'none'
    };
    
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    
    // 비밀번호 제외하고 반환
    const { password: _, ...userWithoutPassword } = newUser;
    return { success: true, user: userWithoutPassword };
  } catch (error) {
    console.error('로컬 사용자 생성 중 오류 발생:', error);
    return { success: false, message: '사용자 생성 중 오류가 발생했습니다.' };
  }
}

// 사용자 인증 함수
export async function authenticateUser(username, password) {
  try {
    // 먼저 이메일 찾기
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('email')
      .eq('username', username)
      .single();
    
    if (userError || !userData) {
      // 로컬 스토리지 폴백
      return authenticateLocalUser(username, password);
    }
    
    // Supabase 인증으로 로그인
    const { data, error } = await supabase.auth.signInWithPassword({
      email: userData.email,
      password
    });
    
    if (error) {
      // 로컬 스토리지 폴백
      return authenticateLocalUser(username, password);
    }
    
    // 사용자 정보 가져오기
    const { data: user, error: userDataError } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single();
    
    if (userDataError) {
      // 로컬 스토리지 폴백
      return authenticateLocalUser(username, password);
    }
    
    // 사용자 데이터 형식 변환
    const formattedUser = {
      username: user.username,
      email: user.email,
      isAdmin: user.is_admin,
      membershipType: user.membership_type,
      vipStatus: user.vip_status,
      vipExpiry: user.vip_expiry,
      createdAt: user.created_at
    };
    
    return { success: true, user: formattedUser };
  } catch (error) {
    console.error('사용자 인증 중 오류 발생:', error);
    
    // 로컬 스토리지 폴백
    return authenticateLocalUser(username, password);
  }
}

// 로컬 스토리지에서 사용자 인증 (폴백)
function authenticateLocalUser(username, password) {
  try {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find(u => u.username === username && u.password === password);
    
    if (!user) {
      return { success: false, message: '사용자명 또는 비밀번호가 일치하지 않습니다.' };
    }
    
    // 비밀번호 제외하고 반환
    const { password: _, ...userWithoutPassword } = user;
    return { success: true, user: userWithoutPassword };
  } catch (error) {
    console.error('로컬 사용자 인증 중 오류 발생:', error);
    return { success: false, message: '사용자 인증 중 오류가 발생했습니다.' };
  }
}

// 사용자명으로 사용자 조회
export async function getUserByUsername(username) {
  try {
    // Supabase에서 사용자 찾기
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single();
    
    if (error) {
      console.error('사용자 조회 오류:', error);
      
      // 로컬 스토리지 폴백
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const user = users.find(u => u.username === username);
      
      if (!user) {
        return { success: false, message: '사용자를 찾을 수 없습니다.' };
      }
      
      return { success: true, user };
    }
    
    if (!data) {
      return { success: false, message: '사용자를 찾을 수 없습니다.' };
    }
    
    // 사용자 데이터 형식 변환
    const user = {
      username: data.username,
      email: data.email,
      isAdmin: data.is_admin,
      membershipType: data.membership_type,
      vipStatus: data.vip_status,
      vipExpiry: data.vip_expiry,
      createdAt: data.created_at
    };
    
    return { success: true, user };
  } catch (error) {
    console.error('사용자 조회 중 오류 발생:', error);
    
    // 폴백: 로컬 스토리지
    try {
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const user = users.find(u => u.username === username);
      
      if (!user) {
        return { success: false, message: '사용자를 찾을 수 없습니다.' };
      }
      
      return { success: true, user };
    } catch (e) {
      return { success: false, message: '사용자 정보 로드 중 오류 발생' };
    }
  }
}

// VIP 상태 업데이트
export async function updateVipStatus(username, vipStatus, membershipType) {
  try {
    const vipExpiry = vipStatus === 'approved' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : null;
    
    // Supabase에서 VIP 상태 업데이트
    const { data, error } = await supabase
      .from('users')
      .update({ 
        vip_status: vipStatus, 
        membership_type: membershipType,
        vip_expiry: vipExpiry
      })
      .eq('username', username)
      .select();
    
    if (error) {
      console.error('VIP 상태 업데이트 오류:', error);
      // 로컬 스토리지 폴백
      return updateLocalVipStatus(username, vipStatus, membershipType);
    }
    
    return { success: true, user: data[0] };
  } catch (error) {
    console.error('VIP 상태 업데이트 중 오류 발생:', error);
    
    // 로컬 스토리지 폴백
    return updateLocalVipStatus(username, vipStatus, membershipType);
  }
}

// 로컬 스토리지에서 VIP 상태 업데이트 (폴백)
function updateLocalVipStatus(username, vipStatus, membershipType) {
  try {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const userIndex = users.findIndex(u => u.username === username);
    
    if (userIndex === -1) {
      return { success: false, message: '사용자를 찾을 수 없습니다.' };
    }
    
    // VIP 만료일 계산 (승인된 경우 30일)
    const vipExpiry = vipStatus === 'approved' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : null;
    
    // 사용자 정보 업데이트
    users[userIndex] = {
      ...users[userIndex],
      vipStatus,
      membershipType,
      vipExpiry
    };
    
    localStorage.setItem('users', JSON.stringify(users));
    
    return { success: true, user: users[userIndex] };
  } catch (error) {
    console.error('로컬 VIP 상태 업데이트 중 오류 발생:', error);
    return { success: false, message: 'VIP 상태 업데이트 중 오류가 발생했습니다.' };
  }
}

// 모든 사용자 조회
export async function getAllUsers() {
  try {
    // Supabase에서 모든 사용자 가져오기
    const { data, error } = await supabase
      .from('users')
      .select('*');
    
    if (error) {
      console.error('사용자 목록 조회 오류:', error);
      // 로컬 스토리지 폴백
      return getAllLocalUsers();
    }
    
    // 사용자 데이터 형식 변환
    const formattedUsers = data.map(user => ({
      username: user.username,
      email: user.email,
      isAdmin: user.is_admin,
      membershipType: user.membership_type,
      vipStatus: user.vip_status,
      vipExpiry: user.vip_expiry,
      createdAt: user.created_at
    }));
    
    return { success: true, users: formattedUsers };
  } catch (error) {
    console.error('사용자 목록 조회 중 오류 발생:', error);
    
    // 로컬 스토리지 폴백
    return getAllLocalUsers();
  }
}

// 로컬 스토리지에서 모든 사용자 가져오기 (폴백)
function getAllLocalUsers() {
  try {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    
    // 비밀번호 제외하고 반환
    const usersWithoutPasswords = users.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
    
    return { success: true, users: usersWithoutPasswords };
  } catch (error) {
    console.error('로컬 사용자 목록 조회 중 오류 발생:', error);
    return { success: false, message: '사용자 목록 조회 중 오류가 발생했습니다.' };
  }
}

// 사용자 일일 사용량 업데이트
export async function updateDailyUsage(username) {
  try {
    // Supabase에서 사용자 일일 사용량 업데이트
    const { data, error } = await supabase
      .from('users')
      .update({ 
        daily_usage_count: { _inc: 1 }
      })
      .eq('username', username)
      .select();
    
    if (error) {
      console.error('사용자 일일 사용량 업데이트 오류:', error);
      // 로컬 스토리지 폴백
      return updateLocalDailyUsage(username);
    }
    
    return { success: true };
  } catch (error) {
    console.error('사용자 일일 사용량 업데이트 중 오류 발생:', error);
    
    // 로컬 스토리지 폴백
    return updateLocalDailyUsage(username);
  }
}

// 로컬 스토리지에서 사용자 일일 사용량 업데이트 (폴백)
function updateLocalDailyUsage(username) {
  try {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const userIndex = users.findIndex(u => u.username === username);
    
    if (userIndex === -1) {
      return { success: false, message: '사용자를 찾을 수 없습니다.' };
    }
    
    // 사용자 일일 사용량 업데이트
    users[userIndex].dailyUsageCount = (users[userIndex].dailyUsageCount || 0) + 1;
    
    localStorage.setItem('users', JSON.stringify(users));
    
    return { success: true };
  } catch (error) {
    console.error('로컬 사용자 일일 사용량 업데이트 중 오류 발생:', error);
    return { success: false, message: '사용자 일일 사용량 업데이트 중 오류가 발생했습니다.' };
  }
}

// 사용자 키워드 기록 업데이트
export async function updateUserKeywords(username, keyword) {
  try {
    // Supabase에서 사용자 키워드 기록 업데이트
    const { data, error } = await supabase
      .from('users')
      .update({ 
        previous_keywords: { _append: [keyword] }
      })
      .eq('username', username)
      .select();
    
    if (error) {
      console.error('사용자 키워드 기록 업데이트 오류:', error);
      // 로컬 스토리지 폴백
      return updateLocalUserKeywords(username, keyword);
    }
    
    return { success: true };
  } catch (error) {
    console.error('사용자 키워드 기록 업데이트 중 오류 발생:', error);
    
    // 로컬 스토리지 폴백
    return updateLocalUserKeywords(username, keyword);
  }
}

// 로컬 스토리지에서 사용자 키워드 기록 업데이트 (폴백)
function updateLocalUserKeywords(username, keyword) {
  try {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const userIndex = users.findIndex(u => u.username === username);
    
    if (userIndex === -1) {
      return { success: false, message: '사용자를 찾을 수 없습니다.' };
    }
    
    // 사용자 키워드 기록 업데이트
    const keywords = users[userIndex].previousKeywords || [];
    keywords.unshift(keyword);
    
    if (keywords.length > 20) {
      keywords.pop();
    }
    
    users[userIndex].previousKeywords = keywords;
    
    localStorage.setItem('users', JSON.stringify(users));
    
    return { success: true };
  } catch (error) {
    console.error('로컬 사용자 키워드 기록 업데이트 중 오류 발생:', error);
    return { success: false, message: '사용자 키워드 기록 업데이트 중 오류가 발생했습니다.' };
  }
}

// 사용자 데이터 저장
export async function saveUserData(username, data) {
  try {
    // Supabase에서 사용자 데이터 저장
    const { data: userData, error } = await supabase
      .from('users')
      .update(data)
      .eq('username', username)
      .select();
    
    if (error) {
      console.error('사용자 데이터 저장 오류:', error);
      // 로컬 스토리지 폴백
      return saveLocalUserData(username, data);
    }
    
    return { success: true };
  } catch (error) {
    console.error('사용자 데이터 저장 중 오류 발생:', error);
    
    // 로컬 스토리지 폴백
    return saveLocalUserData(username, data);
  }
}

// 로컬 스토리지에서 사용자 데이터 저장 (폴백)
function saveLocalUserData(username, data) {
  try {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const userIndex = users.findIndex(u => u.username === username);
    
    if (userIndex === -1) {
      return { success: false, message: '사용자를 찾을 수 없습니다.' };
    }
    
    // 사용자 데이터 업데이트
    users[userIndex] = { ...users[userIndex], ...data };
    
    localStorage.setItem('users', JSON.stringify(users));
    
    return { success: true };
  } catch (error) {
    console.error('로컬 사용자 데이터 저장 중 오류 발생:', error);
    return { success: false, message: '사용자 데이터 저장 중 오류가 발생했습니다.' };
  }
}

// VIP 상태 확인
export function checkVipStatus(user) {
  if (!user) return false;
  
  // 관리자는 항상 VIP
  if (user.isAdmin || user.username === '1111') return true;
  
  // VIP 상태 확인
  if (user.vipStatus === 'approved' && user.membershipType === 'vip') {
    // VIP 만료 체크
    if (user.vipExpiry) {
      const now = new Date();
      const expiryDate = new Date(user.vipExpiry);
      return expiryDate > now;
    }
    return true;
  }
  
  return false;
}
