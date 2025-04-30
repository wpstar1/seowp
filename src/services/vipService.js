/**
 * VIP 사용자 관리 서비스
 * VIP 상태 확인 및 관리에 관련된 모든 로직을 처리합니다.
 */

import { executeQuery } from '../lib/db';

/**
 * 사용자의 VIP 상태를 확인하는 함수
 * @param {string} username - 사용자 이름
 * @returns {Promise<{success: boolean, isVip: boolean, error?: string}>} - VIP 상태 확인 결과
 */
export const checkVipStatus = async (username) => {
  try {
    // 관리자 계정(1111)은 항상 VIP 상태
    if (username === '1111') {
      console.log('관리자 계정(1111)은 자동으로 VIP 권한이 부여됩니다.');
      return { success: true, isVip: true };
    }
    
    // 데이터베이스에서 VIP 상태 확인
    const result = await executeQuery(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );
    
    if (!result.rows || result.rows.length === 0) {
      return { success: false, error: '사용자를 찾을 수 없습니다.' };
    }
    
    const user = result.rows[0];
    
    // VIP 상태 및 만료일 확인
    if (user.membershiptype === 'vip' && user.vipstatus === 'approved') {
      // 만료일 확인
      if (user.vipexpiredate) {
        const expiryDate = new Date(user.vipexpiredate);
        if (new Date() > expiryDate) {
          // VIP 만료됨
          await executeQuery(
            'UPDATE users SET membershiptype = $1, vipstatus = $2 WHERE username = $3',
            ['free', 'expired', username]
          );
          return { success: true, isVip: false };
        }
      }
      
      return { success: true, isVip: true };
    }
    
    return { success: true, isVip: false };
  } catch (error) {
    console.error('VIP 상태 확인 중 오류:', error);
    
    // 데이터베이스 오류 시 로컬 스토리지 폴백
    try {
      const users = JSON.parse(localStorage.getItem('smart_content_users') || '[]');
      const user = users.find(u => u.username === username);
      
      if (user && user.membershipType === 'vip' && user.vipStatus === 'approved') {
        if (user.membershipExpiry) {
          const expiryDate = new Date(user.membershipExpiry);
          if (new Date() > expiryDate) {
            return { success: true, isVip: false };
          }
        }
        return { success: true, isVip: true };
      }
      
      return { success: true, isVip: false };
    } catch (localError) {
      console.error('로컬 스토리지 VIP 확인 중 오류:', localError);
      return { success: false, error: error.message || '상태 확인 중 오류가 발생했습니다.' };
    }
  }
};

/**
 * VIP 상태 업데이트 함수
 * @param {string} username - 사용자 이름
 * @param {boolean} isVip - VIP 상태 여부
 * @param {string} vipStatus - VIP 상태 (approved, pending, rejected)
 * @param {Date} expiryDate - 만료일
 * @returns {Promise<{success: boolean, error?: string}>} - 업데이트 결과
 */
export const updateVipStatus = async (username, isVip, vipStatus = 'approved', expiryDate = null) => {
  try {
    const membershipType = isVip ? 'vip' : 'free';
    
    // 만료일이 없으면 기본값으로 1년 후 설정
    if (isVip && !expiryDate) {
      expiryDate = new Date();
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    }
    
    // 데이터베이스에 VIP 상태 업데이트
    await executeQuery(
      'UPDATE users SET membershiptype = $1, vipstatus = $2, vipexpiredate = $3 WHERE username = $4',
      [membershipType, vipStatus, expiryDate ? expiryDate.toISOString() : null, username]
    );
    
    // 로컬 스토리지도 함께 업데이트 (동기화)
    try {
      const users = JSON.parse(localStorage.getItem('smart_content_users') || '[]');
      const userIndex = users.findIndex(u => u.username === username);
      
      if (userIndex >= 0) {
        users[userIndex].membershipType = membershipType;
        users[userIndex].vipStatus = vipStatus;
        users[userIndex].membershipExpiry = expiryDate ? expiryDate.toISOString() : null;
        
        localStorage.setItem('smart_content_users', JSON.stringify(users));
      }
    } catch (localError) {
      console.error('로컬 스토리지 VIP 업데이트 중 오류:', localError);
    }
    
    return { success: true };
  } catch (error) {
    console.error('VIP 상태 업데이트 중 오류:', error);
    return { success: false, error: error.message || '상태 업데이트 중 오류가 발생했습니다.' };
  }
};
