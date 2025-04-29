import React, { useEffect, useState } from 'react';
import { initializeDatabase } from '../services/dbService';
import { executeQuery } from '../lib/db';

/**
 * 데이터베이스 초기화를 담당하는 컴포넌트
 * 앱이 시작될 때 한 번만 실행되며 필요한 테이블을 생성하고
 * 로컬 스토리지의 데이터를 데이터베이스로 마이그레이션합니다.
 */
const DatabaseInitializer = () => {
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initDb = async () => {
      try {
        console.log('데이터베이스 초기화 중...');
        
        // 데이터베이스 초기화 (테이블 생성)
        const result = await initializeDatabase();
        
        if (result.success) {
          console.log('데이터베이스 초기화 성공');
          
          // 로컬 스토리지에서 사용자 데이터 가져오기
          const localUsers = JSON.parse(localStorage.getItem('smart_content_users') || '[]');
          console.log(`로컬 스토리지에서 ${localUsers.length}명의 사용자 발견`);
          
          // 각 사용자를 데이터베이스에 마이그레이션
          for (const user of localUsers) {
            try {
              // 사용자가 이미 존재하는지 확인
              const checkResult = await executeQuery('SELECT * FROM users WHERE username = $1', [user.username]);
              
              if (checkResult.success && checkResult.data.length === 0) {
                // 새 사용자 생성
                const createResult = await executeQuery(
                  'INSERT INTO users (username, password, membership_type, vip_status, membership_expiry, created_at, updated_at, saved_links, previous_keywords) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
                  [
                    user.username,
                    user.password,
                    user.membershipType || 'basic',
                    user.vipStatus || 'none',
                    user.membershipExpiry || null,
                    user.createdAt || new Date().toISOString(),
                    user.updatedAt || new Date().toISOString(),
                    JSON.stringify(user.savedLinks || []),
                    JSON.stringify(user.previousKeywords || [])
                  ]
                );
                
                if (createResult.success) {
                  console.log(`사용자 ${user.username} 마이그레이션 성공`);
                } else {
                  console.error(`사용자 ${user.username} 마이그레이션 실패:`, createResult.error);
                }
              } else if (checkResult.success) {
                console.log(`사용자 ${user.username}는 이미 데이터베이스에 존재합니다`);
              }
            } catch (userError) {
              console.error(`사용자 ${user.username} 마이그레이션 중 오류:`, userError);
            }
          }
          
          // 데이터베이스에서 모든 사용자 가져와서 캐시에 저장 (관리자 페이지용)
          try {
            const allUsers = await executeQuery('SELECT * FROM users');
            if (allUsers.success) {
              // 관리자 페이지에서 사용할 수 있도록 로컬 스토리지에 임시 캐시
              localStorage.setItem('db_users_cache', JSON.stringify(allUsers.data));
              console.log(`데이터베이스에서 ${allUsers.data.length}명의 사용자 정보를 캐시했습니다`);
            }
          } catch (cacheError) {
            console.error('사용자 데이터 캐싱 중 오류:', cacheError);
          }
          
          setInitialized(true);
        } else {
          console.error('데이터베이스 초기화 실패:', result.error);
          setError(result.error);
        }
      } catch (err) {
        console.error('데이터베이스 초기화 중 오류 발생:', err);
        setError(err.message || '알 수 없는 오류');
      }
    };

    initDb();
  }, []);

  // 이 컴포넌트는 UI를 렌더링하지 않습니다
  return null;
};

export default DatabaseInitializer;
