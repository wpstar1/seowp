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
const VIP_APPROVED_USERS_KEY = 'smart_content_vip_approved_users';

// 로컬 스토리지 헬퍼 함수 개선
const getUsers = () => {
  try {
    const usersJson = localStorage.getItem(USERS_KEY);
    if (!usersJson) {
      console.log('저장된 사용자 없음, 빈 배열 반환');
      return [];
    }

    const users = JSON.parse(usersJson);
    if (!Array.isArray(users)) {
      console.error('사용자 데이터가 배열이 아님, 초기화');
      return [];
    }

    console.log(`${users.length}명의 사용자 데이터 로드됨`);
    return users;
  } catch (error) {
    console.error('사용자 데이터 로드 오류:', error);
    return [];
  }
};

const saveUsers = (users) => {
  if (!Array.isArray(users)) {
    console.error('유효하지 않은 사용자 데이터:', users);
    return false;
  }

  try {
    // 중복 사용자 제거 (username 기준)
    const uniqueUsers = users.reduce((acc, current) => {
      const duplicate = acc.find(item => item.username === current.username);
      if (!duplicate) {
        acc.push(current);
      }
      return acc;
    }, []);

    const usersJson = JSON.stringify(uniqueUsers);
    localStorage.setItem(USERS_KEY, usersJson);
    console.log(`${uniqueUsers.length}명의 사용자 데이터 저장됨`);
    return true;
  } catch (error) {
    console.error('사용자 데이터 저장 오류:', error);
    return false;
  }
};

