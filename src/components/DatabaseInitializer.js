import React, { useState, useEffect } from 'react';
import { initializeDatabase, migrateLocalStorageData } from '../services/dbService';

// 데이터베이스 초기화 및 데이터 마이그레이션을 처리하는 컴포넌트
function DatabaseInitializer() {
  const [initialized, setInitialized] = useState(false);
  const [migrated, setMigrated] = useState(false);
  const [status, setStatus] = useState('데이터베이스 초기화 중...');
  const [error, setError] = useState(null);

  useEffect(() => {
    async function initDB() {
      try {
        // 데이터베이스 테이블 초기화
        setStatus('데이터베이스 테이블 초기화 중...');
        const initResult = await initializeDatabase();
        
        if (!initResult.success) {
          throw new Error(initResult.error || '데이터베이스 초기화 실패');
        }
        
        setInitialized(true);
        setStatus('데이터베이스 초기화 완료');

        // 로컬 스토리지 데이터 마이그레이션
        setStatus('로컬 데이터 마이그레이션 중...');
        const migrateResult = await migrateLocalStorageData();
        
        if (!migrateResult.success) {
          console.warn('데이터 마이그레이션 경고:', migrateResult.error);
          setStatus('일부 데이터 마이그레이션 실패, 기능은 정상 작동합니다.');
        } else {
          setStatus('데이터 마이그레이션 완료');
        }
        
        setMigrated(true);
        
        // 2초 후 상태 메시지 사라지게 함
        setTimeout(() => {
          setStatus(null);
        }, 2000);
      } catch (err) {
        console.error('데이터베이스 초기화 오류:', err);
        setError(err.message || '데이터베이스 연결 오류');
        setStatus('오류 발생');
      }
    }

    initDB();
  }, []);

  if (!status && !error) {
    return null;
  }

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
      {error ? `오류: ${error}` : status}
    </div>
  );
}

export default DatabaseInitializer;
