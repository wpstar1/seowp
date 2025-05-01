// Supabase 클라이언트 설정
import { createClient } from '@supabase/supabase-js';

// Supabase URL과 API 키 설정 (환경 변수 또는 하드코딩된 값 사용)
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://eerkpvbwuyzszvzuoxvn.supabase.co';
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVlcmtwdmJ3dXl6c3p2enVveHZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYwMjc0NDUsImV4cCI6MjA2MTYwMzQ0NX0.g5ebQX7U0IPEmuN5E7o8yOOoc5_kOaqVUq-e7ikKxCg';

// Supabase 클라이언트 생성
export const supabase = createClient(supabaseUrl, supabaseKey);

// 사용자 관련 함수들
export const auth = {
  // 회원가입
  async signup(userData) {
    const { email, password, username } = userData;
    
    // 1. Supabase 인증을 통한 사용자 생성
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });
    
    if (authError) throw authError;
    
    // 2. 사용자 테이블에 추가 정보 저장
    const { data: userData, error: userError } = await supabase
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
    
    if (userError) throw userError;
    
    return {
      user: {
        ...userData[0],
        id: authData.user.id
      }
    };
  },
  
  // 로그인
  async login({ email, password }) {
    // 1. Supabase 인증으로 로그인
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (authError) throw authError;
    
    // 2. 사용자 정보 가져오기
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', authData.user.id)
      .single();
    
    if (userError) throw userError;
    
    return {
      user: {
        ...userData,
        id: authData.user.id
      }
    };
  },
  
  // 로그아웃
  async logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { success: true };
  },
  
  // 현재 사용자 가져오기
  async getCurrentUser() {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      return { user: null };
    }
    
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', session.user.id)
      .single();
    
    if (userError) return { user: null };
    
    return {
      user: {
        ...userData,
        id: session.user.id
      }
    };
  }
};

// 사용자 관리 함수들
export const users = {
  // 모든 사용자 목록 가져오기
  async getAll() {
    const { data, error } = await supabase
      .from('users')
      .select('*');
    
    if (error) throw error;
    return { users: data };
  },
  
  // VIP 상태 업데이트
  async updateVipStatus(username, vipStatus, membershipType) {
    const { data, error } = await supabase
      .from('users')
      .update({ vip_status: vipStatus, membership_type: membershipType })
      .eq('username', username)
      .select();
    
    if (error) throw error;
    return { user: data[0] };
  }
};

// Supabase 스키마 생성 함수 (최초 1회 실행)
export async function setupSupabaseSchema() {
  try {
    // 1. 사용자 테이블 생성
    const { error: createError } = await supabase.rpc('create_users_table_if_not_exists');
    
    if (createError) {
      console.error('사용자 테이블 생성 오류:', createError);
      return false;
    }
    
    console.log('Supabase 스키마 설정 완료');
    return true;
  } catch (error) {
    console.error('Supabase 스키마 설정 오류:', error);
    return false;
  }
}

// 로컬 스토리지 폴백 메커니즘
export function getLocalUsers() {
  try {
    return JSON.parse(localStorage.getItem('users') || '[]');
  } catch (error) {
    console.error('로컬 스토리지 읽기 오류:', error);
    return [];
  }
}

export function saveLocalUser(userData) {
  try {
    const users = getLocalUsers();
    const existingIndex = users.findIndex(u => u.username === userData.username);
    
    if (existingIndex >= 0) {
      users[existingIndex] = { ...users[existingIndex], ...userData };
    } else {
      users.push({
        ...userData,
        _id: `user_${Date.now()}`,
        createdAt: new Date().toISOString(),
        isAdmin: userData.username === '1111',
        membershipType: userData.username === '1111' ? 'vip' : 'free',
        vipStatus: userData.username === '1111' ? 'approved' : 'none'
      });
    }
    
    localStorage.setItem('users', JSON.stringify(users));
    return users;
  } catch (error) {
    console.error('로컬 스토리지 저장 오류:', error);
    return [];
  }
}
