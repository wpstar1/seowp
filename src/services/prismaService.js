import prisma from '../lib/prisma';

// 사용자 관련 함수
export const getUsers = async () => {
  try {
    const users = await prisma.user.findMany();
    return users;
  } catch (error) {
    console.error('사용자 목록 조회 실패:', error);
    return null;
  }
};

export const getUserByUsername = async (username) => {
  try {
    const user = await prisma.user.findUnique({
      where: { username }
    });
    return user;
  } catch (error) {
    console.error('사용자 조회 실패:', error);
    return null;
  }
};

export const createUser = async (userData) => {
  try {
    const user = await prisma.user.create({
      data: userData
    });
    return user;
  } catch (error) {
    console.error('사용자 생성 실패:', error);
    return null;
  }
};

export const updateUser = async (username, userData) => {
  try {
    const user = await prisma.user.update({
      where: { username },
      data: userData
    });
    return user;
  } catch (error) {
    console.error('사용자 업데이트 실패:', error);
    return null;
  }
};

// VIP 관련 함수
export const updateVipStatus = async (username, status, depositName = null) => {
  try {
    const user = await prisma.user.update({
      where: { username },
      data: { 
        vipStatus: status,
        depositName: depositName,
        ...(status === 'approved' && { 
          membershipType: 'vip',
          // 30일 후 만료
          membershipExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        })
      }
    });
    
    // VIP 요청 로그 생성
    await prisma.vipRequestLog.create({
      data: {
        username,
        status,
        depositName,
        ...(status !== 'pending' && { responseDate: new Date() })
      }
    });
    
    return user;
  } catch (error) {
    console.error('VIP 상태 업데이트 실패:', error);
    return null;
  }
};

export const getVipRequests = async () => {
  try {
    const requests = await prisma.user.findMany({
      where: { vipStatus: 'pending' }
    });
    return requests;
  } catch (error) {
    console.error('VIP 요청 목록 조회 실패:', error);
    return null;
  }
};

// 링크 관련 함수
export const saveLink = async (userId, url, keyword) => {
  try {
    const link = await prisma.link.create({
      data: {
        url,
        keyword,
        userId
      }
    });
    return link;
  } catch (error) {
    console.error('링크 저장 실패:', error);
    return null;
  }
};

export const getLinksByUserId = async (userId) => {
  try {
    const links = await prisma.link.findMany({
      where: { userId }
    });
    return links;
  } catch (error) {
    console.error('링크 목록 조회 실패:', error);
    return null;
  }
};

// 키워드 관련 함수
export const savePreviousKeyword = async (userId, keyword) => {
  try {
    const prevKeyword = await prisma.previousKeyword.create({
      data: {
        keyword,
        userId
      }
    });
    return prevKeyword;
  } catch (error) {
    console.error('이전 키워드 저장 실패:', error);
    return null;
  }
};

export const getPreviousKeywordsByUserId = async (userId) => {
  try {
    const keywords = await prisma.previousKeyword.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10 // 최근 10개만
    });
    return keywords;
  } catch (error) {
    console.error('이전 키워드 목록 조회 실패:', error);
    return null;
  }
};

// 생성된 콘텐츠 관련 함수
export const saveGeneratedContent = async (userId, title, content, keyword, contentType = 'blog') => {
  try {
    const savedContent = await prisma.generatedContent.create({
      data: {
        title,
        content,
        keyword,
        contentType,
        userId
      }
    });
    return savedContent;
  } catch (error) {
    console.error('컨텐츠 저장 실패:', error);
    return null;
  }
};

export const getGeneratedContentsByUserId = async (userId) => {
  try {
    const contents = await prisma.generatedContent.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
    return contents;
  } catch (error) {
    console.error('생성된 컨텐츠 목록 조회 실패:', error);
    return null;
  }
};

// 로컬 스토리지에서 데이터베이스로 마이그레이션하는 함수
export const migrateLocalStorageToDatabase = async () => {
  try {
    // 로컬 스토리지에서 사용자 정보 가져오기
    const users = JSON.parse(localStorage.getItem('smart_content_users') || '[]');
    
    for (const user of users) {
      // 이미 존재하는 사용자인지 확인
      const existingUser = await getUserByUsername(user.username);
      
      if (!existingUser) {
        // 사용자 생성
        await createUser({
          username: user.username,
          password: user.password,
          membershipType: user.membershipType || 'regular',
          vipStatus: user.vipStatus,
          depositName: user.depositName,
          membershipExpiry: user.membershipExpiry ? new Date(user.membershipExpiry) : null
        });
      }
    }
    
    return { success: true, message: '마이그레이션 완료' };
  } catch (error) {
    console.error('마이그레이션 실패:', error);
    return { success: false, error: error.message };
  }
};
