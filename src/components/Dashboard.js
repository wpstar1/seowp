import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/LocalAuthContext';
import moment from 'moment';
import '../App.css';
import './Dashboard.css';

const Dashboard = () => {
  const { currentUser, signOut } = useAuth();
  const navigate = useNavigate();

  // 회원 타입에 따른 메시지 및 스타일
  const getMembershipBadge = () => {
    if (currentUser?.membershipType === 'vip') {
      return <span className="badge vip-badge">VIP 회원</span>;
    }
    return <span className="badge regular-badge">일반 회원</span>;
  };

  // 만료일 표시
  const getExpiryInfo = () => {
    if (currentUser?.membershipType !== 'vip' || !currentUser?.membershipExpiry) {
      return null;
    }

    const expiryDate = moment(currentUser.membershipExpiry);
    const daysLeft = expiryDate.diff(moment(), 'days');
    
    return (
      <div className="expiry-info">
        <p>VIP 만료일: {expiryDate.format('YYYY년 MM월 DD일')}</p>
        <p className={daysLeft <= 5 ? 'expiry-warning' : ''}>
          {daysLeft > 0 ? `남은 기간: ${daysLeft}일` : '만료됨'}
        </p>
      </div>
    );
  };

  // 사용량 정보
  const getUsageInfo = () => {
    if (currentUser?.membershipType === 'vip') {
      return <p className="usage-info">콘텐츠 생성: 무제한</p>;
    }
    
    const usedToday = currentUser?.dailyUsageCount || 0;
    return (
      <p className="usage-info">
        오늘 사용량: {usedToday}/1 
        {usedToday >= 1 && (
          <span className="usage-limit">
            (한도 도달: VIP로 업그레이드하면 무제한 사용 가능)
          </span>
        )}
      </p>
    );
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('로그아웃 오류:', error);
    }
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>대시보드</h1>
        <button className="logout-button" onClick={handleLogout}>로그아웃</button>
      </div>
      
      <div className="dashboard-content">
        <div className="user-profile-card">
          <div className="profile-header">
            <h2>내 프로필</h2>
            {getMembershipBadge()}
          </div>
          
          <div className="profile-details">
            <p><strong>이메일:</strong> {currentUser?.email}</p>
            <p><strong>가입일:</strong> {currentUser?.createdAt ? moment(currentUser.createdAt).format('YYYY년 MM월 DD일') : '로딩 중...'}</p>
            {getExpiryInfo()}
            {getUsageInfo()}
          </div>
          
          {currentUser?.membershipType !== 'vip' && (
            <div className="upgrade-section">
              <h3>VIP 회원 혜택</h3>
              <ul>
                <li>하루 콘텐츠 생성 무제한 (일반 회원: 1회)</li>
                <li>고급 콘텐츠 템플릿 사용 가능</li>
                <li>우선 기술 지원</li>
              </ul>
              <button 
                className="upgrade-button"
                onClick={() => navigate('/upgrade-vip')}
              >
                VIP 회원으로 업그레이드
              </button>
            </div>
          )}
        </div>
        
        <div className="quick-actions">
          <h3>바로가기</h3>
          <div className="actions-grid">
            <button className="action-button" onClick={() => navigate('/content-creator')}>
              콘텐츠 생성기 시작
            </button>
            <button className="action-button" onClick={() => navigate('/')}>
              메인 페이지
            </button>
            {currentUser?.membershipType === 'vip' && (
              <button className="action-button" onClick={() => navigate('/content-creator')}>
                VIP 콘텐츠 생성기
              </button>
            )}
            <button className="action-button secondary" onClick={handleLogout}>
              로그아웃
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
