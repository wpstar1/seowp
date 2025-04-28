import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/LocalAuthContext';
import '../styles/Admin.css';

// 쿼리 파라미터 파싱 함수
const useQuery = () => {
  return new URLSearchParams(useLocation().search);
};

const Admin = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const query = useQuery();
  
  // VIP 승격 대상 사용자명과 액션 가져오기
  const upgradeTargetUsername = query.get('username');
  const action = query.get('action');

  useEffect(() => {
    // 관리자 체크 - 여기서는 간단히 'admin' 사용자만 접근 가능하도록 함
    if (!currentUser || currentUser.username !== 'admin') {
      setMessage('관리자 권한이 필요합니다.');
      setMessageType('error');
      setTimeout(() => navigate('/'), 2000);
      return;
    }
    
    // 저장된 사용자 목록 가져오기
    loadUsers();
    
    // VIP 승격 처리 - URL로 전달된 사용자가 있는 경우
    if (upgradeTargetUsername && action === 'vip-upgrade') {
      handleVipUpgrade(upgradeTargetUsername);
    }
  }, [currentUser, navigate, upgradeTargetUsername, action]);
  
  // 사용자 목록 로드
  const loadUsers = () => {
    try {
      const usersJson = localStorage.getItem('smart_content_users');
      if (usersJson) {
        const parsedUsers = JSON.parse(usersJson);
        setUsers(parsedUsers);
      }
      setLoading(false);
    } catch (error) {
      console.error('사용자 목록 로드 오류:', error);
      setMessage('사용자 목록을 로드하는 중 오류가 발생했습니다.');
      setMessageType('error');
      setLoading(false);
    }
  };
  
  // VIP 승격 처리
  const handleVipUpgrade = (username) => {
    try {
      const usersJson = localStorage.getItem('smart_content_users');
      if (!usersJson) {
        setMessage(`사용자 데이터를 찾을 수 없습니다.`);
        setMessageType('error');
        return;
      }
      
      const users = JSON.parse(usersJson);
      const userIndex = users.findIndex(user => 
        user.username.toLowerCase() === username.toLowerCase()
      );
      
      if (userIndex === -1) {
        setMessage(`사용자 '${username}'를 찾을 수 없습니다.`);
        setMessageType('error');
        return;
      }
      
      // 이미 VIP인 경우 확인
      if (users[userIndex].membershipType === 'vip') {
        setMessage(`사용자 '${username}'는 이미 VIP 회원입니다.`);
        setMessageType('info');
        return;
      }
      
      // VIP로 업그레이드
      const today = new Date();
      const expiryDate = new Date(today);
      expiryDate.setDate(today.getDate() + 30); // 30일 후
      
      users[userIndex].membershipType = 'vip';
      users[userIndex].membershipExpiry = expiryDate.toISOString();
      users[userIndex].updatedAt = new Date().toISOString();
      
      // 저장
      localStorage.setItem('smart_content_users', JSON.stringify(users));
      
      // 메시지 표시 및 사용자 목록 다시 로드
      setMessage(`사용자 '${username}'를 VIP로 성공적으로 승격했습니다!`);
      setMessageType('success');
      loadUsers();
      
      // URL에서 쿼리 파라미터 제거
      window.history.replaceState({}, document.title, '/admin');
    } catch (error) {
      console.error('VIP 업그레이드 오류:', error);
      setMessage(`오류가 발생했습니다: ${error.message}`);
      setMessageType('error');
    }
  };
  
  // 사용자 VIP 승격/취소 처리
  const toggleVipStatus = (username) => {
    try {
      const userIndex = users.findIndex(user => user.username === username);
      if (userIndex === -1) return;
      
      const updatedUsers = [...users];
      const isCurrentlyVip = updatedUsers[userIndex].membershipType === 'vip';
      
      if (isCurrentlyVip) {
        // VIP 취소
        updatedUsers[userIndex].membershipType = 'basic';
        updatedUsers[userIndex].membershipExpiry = null;
      } else {
        // VIP 승격
        const today = new Date();
        const expiryDate = new Date(today);
        expiryDate.setDate(today.getDate() + 30); // 30일 후
        
        updatedUsers[userIndex].membershipType = 'vip';
        updatedUsers[userIndex].membershipExpiry = expiryDate.toISOString();
      }
      
      updatedUsers[userIndex].updatedAt = new Date().toISOString();
      
      // 저장
      localStorage.setItem('smart_content_users', JSON.stringify(updatedUsers));
      setUsers(updatedUsers);
      
      setMessage(`사용자 '${username}'의 VIP 상태가 ${isCurrentlyVip ? '취소' : '승격'}되었습니다.`);
      setMessageType('success');
    } catch (error) {
      console.error('VIP 상태 변경 오류:', error);
      setMessage(`오류가 발생했습니다: ${error.message}`);
      setMessageType('error');
    }
  };
  
  return (
    <div className="admin-container">
      <h1>관리자 페이지</h1>
      
      {/* 메시지 표시 */}
      {message && (
        <div className={`admin-message ${messageType}`}>
          {message}
        </div>
      )}
      
      <h2>사용자 관리</h2>
      
      {loading ? (
        <p>로딩 중...</p>
      ) : (
        <div className="user-list">
          <table>
            <thead>
              <tr>
                <th>사용자명</th>
                <th>이메일</th>
                <th>회원 등급</th>
                <th>등록일</th>
                <th>마지막 업데이트</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {users.length > 0 ? (
                users.map((user, index) => (
                  <tr key={index}>
                    <td>{user.username}</td>
                    <td>{user.email || '-'}</td>
                    <td className={user.membershipType === 'vip' ? 'vip-badge' : ''}>
                      {user.membershipType === 'vip' ? 'VIP' : '일반'}
                      {user.membershipType === 'vip' && user.membershipExpiry && (
                        <span className="expiry-date">
                          (만료: {new Date(user.membershipExpiry).toLocaleDateString()})
                        </span>
                      )}
                    </td>
                    <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td>{user.updatedAt ? new Date(user.updatedAt).toLocaleDateString() : '-'}</td>
                    <td>
                      <button 
                        className={user.membershipType === 'vip' ? 'revoke-vip-button' : 'grant-vip-button'}
                        onClick={() => toggleVipStatus(user.username)}
                      >
                        {user.membershipType === 'vip' ? 'VIP 취소' : 'VIP 승격'}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6">등록된 사용자가 없습니다.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Admin;
