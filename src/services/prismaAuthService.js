import prisma from '../lib/prisma';
import { getUserByUsername, createUser, updateUser } from './prismaService';

// 로그인 처리 함수
export const login = async (username, password) => {
  try {
    // 사용자 정보 조회
    const user = await getUserByUsername(username);
    
    // 사용자가 존재하지 않거나 비밀번호가 일치하지 않으면 실패
    if (!user || user.password !== password) {
      return { success: false, message: '아이디 또는 비밀번호가 올바르지 않습니다.' };
    }
    
    // VIP 멤버십 기간 확인
    if (user.membershipType === 'vip' && user.membershipExpiry) {
      const now = new Date();
      const expiryDate = new Date(user.membershipExpiry);
      
      // 만료되었으면 멤버십 타입 변경
      if (now > expiryDate) {
        await updateUser(username, {
          membershipType: 'regular',
          vipStatus: null
        });
        user.membershipType = 'regular';
        user.vipStatus = null;
      }
    }
    
    // 관리자 계정 특별 처리 (1111)
    if (username === '1111') {
      await updateUser(username, {
        membershipType: 'vip',
        vipStatus: 'approved'
      });
      user.membershipType = 'vip';
      user.vipStatus = 'approved';
    }
    
    return {
      success: true,
      user: {
        username: user.username,
        membershipType: user.membershipType,
        vipStatus: user.vipStatus,
        depositName: user.depositName,
        membershipExpiry: user.membershipExpiry
      }
    };
  } catch (error) {
    console.error('로그인 실패:', error);
    return { success: false, message: '로그인 중 오류가 발생했습니다.' };
  }
};

// 회원가입 처리 함수
export const register = async (username, password, confirmPassword) => {
  try {
    // 비밀번호 확인
    if (password !== confirmPassword) {
      return { success: false, message: '비밀번호가 일치하지 않습니다.' };
    }
    
    // 사용자명 길이 검증
    if (!username || username.length < 3) {
      return { success: false, message: '사용자명은 3자 이상이어야 합니다.' };
    }
    
    // 비밀번호 길이 검증
    if (!password || password.length < 4) {
      return { success: false, message: '비밀번호는 4자 이상이어야 합니다.' };
    }
    
    // 이미 존재하는 사용자인지 확인
    const existingUser = await getUserByUsername(username);
    if (existingUser) {
      return { success: false, message: '이미 존재하는 사용자명입니다.' };
    }
    
    // 새 사용자 생성
    const newUser = await createUser({
      username,
      password,
      membershipType: 'regular'
    });
    
    if (!newUser) {
      return { success: false, message: '회원가입 중 오류가 발생했습니다.' };
    }
    
    return {
      success: true,
      message: '회원가입이 완료되었습니다.',
      user: {
        username: newUser.username,
        membershipType: newUser.membershipType
      }
    };
  } catch (error) {
    console.error('회원가입 실패:', error);
    return { success: false, message: '회원가입 중 오류가 발생했습니다.' };
  }
};

// VIP 신청 처리 함수
export const requestVip = async (username, depositName) => {
  try {
    // 사용자 존재 확인
    const user = await getUserByUsername(username);
    if (!user) {
      return { success: false, message: '사용자를 찾을 수 없습니다.' };
    }
    
    // 이미 VIP이거나 대기 중인 경우
    if (user.membershipType === 'vip') {
      return { success: false, message: '이미 VIP 회원입니다.' };
    }
    
    if (user.vipStatus === 'pending') {
      return { success: false, message: '이미 VIP 승인 대기 중입니다.' };
    }
    
    // VIP 신청 상태로 업데이트
    await updateUser(username, {
      vipStatus: 'pending',
      depositName
    });
    
    // VIP 요청 로그 생성
    await prisma.vipRequestLog.create({
      data: {
        username,
        status: 'pending',
        depositName,
        requestDate: new Date()
      }
    });
    
    return { success: true, message: 'VIP 신청이 완료되었습니다. 관리자 승인 후 사용 가능합니다.' };
  } catch (error) {
    console.error('VIP 신청 실패:', error);
    return { success: false, message: 'VIP 신청 중 오류가 발생했습니다.' };
  }
};

// VIP 상태 확인 함수
export const checkVipStatus = async (username) => {
  try {
    const user = await getUserByUsername(username);
    if (!user) {
      return { isVip: false, message: '사용자를 찾을 수 없습니다.' };
    }
    
    // 관리자 계정은 항상 VIP
    if (username === '1111') {
      return { isVip: true, message: '관리자 계정입니다.' };
    }
    
    // VIP 멤버십 상태 확인
    if (user.membershipType === 'vip' && user.vipStatus === 'approved') {
      // 만료일 확인
      if (user.membershipExpiry) {
        const now = new Date();
        const expiryDate = new Date(user.membershipExpiry);
        
        if (now > expiryDate) {
          // 만료된 경우 업데이트
          await updateUser(username, {
            membershipType: 'regular',
            vipStatus: null
          });
          return { isVip: false, message: 'VIP 멤버십이 만료되었습니다.' };
        }
        
        // 만료되지 않음
        const daysLeft = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
        return { 
          isVip: true, 
          message: `VIP 멤버십 사용 중 (${daysLeft}일 남음)`,
          expiryDate: user.membershipExpiry
        };
      }
      
      return { isVip: true, message: 'VIP 멤버십 사용 중' };
    }
    
    // VIP 신청 대기 중
    if (user.vipStatus === 'pending') {
      return { isVip: false, isPending: true, message: 'VIP 승인 대기 중입니다.' };
    }
    
    // 일반 회원
    return { isVip: false, message: '일반 회원입니다.' };
  } catch (error) {
    console.error('VIP 상태 확인 실패:', error);
    return { isVip: false, message: 'VIP 상태 확인 중 오류가 발생했습니다.' };
  }
};

// VIP 승인/거절 처리 함수 (관리자용)
export const approveVipRequest = async (username, status, approvedBy) => {
  try {
    // 사용자 존재 확인
    const user = await getUserByUsername(username);
    if (!user) {
      return { success: false, message: '사용자를 찾을 수 없습니다.' };
    }
    
    // 승인 상태에 따라 처리
    if (status === 'approved') {
      // 승인 처리
      await updateUser(username, {
        membershipType: 'vip',
        vipStatus: 'approved',
        membershipExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30일 후
      });
      
      // VIP 요청 로그 업데이트
      await prisma.vipRequestLog.updateMany({
        where: { 
          username,
          status: 'pending'
        },
        data: {
          status: 'approved',
          approvedBy,
          responseDate: new Date()
        }
      });
      
      return { success: true, message: `${username} 사용자의 VIP 신청이 승인되었습니다.` };
    } else if (status === 'rejected') {
      // 거절 처리
      await updateUser(username, {
        vipStatus: 'rejected'
      });
      
      // VIP 요청 로그 업데이트
      await prisma.vipRequestLog.updateMany({
        where: { 
          username,
          status: 'pending'
        },
        data: {
          status: 'rejected',
          approvedBy,
          responseDate: new Date()
        }
      });
      
      return { success: true, message: `${username} 사용자의 VIP 신청이 거절되었습니다.` };
    }
    
    return { success: false, message: '잘못된 처리 상태입니다.' };
  } catch (error) {
    console.error('VIP 승인/거절 처리 실패:', error);
    return { success: false, message: 'VIP 처리 중 오류가 발생했습니다.' };
  }
};
