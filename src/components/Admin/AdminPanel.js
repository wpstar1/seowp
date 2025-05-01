import React, { useState, useEffect, useCallback } from 'react';
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
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // 관리자가 아니면 접근 불가
  const isAdmin = currentUser && (currentUser.isAdmin || currentUser.username === '1111');
  
  // 사용자 목록 새로고침
  const refreshUserList = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);
  
  // 사용자 목록 로드
  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true);
        setError('');
        console.log('사용자 목록 로드 시도...');
        
        const result = await getAllUsersList();
        
        console.log('받은 사용자 목록:', result);
        
        if (result && Array.isArray(result)) {
          setUsers(result);
          console.log('사용자 목록 설정 성공:', result.length, '명의 사용자');
        } else {
          console.error('유효하지 않은 사용자 목록:', result);
          setError('사용자 목록을 불러오는데 실패했습니다.');
        }
      } catch (error) {
        console.error('사용자 목록 로드 오류:', error);
        setError('사용자 목록을 불러오는데 실패했습니다: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    // 관리자인 경우에만 로드
    if (isAdmin) {
      loadUsers();
    }
  }, [getAllUsersList, isAdmin, refreshTrigger]);

  // VIP 승인/거부 팝업 표시
  const handleVipAction = (user, action) => {
    setSelectedUser(user);
    setActionType(action);
    setShowConfirmModal(true);
  };

  // VIP 상태 업데이트 처리
  const confirmVipAction = async () => {
    if (!selectedUser) return;
    
    try {
      const approve = actionType === 'approve';
      console.log(`${selectedUser.username} 사용자의 VIP 요청 ${approve ? '승인' : '거부'} 시도...`);
      
      await handleVipRequest(selectedUser.username, approve ? 'approve' : 'reject');
      console.log('VIP 상태 업데이트 성공');
      
      // 사용자 목록 새로고침
      refreshUserList();
      
      // 모달 닫기
      setShowConfirmModal(false);
      setSelectedUser(null);
      
      // 성공 메시지
      alert(`${selectedUser.username} 사용자의 VIP 신청이 ${approve ? '승인' : '거부'}되었습니다.`);
      
      // 약간의 지연 후 페이지 새로고침 (상태 갱신을 위해)
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('VIP 처리 오류:', error);
      alert(`VIP 상태 업데이트 중 오류가 발생했습니다: ${error.message}`);
    }
  };

  // 관리자가 아니면 홈으로 리다이렉트
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="admin-panel">
      <h1>관리자 페이지</h1>
      
      <div className="admin-controls">
        <button onClick={refreshUserList} className="refresh-btn">
          사용자 목록 새로고침
        </button>
      </div>
      
      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={refreshUserList}>다시 시도</button>
        </div>
      )}
      
      {loading ? (
        <div className="loading">데이터를 불러오는 중...</div>
      ) : (
        <div className="users-list">
          <h2>사용자 목록 ({users.length}명)</h2>
          
          {users.length === 0 ? (
            <p className="no-users">등록된 사용자가 없습니다.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>사용자명</th>
                  <th>이메일</th>
                  <th>상태</th>
                  <th>생성일</th>
                  <th>관리</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user, index) => (
                  <tr key={index} className={user.vipStatus === 'pending' ? 'pending-row' : ''}>
                    <td>
                      {user.username}
                      {user.isAdmin && <span className="admin-badge">관리자</span>}
                    </td>
                    <td>{user.email || '미등록'}</td>
                    <td>
                      {user.vipStatus === 'approved' ? (
                        <span className="vip-badge">VIP</span>
                      ) : user.vipStatus === 'pending' ? (
                        <span className="pending-badge">VIP 신청중</span>
                      ) : (
                        <span className="free-badge">일반</span>
                      )}
                    </td>
                    <td>
                      {user.createdAt ? 
                        (new Date(user.createdAt).toString() !== 'Invalid Date' ? 
                          new Date(user.createdAt).toLocaleDateString() : 
                          '날짜 없음'
                        ) : '날짜 없음'}
                    </td>
                    <td>
                      {/* 관리자만 볼 수 있는 VIP 승인 버튼 */}
                      {isAdmin && user.vipStatus !== 'approved' && !user.isAdmin && (
                        <div className="vip-actions">
                          <button
                            onClick={() => handleVipAction(user, 'approve')}
                            className="approve-btn"
                          >
                            승인
                          </button>
                          {user.vipStatus === 'pending' && (
                            <button
                              onClick={() => handleVipAction(user, 'reject')}
                              className="reject-btn"
                            >
                              거부
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
      
      {/* 확인 모달 */}
      {showConfirmModal && selectedUser && (
        <div className="confirm-modal">
          <div className="modal-content">
            <h3>VIP 신청 {actionType === 'approve' ? '승인' : '거부'}</h3>
            <p>
              <strong>{selectedUser.username}</strong> 사용자의 VIP 신청을
              {actionType === 'approve' ? ' 승인' : ' 거부'}하시겠습니까?
            </p>
            <div className="modal-buttons">
              <button onClick={confirmVipAction} className="confirm-btn">
                확인
              </button>
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setSelectedUser(null);
                }}
                className="cancel-btn"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