// 인증 제공자 컴포넌트
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 초기화 시 로컬 스토리지에서 사용자 로드
  useEffect(() => {
    const loadUser = () => {
      try {
        // 현재 사용자 정보 로드
        const username = localStorage.getItem(CURRENT_USER_KEY);
        
        // 로그인된 사용자가 없으면 종료
        if (!username) {
          console.log('로그인된 사용자 없음');
          setLoading(false);
          return;
        }
        
        console.log('저장된 사용자명 발견:', username);
        
        // 사용자 목록에서 해당 사용자 찾기
        const users = getUsers();
        
        const user = users.find(u => u.username === username);
        if (!user) {
          console.log('세션은 있으나 사용자 정보가 없음');
          localStorage.removeItem(CURRENT_USER_KEY); // 세션 초기화
          setLoading(false);
          return;
        }
        
        console.log('사용자 로드 성공:', user.username);
        setCurrentUser(user);
        
        // VIP 상태 확인
        checkAndApplyVipStatus(user, users);
      } catch (error) {
        console.error('사용자 로드 오류:', error);
        localStorage.removeItem(CURRENT_USER_KEY); // 오류 발생 시 세션 초기화
      } finally {
        setLoading(false);
      }
    };
    
    loadUser();
  }, []);
  
  // VIP 상태 확인 및 적용
  const checkAndApplyVipStatus = (user, users) => {
    try {
      if (!user) return;
      
      // VIP 회원이 아니면 확인하지 않음
      if (user.membershipType !== 'vip') {
        // VIP 승인 목록 확인
        const approvedVipUsers = JSON.parse(localStorage.getItem(VIP_APPROVED_USERS_KEY) || '[]');
        
        // 승인 목록에 있는지 확인
        const isApproved = approvedVipUsers.some(
          approvedUser => approvedUser.username.toLowerCase() === user.username.toLowerCase()
        );
        
        if (isApproved) {
          console.log('VIP 승인 목록에 있음, VIP로 업그레이드');
          
          // 사용자 배열에서 사용자 인덱스 찾기
          const userIndex = users.findIndex(u => u.username === user.username);
          
          if (userIndex !== -1) {
            // VIP로 업그레이드
            const updatedUser = {...users[userIndex]};
            updatedUser.membershipType = 'vip';
            
            // 30일 만료일 설정
            const today = new Date();
            const expiryDate = new Date(today);
            expiryDate.setDate(today.getDate() + 30);
            updatedUser.membershipExpiry = expiryDate.toISOString();
            
            // 사용자 배열 업데이트
            users[userIndex] = updatedUser;
            saveUsers(users);
            
            // 현재 사용자 상태 업데이트
            setCurrentUser(updatedUser);
          }
        }
        
        return;
      }
      
      // VIP 회원의 경우 만료 여부 확인
      if (user.membershipExpiry) {
        const expiryDate = new Date(user.membershipExpiry);
        
        if (new Date() > expiryDate) {
          console.log('VIP 멤버십 만료됨, 일반 회원으로 변경');
          
          // 사용자 찾기
          const userIndex = users.findIndex(u => u.username === user.username);
          
          if (userIndex !== -1) {
            // 일반 회원으로 변경
            const updatedUser = {...users[userIndex]};
            updatedUser.membershipType = 'regular';
            
            // 사용자 배열 업데이트
            users[userIndex] = updatedUser;
            saveUsers(users);
            
            // 현재 사용자 상태 업데이트
            setCurrentUser(updatedUser);
          }
        }
      }
    } catch (error) {
      console.error('VIP 상태 확인 오류:', error);
    }
  };

  // VIP 사용자 승인 처리 함수 - 관리자용
  const approveVipUser = async (username) => {
    try {
      console.log('VIP 사용자 승인 처리 시작:', username);
      
      const users = getUsers();
      // 대소문자 구분 없이 사용자 찾기
      const userIndex = users.findIndex(u => 
        u.username && u.username.toLowerCase() === username.toLowerCase()
      );
      
      if (userIndex === -1) {
        console.error('대상 사용자를 찾을 수 없음:', username);
        return { success: false, error: '대상 사용자를 찾을 수 없습니다' };
      }
      
      const user = users[userIndex];
      console.log('승인 대상 사용자 찾음:', user.username);
      
      // 이미 VIP인 경우
      if (user.membershipType === 'vip') {
        console.log('이미 VIP 회원입니다');
        return { success: true, message: '이미 VIP 회원입니다' };
      }
      
      // VIP로 업그레이드
      const today = new Date();
      const expiryDate = new Date(today);
      expiryDate.setDate(today.getDate() + 30); // 30일 후
      
      console.log('VIP 업그레이드 진행 중');
      console.log('만료일 설정:', expiryDate.toLocaleDateString());
      
      user.membershipType = 'vip';
      user.vipStatus = 'approved'; // 중요: VIP 상태를 approved로 설정
      user.membershipExpiry = expiryDate.toISOString();
      user.updatedAt = new Date().toISOString();
      user.dailyUsageCount = 0; // 사용 카운트 초기화
      
      users[userIndex] = user;
      const saved = saveUsers(users);
      console.log('로컬 스토리지 저장 결과:', saved ? '성공' : '실패');
      
      // 현재 사용자 정보 업데이트 (새 객체로 복사하여 참조 갱신)
      if (currentUser && currentUser.username === username) {
        setCurrentUser({...user});
        console.log('현재 사용자 상태 업데이트 완료');
      }
      
      return { success: true };
    } catch (error) {
      console.error('VIP 업그레이드 오류:', error);
      return { success: false, error: '업그레이드 처리 중 오류가 발생했습니다' };
    }
  };

  // 관리자 여부 확인 함수
  const isAdmin = () => {
    if (!currentUser) return false;
    return currentUser.username === '1111'; // 관리자 아이디는 1111
  };

  // 로그인 함수 (개선된 버전)
  const login = async (username, password) => {
    if (!username || !password) {
      return { success: false, error: '아이디와 비밀번호를 모두 입력해주세요' };
    }
    
    setError('');
    
    try {
      console.log('로그인 시도:', username);
      
      // 입력값 정리
      username = username.trim();
      password = password.trim();
      
      // 관리자 계정 체크 (아이디 1111, 비번 1111)
      if (username === '1111' && password === '1111') {
        console.log('관리자 로그인 시도 확인');
        
        // 사용자 목록 로드
        const users = getUsers();
        
        // 관리자 사용자가 없는 경우 생성
        let adminUser = users.find(u => u.username === '1111');
        
        if (!adminUser) {
          console.log('관리자 계정 생성');
          
          adminUser = {
            id: Date.now().toString(),
            username: '1111',
            password: '1111', // 실제 앱에서는 해시 처리 필요
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            membershipType: 'admin',
            isAdmin: true,
            dailyUsageCount: 0
          };
          
          users.push(adminUser);
          saveUsers(users);
        }
        
        console.log('관리자 로그인 성공');
        setCurrentUser(adminUser);
        localStorage.setItem(CURRENT_USER_KEY, adminUser.username);
        
        return { success: true, message: '관리자 로그인 성공!' };
      }
      
      // 일반 사용자 로그인 처리
      const users = getUsers();
      
      if (users.length === 0) {
        console.log('저장된 사용자가 없음');
        return { success: false, error: '등록된 사용자가 없습니다. 회원가입을 먼저 진행해주세요.' };
      }
      
      // 사용자 이름으로 검색 (대소문자 구분 없이)
      const user = users.find(user => 
        user.username && user.username.toLowerCase() === username.toLowerCase()
      );
      
      if (!user) {
        console.log('사용자를 찾을 수 없음:', username);
        return { success: false, error: '아이디 또는 비밀번호가 올바르지 않습니다' };
      }
      
      // 비밀번호 일치 여부 확인
      if (user.password !== password) {
        console.log('비밀번호 불일치');
        return { success: false, error: '아이디 또는 비밀번호가 올바르지 않습니다' };
      }
      
      console.log('로그인 성공:', username);
      
      // 세션 유지
      localStorage.setItem(CURRENT_USER_KEY, user.username);
      setCurrentUser(user);
      
      // VIP 상태 확인
      checkAndApplyVipStatus(user, users);
      
      return { success: true };
    } catch (error) {
      console.error('로그인 처리 중 오류 발생:', error);
      return { success: false, error: '로그인 처리 중 오류가 발생했습니다' };
    }
  };

  // 로그아웃
  const signOut = () => {
    try {
      console.log('로그아웃 처리');
      localStorage.removeItem(CURRENT_USER_KEY);
      setCurrentUser(null);
      return true;
    } catch (error) {
      console.error('로그아웃 오류:', error);
      return false;
    }
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
            return true; // 유효한 VIP 회원
          }
        } else {
          return true; // 만료일 없는 VIP (무기한)
        }
      }
      
      // 일반 회원인 경우 일일 사용량 제한 확인
      const MAX_DAILY_USAGE = 3;
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      
      let lastUsageDate = null;
      if (user.lastUsageDate) {
        lastUsageDate = new Date(user.lastUsageDate).toISOString().split('T')[0];
      }
      
      // 날짜가 바뀌었으면 사용량 초기화
      if (lastUsageDate !== today) {
        user.dailyUsageCount = 0;
      }
      
      // 사용량 확인
      return user.dailyUsageCount < MAX_DAILY_USAGE;
    } catch (error) {
      console.error('사용량 확인 오류:', error);
      return false;
    }
  };
  
  // 사용량 증가
  const incrementUsage = async () => {
    if (!currentUser) return;
    
    try {
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
        setCurrentUser({...user});
      }
    } catch (error) {
      console.error('사용량 업데이트 오류:', error);
    }
  };

  // VIP 업그레이드 처리
  const upgradeToVIP = async () => {
    if (!currentUser) return { success: false, error: '로그인이 필요합니다' };
    
    try {
      console.log('VIP 업그레이드 요청:', currentUser.username);
      
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
      
      // 이미 VIP 회원인 경우
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
        setCurrentUser(user);
        
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
      
      // 현재 사용자 정보 업데이트 (새 객체로 복사하여 참조 갱신)
      setCurrentUser({...user});
      console.log('현재 사용자 상태 업데이트 완료');
      
      return { success: true };
    } catch (error) {
      console.error('VIP 업그레이드 오류:', error);
      return { success: false, error: '업그레이드 처리 중 오류가 발생했습니다' };
    }
  };

  // 회원가입 (개선된 버전)
  const register = async (username, password, passwordConfirm) => {
    if (!username || !password) {
      return { success: false, error: '아이디와 비밀번호를 모두 입력해주세요' };
    }
    
    if (password !== passwordConfirm) {
      return { success: false, error: '비밀번호와 비밀번호 확인이 일치하지 않습니다' };
    }
    
    setError('');
    
    try {
      console.log('회원가입 시도:', username);
      
      // 입력값 정리
      username = username.trim();
      password = password.trim();
      
      // 아이디 길이 검증
      if (username.length < 3) {
        return { success: false, error: '아이디는 3자 이상이어야 합니다' };
      }
      
      // 비밀번호 길이 검증
      if (password.length < 4) {
        return { success: false, error: '비밀번호는 4자 이상이어야 합니다' };
      }
      
      // 기존 사용자 확인
      const users = getUsers();
      console.log('현재 저장된 사용자 수:', users.length);
      
      const existingUser = users.find(user => 
        user.username && user.username.toLowerCase() === username.toLowerCase()
      );
      
      if (existingUser) {
        console.log('이미 사용 중인 아이디:', username);
        return { success: false, error: '이미 사용 중인 아이디입니다' };
      }
      
      // 새 사용자 생성
      const newUser = {
        id: Date.now().toString(),
        username,
        password, // 실제 서비스에서는 비밀번호 해싱 필요
        membershipType: 'regular',
        dailyUsageCount: 0,
        lastUsageDate: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      console.log('신규 사용자 객체 생성:', newUser.username);
      
      // 사용자 저장
      users.push(newUser);
      const saveResult = saveUsers(users);
      
      if (!saveResult) {
        console.error('사용자 저장 실패');
        return { success: false, error: '사용자 정보 저장에 실패했습니다' };
      }
      
      console.log('사용자 저장 성공');
      
      // 자동 로그인 처리
      localStorage.setItem(CURRENT_USER_KEY, username);
      setCurrentUser(newUser);
      
      return { success: true };
    } catch (error) {
      console.error('회원가입 오류:', error);
      return { success: false, error: '회원가입 처리 중 오류가 발생했습니다' };
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
    approveVipUser,
    isAdmin,
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
