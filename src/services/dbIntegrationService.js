import * as prismaService from './prismaService';
import * as prismaAuthService from './prismaAuthService';

/**
 * 데이터베이스 통합 서비스
 * 로컬 스토리지와 Prisma 데이터베이스 간의 통합 레이어
 */

// 애플리케이션 시작 시 호출되어 데이터베이스 연결 상태를 확인
export const initDatabase = async () => {
  try {
    // Prisma 연결 테스트
    return await testDatabaseConnection();
  } catch (error) {
    console.error('데이터베이스 초기화 오류:', error);
    return { connected: false, error: error.message };
  }
};

// 데이터베이스 연결 테스트
export const testDatabaseConnection = async () => {
  try {
    // 간단한 쿼리 실행
    const users = await prismaService.getUsers();
    return { connected: true, users };
  } catch (error) {
    console.error('데이터베이스 연결 오류:', error);
    return { connected: false, error: error.message };
  }
};

// 사용자 로그인 처리 - Prisma 우선, 실패 시 로컬 스토리지 폴백
export const loginUser = async (username, password) => {
  try {
    // Prisma DB에서 로그인 시도
    const result = await prismaAuthService.login(username, password);
    
    if (result.success) {
      console.log('DB 로그인 성공:', username);
      return { success: true, user: result.user };
    }
    
    throw new Error(result.message || '로그인 실패');
  } catch (error) {
    console.error('DB 로그인 오류:', error);
    
    // 로컬 스토리지 로그인 폴백
    const users = JSON.parse(localStorage.getItem('smart_content_users') || '[]');
    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
      return { success: true, user };
    }
    
    return { success: false, error: '아이디 또는 비밀번호가 올바르지 않습니다.' };
  }
};

