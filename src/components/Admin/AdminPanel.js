import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/SupabaseAuthContext';
import './AdminPanel.css';

const AdminPanel = () => {
  const { currentUser, getAllUsersList, handleVipRequest } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionType, setActionType] = useState('');

  // 관리자가 아니면 접근 불가
  const isAdmin = currentUser && (currentUser.isAdmin || currentUser.username === '1111');
  
  // 사용자 목록 로드
  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true);
        const result = await getAllUsersList();
        
        if (result) {
          setUsers(result);
        } else {
          setError('사용자 목록을 불러오는데 실패했습니다.');
        }
      } catch (error) {
        console.error('사용자 목록 로드 오류:', error);
        setError('사용자 목록을 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, [getAllUsersList]);

  // VIP 승인/거부 팝업 표시
  const handleVipAction = (user, action) => {
    setSelectedUser(user);
    setActionType(action);
    setShowConfirmModal(true);
  };

  // VIP 상태 업데이트 처리
  const confirmVipAction = async () => {
    try {
      const approve = actionType === 'approve';
      await handleVipRequest(selectedUser.username, approve ? 'approve' : 'reject');
      
      // 사용자 목록 새로고침
      const updatedUsers = await getAllUsersList();
      setUsers(updatedUsers);
      
      setShowConfirmModal(false);
    } catch (error) {
      console.error('VIP 처리 오류:', error);
      alert(`VIP 상태 업데이트 중 오류가 발생했습니다: ${error.message}`);
    }
  };

  // VIP 상태에 따른 배지 렌더링
  const renderVipBadge = (user) => {
    if (user.vipStatus === 'approved' || user.membershipType === 'vip') {
      return <span className="badge vip-badge">VIP</span>;
    } else if (user.vipStatus === 'pending') {
      return <span className="badge pending-badge">승인 대기중</span>;
    } else if (user.vipStatus === 'rejected') {
      return <span className="badge rejected-badge">거부됨</span>;
    }
    return null;
  };

  // VIP 만료일 표시
  const renderExpiryDate = (user) => {
    if ((user.vipStatus === 'approved' || user.membershipType === 'vip') && user.membershipExpiry) {
      const expiryDate = new Date(user.membershipExpiry);
      const now = new Date();
      const daysLeft = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
      
      return (
        <span className="expiry-date">
          만료: {expiryDate.toLocaleDateString()} ({daysLeft}일 남음)
        </span>
      );
    }
    return null;
  };

  // 관리자가 아니면 홈으로 리다이렉트
  if (!isAdmin) {
    return <Navigate to="/" />;
  }

  return (
    <div className="admin-panel">
      <h1>관리자 페이지</h1>
      <p className="admin-subtitle">VIP 회원 신청을 관리하고 사용자 정보를 확인할 수 있습니다.</p>
      
      {error && <div className="error-message">{error}</div>}
      
      {loading ? (
        <div className="loading-spinner"></div>
      ) : (
        <div className="users-container">
          <h2>사용자 목록</h2>
          
          <div className="users-table-container">
            <table className="users-table">
              <thead>
                <tr>
                  <th>아이디</th>
                  <th>상태</th>
                  <th>가입일</th>
                  <th>VIP 신청</th>
                  <th>관리</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.username} className={user.vipStatus === 'pending' ? 'pending-row' : ''}>
                    <td>{user.username}</td>
                    <td>{renderVipBadge(user)} {renderExpiryDate(user)}</td>
                    <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td>
                      {user.vipStatus === 'pending' ? (
                        <span className="vip-request-date">
                          {new Date(user.updatedAt).toLocaleDateString()}
                        </span>
                      ) : user.vipStatus === 'none' ? (
                        <span className="no-request">-</span>
                      ) : (
                        <span className="vip-request-date">
                          {new Date(user.updatedAt).toLocaleDateString()}
                        </span>
                      )}
                    </td>
                    <td>
                      {user.vipStatus === 'pending' && (
                        <div className="action-buttons">
                          <button 
                            className="approve-btn"
                            onClick={() => handleVipAction(user, 'approve')}
                          >
                            승인
                          </button>
                          <button 
                            className="reject-btn"
                            onClick={() => handleVipAction(user, 'reject')}
                          >
                            거부
                          </button>
                        </div>
                      )}
                      {user.vipStatus === 'approved' && (
                        <button 
                          className="cancel-btn"
                          onClick={() => handleVipAction(user, 'reject')}
                        >
                          VIP 취소
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* 확인 모달 */}
      {showConfirmModal && selectedUser && (
        <div className="modal-overlay">
          <div className="modal-container">
            <h2>확인</h2>
            <p>
              {actionType === 'approve' 
                ? `${selectedUser.username} 사용자의 VIP 신청을 승인하시겠습니까?` 
                : `${selectedUser.username} 사용자의 VIP 상태를 취소하시겠습니까?`
              }
            </p>
            <div className="modal-buttons">
              <button className="cancel-btn" onClick={() => setShowConfirmModal(false)}>
                취소
              </button>
              <button 
                className={actionType === 'approve' ? 'approve-btn' : 'reject-btn'}
                onClick={confirmVipAction}
              >
                {actionType === 'approve' ? '승인' : '취소'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
