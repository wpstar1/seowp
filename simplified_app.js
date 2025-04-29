import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  // 최소한의 필수 상태만 유지
  const [isLoading, setIsLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showVipModal, setShowVipModal] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [authError, setAuthError] = useState('');
  
  // VIP 신청 정보
  const [depositName, setDepositName] = useState('');
  const [vipRequestStatus, setVipRequestStatus] = useState(''); // 'pending', 'approved', 'rejected'
  const [isVip, setIsVip] = useState(false);  // VIP 상태 추가

  // 로컬 스토리지에서 사용자 정보 로드
  useEffect(() => {
    const currentUser = localStorage.getItem('smart_content_current_user');
    if (currentUser) {
      setIsLoggedIn(true);
      setUsername(currentUser);
      
      // 사용자 데이터 로드 - 대소문자 구분 없이 사용자 찾기
      const users = JSON.parse(localStorage.getItem('smart_content_users') || '[]');
      const user = users.find(u => u.username.toLowerCase() === currentUser.toLowerCase());
      
      if (user) {
        // VIP 상태 확인 및 설정
        if (user.membershipType === 'vip' && user.vipStatus === 'approved') {
          setIsVip(true);
        } else {
          setIsVip(false);
        }
      }
    }
  }, []);

  // 승인된 사용자 목록을 정기적으로 확인하고 VIP 상태를 업데이트하는 기능 추가
  useEffect(() => {
    const checkApprovedUsers = async () => {
      if (!username) return;
      
      try {
        const response = await fetch('https://seo-beige.vercel.app/api/approved-users');
        if (!response.ok) {
          console.error('API 응답 오류:', response.status);
          return;
        }
        
        const data = await response.json();
        
        if (data.success && Array.isArray(data.approvedUsers)) {
          // 대소문자 구분 없이 비교
          const approvedUser = data.approvedUsers.find(u => 
            u.userId.toLowerCase() === username.toLowerCase()
          );
          
          if (approvedUser && approvedUser.approvalStatus === 'approved') {
            // 현재 사용자가 VIP가 아니라면 업데이트
            const users = JSON.parse(localStorage.getItem('smart_content_users') || '[]');
            // 대소문자 구분 없이 사용자 찾기
            const userIndex = users.findIndex(u => u.username.toLowerCase() === username.toLowerCase());
            
            if (userIndex !== -1) {
              // 사용자 VIP 상태 업데이트
              const today = new Date();
              const expiryDate = new Date(today);
              expiryDate.setDate(today.getDate() + 30); // 30일 후
              
              users[userIndex].membershipType = 'vip';
              users[userIndex].vipStatus = 'approved';
              users[userIndex].membershipExpiry = expiryDate.toISOString();
              users[userIndex].updatedAt = new Date().toISOString();
              
              // 로컬 스토리지 업데이트
              localStorage.setItem('smart_content_users', JSON.stringify(users));
              
              setIsLoggedIn(true);
              setUsername(users[userIndex].username);
              setIsVip(true);
            }
          }
        }
      } catch (error) {
        console.error('승인 상태 확인 중 오류:', error);
      }
    };
    
    // 페이지 로드 시 즉시 확인
    checkApprovedUsers();
    
    // 1분마다 주기적으로 확인
    const intervalId = setInterval(checkApprovedUsers, 60000);
    
    return () => {
      clearInterval(intervalId); // 컴포넌트 언마운트 시 인터벌 제거
    };
  }, [username]);

  // 간단한 로딩 표시 함수
  const showLoading = (message) => {
    setIsLoading(true);
    return new Promise((resolve) => {
      setTimeout(() => {
        setIsLoading(false);
        resolve();
      }, 1000); // 간단한 1초 딜레이
    });
  };

  // 로그인 처리 함수
  const handleLogin = async () => {
    // 간단한 로딩 표시
    await showLoading();
    
    // 관리자 계정 (1111/1111) 처리
    if (username === '1111' && password === '1111') {
      setIsLoggedIn(true);
      setShowLoginModal(false);
      setIsVip(true);
      
      // 로컬 스토리지에 관리자 계정 저장
      localStorage.setItem('smart_content_current_user', username);
      
      let users = JSON.parse(localStorage.getItem('smart_content_users') || '[]');
      let adminUser = users.find(u => u.username === '1111');
      
      if (!adminUser) {
        adminUser = {
          username: '1111',
          password: '1111',
          membershipType: 'vip',
          vipStatus: 'approved',
          isAdmin: true,
          membershipExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1년
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        users.push(adminUser);
        localStorage.setItem('smart_content_users', JSON.stringify(users));
      }
      return;
    }
    
    // 일반 사용자 로그인 처리
    const users = JSON.parse(localStorage.getItem('smart_content_users') || '[]');
    // 대소문자 구분 없이 사용자 찾기
    const user = users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password);
    
    if (user) {
      setIsLoggedIn(true);
      setShowLoginModal(false);
      localStorage.setItem('smart_content_current_user', user.username);
      
      // VIP 상태 확인 및 설정
      if (user.membershipType === 'vip' && user.vipStatus === 'approved') {
        setIsVip(true);
      } else {
        setIsVip(false);
      }
      
      setAuthError('');
    } else {
      setAuthError('아이디 또는 비밀번호가 올바르지 않습니다.');
    }
  };
  
  // 회원가입 처리 함수
  const handleRegister = async () => {
    // 간단한 로딩 표시
    await showLoading();
    
    if (!username.trim()) {
      setAuthError('아이디를 입력해주세요.');
      return;
    }
    
    if (!password.trim()) {
      setAuthError('비밀번호를 입력해주세요.');
      return;
    }
    
    if (password !== confirmPassword) {
      setAuthError('비밀번호가 일치하지 않습니다.');
      return;
    }
    
    const users = JSON.parse(localStorage.getItem('smart_content_users') || '[]');
    // 대소문자 구분 없이 중복 확인
    const existingUser = users.find(u => u.username.toLowerCase() === username.toLowerCase());
    
    if (existingUser) {
      setAuthError('이미 존재하는 아이디입니다.');
      return;
    }
    
    // 새 사용자 생성
    const newUser = {
      username: username,
      password: password,
      membershipType: 'basic',
      vipStatus: 'none',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    users.push(newUser);
    localStorage.setItem('smart_content_users', JSON.stringify(users));
    localStorage.setItem('smart_content_current_user', username);
    
    setIsLoggedIn(true);
    setIsVip(false);
    setShowRegisterModal(false);
    setAuthError('');
  };
  
  // VIP 신청 처리 함수
  const handleVipRequest = async () => {
    // 간단한 로딩 표시
    await showLoading();
    
    if (!depositName.trim()) {
      alert('예금주와 ID를 입력해주세요.');
      return;
    }
    
    // 확인 팝업 표시
    if (window.confirm(`예금주와 금액이 정확한지 확인해주세요.\n\n예금주: ${depositName}\n금액: 19,900원\n\nVIP 신청을 진행하시겠습니까?`)) {
      // 현재 사용자 정보 업데이트
      const users = JSON.parse(localStorage.getItem('smart_content_users') || '[]');
      const userIndex = users.findIndex(u => u.username.toLowerCase() === username.toLowerCase());
      
      if (userIndex !== -1) {
        users[userIndex].vipRequestDate = new Date().toISOString();
        users[userIndex].vipStatus = 'pending';
        users[userIndex].depositName = depositName;
        
        localStorage.setItem('smart_content_users', JSON.stringify(users));
        setVipRequestStatus('pending');
        
        // 스낵바 메시지 대신 알림
        alert('VIP 신청이 접수되었습니다. 관리자 승인을 기다려주세요.');
        
        // VIP 모달 닫기
        setShowVipModal(false);
      }
    }
  };
  
  // 로그아웃 처리 함수
  const handleLogout = () => {
    localStorage.removeItem('smart_content_current_user');
    setIsLoggedIn(false);
    setUsername('');
    setIsVip(false);
  };

  // UI 렌더링 (불필요한 기능 모두 제거하고 간단한 UI만 표시)
  return (
    <div className="app">
      <header className="header">
        <div className="container">
          <h1 className="brand">Smart VIP System</h1>
          <div className="user-actions">
            {!isLoggedIn ? (
              <>
                <button className="btn btn-login" onClick={() => setShowLoginModal(true)}>로그인</button>
                <button className="btn btn-register" onClick={() => setShowRegisterModal(true)}>회원가입</button>
              </>
            ) : (
              <>
                <span className="welcome-message">
                  환영합니다, {username}님 {isVip && <span className="vip-badge">VIP</span>}
                </span>
                <button className="btn btn-logout" onClick={handleLogout}>로그아웃</button>
                {!isVip && (
                  <button className="btn btn-vip" onClick={() => setShowVipModal(true)}>VIP 신청</button>
                )}
              </>
            )}
          </div>
        </div>
      </header>

      <main className="main-content">
        <div className="container">
          {isLoading && (
            <div className="simple-loading">
              <div className="loading-spinner"></div>
              <p>처리 중입니다...</p>
            </div>
          )}
          
          <div className="welcome-section">
            <h2>Smart Content Creator</h2>
            <p>이 앱은 대폭 간소화되었으며, 로그인/회원가입과 VIP 시스템만 남아있습니다.</p>
            {isLoggedIn && !isVip && (
              <div className="vip-promo">
                <h3>VIP 회원 혜택</h3>
                <ul>
                  <li>프리미엄 기능 제공</li>
                  <li>추가 리소스 접근 권한</li>
                  <li>우선 지원</li>
                </ul>
                <button className="btn btn-vip-large" onClick={() => setShowVipModal(true)}>VIP 신청하기</button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* 로그인 모달 */}
      {showLoginModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>로그인</h2>
              <button className="close-btn" onClick={() => setShowLoginModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="username">아이디</label>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="아이디를 입력하세요"
                />
              </div>
              <div className="form-group">
                <label htmlFor="password">비밀번호</label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="비밀번호를 입력하세요"
                />
              </div>
              {authError && <div className="error-message">{authError}</div>}
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={handleLogin}>로그인</button>
              <button className="btn btn-secondary" onClick={() => setShowLoginModal(false)}>취소</button>
            </div>
          </div>
        </div>
      )}

      {/* 회원가입 모달 */}
      {showRegisterModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>회원가입</h2>
              <button className="close-btn" onClick={() => setShowRegisterModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="register-username">아이디</label>
                <input
                  type="text"
                  id="register-username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="아이디를 입력하세요"
                />
              </div>
              <div className="form-group">
                <label htmlFor="register-password">비밀번호</label>
                <input
                  type="password"
                  id="register-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="비밀번호를 입력하세요"
                />
              </div>
              <div className="form-group">
                <label htmlFor="confirm-password">비밀번호 확인</label>
                <input
                  type="password"
                  id="confirm-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="비밀번호를 다시 입력하세요"
                />
              </div>
              {authError && <div className="error-message">{authError}</div>}
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={handleRegister}>회원가입</button>
              <button className="btn btn-secondary" onClick={() => setShowRegisterModal(false)}>취소</button>
            </div>
          </div>
        </div>
      )}

      {/* VIP 신청 모달 */}
      {showVipModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>VIP 멤버십 신청</h2>
              <button className="close-btn" onClick={() => setShowVipModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="vip-info">
                <h3>VIP 멤버십 혜택</h3>
                <ul>
                  <li>모든 프리미엄 기능 이용</li>
                  <li>우선 지원</li>
                  <li>추가 리소스 제공</li>
                </ul>
                <p className="vip-price">19,900원 / 30일</p>
                
                <div className="payment-info">
                  <h4>입금 정보</h4>
                  <div className="account-info">
                    <p>입금 계좌: 카카오뱅크 3333335201265</p>
                    <button 
                      className="copy-button"
                      onClick={() => {
                        navigator.clipboard.writeText('3333335201265')
                          .then(() => alert('계좌번호가 복사되었습니다!'))
                          .catch(err => alert('복사에 실패했습니다: ' + err));
                      }}
                    >
                      복사
                    </button>
                  </div>
                  <p>예금주: 이경형</p>
                  <p>입금 후 아래 버튼을 클릭하여 신청하세요.</p>
                  <p className="test-mode-notice">* 입금시 예금자명을 예금주와 아이디를 모두써서 보내주세요</p>
                </div>
                
                <div className="vip-upgrade-form">
                  <div className="form-group">
                    <label>예금주와 id</label>
                    <input 
                      type="text" 
                      value={depositName} 
                      onChange={(e) => setDepositName(e.target.value)} 
                      placeholder="예금주와 id 입력하세요"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="btn btn-primary"
                disabled={!depositName.trim()} 
                onClick={handleVipRequest}
              >
                VIP 신청하기
              </button>
              <button className="btn btn-secondary" onClick={() => setShowVipModal(false)}>
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
