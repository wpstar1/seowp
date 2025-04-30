import React, { createContext, useContext, useState, useEffect } from 'react';
import moment from 'moment';
import { 
  getUserByUsername, 
  createUser, 
  authenticateUser, 
  updateVipStatus,
  getAllUsers,
  checkVipStatus
} from '../services/dbService';

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

// 인증 제공자 컴포넌트
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 초기화 시 데이터베이스에서 사용자 로드
  useEffect(() => {
    const loadUser = async () => {
      try {
        // 현재 사용자 정보 로드 (로컬 스토리지에서 사용자명만 가져옴)
        const username = localStorage.getItem(CURRENT_USER_KEY);
        
        // 로그인된 사용자가 없으면 종료
        if (!username) {
          console.log('로그인된 사용자 없음');
          setLoading(false);
          return;
        }
        
        console.log('저장된 사용자명 발견:', username);
        
        // 데이터베이스에서 사용자 정보 조회
        const result = await getUserByUsername(username);
        
        if (!result.success) {
          console.log('데이터베이스에서 사용자 정보를 찾을 수 없음');
          localStorage.removeItem(CURRENT_USER_KEY); // 세션 초기화
          setLoading(false);
          return;
        }
        
        const user = result.data;
        
        // VIP 상태 확인 및 설정
        const vipResult = await checkVipStatus(username);
        const isVip = vipResult.success && vipResult.isVip;
        const isAdmin = user.isadmin || username === '1111';
        
        console.log('사용자 로드 성공:', user.username);
        setCurrentUser({
          ...user,
          isVip,
          isAdmin
        });
      } catch (error) {
        console.error('사용자 로드 중 오류 발생:', error);
        setError('사용자 정보를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  // 로그인 함수
  const login = async (username, password) => {
    try {
      setLoading(true);
      
      // 데이터베이스에서 사용자 인증
      const result = await authenticateUser(username, password);
      
      if (!result.success) {
        setError(result.error || '로그인에 실패했습니다.');
        return { success: false, error: result.error || '로그인에 실패했습니다.' };
      }
      
      const user = result.data;
      
      // 세션 유지를 위해 로컬 스토리지에 사용자명 저장
      localStorage.setItem(CURRENT_USER_KEY, username);
      
      // 로그인 만료 시간 설정 (7일)
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 7);
      localStorage.setItem('smart_content_login_expiry', expiryDate.getTime().toString());
      
      // VIP 상태 확인
      const vipResult = await checkVipStatus(username);
      const isVip = vipResult.success && vipResult.isVip;
      const isAdmin = user.isadmin || username === '1111';
      
      setCurrentUser({
        ...user, 
        isVip, 
        isAdmin
      });
      
      setError('');
      return { success: true, user };
    } catch (error) {
      console.error('로그인 중 오류 발생:', error);
      setError('로그인 중 오류가 발생했습니다.');
      return { success: false, error: '로그인 중 오류가 발생했습니다.' };
    } finally {
      setLoading(false);
    }
  };

  // 회원가입 함수
  const register = async (username, password, confirmPassword) => {
    try {
      setLoading(true);
      
      // 비밀번호 확인
      if (confirmPassword && password !== confirmPassword) {
        setError('비밀번호가 일치하지 않습니다.');
        return { success: false, error: '비밀번호가 일치하지 않습니다.' };
      }
      
      // 데이터베이스에 사용자 생성
      const result = await createUser({
        username,
        password
      });
      
      if (!result.success) {
        setError(result.error || '회원가입에 실패했습니다.');
        return { success: false, error: result.error || '회원가입에 실패했습니다.' };
      }
      
      setError('');
      return { success: true, data: result.data };
    } catch (error) {
      console.error('회원가입 중 오류 발생:', error);
      setError('회원가입 중 오류가 발생했습니다.');
      return { success: false, error: '회원가입 중 오류가 발생했습니다.' };
    } finally {
      setLoading(false);
    }
  };

  // 로그아웃 함수
  const logout = () => {
    localStorage.removeItem(CURRENT_USER_KEY);
    localStorage.removeItem('smart_content_login_expiry');
    setCurrentUser(null);
    setError('');
  };

  // VIP 업그레이드 요청
  const requestVipUpgrade = async (username) => {
    try {
      if (!currentUser) {
        setError('로그인이 필요합니다.');
        return { success: false, error: '로그인이 필요합니다.' };
      }
      
      // 데이터베이스에 VIP 요청 상태 업데이트
      const result = await updateVipStatus(username, 'pending');
      
      if (!result.success) {
        setError(result.error || 'VIP 업그레이드 요청에 실패했습니다.');
        return { success: false, error: result.error || 'VIP 업그레이드 요청에 실패했습니다.' };
      }
      
      // 현재 사용자 상태 업데이트
      setCurrentUser({
        ...currentUser,
        vipStatus: 'pending',
        updatedAt: new Date()
      });
      
      return { success: true };
    } catch (error) {
      console.error('VIP 업그레이드 요청 중 오류 발생:', error);
      setError('VIP 업그레이드 요청 중 오류가 발생했습니다.');
      return { success: false, error: '서버 오류가 발생했습니다.' };
    }
  };

  // VIP 승인/거부 (관리자용)
  const manageVipRequest = async (username, approve) => {
    try {
      if (!currentUser || !(currentUser.isAdmin || currentUser.username === '1111')) {
        setError('관리자 권한이 필요합니다.');
        return { success: false, error: '관리자 권한이 필요합니다.' };
      }
      
      // 데이터베이스에 VIP 상태 업데이트
      const status = approve ? 'approved' : 'rejected';
      
      // VIP 승인 시 만료일 설정 (현재로부터 30일)
      const expiryDate = approve ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null;
      const result = await updateVipStatus(username, status, expiryDate);
      
      if (!result.success) {
        setError(result.error || 'VIP 상태 업데이트에 실패했습니다.');
        return { success: false, error: result.error || 'VIP 상태 업데이트에 실패했습니다.' };
      }
      
      // 현재 사용자가 해당 사용자라면 상태 업데이트
      if (currentUser.username === username) {
        setCurrentUser({
          ...currentUser,
          membershipType: approve ? 'vip' : 'regular',
          vipStatus: status,
          vipExpiryDate: expiryDate,
          updatedAt: new Date()
        });
      }
      
      return { success: true };
    } catch (error) {
      console.error('VIP 상태 관리 중 오류 발생:', error);
      setError('VIP 상태 관리 중 오류가 발생했습니다.');
      return { success: false, error: '서버 오류가 발생했습니다.' };
    }
  };

  // 사용자 목록 조회 (관리자용)
  const getUsersList = async () => {
    try {
      if (!currentUser || !(currentUser.isAdmin || currentUser.username === '1111')) {
        setError('관리자 권한이 필요합니다.');
        return { success: false, error: '관리자 권한이 필요합니다.' };
      }
      
      // 데이터베이스에서 사용자 목록 조회
      const result = await getAllUsers();
      return result;
    } catch (error) {
      console.error('사용자 목록 조회 중 오류 발생:', error);
      setError('사용자 목록 조회 중 오류가 발생했습니다.');
      return { success: false, error: '사용자 목록 조회 중 오류가 발생했습니다.' };
    }
  };
  
  // 제공할 값
  const value = {
    currentUser,
    login,
    logout,
    signOut: logout, // signOut 함수명으로도 접근 가능하도록 추가
    register,
    loading,
    error,
    requestVipUpgrade,
    manageVipRequest,
    getUsersList,
    setError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
