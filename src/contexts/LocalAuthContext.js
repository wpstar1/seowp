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

// 로컬 스토리지 헬퍼 함수 추가
const getUsers = () => {
  try {
    const usersJson = localStorage.getItem(USERS_KEY);
    return usersJson ? JSON.parse(usersJson) : [];
  } catch (e) {
    console.error('로컬 스토리지 데이터 파싱 오류:', e);
    return [];
  }
};

const saveUsers = (users) => {
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    return true;
  } catch (e) {
    console.error('로컬 스토리지 저장 오류:', e);
    return false;
  }
};

// 인증 제공자 컴포넌트
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 디버그 유틸리티 함수
  const debugLocalStorage = () => {
    console.log('===== 로컬 스토리지 상태 =====');
    console.log('Users:', localStorage.getItem(USERS_KEY));
    console.log('Current User:', localStorage.getItem(CURRENT_USER_KEY));
    if (!localStorage.getItem(USERS_KEY)) {
      console.log('경고: 사용자 데이터가 없습니다!');
      // 초기 상태면 빈 배열 저장해서 초기화
      localStorage.setItem(USERS_KEY, JSON.stringify([]));
    }
    console.log('=============================');
  };

  // 로컬 스토리지에서 사용자 정보 로드
  useEffect(() => {
    const loadUserFromStorage = () => {
      try {
        debugLocalStorage(); // 시작 시 로컬 스토리지 상태 체크

        const savedUsername = localStorage.getItem(CURRENT_USER_KEY);
        if (savedUsername) {
          // 저장된 사용자 목록 가져오기
          const users = getUsers();
          const user = users.find(u => u.username === savedUsername);
          
          if (user) {
            console.log('자동 로그인 성공:', user.username);
            setCurrentUser(user);
          } else {
            console.log('자동 로그인 실패: 저장된 사용자를 찾을 수 없음', savedUsername);
            localStorage.removeItem(CURRENT_USER_KEY);
          }
        }
      } catch (error) {
        console.error('사용자 로드 오류:', error);
        // 오류 발생 시 로컬 스토리지 초기화
        localStorage.removeItem(CURRENT_USER_KEY);
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
      const users = getUsers();
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
      saveUsers(users);
      
      // 자동 로그인 처리
      localStorage.setItem(CURRENT_USER_KEY, username);
      setCurrentUser(newUser);
      
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
      console.log('로그인 시도:', username);
      
      // 사용자 찾기
      const users = getUsers();
      console.log('저장된 사용자 수:', users.length);
      
      // 사용자 이름으로 검색 (대소문자 구분 없이)
      const user = users.find(user => 
        user.username.toLowerCase() === username.toLowerCase()
      );
      
      console.log('사용자 찾음:', user ? 'Yes' : 'No');
      
      if (!user) {
        console.log('사용자를 찾을 수 없음');
        throw new Error('아이디 또는 비밀번호가 올바르지 않습니다');
      }
      
      console.log('비밀번호 확인 - 입력된 비밀번호 길이:', password.length);
      console.log('비밀번호 확인 - 저장된 비밀번호 길이:', user.password.length);
      
      // 비밀번호 일치 여부 확인 (공백 제거)
      if (password.trim() !== user.password.trim()) {
        console.log('비밀번호 불일치');
        throw new Error('아이디 또는 비밀번호가 올바르지 않습니다');
      }
      
      console.log('로그인 성공');
      
      // 세션 유지
      localStorage.setItem(CURRENT_USER_KEY, user.username);
      setCurrentUser(user);
      
      return { success: true };
    } catch (error) {
      console.error('로그인 오류:', error.message);
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
      const users = getUsers();
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
            saveUsers(users);
            
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
        saveUsers(users);
        
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
      const users = getUsers();
      const userIndex = users.findIndex(u => u.username === currentUser.username);
      
      if (userIndex === -1) return;
      
      const user = users[userIndex];
      
      // VIP 회원이 아닌 경우에만 카운트 증가
      if (user.membershipType !== 'vip') {
        user.dailyUsageCount += 1;
        user.lastUsageDate = new Date().toISOString();
        
        users[userIndex] = user;
        saveUsers(users);
        
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
      console.log('VIP 업그레이드 시작:', currentUser.username);
      
      // 현재 사용자 정보 가져오기
      const users = getUsers();
      console.log('전체 사용자 수:', users.length);
      
      const userIndex = users.findIndex(u => u.username === currentUser.username);
      console.log('사용자 인덱스:', userIndex);
      
      if (userIndex === -1) {
        console.error('VIP 업그레이드 실패: 사용자를 찾을 수 없음');
        return { success: false, error: '사용자를 찾을 수 없습니다' };
      }
      
      const user = users[userIndex];
      console.log('현재 사용자 상태:', user.membershipType);
      
      // 이미 VIP 회원인지 확인
      if (user.membershipType === 'vip') {
        console.log('이미 VIP 회원입니다');
        
        // VIP 만료일 갱신
        const today = new Date();
        const expiryDate = new Date(today);
        expiryDate.setDate(today.getDate() + 30); // 추가 30일
        
        user.membershipExpiry = expiryDate.toISOString();
        user.updatedAt = new Date().toISOString();
        
        console.log('VIP 만료일 갱신:', expiryDate.toLocaleDateString());
        
        users[userIndex] = user;
        const saved = saveUsers(users);
        console.log('로컬 스토리지 저장 결과:', saved ? '성공' : '실패');
        
        // 현재 사용자 정보 업데이트
        setCurrentUser({...user});
        
        // 성공 반환, 갱신 메시지 포함
        return { success: true, message: 'VIP 기간이 30일 추가되었습니다.' };
      }
      
      // VIP로 업그레이드
      const today = new Date();
      const expiryDate = new Date(today);
      expiryDate.setDate(today.getDate() + 30); // 30일 후
      
      console.log('VIP 업그레이드 진행 중');
      console.log('만료일 설정:', expiryDate.toLocaleDateString());
      
      user.membershipType = 'vip';
      user.membershipExpiry = expiryDate.toISOString();
      user.updatedAt = new Date().toISOString();
      user.dailyUsageCount = 0; // 사용 카운트 초기화
      
      users[userIndex] = user;
      const saved = saveUsers(users);
      console.log('로컬 스토리지 저장 결과:', saved ? '성공' : '실패');
      
      // 로컬 스토리지 확인
      console.log('저장 후 로컬 스토리지 확인:', localStorage.getItem(USERS_KEY));
      
      // 현재 사용자 정보 업데이트 (새 객체로 복사하여 참조 갱신)
      setCurrentUser({...user});
      console.log('현재 사용자 상태 업데이트 완료');
      
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
