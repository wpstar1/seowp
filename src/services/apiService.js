import axios from 'axios';

// API 기본 URL 설정
// 로컬 개발 시에는 http://localhost:3000/api가 되고
// Vercel 배포 시에는 실제 도메인/api가 됩니다
const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

// axios 인스턴스 생성
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 로그인 API
export const loginUser = async (username, password) => {
  try {
    const response = await api.post('/auth', {
      action: 'login',
      username,
      password
    });
    
    return response.data;
  } catch (error) {
    console.error('로그인 API 오류:', error);
    
    // 오류 응답이 있는 경우
    if (error.response && error.response.data) {
      return error.response.data;
    }
    
    // 네트워크 오류 등
    return { 
      success: false, 
      message: '서버 연결 오류가 발생했습니다. 로컬 스토리지로 폴백합니다.' 
    };
  }
};

// 회원가입 API
export const registerUser = async (username, password, confirmPassword) => {
  try {
    const response = await api.post('/auth', {
      action: 'register',
      username,
      password,
      confirmPassword
    });
    
    return response.data;
  } catch (error) {
    console.error('회원가입 API 오류:', error);
    
    // 오류 응답이 있는 경우
    if (error.response && error.response.data) {
      return error.response.data;
    }
    
    // 네트워크 오류 등
    return { 
      success: false, 
      message: '서버 연결 오류가 발생했습니다. 로컬 스토리지로 폴백합니다.' 
    };
  }
};

// VIP 상태 확인 API
export const checkVipStatus = async (username) => {
  try {
    const response = await api.get(`/vip?username=${username}`);
    return response.data;
  } catch (error) {
    console.error('VIP 상태 확인 API 오류:', error);
    
    // 오류 응답이 있는 경우
    if (error.response && error.response.data) {
      return error.response.data;
    }
    
    // 네트워크 오류 등
    return { 
      success: false, 
      isVip: false,
      message: '서버 연결 오류가 발생했습니다. 로컬 스토리지로 폴백합니다.' 
    };
  }
};

// VIP 신청 API
export const requestVip = async (username, depositName) => {
  try {
    const response = await api.post('/auth', {
      action: 'request-vip',
      username,
      depositName
    });
    
    return response.data;
  } catch (error) {
    console.error('VIP 신청 API 오류:', error);
    
    // 오류 응답이 있는 경우
    if (error.response && error.response.data) {
      return error.response.data;
    }
    
    // 네트워크 오류 등
    return { 
      success: false, 
      message: '서버 연결 오류가 발생했습니다. 로컬 스토리지로 폴백합니다.' 
    };
  }
};

// VIP 승인 API
export const approveVipRequest = async (username, status, approvedBy) => {
  try {
    const response = await api.post('/vip', {
      username,
      status,
      approvedBy
    });
    
    return response.data;
  } catch (error) {
    console.error('VIP 승인 API 오류:', error);
    
    // 오류 응답이 있는 경우
    if (error.response && error.response.data) {
      return error.response.data;
    }
    
    // 네트워크 오류 등
    return { 
      success: false, 
      message: '서버 연결 오류가 발생했습니다. 로컬 스토리지로 폴백합니다.' 
    };
  }
};

// VIP 신청 목록 조회 API
export const getVipRequests = async (adminUsername) => {
  try {
    const response = await api.get(`/admin?adminUsername=${adminUsername}`);
    return response.data;
  } catch (error) {
    console.error('VIP 신청 목록 조회 API 오류:', error);
    
    // 오류 응답이 있는 경우
    if (error.response && error.response.data) {
      return error.response.data;
    }
    
    // 네트워크 오류 등
    return { 
      success: false, 
      requests: [],
      message: '서버 연결 오류가 발생했습니다. 로컬 스토리지로 폴백합니다.' 
    };
  }
};

// 콘텐츠 저장 API
export const saveContent = async (username, data) => {
  try {
    const { title, content, keyword, previousKeyword } = data;
    
    const response = await api.post('/content', {
      username,
      title,
      content,
      keyword,
      previousKeyword
    });
    
    return response.data;
  } catch (error) {
    console.error('콘텐츠 저장 API 오류:', error);
    
    // 오류 응답이 있는 경우
    if (error.response && error.response.data) {
      return error.response.data;
    }
    
    // 네트워크 오류 등
    return { 
      success: false, 
      message: '서버 연결 오류가 발생했습니다. 로컬 스토리지로 폴백합니다.' 
    };
  }
};

// 사용자 데이터 조회 API
export const getUserData = async (username, type) => {
  try {
    const response = await api.get(`/content?username=${username}&type=${type}`);
    return response.data;
  } catch (error) {
    console.error(`${type} 조회 API 오류:`, error);
    
    // 오류 응답이 있는 경우
    if (error.response && error.response.data) {
      return error.response.data;
    }
    
    // 네트워크 오류 등
    return { 
      success: false, 
      message: '서버 연결 오류가 발생했습니다. 로컬 스토리지로 폴백합니다.' 
    };
  }
};
