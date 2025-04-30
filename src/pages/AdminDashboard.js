import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/LocalAuthContext';
import '../styles/AdminDashboard.css';

const AdminDashboard = () => {
  const { currentUser, isAdmin } = useAuth();
  const navigate = useNavigate();
  
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('users');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  
  // 새 사용자 생성 상태
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showAddUserForm, setShowAddUserForm] = useState(false);
  
  // VIP 승인 대기 목록
  const [pendingVipRequests, setPendingVipRequests] = useState([]);

  useEffect(() => {
    // 관리자 권한 확인
    if (!currentUser || currentUser.username !== '1111') {
      alert('관리자 권한이 필요합니다');
      navigate('/');
      return;
    }
    
    loadUsers();
    loadPendingVipRequests();
  }, [currentUser, navigate]);
  
  // 사용자 목록 로드
  const loadUsers = async () => {
    try {
      setLoading(true);
      
      // API로 사용자 목록 가져오기 시도
      try {
        const response = await fetch('/api/users');
        if (response.ok) {
          const data = await response.json();
          if (data.success && Array.isArray(data.users)) {
            setUsers(data.users);
            setLoading(false);
            return;
          }
        }
      } catch (apiError) {
        console.error('API에서 사용자 목록 로드 실패:', apiError);
      }
      
      // API 실패 시 localStorage에서 가져오기 (폴백)
      const usersJson = localStorage.getItem('smart_content_users');
      if (usersJson) {
        const parsedUsers = JSON.parse(usersJson);
        setUsers(parsedUsers);
      } else {
        setUsers([]);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('사용자 목록 로드 오류:', error);
      setMessage('사용자 목록을 로드하는 중 오류가 발생했습니다');
      setMessageType('error');
      setLoading(false);
    }
  };
  
  // VIP 승인 대기 목록 로드
  const loadPendingVipRequests = () => {
    try {
      // VIP 요청 목록 가져오기
      const pendingRequestsJson = localStorage.getItem('smart_content_vip_requests');
      if (pendingRequestsJson) {
        const pendingRequests = JSON.parse(pendingRequestsJson);
        setPendingVipRequests(pendingRequests);
      }
    } catch (error) {
      console.error('VIP 승인 대기 목록 로드 오류:', error);
    }
  };
  
  // 사용자 추가
  const handleAddUser = (e) => {
    e.preventDefault();
    
    if (!newUsername || !newPassword) {
      setMessage('사용자명과 비밀번호를 모두 입력해주세요');
      setMessageType('error');
      return;
    }
    
    try {
      // 기존 사용자 확인
      const existingUser = users.find(user => 
        user.username.toLowerCase() === newUsername.toLowerCase()
      );
      
      if (existingUser) {
        setMessage('이미 존재하는 사용자명입니다');
        setMessageType('error');
        return;
      }
      
      // 새 사용자 생성
      const newUser = {
        id: Date.now().toString(),
        username: newUsername,
        password: newPassword,
        email: '',
        membershipType: 'regular',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // 사용자 목록에 추가
      const updatedUsers = [...users, newUser];
      localStorage.setItem('smart_content_users', JSON.stringify(updatedUsers));
      setUsers(updatedUsers);
      
      // 입력창 초기화
      setNewUsername('');
      setNewPassword('');
      setShowAddUserForm(false);
      
      setMessage('사용자가 성공적으로 추가되었습니다');
      setMessageType('success');
    } catch (error) {
      console.error('사용자 추가 오류:', error);
      setMessage('사용자 추가 중 오류가 발생했습니다');
      setMessageType('error');
    }
  };
  
  // 사용자 삭제
  const handleDeleteUser = (username) => {
    if (!window.confirm(`사용자 '${username}'을(를) 삭제하시겠습니까?`)) {
      return;
    }
    
    try {
      // 관리자는 삭제 불가
      if (username === '1111') {
        setMessage('관리자 계정은 삭제할 수 없습니다');
        setMessageType('error');
        return;
      }
      
      // 사용자 삭제
      const updatedUsers = users.filter(user => user.username !== username);
      localStorage.setItem('smart_content_users', JSON.stringify(updatedUsers));
      setUsers(updatedUsers);
      
      setMessage('사용자가 성공적으로 삭제되었습니다');
      setMessageType('success');
    } catch (error) {
      console.error('사용자 삭제 오류:', error);
      setMessage('사용자 삭제 중 오류가 발생했습니다');
      setMessageType('error');
    }
  };
  
  // VIP 상태 변경 (승격 또는 취소)
  const handleToggleVipStatus = (username) => {
    try {
      const userIndex = users.findIndex(user => user.username === username);
      if (userIndex === -1) return;
      
      const updatedUsers = [...users];
      const isCurrentlyVip = updatedUsers[userIndex].membershipType === 'vip';
      
      // VIP 상태 변경
      if (isCurrentlyVip) {
        // VIP 상태 취소
        updatedUsers[userIndex].membershipType = 'regular';
        updatedUsers[userIndex].membershipExpiry = null;
        updatedUsers[userIndex].vipStatus = null;
      } else {
        // VIP로 승격
        const today = new Date();
        const expiryDate = new Date(today);
        expiryDate.setDate(today.getDate() + 30); // 30일 후
        
        updatedUsers[userIndex].membershipType = 'vip';
        updatedUsers[userIndex].membershipExpiry = expiryDate.toISOString();
        updatedUsers[userIndex].vipStatus = 'approved';
        updatedUsers[userIndex].updatedAt = new Date().toISOString();
      }
      
      // 저장
      localStorage.setItem('smart_content_users', JSON.stringify(updatedUsers));
      setUsers(updatedUsers);
      
      setMessage(`사용자 '${username}'의 VIP 상태가 ${isCurrentlyVip ? '취소' : '승격'}되었습니다`);
      setMessageType('success');
    } catch (error) {
      console.error('VIP 상태 변경 오류:', error);
      setMessage('VIP 상태 변경 중 오류가 발생했습니다');
      setMessageType('error');
    }
  };
  
  // VIP 신청 승인
  const handleApproveVipRequest = (requestId, username) => {
    try {
      // 사용자 찾기
      const userIndex = users.findIndex(user => 
        user.username.toLowerCase() === username.toLowerCase()
      );
      
      if (userIndex === -1) {
        setMessage(`사용자 '${username}'을(를) 찾을 수 없습니다`);
        setMessageType('error');
        return;
      }
      
      // VIP로 승격
      const updatedUsers = [...users];
      const today = new Date();
      const expiryDate = new Date(today);
      expiryDate.setDate(today.getDate() + 30); // 30일 후
      
      updatedUsers[userIndex].membershipType = 'vip';
      updatedUsers[userIndex].membershipExpiry = expiryDate.toISOString();
      updatedUsers[userIndex].vipStatus = 'approved';
      updatedUsers[userIndex].updatedAt = new Date().toISOString();
      
      // 요청에서 제거
      const updatedRequests = pendingVipRequests.filter(req => req.id !== requestId);
      
      // 저장
      localStorage.setItem('smart_content_users', JSON.stringify(updatedUsers));
      localStorage.setItem('smart_content_vip_requests', JSON.stringify(updatedRequests));
      
      setUsers(updatedUsers);
      setPendingVipRequests(updatedRequests);
      
      setMessage(`사용자 '${username}'의 VIP 승인이 완료되었습니다`);
      setMessageType('success');
    } catch (error) {
      console.error('VIP 승인 오류:', error);
      setMessage('VIP 승인 중 오류가 발생했습니다');
      setMessageType('error');
    }
  };
  
  // VIP 신청 거절
  const handleRejectVipRequest = (requestId) => {
    try {
      // 요청에서 제거
      const updatedRequests = pendingVipRequests.filter(req => req.id !== requestId);
      
      // 저장
      localStorage.setItem('smart_content_vip_requests', JSON.stringify(updatedRequests));
      setPendingVipRequests(updatedRequests);
      
      setMessage('VIP 신청이 거절되었습니다');
      setMessageType('success');
    } catch (error) {
      console.error('VIP 거절 오류:', error);
      setMessage('VIP 거절 중 오류가 발생했습니다');
      setMessageType('error');
    }
  };

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1>관리자 대시보드</h1>
        <div className="admin-tabs">
          <button
            className={activeTab === 'users' ? 'active' : ''}
            onClick={() => setActiveTab('users')}
          >
            사용자 관리
          </button>
          <button
            className={activeTab === 'vip' ? 'active' : ''}
            onClick={() => setActiveTab('vip')}
          >
            VIP 승인 관리
          </button>
        </div>
      </div>
      
      {/* 알림 메시지 */}
      {message && (
        <div className={`admin-message ${messageType}`}>
          {message}
          <button className="close-message" onClick={() => setMessage('')}>×</button>
        </div>
      )}
      
      {/* 사용자 관리 탭 */}
      {activeTab === 'users' && (
        <div className="admin-section">
          <div className="section-header">
            <h2>사용자 관리</h2>
            <button 
              className="add-user-button"
              onClick={() => setShowAddUserForm(!showAddUserForm)}
            >
              {showAddUserForm ? '취소' : '새 사용자 추가'}
            </button>
          </div>
          
          {/* 사용자 추가 폼 */}
          {showAddUserForm && (
            <div className="add-user-form">
              <form onSubmit={handleAddUser}>
                <div className="form-group">
                  <label htmlFor="new-username">사용자명</label>
                  <input
                    id="new-username"
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="사용자명을 입력하세요"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="new-password">비밀번호</label>
                  <input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="비밀번호를 입력하세요"
                    required
                  />
                </div>
                <div className="form-actions">
                  <button type="submit" className="save-button">저장</button>
                  <button type="button" className="cancel-button" onClick={() => setShowAddUserForm(false)}>취소</button>
                </div>
              </form>
            </div>
          )}
          
          {/* 사용자 목록 */}
          {loading ? (
            <p className="loading">로딩 중...</p>
          ) : (
            <div className="user-list">
              <table>
                <thead>
                  <tr>
                    <th>사용자명</th>
                    <th>이메일</th>
                    <th>회원 등급</th>
                    <th>등록일</th>
                    <th>만료일</th>
                    <th>관리</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length > 0 ? (
                    users.map((user, index) => (
                      <tr key={index} className={user.username === '1111' ? 'admin-user' : ''}>
                        <td>{user.username}</td>
                        <td>{user.email || '-'}</td>
                        <td className={user.membershipType === 'vip' ? 'vip-badge' : (user.membershipType === 'admin' ? 'admin-badge' : '')}>
                          {user.membershipType === 'vip' ? 'VIP' : 
                           user.membershipType === 'admin' ? '관리자' : '일반'}
                        </td>
                        <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                        <td>
                          {user.membershipExpiry ? 
                            new Date(user.membershipExpiry).toLocaleDateString() : 
                            '-'}
                        </td>
                        <td className="actions">
                          {user.username !== '1111' && (
                            <>
                              <button 
                                className={user.membershipType === 'vip' ? 'revoke-button' : 'promote-button'}
                                onClick={() => handleToggleVipStatus(user.username)}
                              >
                                {user.membershipType === 'vip' ? 'VIP 취소' : 'VIP 승격'}
                              </button>
                              <button 
                                className="delete-button"
                                onClick={() => handleDeleteUser(user.username)}
                              >
                                삭제
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="no-data">등록된 사용자가 없습니다</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
      
      {/* VIP 승인 관리 탭 */}
      {activeTab === 'vip' && (
        <div className="admin-section">
          <h2>VIP 승인 관리</h2>
          
          {pendingVipRequests.length > 0 ? (
            <div className="vip-requests">
              <h3>VIP 승인 대기 목록 ({pendingVipRequests.length}건)</h3>
              <table>
                <thead>
                  <tr>
                    <th>사용자명</th>
                    <th>신청일</th>
                    <th>입금자명</th>
                    <th>상태</th>
                    <th>관리</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingVipRequests.map((request, index) => (
                    <tr key={index}>
                      <td>{request.username}</td>
                      <td>{new Date(request.requestDate).toLocaleDateString()}</td>
                      <td>{request.depositName || '-'}</td>
                      <td>승인 대기중</td>
                      <td className="actions">
                        <button 
                          className="approve-button"
                          onClick={() => handleApproveVipRequest(request.id, request.username)}
                        >
                          승인
                        </button>
                        <button 
                          className="reject-button"
                          onClick={() => handleRejectVipRequest(request.id)}
                        >
                          거절
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="no-data">VIP 승인 대기 중인 요청이 없습니다</p>
          )}
          
          {/* VIP 수동 승격 안내 */}
          <div className="vip-manual-section">
            <h3>VIP 수동 승격</h3>
            <p>
              '사용자 관리' 탭에서 원하는 사용자를 선택하고 'VIP 승격' 버튼을 클릭하여 
              수동으로 VIP 상태로 변경할 수 있습니다.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
