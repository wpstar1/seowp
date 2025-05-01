import React, { createContext, useContext, useState, useEffect } from 'react';
import moment from 'moment';
import { supabase, auth as supabaseAuth } from '../lib/supabase';

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
        const { data, error } = await supabase.from('users').select('count', { count: 'exact' }).limit(1);
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
          const { data: session } = await supabaseAuth.getSession();
          
          if (session && session.session) {
            // 사용자 정보 조회
            const { data: userData, error } = await supabase
              .from('users')
              .select('*')
              .eq('user_id', session.session.user.id)
              .single();
            
            if (error) {
              console.error('사용자 정보 조회 오류:', error);
              setCurrentUser(null);
            } else {
              // Supabase에서 가져온 데이터를 기존 앱 형식에 맞게 변환
              const formattedUser = {
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
      
      if (isSupabaseConnected) {
        // Supabase로 회원가입
        const { data, error } = await supabaseAuth.signup(userData);
        
        if (error) {
          throw new Error(error.message || '회원가입 중 오류가 발생했습니다.');
        }
        
        // 사용자 정보를 기존 앱 형식에 맞게 변환
        const formattedUser = {
          username: userData.username,
          email: userData.email,
          isAdmin: userData.username === '1111',
          membershipType: userData.username === '1111' ? 'vip' : 'free',
          vipStatus: userData.username === '1111' ? 'approved' : 'none',
          createdAt: new Date().toISOString()
        };
        
        setCurrentUser(formattedUser);
        localStorage.setItem(CURRENT_USER_KEY, formattedUser.username);
        return { success: true, user: formattedUser };
      } else {
        // 로컬 스토리지 폴백
        return registerLocalUser(userData);
      }
    } catch (err) {
      console.error('회원가입 오류:', err);
      setError(err.message);
      
      // Supabase 오류 시 로컬 스토리지 폴백
      try {
        const result = await registerLocalUser(userData);
        return result;
      } catch (localError) {
        throw localError;
      }
    }
  };

  // 로컬 스토리지 회원가입 (폴백)
  const registerLocalUser = async (userData) => {
    try {
      const { username, password, email } = userData;
      
      // 기존 사용자 확인
      const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
      const existingUser = users.find(u => u.username === username);
      
      if (existingUser) {
        throw new Error('이미 존재하는 사용자입니다.');
      }
      
      // 새 사용자 생성
      const newUser = {
        _id: `user_${Date.now()}`,
        username,
        password, // 실제로는 해싱 필요
        email,
        createdAt: new Date().toISOString(),
        isAdmin: username === '1111',
        membershipType: username === '1111' ? 'vip' : 'free',
        vipStatus: username === '1111' ? 'approved' : 'none'
      };
      
      users.push(newUser);
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
      
      // 현재 사용자로 설정
      const { password: _, ...userWithoutPassword } = newUser;
      setCurrentUser(userWithoutPassword);
      localStorage.setItem(CURRENT_USER_KEY, username);
      
      return { success: true, user: userWithoutPassword };
    } catch (err) {
      console.error('로컬 회원가입 오류:', err);
      setError(err.message);
      throw err;
    }
  };

  // 로그인
  const login = async (username, password) => {
    try {
      setError('');
      
      if (isSupabaseConnected) {
        // Supabase로 로그인
        const { data, error } = await supabaseAuth.login({ 
          email: username, // username으로 이메일 필드를 처리
          password 
        });
        
        if (error) {
          throw new Error(error.message || '로그인 중 오류가 발생했습니다.');
        }
        
        // 사용자 정보를 기존 앱 형식에 맞게 변환
        const formattedUser = {
          username: data.user.username || username,
          email: data.user.email,
          isAdmin: data.user.is_admin,
          membershipType: data.user.membership_type,
          vipStatus: data.user.vip_status,
          vipExpiry: data.user.vip_expiry,
          createdAt: data.user.created_at
        };
        
        setCurrentUser(formattedUser);
        localStorage.setItem(CURRENT_USER_KEY, formattedUser.username);
        return { success: true, user: formattedUser };
      } else {
        // 로컬 스토리지 폴백
        return loginLocalUser(username, password);
      }
    } catch (err) {
      console.error('로그인 오류:', err);
      setError(err.message);
      
      // Supabase 오류 시 로컬 스토리지 폴백
      try {
        const result = await loginLocalUser(username, password);
        return result;
      } catch (localError) {
        throw localError;
      }
    }
  };

  // 로컬 스토리지 로그인 (폴백)
  const loginLocalUser = async (username, password) => {
    try {
      // 사용자 확인
      const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
      const user = users.find(u => u.username === username && u.password === password);
      
      if (!user) {
        throw new Error('사용자명 또는 비밀번호가 일치하지 않습니다.');
      }
      
      // 현재 사용자로 설정
      const { password: _, ...userWithoutPassword } = user;
      setCurrentUser(userWithoutPassword);
      localStorage.setItem(CURRENT_USER_KEY, username);
      
      return { success: true, user: userWithoutPassword };
    } catch (err) {
      console.error('로컬 로그인 오류:', err);
      setError(err.message);
      throw err;
    }
  };

  // 로그아웃
  const logout = async () => {
    try {
      if (isSupabaseConnected) {
        // Supabase 로그아웃
        const { error } = await supabaseAuth.signOut();
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
        throw new Error('관리자만 VIP 요청을 처리할 수 있습니다.');
      }
      
      const vipStatus = action === 'approve' ? 'approved' : 'rejected';
      const membershipType = action === 'approve' ? 'vip' : 'free';
      
      // VIP 만료일 (승인 시 현재 날짜로부터 30일)
      const vipExpiry = action === 'approve' 
        ? moment().add(30, 'days').toISOString()
        : null;
      
      if (isSupabaseConnected) {
        // Supabase로 업데이트
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
          throw new Error(error.message || 'VIP 요청 처리 중 오류가 발생했습니다.');
        }
      }
      
      // 로컬 스토리지 업데이트 (폴백 및 동기화)
      const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
      const index = users.findIndex(u => u.username === username);
      
      if (index !== -1) {
        users[index] = {
          ...users[index],
          vipStatus,
          membershipType,
          vipExpiry
        };
        
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
      }
      
      // VIP 승인 사용자 목록 업데이트
      if (action === 'approve') {
        const approvedUsers = JSON.parse(localStorage.getItem(VIP_APPROVED_USERS_KEY) || '[]');
        
        if (!approvedUsers.includes(username)) {
          approvedUsers.push(username);
          localStorage.setItem(VIP_APPROVED_USERS_KEY, JSON.stringify(approvedUsers));
        }
      }
      
      return { success: true };
    } catch (err) {
      console.error('VIP 요청 처리 오류:', err);
      setError(err.message);
      throw err;
    }
  };

  // 모든 사용자 가져오기 (관리자 전용)
  const getAllUsersList = async () => {
    try {
      if (!currentUser || !currentUser.isAdmin) {
        throw new Error('관리자 권한이 필요합니다.');
      }
      
      if (isSupabaseConnected) {
        // Supabase에서 사용자 목록 가져오기
        const { data, error } = await supabase.from('users').select('*');
        
        if (error) {
          throw new Error(error.message || '사용자 목록을 가져오는 중 오류가 발생했습니다.');
        }
        
        // Supabase 데이터를 앱 형식에 맞게 변환
        const formattedUsers = data.map(user => ({
          username: user.username,
          email: user.email,
          isAdmin: user.is_admin,
          membershipType: user.membership_type,
          vipStatus: user.vip_status,
          vipExpiry: user.vip_expiry,
          createdAt: user.created_at
        }));
        
        return formattedUsers;
      } else {
        // 로컬 스토리지에서 사용자 목록 가져오기
        const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
        return users.map(user => {
          const { password, ...userWithoutPassword } = user;
          return userWithoutPassword;
        });
      }
    } catch (err) {
      console.error('사용자 목록 가져오기 오류:', err);
      
      // 로컬 스토리지 폴백
      try {
        const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
        return users.map(user => {
          const { password, ...userWithoutPassword } = user;
          return userWithoutPassword;
        });
      } catch (localError) {
        console.error('로컬 스토리지에서 사용자 목록 가져오기 오류:', localError);
        return [];
      }
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
