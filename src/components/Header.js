import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/SupabaseAuthContext';
import '../styles/Header.css';

const Header = () => {
  const { currentUser, logout, refreshCurrentUser } = useAuth();
  const isAdmin = currentUser && currentUser.username === '1111'; 
  const isVip = currentUser && (currentUser.membershipType === 'vip' || currentUser.vipStatus === 'approved' || isAdmin);
  
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  
  // 로그아웃 처리
  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = '/';
    } catch (error) {
      console.error('로그아웃 오류:', error);
    }
  };
  
  // VIP 신청 모달 표시 함수
  const handleVipRequest = () => {
    // App.js에서 정의된 모달을 열기 위해 커스텀 이벤트 발생
    if (currentUser) {
      // 로그인한 사용자는 VIP 신청 모달 표시
      const vipRequestEvent = new CustomEvent('openVipModal');
      window.dispatchEvent(vipRequestEvent);
    } else {
      // 로그인하지 않은 사용자는 로그인 모달 표시
      const loginRequestEvent = new CustomEvent('openLoginModal');
      window.dispatchEvent(loginRequestEvent);
    }
  };
  
  // 화면 진입시 사용자 정보 새로고침
  useEffect(() => {
    const refreshUserInfo = async () => {
      if (currentUser) {
        await refreshCurrentUser();
        console.log('Header: 사용자 정보 새로고침 완료');
      }
    };
    
    refreshUserInfo();
  }, [currentUser, refreshCurrentUser]);

  return (
    <header className="app-header">
      <div className="logo">
        <span className="logo-icon">🟣</span>
        <Link to="/" className="logo-link">위프스타 Content Creator v5</Link>
        <span className="logo-subtitle">모바일 AI 콘텐츠 생성기</span>
      </div>
      
      <nav className="header-nav">
        {currentUser ? (
          <div className="user-menu">
            <span className="username">{currentUser.username}</span>
            
            {isAdmin && (
              <Link to="/admin" className="admin-link">관리자</Link>
            )}
            
            {isVip ? (
              <span className="vip-badge">
                <span className="vip-icon">⭐</span> 
                VIP 회원
              </span>
            ) : (
              <button 
                onClick={handleVipRequest} 
                className="vip-btn"
              >
                VIP 신청
              </button>
            )}
            
            <button 
              onClick={handleLogout} 
              className="logout-btn"
            >
              로그아웃
            </button>
          </div>
        ) : (
          <div className="auth-buttons">
            <Link to="/login" className="login-btn">로그인</Link>
            <Link to="/register" className="register-btn">회원가입</Link>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;