// 사용자 등록 처리 - Prisma 우선, 실패 시 로컬 스토리지 폴백
export const registerUser = async (username, password, confirmPassword) => {
  try {
    // Prisma DB에 사용자 등록
    const result = await prismaAuthService.register(username, password, confirmPassword);
    
    if (result.success) {
      console.log('DB 회원가입 성공:', username);
      return { success: true, message: result.message };
    }
    
    throw new Error(result.message || '회원가입 실패');
  } catch (error) {
    console.error('DB 회원가입 오류:', error);
    
    // 로컬 스토리지 회원가입 폴백
    // 이미 존재하는 사용자 확인
    const users = JSON.parse(localStorage.getItem('smart_content_users') || '[]');
    const existingUser = users.find(u => u.username === username);
    
    if (existingUser) {
      return { success: false, error: '이미 사용 중인 사용자명입니다.' };
    }
    
    if (password !== confirmPassword) {
      return { success: false, error: '비밀번호가 일치하지 않습니다.' };
    }
    
    // 새 사용자 추가
    const newUser = {
      username,
      password,
      membershipType: 'regular',
      createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    localStorage.setItem('smart_content_users', JSON.stringify(users));
    
    return { success: true, message: '회원가입이 완료되었습니다.' };
  }
};

// VIP 상태 확인 - Prisma 우선, 실패 시 로컬 스토리지 폴백
export const checkVipStatus = async (username) => {
  try {
    // 관리자는 항상 VIP
    if (username === '1111') {
      return { isVip: true, message: '관리자 계정입니다.' };
    }
    
    // Prisma DB에서 VIP 상태 확인
    const result = await prismaAuthService.checkVipStatus(username);
    
    if (result.isVip !== undefined) {
      return result;
    }
    
    throw new Error(result.message || 'VIP 상태 확인 실패');
  } catch (error) {
    console.error('DB VIP 상태 확인 오류:', error);
    
    // 로컬 스토리지 VIP 상태 확인 폴백
    const users = JSON.parse(localStorage.getItem('smart_content_users') || '[]');
    const user = users.find(u => u.username === username);
    
    if (!user) {
      return { isVip: false, message: '사용자를 찾을 수 없습니다.' };
    }
    
    // VIP 상태 및 만료일 확인
    if (user.membershipType === 'vip' && user.vipStatus === 'approved') {
      if (user.membershipExpiry) {
        const now = new Date();
        const expiryDate = new Date(user.membershipExpiry);
        
        if (now > expiryDate) {
          // 만료된 경우 업데이트
          user.membershipType = 'regular';
          user.vipStatus = null;
          localStorage.setItem('smart_content_users', JSON.stringify(users));
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
  }
};

// VIP 신청 처리 - Prisma 우선, 실패 시 로컬 스토리지 폴백
export const requestVip = async (username, depositName) => {
  try {
    // Prisma DB에 VIP 신청
    const result = await prismaAuthService.requestVip(username, depositName);
    
    if (result.success) {
      return result;
    }
    
    throw new Error(result.message || 'VIP 신청 실패');
  } catch (error) {
    console.error('DB VIP 신청 오류:', error);
    
    // 로컬 스토리지 VIP 신청 폴백
    const users = JSON.parse(localStorage.getItem('smart_content_users') || '[]');
    const userIndex = users.findIndex(u => u.username === username);
    
    if (userIndex === -1) {
      return { success: false, error: '사용자를 찾을 수 없습니다.' };
    }
    
    // 이미 VIP이거나 신청 중인 경우
    if (users[userIndex].membershipType === 'vip') {
      return { success: false, error: '이미 VIP 회원입니다.' };
    }
    
    if (users[userIndex].vipStatus === 'pending') {
      return { success: false, error: '이미 VIP 승인 대기 중입니다.' };
    }
    
    // VIP 신청 상태로 업데이트
    users[userIndex].vipStatus = 'pending';
    users[userIndex].depositName = depositName;
    
    localStorage.setItem('smart_content_users', JSON.stringify(users));
    
    return { success: true, message: 'VIP 신청이 완료되었습니다. 관리자 승인 후 사용 가능합니다.' };
  }
};

// VIP 승인/거부 처리 - Prisma 우선, 실패 시 로컬 스토리지 폴백
export const approveVipRequest = async (username, status, approvedBy) => {
  try {
    // Prisma DB에 VIP 승인/거부
    const result = await prismaAuthService.approveVipRequest(username, status, approvedBy);
    
    if (result.success) {
      return result;
    }
    
    throw new Error(result.message || 'VIP 승인 처리 실패');
  } catch (error) {
    console.error('DB VIP 승인 오류:', error);
    
    // 로컬 스토리지 VIP 승인 폴백
    const users = JSON.parse(localStorage.getItem('smart_content_users') || '[]');
    const userIndex = users.findIndex(u => u.username === username);
    
    if (userIndex === -1) {
      return { success: false, error: '사용자를 찾을 수 없습니다.' };
    }
    
    // 승인/거부 처리
    if (status === 'approved') {
      // 승인일 경우 VIP로 설정하고 30일 만료일 추가
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30);
      
      users[userIndex].membershipType = 'vip';
      users[userIndex].vipStatus = 'approved';
      users[userIndex].membershipExpiry = expiryDate.toISOString();
    } else {
      // 거부일 경우
      users[userIndex].vipStatus = 'rejected';
    }
    
    localStorage.setItem('smart_content_users', JSON.stringify(users));
    
    return { 
      success: true, 
      message: `${username} 사용자의 VIP 신청이 ${status === 'approved' ? '승인' : '거절'}되었습니다.` 
    };
  }
};

// VIP 신청 목록 조회 - Prisma 우선, 실패 시 로컬 스토리지 폴백
export const getVipRequests = async () => {
  try {
    // Prisma DB에서 VIP 신청 목록 조회
    const requests = await prismaService.getVipRequests();
    
    if (requests) {
      return { success: true, requests };
    }
    
    throw new Error('VIP 신청 목록 조회 실패');
  } catch (error) {
    console.error('DB VIP 신청 목록 조회 오류:', error);
    
    // 로컬 스토리지 VIP 신청 목록 조회 폴백
    const users = JSON.parse(localStorage.getItem('smart_content_users') || '[]');
    const pendingUsers = users.filter(u => u.vipStatus === 'pending');
    
    return { success: true, requests: pendingUsers };
  }
};

// 사용자 데이터 저장 (키워드, 콘텐츠 등)
export const saveUserData = async (username, data) => {
  try {
    const { previousKeyword, generatedContent } = data;
    
    // Prisma DB에 데이터 저장
    try {
      // 사용자 ID 조회
      const user = await prismaService.getUserByUsername(username);
      
      if (user) {
        // 키워드 저장
        if (previousKeyword) {
          await prismaService.savePreviousKeyword(user.id, previousKeyword);
        }
        
        // 콘텐츠 저장
        if (generatedContent) {
          const { title, content, keyword } = generatedContent;
          await prismaService.saveGeneratedContent(user.id, title, content, keyword);
        }
        
        return { success: true };
      }
    } catch (dbError) {
      console.error('DB 데이터 저장 오류:', dbError);
      throw dbError;
    }
  } catch (error) {
    console.error('데이터 저장 오류:', error);
    
    // 로컬 스토리지 데이터 저장 폴백
    if (data.previousKeyword) {
      const prevKeywords = JSON.parse(localStorage.getItem(`${username}_keywords`) || '[]');
      if (!prevKeywords.includes(data.previousKeyword)) {
        prevKeywords.unshift(data.previousKeyword);
        localStorage.setItem(`${username}_keywords`, JSON.stringify(prevKeywords.slice(0, 10)));
      }
    }
    
    if (data.generatedContent) {
      const contents = JSON.parse(localStorage.getItem(`${username}_contents`) || '[]');
      contents.unshift({
        id: Date.now(),
        ...data.generatedContent,
        date: new Date().toISOString()
      });
      localStorage.setItem(`${username}_contents`, JSON.stringify(contents));
    }
    
    return { success: true, usingLocalStorage: true };
  }
};
