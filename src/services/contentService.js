/**
 * 컨텐츠 관련 서비스
 * 컨텐츠 생성, 저장, 검색 등 컨텐츠 관리 기능을 제공합니다.
 */

import { executeQuery } from '../lib/db';

/**
 * 생성된 컨텐츠를 데이터베이스에 저장
 * @param {string} username - 사용자 이름
 * @param {string} keyword - 사용한 키워드
 * @param {string} title - 컨텐츠 제목
 * @param {string} content - 생성된 컨텐츠
 * @returns {Promise<{success: boolean, error?: string}>} - 저장 결과
 */
export const saveGeneratedContent = async (username, keyword, title, content) => {
  try {
    // 데이터베이스에 저장
    await executeQuery(
      'INSERT INTO contents (username, title, content, keyword) VALUES ($1, $2, $3, $4)',
      [username, title, content, keyword]
    );
    
    // 키워드 히스토리에 추가
    await executeQuery(
      'INSERT INTO keyword_history (username, keyword) VALUES ($1, $2)',
      [username, keyword]
    );
    
    // 로컬 스토리지에도 사용 키워드 기록 (동기화)
    try {
      const users = JSON.parse(localStorage.getItem('smart_content_users') || '[]');
      const userIndex = users.findIndex(u => u.username === username);
      
      if (userIndex >= 0) {
        if (!users[userIndex].previousKeywords) {
          users[userIndex].previousKeywords = [];
        }
        
        // 중복 키워드 방지
        if (!users[userIndex].previousKeywords.includes(keyword)) {
          users[userIndex].previousKeywords.unshift(keyword);
          
          // 최대 20개까지만 유지
          users[userIndex].previousKeywords = users[userIndex].previousKeywords.slice(0, 20);
          
          localStorage.setItem('smart_content_users', JSON.stringify(users));
        }
      }
    } catch (localError) {
      console.error('로컬 스토리지 키워드 저장 중 오류:', localError);
    }
    
    return { success: true };
  } catch (error) {
    console.error('컨텐츠 저장 중 오류:', error);
    return { success: false, error: error.message || '컨텐츠 저장 중 오류가 발생했습니다.' };
  }
};

/**
 * 사용자의 이전 생성된 컨텐츠 목록 조회
 * @param {string} username - 사용자 이름
 * @returns {Promise<{success: boolean, data?: Array, error?: string}>} - 컨텐츠 목록
 */
export const getUserContents = async (username) => {
  try {
    const result = await executeQuery(
      'SELECT * FROM contents WHERE username = $1 ORDER BY created_at DESC',
      [username]
    );
    
    return { success: true, data: result.rows };
  } catch (error) {
    console.error('컨텐츠 조회 중 오류:', error);
    return { success: false, error: error.message || '컨텐츠 조회 중 오류가 발생했습니다.' };
  }
};

/**
 * 링크를 데이터베이스에 저장
 * @param {string} username - 사용자 이름
 * @param {Object} link - 저장할 링크 객체
 * @returns {Promise<{success: boolean, error?: string}>} - 저장 결과
 */
export const saveLinkToDatabase = async (username, link) => {
  try {
    // 데이터베이스에 링크 저장
    await executeQuery(
      'INSERT INTO saved_links (username, url, title, created_at) VALUES ($1, $2, $3, $4)',
      [username, link.url, link.title, new Date().toISOString()]
    );
    
    // 로컬 스토리지에도 링크 저장 (동기화)
    try {
      const users = JSON.parse(localStorage.getItem('smart_content_users') || '[]');
      const userIndex = users.findIndex(u => u.username === username);
      
      if (userIndex >= 0) {
        if (!users[userIndex].savedLinks) {
          users[userIndex].savedLinks = [];
        }
        
        users[userIndex].savedLinks.push(link);
        localStorage.setItem('smart_content_users', JSON.stringify(users));
      }
    } catch (localError) {
      console.error('로컬 스토리지 링크 저장 중 오류:', localError);
    }
    
    return { success: true };
  } catch (error) {
    console.error('링크 저장 중 오류:', error);
    return { success: false, error: error.message || '링크 저장 중 오류가 발생했습니다.' };
  }
};

/**
 * 사용자의 저장된 링크 목록 조회
 * @param {string} username - 사용자 이름
 * @returns {Promise<{success: boolean, data?: Array, error?: string}>} - 링크 목록
 */
export const getUserLinks = async (username) => {
  try {
    const result = await executeQuery(
      'SELECT * FROM saved_links WHERE username = $1 ORDER BY created_at DESC',
      [username]
    );
    
    return { success: true, data: result.rows };
  } catch (error) {
    console.error('링크 조회 중 오류:', error);
    
    // 데이터베이스 오류 시 로컬 스토리지 폴백
    try {
      const users = JSON.parse(localStorage.getItem('smart_content_users') || '[]');
      const user = users.find(u => u.username === username);
      
      if (user && user.savedLinks) {
        return { success: true, data: user.savedLinks };
      }
      
      return { success: true, data: [] };
    } catch (localError) {
      console.error('로컬 스토리지 링크 조회 중 오류:', localError);
      return { success: false, error: error.message || '링크 조회 중 오류가 발생했습니다.' };
    }
  }
};

/**
 * 사용자의 키워드 사용 기록 조회
 * @param {string} username - 사용자 이름
 * @returns {Promise<{success: boolean, data?: Array, error?: string}>} - 키워드 목록
 */
export const getUserKeywords = async (username) => {
  try {
    const result = await executeQuery(
      'SELECT keyword, COUNT(*) as count FROM keyword_history WHERE username = $1 GROUP BY keyword ORDER BY count DESC LIMIT 20',
      [username]
    );
    
    return { success: true, data: result.rows };
  } catch (error) {
    console.error('키워드 조회 중 오류:', error);
    
    // 데이터베이스 오류 시 로컬 스토리지 폴백
    try {
      const users = JSON.parse(localStorage.getItem('smart_content_users') || '[]');
      const user = users.find(u => u.username === username);
      
      if (user && user.previousKeywords) {
        return { success: true, data: user.previousKeywords.map(keyword => ({ keyword, count: 1 })) };
      }
      
      return { success: true, data: [] };
    } catch (localError) {
      console.error('로컬 스토리지 키워드 조회 중 오류:', localError);
      return { success: false, error: error.message || '키워드 조회 중 오류가 발생했습니다.' };
    }
  }
};
