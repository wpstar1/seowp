import React, { useEffect, useState } from 'react';
import { initializeDatabase } from '../lib/db';

/**
 * 데이터베이스 초기화를 담당하는 컴포넌트
 * 앱이 시작될 때 한 번만 실행되며 필요한 테이블을 생성하고
 * 로컬 스토리지의 데이터를 IndexedDB로 마이그레이션합니다.
 */
const DatabaseInitializer = () => {
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('데이터베이스 초기화 중...');
  const [showMessage, setShowMessage] = useState(true);

  useEffect(() => {
    const initDb = async () => {
      try {
        console.log('IndexedDB 데이터베이스 초기화 중...');
        setMessage('IndexedDB 데이터베이스 연결 및 초기화 중...');
        
        // 데이터베이스 초기화 (테이블 생성 및 로컬 스토리지 마이그레이션)
        const result = await initializeDatabase();
        
        if (result.success) {
          console.log('IndexedDB 데이터베이스 초기화 성공');
          setMessage('IndexedDB 데이터베이스 초기화 성공! 브라우저에 데이터가 안전하게 저장되었습니다.');
          
          // 사용자 데이터 캐시 확인
          const dbCache = JSON.parse(localStorage.getItem('db_users_cache') || '[]');
          console.log(`IndexedDB에서 ${dbCache.length}명의 사용자 정보를 캐시했습니다`);
          
          // 3초 후 메시지 숨김
          setTimeout(() => setShowMessage(false), 3000);
          setInitialized(true);
        } else {
          console.error('IndexedDB 데이터베이스 초기화 실패:', result.error);
          setError(result.error);
          setMessage(`IndexedDB 데이터베이스 초기화 실패: ${result.error}`);
          // 오류 발생 시 3초 후 메시지 숨김
          setTimeout(() => setShowMessage(false), 3000);
        }
      } catch (err) {
        console.error('IndexedDB 데이터베이스 초기화 중 오류 발생:', err);
        setError(err.message || '알 수 없는 오류');
        setMessage(`IndexedDB 데이터베이스 오류: ${err.message || '알 수 없는 오류'}`);
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
