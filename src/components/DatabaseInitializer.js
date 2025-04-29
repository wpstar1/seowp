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
  const [message, setMessage] = useState('데이터베이스 초기화 중...');
  const [showMessage, setShowMessage] = useState(true);

  useEffect(() => {
    const initDb = async () => {
      try {
        console.log('데이터베이스 초기화 중...');
        setMessage('데이터베이스 연결 및 초기화 중...');
        
        // 데이터베이스 연결 테스트
        try {
          const testResult = await executeQuery('SELECT NOW() as time');
          if (testResult.success) {
            console.log('데이터베이스 연결 성공:', testResult.data);
            setMessage('데이터베이스 연결 성공! 초기화 진행 중...');
          } else {
            console.error('데이터베이스 연결 테스트 실패:', testResult.error);
            setMessage('데이터베이스 연결 실패! 로컬 모드로 전환합니다...');
            // 오류 발생 시 3초 후 메시지 숨김
            setTimeout(() => setShowMessage(false), 3000);
            return;
          }
        } catch (connError) {
          console.error('데이터베이스 연결 오류:', connError);
          setMessage('데이터베이스 연결 오류! 로컬 모드로 전환합니다...');
          // 오류 발생 시 3초 후 메시지 숨김
          setTimeout(() => setShowMessage(false), 3000);
          return;
        }
        
        // 데이터베이스 초기화 (테이블 생성)
        const result = await initializeDatabase();
        
        if (result.success) {
          console.log('데이터베이스 초기화 성공');
          setMessage('데이터베이스 초기화 성공! 데이터 마이그레이션 중...');
          
          // 로컬 스토리지에서 사용자 데이터 가져오기
          const localUsers = JSON.parse(localStorage.getItem('smart_content_users') || '[]');
          console.log(`로컬 스토리지에서 ${localUsers.length}명의 사용자 발견`);
          
          // 각 사용자를 데이터베이스에 마이그레이션
          for (const user of localUsers) {
            try {
              // 사용자명 확인
              if (!user.username) {
                console.error('유효하지 않은 사용자 데이터:', user);
                continue;
              }
              
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
              setMessage(`데이터베이스 초기화 완료! ${allUsers.data.length}명의 사용자 정보 로드됨`);
              
              // 3초 후 메시지 숨김
              setTimeout(() => setShowMessage(false), 3000);
            }
          } catch (cacheError) {
            console.error('사용자 데이터 캐싱 중 오류:', cacheError);
            setMessage('데이터베이스는 초기화되었지만 사용자 데이터 로드에 문제가 발생했습니다');
            // 오류 발생 시 3초 후 메시지 숨김
            setTimeout(() => setShowMessage(false), 3000);
          }
          
          setInitialized(true);
        } else {
          console.error('데이터베이스 초기화 실패:', result.error);
          setError(result.error);
          setMessage(`데이터베이스 초기화 실패: ${result.error}`);
          // 오류 발생 시 3초 후 메시지 숨김
          setTimeout(() => setShowMessage(false), 3000);
        }
      } catch (err) {
        console.error('데이터베이스 초기화 중 오류 발생:', err);
        setError(err.message || '알 수 없는 오류');
        setMessage(`데이터베이스 오류: ${err.message || '알 수 없는 오류'}`);
        // 오류 발생 시 3초 후 메시지 숨김
        setTimeout(() => setShowMessage(false), 3000);
      }
    };

    initDb();
  }, []);

  // 메시지 UI 컴포넌트 렌더링
  if (showMessage) {
    return (
      <div style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        backgroundColor: error ? '#f8d7da' : '#d4edda',
        color: error ? '#721c24' : '#155724',
        padding: '10px 15px',
        borderRadius: '4px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        zIndex: 9999,
        maxWidth: '300px'
      }}>
        {message}
      </div>
    );
  }
  
  // 메시지가 표시되지 않을 때는 null 반환
  return null;
};

export default DatabaseInitializer;
