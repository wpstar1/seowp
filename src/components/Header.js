import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/LocalAuthContext';
import '../styles/Header.css';

const Header = ({ setShowLoginModal, setShowRegisterModal }) => {
  const { currentUser, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  
  // 로그아웃 처리
  const handleLogout = () => {
    logout();
    navigate('/');
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
            <button onClick={handleLogout} className="logout-btn">로그아웃</button>
          </div>
        ) : (
          <div className="auth-buttons">
            <button onClick={() => setShowLoginModal(true)}>로그인</button>
            <button onClick={() => setShowRegisterModal(true)}>회원가입</button>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;
