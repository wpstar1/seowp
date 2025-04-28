import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/LocalAuthContext';
import '../styles/Header.css';

const Header = () => {
  const { currentUser, signOut, isAdmin } = useAuth();
  
  // 로그아웃 처리
  const handleLogout = () => {
    signOut();
    window.location.href = '/';
  };
  
  // VIP 신청 모달 표시 함수
  const handleVipRequest = () => {
    // App.js에서 정의된 모달을 열기 위해 커스텀 이벤트 발생
    const vipRequestEvent = new CustomEvent('openVipModal');
    window.dispatchEvent(vipRequestEvent);
  };
  
  return (
    <header className="app-header">
      <div className="logo">
        <Link to="/" className="logo-link">스마트 콘텐츠 크리에이터</Link>
      </div>
      
      <nav className="header-nav">
        {currentUser ? (
          <div className="user-menu">
            <span className="username">{currentUser.username}</span>
            
            {isAdmin && isAdmin() && (
              <Link to="/admin-dashboard" className="admin-link">관리자 페이지</Link>
            )}
            
            {!isAdmin() && (
              <button 
                onClick={handleVipRequest} 
                className="vip-btn"
                style={{
                  backgroundColor: '#6c5ce7', 
                  color: 'white',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '4px',
                  marginRight: '10px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                VIP 신청
              </button>
            )}
            
            <button onClick={handleLogout} className="logout-btn">로그아웃</button>
          </div>
        ) : (
          <div className="auth-buttons">
            <Link to="/login" className="auth-btn login-btn" style={{ color: 'white', marginRight: '15px', fontWeight: 'bold' }}>로그인</Link>
            <Link to="/register" className="auth-btn register-btn" style={{ color: 'white', marginRight: '15px', fontWeight: 'bold' }}>회원가입</Link>
            <button 
              onClick={handleVipRequest} 
              className="vip-btn"
              style={{
                backgroundColor: '#6c5ce7', 
                color: 'white',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              VIP 신청
            </button>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;
