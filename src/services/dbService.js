// 데이터베이스 서비스
import { connectDB, User, mongoose } from '../lib/mongodb';

// 데이터베이스 테이블 초기화
export async function initializeDatabase() {
  try {
    await connectDB();
    console.log('데이터베이스 초기화 완료');
    return { success: true };
  } catch (error) {
    console.error('데이터베이스 초기화 오류:', error);
    return { success: false, error: error.message };
  }
}

// 사용자 생성 함수
export const createUser = async (userData) => {
  try {
    await connectDB();
    
    // 이미 존재하는 사용자 확인
    const existingUser = await User.findOne({ username: userData.username });
    if (existingUser) {
      return { success: false, error: '이미 사용 중인 사용자명입니다.' };
    }
    
    // 새 사용자 생성
    const newUser = await User.create({
      ...userData,
      membershipType: 'regular',
      vipStatus: 'none',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    return { success: true, data: newUser };
  } catch (error) {
    console.error('사용자 생성 오류:', error);
    return { success: false, error: error.message };
  }
};

// 사용자 인증 함수
export const authenticateUser = async (username, password) => {
  try {
    await connectDB();
    
    const user = await User.findOne({ username });
    
    if (!user) {
      return { success: false, error: '사용자를 찾을 수 없습니다.' };
    }
    
    // 비밀번호 비교 (나중에 해싱 추가 필요)
    if (user.password !== password) {
      return { success: false, error: '비밀번호가 일치하지 않습니다.' };
    }
    
    return { success: true, data: user };
  } catch (error) {
    console.error('인증 오류:', error);
    return { success: false, error: error.message };
  }
};

// 사용자명으로 사용자 조회
export const getUserByUsername = async (username) => {
  try {
    await connectDB();
    
    const user = await User.findOne({ username });
    
    if (!user) {
      return { success: false, error: '사용자를 찾을 수 없습니다.' };
    }
    
    return { success: true, data: user };
  } catch (error) {
    console.error('사용자 조회 오류:', error);
    return { success: false, error: error.message };
  }
};

// VIP 상태 업데이트
export const updateVipStatus = async (username, status, expiryDate = null) => {
  try {
    await connectDB();
    
    const user = await User.findOne({ username });
    
    if (!user) {
      return { success: false, error: '사용자를 찾을 수 없습니다.' };
    }
    
    // 상태에 따른 처리
    if (status === 'approved') {
      // VIP 승인 시 30일 만료일 설정 (함수 매개변수로부터)
      const membershipExpiry = expiryDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      
      await User.findByIdAndUpdate(user._id, {
        membershipType: 'vip',
        vipStatus: 'approved',
        membershipExpiry,
        updatedAt: new Date()
      });
      
      return { success: true, expiryDate: membershipExpiry };
    } else if (status === 'rejected') {
      await User.findByIdAndUpdate(user._id, {
        membershipType: 'regular',
        vipStatus: status,
        membershipExpiry: null,
        updatedAt: new Date()
      });
      
      return { success: true };
    } else {
      // 대기 상태 등 기타 업데이트
      await User.findByIdAndUpdate(user._id, {
        vipStatus: status,
        updatedAt: new Date()
      });
      
      return { success: true };
    }
  } catch (error) {
    console.error('VIP 상태 업데이트 오류:', error);
    return { success: false, error: error.message };
  }
};

// 모든 사용자 조회
export const getAllUsers = async () => {
  try {
    await connectDB();
    
    const users = await User.find({});
    
    return { success: true, data: users };
  } catch (error) {
    console.error('사용자 목록 조회 오류:', error);
    return { success: false, error: error.message };
  }
};

// 사용자 일일 사용량 업데이트
export const updateDailyUsage = async (username) => {
  try {
    await connectDB();
    
    const user = await User.findOne({ username });
    
    if (!user) {
      return { success: false, error: '사용자를 찾을 수 없습니다.' };
    }
    
    await User.findByIdAndUpdate(user._id, {
      dailyUsageCount: (user.dailyUsageCount || 0) + 1,
      updatedAt: new Date()
    });
    
    return { success: true };
  } catch (error) {
    console.error('사용량 업데이트 오류:', error);
    return { success: false, error: error.message };
  }
};

// 사용자 키워드 기록 업데이트
export const updateUserKeywords = async (username, keyword) => {
  try {
    await connectDB();
    
    const user = await User.findOne({ username });
    
    if (!user) {
      return { success: false, error: '사용자를 찾을 수 없습니다.' };
    }
    
    // 최대 20개 키워드만 저장
    const keywords = user.previousKeywords || [];
    keywords.unshift(keyword);
    
    if (keywords.length > 20) {
      keywords.pop();
    }
    
    await User.findByIdAndUpdate(user._id, {
      previousKeywords: keywords,
      updatedAt: new Date()
    });
    
    return { success: true };
  } catch (error) {
    console.error('키워드 업데이트 오류:', error);
    return { success: false, error: error.message };
  }
};

// 사용자 데이터 저장
export const saveUserData = async (username, data) => {
  try {
    await connectDB();
    
    const user = await User.findOne({ username });
    
    if (!user) {
      return { success: false, error: '사용자를 찾을 수 없습니다.' };
    }
    
    // 데이터 업데이트
    const updateData = {
      ...data,
      updatedAt: new Date()
    };
    
    await User.findByIdAndUpdate(user._id, updateData);
    
    return { success: true };
  } catch (error) {
    console.error('사용자 데이터 저장 오류:', error);
    return { success: false, error: error.message };
  }
};

// VIP 상태 확인
export const checkVipStatus = async (username) => {
  try {
    await connectDB();
    
    const user = await User.findOne({ username });
    
    if (!user) {
      return { success: false, error: '사용자를 찾을 수 없습니다.' };
    }
    
    // 관리자는 항상 VIP
    if (username === '1111') {
      return { success: true, isVip: true };
    }
    
    // VIP 체크 로직
    const isVip = user.membershipType === 'vip' || user.vipStatus === 'approved';
    
    // 만료 체크
    if (isVip && user.membershipExpiry) {
      const now = new Date();
      if (new Date(user.membershipExpiry) < now) {
        // 만료된 경우
        await User.findByIdAndUpdate(user._id, {
          membershipType: 'regular',
          vipStatus: 'none',
          updatedAt: new Date()
        });
        
        return { success: true, isVip: false, expired: true };
      }
    }
    
    return { success: true, isVip };
  } catch (error) {
    console.error('VIP 상태 확인 오류:', error);
    return { success: false, error: error.message };
  }
};
