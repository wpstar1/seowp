import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signOut as firebaseSignOut 
} from 'firebase/auth';
import { doc, getDoc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';
import moment from 'moment';

// 인증 컨텍스트 생성
const AuthContext = createContext();

// 컨텍스트 훅
export const useAuth = () => {
  return useContext(AuthContext);
};

// 인증 제공자 컴포넌트
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // 사용자 로그아웃
  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setCurrentUser(null);
      setUserProfile(null);
    } catch (error) {
      console.error('로그아웃 오류:', error);
    }
  };

  // 사용자 프로필 정보 가져오기
  const fetchUserProfile = async (user) => {
    if (!user) return null;
    
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        return userDoc.data();
      }
      return null;
    } catch (error) {
      console.error('사용자 프로필 가져오기 오류:', error);
      return null;
    }
  };

  // 일일 사용량 확인 및 업데이트
  const checkAndUpdateUsage = async () => {
    if (!currentUser || !userProfile) return false;
    
    const userRef = doc(db, 'users', currentUser.uid);
    
    try {
      // VIP 회원인 경우 무제한 사용 가능
      if (userProfile.membershipType === 'vip') {
        // VIP 회원이지만, 멤버십이 만료된 경우 확인
        if (userProfile.membershipExpiry) {
          const expiryDate = userProfile.membershipExpiry.toDate();
          if (moment().isAfter(expiryDate)) {
            // 만료되었으므로 일반 회원으로 변경
            await updateDoc(userRef, {
              membershipType: 'regular',
              updatedAt: serverTimestamp()
            });
            
            // 프로필 업데이트
            const updatedProfile = await fetchUserProfile(currentUser);
            setUserProfile(updatedProfile);
            
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
      const lastUsageDate = userProfile.lastUsageDate 
        ? moment(userProfile.lastUsageDate.toDate()).format('YYYY-MM-DD') 
        : null;
      
      // 날짜가 변경되었으면 카운트 초기화
      if (lastUsageDate !== today) {
        await updateDoc(userRef, {
          dailyUsageCount: 0,
          lastUsageDate: serverTimestamp()
        });
        
        // 프로필 업데이트
        const updatedProfile = await fetchUserProfile(currentUser);
        setUserProfile(updatedProfile);
        
        return true;
      }
      
      // 오늘 사용 횟수 확인
      if (userProfile.dailyUsageCount >= 1) {
        return false; // 일일 사용 한도 초과
      }
      
      return true;
    } catch (error) {
      console.error('사용량 확인 오류:', error);
      return false;
    }
  };

  // 콘텐츠 생성 시 사용량 증가
  const incrementUsage = async () => {
    if (!currentUser) return;
    
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      
      // VIP 회원이 아닌 경우에만 카운트 증가
      if (userProfile?.membershipType !== 'vip') {
        await updateDoc(userRef, {
          dailyUsageCount: increment(1),
          lastUsageDate: serverTimestamp()
        });
        
        // 프로필 업데이트
        const updatedProfile = await fetchUserProfile(currentUser);
        setUserProfile(updatedProfile);
      }
    } catch (error) {
      console.error('사용량 업데이트 오류:', error);
    }
  };

  // 인증 상태 변경 감지
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        const profile = await fetchUserProfile(user);
        setUserProfile(profile);
      }
      
      setLoading(false);
    });
    
    return unsubscribe;
  }, []);

  // 제공하는 값
  const value = {
    currentUser,
    userProfile,
    signOut,
    loading,
    checkAndUpdateUsage,
    incrementUsage,
    fetchUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
