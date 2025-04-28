import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/LocalAuthContext';
import { toast } from 'react-toastify';
import './Auth.css';

const UpgradeVIP = () => {
  const [loading, setLoading] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const { currentUser, upgradeToVIP } = useAuth();
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // 로그인되어 있지 않으면 로그인 페이지로 이동
    if (!currentUser) {
      navigate('/login');
    }
  }, [currentUser, navigate]);

  // 테스트용 즉시 VIP로 업그레이드 (실제로는 결제 처리 후 텔레그램 승인 필요)
  const handleUpgradeNow = async () => {
    if (!currentUser) return;
    
    setUpgrading(true);
    
    try {
      // 현재 상태 로그
      console.log('업그레이드 전 사용자 상태:', currentUser);
      
      // 테스트를 위해 즉시 업그레이드
      const result = await upgradeToVIP();
      
      console.log('업그레이드 결과:', result);
      
      if (result.success) {
        // 성공 메시지 (result에 message가 있으면 그것을 사용)
        const successMsg = result.message || 'VIP 회원으로 업그레이드되었습니다! 30일간 무제한 사용이 가능합니다.';
        setMessage(successMsg);
        toast.success(successMsg);
        
        // 강제로 페이지 리로드하여 상태 갱신
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        toast.error(result.error || '업그레이드 처리 중 오류가 발생했습니다');
      }
    } catch (error) {
      console.error('VIP 업그레이드 오류:', error);
      toast.error('업그레이드 처리 중 오류가 발생했습니다');
    } finally {
      setUpgrading(false);
    }
  };

  // 가상 입금 및 텔레그램 승인 요청 (실제로는 결제 처리 필요)
  const handleRequestUpgrade = () => {
    toast.info('개발 중: 텔레그램 승인 시스템은 현재 서버 없이 테스트 중입니다. "지금 업그레이드" 버튼을 클릭하세요.');
  };

  const getMembershipStatus = () => {
    if (!currentUser) return '로딩 중...';
    
    // 디버깅 정보
    console.log('현재 회원 타입:', currentUser.membershipType);
    console.log('만료일 정보:', currentUser.membershipExpiry);
    
    if (currentUser.membershipType === 'vip') {
      if (!currentUser.membershipExpiry) {
        return 'VIP 회원 (무제한)';
      }
      
      const expiryDate = new Date(currentUser.membershipExpiry);
      return `VIP 회원 (만료일: ${expiryDate.toLocaleDateString()})`;
    }
    
    return '일반 회원';
  };

  const isAlreadyVIP = currentUser?.membershipType === 'vip';

  return (
    <div className="auth-container">
      <div className="auth-form-container">
        <h2>VIP 회원 업그레이드</h2>
        
        {message && <div className="auth-success">{message}</div>}
        
        <div className="vip-info">
          <h3>VIP 회원 혜택</h3>
          <ul>
            <li>하루 사용 횟수 무제한 (일반 회원은 1회만 가능)</li>
            <li>고급 콘텐츠 템플릿 사용 가능</li>
            <li>우선 기술 지원</li>
          </ul>
          
          <h3>VIP 회원 가격</h3>
          <p className="vip-price">30,000원 / 30일</p>
          
          <div className="payment-info">
            <h4>입금 정보</h4>
            <p>입금 계좌: 국민은행 123-456-789012</p>
            <p>예금주: 홍길동</p>
            <p>입금 후 아래 버튼을 클릭하여 신청하세요.</p>
            <p className="test-mode-notice">* 현재 테스트 모드로 운영 중입니다. 실제 결제는 이루어지지 않습니다.</p>
          </div>
        </div>
        
        <div className="vip-status">
          <h3>현재 상태</h3>
          <p>회원 등급: <strong>{getMembershipStatus()}</strong></p>
        </div>
        
        {/* 서버가 없는 상태에서 테스트를 위한 두 가지 방식 제공 */}
        <div className="vip-upgrade-options">
          <p className="test-note">
            * 개발 테스트 중: 두 가지 방식 중 하나를 선택하여 업그레이드 해보세요.
          </p>
          
          <button 
            className="auth-button vip-button"
            onClick={handleRequestUpgrade}
            disabled={upgrading || isAlreadyVIP}
          >
            입금 후 승인 요청 (텔레그램)
          </button>
          
          <div className="or-divider">또는</div>
          
          <button 
            className="auth-button vip-button-test"
            onClick={handleUpgradeNow}
            disabled={upgrading || isAlreadyVIP}
          >
            {upgrading ? '처리 중...' : '지금 업그레이드 (테스트)'}
          </button>
        </div>
        
        <div className="auth-links">
          <button 
            className="back-button"
            onClick={() => navigate('/dashboard')}
          >
            대시보드로 돌아가기
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpgradeVIP;
