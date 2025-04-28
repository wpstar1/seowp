import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/LocalAuthContext';

const Logout = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    // 로그아웃 처리
    signOut();
    
    // 홈으로 리다이렉트
    navigate('/');
  }, [signOut, navigate]);
  
  return (
    <div className="auth-container">
      <div className="auth-form-container">
        <h2>로그아웃 중...</h2>
        <p>로그아웃 처리 중입니다. 잠시만 기다려주세요.</p>
      </div>
    </div>
  );
};

export default Logout;
