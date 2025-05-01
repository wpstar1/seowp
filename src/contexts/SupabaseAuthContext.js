import React, { createContext, useContext, useState, useEffect } from 'react';
import moment from 'moment';
import { supabase } from '../lib/supabase';
import { v4 as uuidv4 } from 'uuid';

// 인증 컨텍스트 생성
const AuthContext = createContext();

// 컨텍스트 훅
export const useAuth = () => {
  return useContext(AuthContext);
};

// 로컬 스토리지 키 정의 (폴백용)
const USERS_KEY = 'smart_content_users';
const CURRENT_USER_KEY = 'smart_content_current_user';
const VIP_APPROVED_USERS_KEY = 'smart_content_vip_approved_users';

// Supabase 인증 제공자 컴포넌트
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(false);

  // Supabase 연결 확인
  useEffect(() => {
    const checkSupabaseConnection = async () => {
      try {
        // 더 단순한 연결 확인 방법 사용
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Supabase 연결 오류:', error);
          setIsSupabaseConnected(false);
        } else {
          console.log('Supabase 연결 성공');
          setIsSupabaseConnected(true);
        }
      } catch (err) {
        console.error('Supabase 연결 확인 중 오류:', err);
        setIsSupabaseConnected(false);
      }
    };

    checkSupabaseConnection();
  }, []);

  // 초기화 시 사용자 로드
  useEffect(() => {
    const loadUser = async () => {
      try {
        if (isSupabaseConnected) {
          // Supabase 세션 확인
          const { data: session } = await supabase.auth.getSession();
          
          if (session && session.session) {
            // 사용자 정보 조회
            const { data: userData, error } = await supabase
              .from('users')
              .select('*')
              .eq('username', session.session.user.user_metadata?.username || '')
              .single();
            
            if (error) {
              console.error('사용자 정보 조회 오류:', error);
              setCurrentUser(null);
            } else {
              // Supabase에서 가져온 데이터를 기존 앱 형식에 맞게 변환
              const formattedUser = {
                id: userData.id,
                username: userData.username,
                email: userData.email,
                isAdmin: userData.is_admin,
                membershipType: userData.membership_type,
                vipStatus: userData.vip_status,
                vipExpiry: userData.vip_expiry,
                createdAt: userData.created_at
              };
              
              setCurrentUser(formattedUser);
              console.log('Supabase에서 사용자 로드 성공:', formattedUser.username);
            }
          } else {
            // 로컬 스토리지 폴백 (Supabase 연결 실패 시)
            fallbackToLocalStorage();
          }
        } else {
          // Supabase 연결이 안 되면 로컬 스토리지 사용
          fallbackToLocalStorage();
        }

        setLoading(false);
      } catch (err) {
        console.error('사용자 로드 중 오류:', err);
        setError(err.message);
        setLoading(false);
        
        // 오류 발생 시 로컬 스토리지 폴백
        fallbackToLocalStorage();
      }
    };
    
    // 로컬 스토리지에서 사용자 정보 로드 (폴백)
    const fallbackToLocalStorage = () => {
      try {
        const username = localStorage.getItem(CURRENT_USER_KEY);
        if (!username) {
          console.log('로그인된 사용자 없음 (로컬 스토리지)');
          setCurrentUser(null);
          return;
        }
        
        const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
        const user = users.find(u => u.username === username);
        
        if (user) {
          setCurrentUser(user);
          console.log('로컬 스토리지에서 사용자 로드 성공:', username);
        } else {
          setCurrentUser(null);
          console.log('로컬 스토리지에서 사용자를 찾을 수 없음:', username);
        }
      } catch (err) {
        console.error('로컬 스토리지에서 사용자 로드 중 오류:', err);
        setCurrentUser(null);
      }
    };

    loadUser();
  }, [isSupabaseConnected]);

  // 회원가입
  const register = async (userData) => {
    try {
      setError('');
      
      if (!isSupabaseConnected) {
        throw new Error('Supabase 연결이 필요합니다. 인터넷 연결을 확인해주세요.');
      }

      // 비밀번호 길이 확인
      if (userData.password.length < 6) {
        throw new Error('비밀번호는 6자리 이상이어야 합니다.');
      }
      
      // 사용자명을 이메일 형식으로 변환 (Supabase 요구사항)
      const autoEmail = `${userData.username}@example.com`;
      console.log('회원가입 시도:', userData.username, '자동 생성 이메일:', autoEmail);
      
      // Supabase로 회원가입
      const { data, error } = await supabase.auth.signUp({
        email: autoEmail,
        password: userData.password,
        options: {
          data: {
            username: userData.username
          }
        }
      });
      
      if (error) {
        throw new Error(error.message || '회원가입 중 오류가 발생했습니다.');
      }
      
      // 사용자 정보를 users 테이블에도 저장
      const isAdmin = userData.username === '1111';
      const vipStatus = userData.username === '1111' ? 'approved' : 'none';
      const membershipType = userData.username === '1111' ? 'vip' : 'free';
      
      console.log('사용자 등록 성공, 사용자 ID:', data.user.id);
      console.log('users 테이블에 저장 시도:', { username: userData.username, is_admin: isAdmin });
      
      // UUID 생성 (PostgreSQL의 UUID 타입과 호환)
      const userId = uuidv4();
      
      // users 테이블에 사용자 정보 저장
      const { error: insertError } = await supabase
        .from('users')
        .insert([
          { 
            id: userId, // UUID 생성
            username: userData.username,
            email: autoEmail, // 자동 생성된 이메일 저장
            is_admin: isAdmin,
            vip_status: vipStatus,
            membership_type: membershipType
          }
        ]);
        
      if (insertError) {
        console.error('users 테이블 저장 오류:', insertError);
        
        // 실패 시 다시 한번 시도 (가능한 충돌 해결)
        const { error: upsertError } = await supabase
          .from('users')
          .upsert([
            { 
              id: userId,
              username: userData.username,
              email: autoEmail,
              is_admin: isAdmin,
              vip_status: vipStatus,
              membership_type: membershipType
            }
          ]);
          
        if (upsertError) {
          console.error('users 테이블 upsert 오류:', upsertError);
        } else {
          console.log('users 테이블 upsert 성공');
        }
      } else {
        console.log('users 테이블 저장 성공');
      }
      
      // 사용자 정보를 기존 앱 형식에 맞게 변환
      const formattedUser = {
        id: userId, // UUID를 사용자 객체에도 추가
        username: userData.username,
        email: autoEmail,
        isAdmin: isAdmin,
        membershipType: membershipType,
        vipStatus: vipStatus,
        createdAt: new Date().toISOString()
      };
      
      // 현재 사용자로 설정
      setCurrentUser(formattedUser);
      localStorage.setItem(CURRENT_USER_KEY, userData.username);
      
      return { success: true, user: formattedUser };
    } catch (err) {
      console.error('회원가입 오류:', err);
      setError(err.message);
      throw err;
    }
  };

  // 로그인
  const login = async (username, password) => {
    try {
      setError('');
      console.log('로그인 시도:', username);
      
      if (!isSupabaseConnected) {
        throw new Error('Supabase 연결이 필요합니다. 인터넷 연결을 확인해주세요.');
      }
      
      // 자동 이메일 생성 (회원가입과 동일한 로직)
      const autoEmail = `${username}@example.com`;
      
      console.log('Supabase 로그인 시도:', autoEmail);
      
      // Supabase로 로그인
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email: autoEmail,
        password 
      });
      
      if (error) {
        console.error('Supabase 로그인 실패:', error.message);
        throw new Error('로그인 정보가 일치하지 않습니다. 사용자명과 비밀번호를 확인해주세요.');
      }
      
      console.log('Supabase 로그인 성공, 데이터:', data);
      
      // 사용자 정보 가져오기
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .single();
      
      if (userError && userError.code !== 'PGRST116') {
        console.error('사용자 데이터 조회 실패:', userError);
      }
      
      // 사용자 데이터 구성
      let formattedUser;
      
      if (userData) {
        // 사용자 테이블에서 데이터를 가져온 경우
        formattedUser = {
          id: userData.id,
          username: userData.username,
          email: userData.email || autoEmail,
          isAdmin: userData.is_admin || username === '1111',
          membershipType: userData.membership_type || (username === '1111' ? 'vip' : 'free'),
          vipStatus: userData.vip_status || (username === '1111' ? 'approved' : 'none'),
          vipExpiry: userData.vip_expiry || null,
          createdAt: userData.created_at || data.user.created_at
        };
      } else {
        // 사용자 정보가 없는 경우 새로 생성
        const userId = uuidv4();
        
        // 기본 사용자 데이터 구성
        formattedUser = {
          id: userId,
          username: username,
          email: autoEmail,
          isAdmin: username === '1111',
          membershipType: username === '1111' ? 'vip' : 'free',
          vipStatus: username === '1111' ? 'approved' : 'none',
          createdAt: data.user.created_at
        };
        
        // users 테이블에 사용자 정보 저장 (없는 경우)
        const { error: insertError } = await supabase
          .from('users')
          .upsert([
            { 
              id: userId,
              username: username,
              email: autoEmail,
              is_admin: username === '1111',
              vip_status: username === '1111' ? 'approved' : 'none',
              membership_type: username === '1111' ? 'vip' : 'free'
            }
          ]);
          
        if (insertError) {
          console.error('로그인 후 사용자 데이터 저장 실패:', insertError);
        }
      }
      
      console.log('로그인 성공, 사용자 정보:', formattedUser);
      
      setCurrentUser(formattedUser);
      localStorage.setItem(CURRENT_USER_KEY, formattedUser.username);
      return { success: true, user: formattedUser };
    } catch (err) {
      console.error('로그인 오류:', err);
      setError(err.message);
      throw err;
    }
  };

  // 로그아웃
  const logout = async () => {
    try {
      if (isSupabaseConnected) {
        // Supabase 로그아웃
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
      }
      
      // 로컬 상태 초기화
      setCurrentUser(null);
      localStorage.removeItem(CURRENT_USER_KEY);
      return { success: true };
    } catch (err) {
      console.error('로그아웃 오류:', err);
      setError(err.message);
      
      // 오류와 상관없이 로컬 상태는 초기화
      setCurrentUser(null);
      localStorage.removeItem(CURRENT_USER_KEY);
      return { success: true };
    }
  };

  // VIP 상태 확인 및 업데이트
  const checkVipMembership = (user) => {
    if (!user) return false;
    
    // 관리자는 항상 VIP
    if (user.isAdmin || user.username === '1111') return true;
    
    // vipStatus가 approved이고 membershipType이 vip인 경우 VIP 회원
    if (user.vipStatus === 'approved' && user.membershipType === 'vip') {
      // VIP 만료 체크
      if (user.vipExpiry) {
        const now = moment();
        const expiryDate = moment(user.vipExpiry);
        return expiryDate.isAfter(now);
      }
      return true;
    }
    
    return false;
  };

  // VIP 신청
  const requestVipUpgrade = async () => {
    try {
      if (!currentUser) {
        throw new Error('로그인이 필요합니다.');
      }
      
      // vipStatus를 'pending'으로 업데이트
      if (isSupabaseConnected) {
        const { data, error } = await supabase
          .from('users')
          .update({ vip_status: 'pending' })
          .eq('username', currentUser.username)
          .select();
        
        if (error) {
          throw new Error(error.message || 'VIP 신청 중 오류가 발생했습니다.');
        }
        
        // 현재 사용자 상태 업데이트
        const updatedUser = {
          ...currentUser,
          vipStatus: 'pending'
        };
        
        setCurrentUser(updatedUser);
        
        // 로컬 스토리지도 함께 업데이트
        updateLocalStorageUser(updatedUser);
        
        return { success: true };
      } else {
        // 로컬 스토리지 폴백
        const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
        const index = users.findIndex(u => u.username === currentUser.username);
        
        if (index === -1) {
          throw new Error('사용자를 찾을 수 없습니다.');
        }
        
        users[index] = {
          ...users[index],
          vipStatus: 'pending'
        };
        
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
        
        // 현재 사용자 상태 업데이트
        const updatedUser = {
          ...currentUser,
          vipStatus: 'pending'
        };
        
        setCurrentUser(updatedUser);
        
        return { success: true };
      }
    } catch (err) {
      console.error('VIP 신청 오류:', err);
      setError(err.message);
      throw err;
    }
  };

  // 로컬 스토리지 사용자 업데이트 (폴백)
  const updateLocalStorageUser = (user) => {
    try {
      if (!user || !user.username) return;
      
      const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
      const index = users.findIndex(u => u.username === user.username);
      
      if (index !== -1) {
        users[index] = {
          ...users[index],
          ...user
        };
        
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
      }
    } catch (err) {
      console.error('로컬 스토리지 사용자 업데이트 오류:', err);
    }
  };

  // VIP 승인/거부 (관리자 전용)
  const handleVipRequest = async (username, action) => {
    try {
      if (!currentUser || !currentUser.isAdmin) {
        throw new Error('관리자 권한이 필요합니다.');
      }
      
      // 사용자 정보 조회
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .single();
      
      if (userError || !user) {
        throw new Error('사용자를 찾을 수 없습니다.');
      }
      
      // 상태와 회원 유형 설정
      const vipStatus = action === 'approve' ? 'approved' : 'rejected';
      const membershipType = action === 'approve' ? 'vip' : 'free';
      
      // 만료일 설정 (승인 시 30일 후)
      const vipExpiry = action === 'approve' 
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() 
        : null;
      
      console.log(`VIP 요청 처리: ${username}, 액션: ${action}, 상태: ${vipStatus}, 만료일: ${vipExpiry}`);
      
      // 사용자 정보 업데이트
      const { error: updateError } = await supabase
        .from('users')
        .update({
          vip_status: vipStatus,
          membership_type: membershipType,
          vip_expiry: vipExpiry
        })
        .eq('username', username);
      
      if (updateError) {
        console.error('VIP 상태 업데이트 오류:', updateError);
        throw new Error(updateError.message || 'VIP 상태 업데이트 중 오류가 발생했습니다.');
      }
      
      return true;
    } catch (error) {
      console.error('VIP 요청 처리 오류:', error);
      throw error;
    }
  };

  // 모든 사용자 목록 가져오기
  const getAllUsersList = async () => {
    try {
      // users 테이블에서만 사용자 정보 가져오기
      const { data, error } = await supabase.from('users').select('*');
      
      if (error) {
        console.error('Supabase 사용자 조회 오류:', error);
        throw new Error(error.message || '사용자 목록을 가져오는 중 오류가 발생했습니다.');
      }
      
      return data || [];
    } catch (error) {
      console.error('사용자 목록 가져오기 오류:', error);
      throw error;
    }
  };

  // 컨텍스트 값 정의
  const value = {
    currentUser,
    loading,
    error,
    isAdmin: currentUser?.isAdmin || false,
    isVip: checkVipMembership(currentUser),
    register,
    login,
    logout,
    signOut: logout, // logout 함수를 signOut 이름으로도 내보내기
    requestVipUpgrade,
    handleVipRequest,
    getAllUsersList,
    isSupabaseConnected
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
