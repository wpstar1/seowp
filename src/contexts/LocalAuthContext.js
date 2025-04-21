import React, { createContext, useContext, useState, useEffect } from 'react';
import moment from 'moment';

// 인증 컨텍스트 생성
const AuthContext = createContext();

// 컨텍스트 훅
export const useAuth = () => {
  return useContext(AuthContext);
};

// 로컬 스토리지 키 정의
const USERS_KEY = 'smart_content_users';
const CURRENT_USER_KEY = 'smart_content_current_user';

// 인증 제공자 컴포넌트
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 로컬 스토리지에서 사용자 정보 로드
  useEffect(() => {
    const loadUserFromStorage = () => {
      try {
        const savedUsername = localStorage.getItem(CURRENT_USER_KEY);
        if (savedUsername) {
          // 저장된 사용자 목록 가져오기
          const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
          const user = users.find(u => u.username === savedUsername);
          
          if (user) {
            setCurrentUser(user);
          }
        }
      } catch (error) {
        console.error('사용자 로드 오류:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadUserFromStorage();
  }, []);

  // 회원가입
  const register = async (username, password) => {
    setError('');
    
    try {
      // 아이디 길이 검증
      if (username.length < 3) {
        throw new Error('아이디는 3자 이상이어야 합니다');
      }
      
      // 비밀번호 길이 검증
      if (password.length < 4) {
        throw new Error('비밀번호는 4자 이상이어야 합니다');
      }
      
      // 기존 사용자 확인
      const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
      const existingUser = users.find(user => user.username === username);
      
      if (existingUser) {
        throw new Error('이미 사용 중인 아이디입니다');
      }
      
      // 새 사용자 생성
      const newUser = {
        id: Date.now().toString(),
        username,
        password, // 실제 서비스에서는 비밀번호 해싱 필요
        membershipType: 'regular',
        dailyUsageCount: 0,
        lastUsageDate: null,
        createdAt: new Date().toISOString()
      };
      
      // 사용자 저장
      users.push(newUser);
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
      
      return { success: true };
    } catch (error) {
      setError(error.message);
      return { success: false, error: error.message };
    }
  };

  // 로그인
  const login = async (username, password) => {
    setError('');
    
    try {
      // 사용자 찾기
      const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
      const user = users.find(user => user.username === username);
      
      if (!user || user.password !== password) { // 실제 서비스에서는 비밀번호 비교 로직 필요
        throw new Error('아이디 또는 비밀번호가 올바르지 않습니다');
      }
      
      // 세션 유지
      localStorage.setItem(CURRENT_USER_KEY, username);
      setCurrentUser(user);
      
      return { success: true };
    } catch (error) {
      setError(error.message);
      return { success: false, error: error.message };
    }
  };

  // 로그아웃
  const signOut = () => {
    localStorage.removeItem(CURRENT_USER_KEY);
    setCurrentUser(null);
  };

  // 사용량 확인
  const checkAndUpdateUsage = async () => {
    if (!currentUser) return false;
    
    try {
      // 현재 사용자 정보 가져오기
      const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
      const userIndex = users.findIndex(u => u.username === currentUser.username);
      
      if (userIndex === -1) return false;
      
      const user = users[userIndex];
      
      // VIP 회원인 경우 무제한 사용 가능
      if (user.membershipType === 'vip') {
        // VIP 회원이지만, 멤버십이 만료된 경우 확인
        if (user.membershipExpiry) {
          const expiryDate = new Date(user.membershipExpiry);
          if (new Date() > expiryDate) {
            // 만료되었으므로 일반 회원으로 변경
            user.membershipType = 'regular';
            users[userIndex] = user;
            localStorage.setItem(USERS_KEY, JSON.stringify(users));
            
            // 현재 사용자 정보 업데이트
            setCurrentUser(user);
            
            // 일반 회원 제한 로직으로 진행
          } else {
            // VIP 멤버십 유효
            return true;
          }
        } else {
          // 만료일이 없는 VIP 회원은 무제한 사용 가능
          return true;
        }
      }
      
      // 일반 회원 사용량 체크
      const today = moment().format('YYYY-MM-DD');
      const lastUsageDate = user.lastUsageDate 
        ? moment(user.lastUsageDate).format('YYYY-MM-DD') 
        : null;
      
      // 날짜가 변경되었으면 카운트 초기화
      if (lastUsageDate !== today) {
        user.dailyUsageCount = 0;
        user.lastUsageDate = new Date().toISOString();
        
        users[userIndex] = user;
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
        
        // 현재 사용자 정보 업데이트
        setCurrentUser(user);
        
        return true;
      }
      
      // 오늘 사용 횟수 확인
      if (user.dailyUsageCount >= 1) {
        return false; // 일일 사용 한도 초과
      }
      
      return true;
    } catch (error) {
      console.error('사용량 확인 오류:', error);
      return false;
    }
  };

  // 사용량 증가
  const incrementUsage = async () => {
    if (!currentUser) return;
    
    try {
      // 현재 사용자 정보 가져오기
      const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
      const userIndex = users.findIndex(u => u.username === currentUser.username);
      
      if (userIndex === -1) return;
      
      const user = users[userIndex];
      
      // VIP 회원이 아닌 경우에만 카운트 증가
      if (user.membershipType !== 'vip') {
        user.dailyUsageCount += 1;
        user.lastUsageDate = new Date().toISOString();
        
        users[userIndex] = user;
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
        
        // 현재 사용자 정보 업데이트
        setCurrentUser(user);
      }
    } catch (error) {
      console.error('사용량 업데이트 오류:', error);
    }
  };

  // VIP 업그레이드 처리 (관리자 요청/승인 없이 테스트 목적으로 즉시 업그레이드)
  const upgradeToVIP = async () => {
    if (!currentUser) return { success: false, error: '로그인이 필요합니다' };
    
    try {
      // 현재 사용자 정보 가져오기
      const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
      const userIndex = users.findIndex(u => u.username === currentUser.username);
      
      if (userIndex === -1) return { success: false, error: '사용자를 찾을 수 없습니다' };
      
      const user = users[userIndex];
      
      // 이미 VIP 회원인지 확인
      if (user.membershipType === 'vip') {
        return { success: false, error: '이미 VIP 회원입니다' };
      }
      
      // VIP로 업그레이드
      const today = new Date();
      const expiryDate = new Date(today);
      expiryDate.setDate(today.getDate() + 30); // 30일 후
      
      user.membershipType = 'vip';
      user.membershipExpiry = expiryDate.toISOString();
      user.updatedAt = new Date().toISOString();
      
      users[userIndex] = user;
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
      
      // 현재 사용자 정보 업데이트
      setCurrentUser(user);
      
      return { success: true };
    } catch (error) {
      console.error('VIP 업그레이드 오류:', error);
      return { success: false, error: '업그레이드 처리 중 오류가 발생했습니다' };
    }
  };

  // 제공하는 값
  const value = {
    currentUser,
    register,
    login,
    signOut,
    checkAndUpdateUsage,
    incrementUsage,
    upgradeToVIP,
    loading,
    error
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
