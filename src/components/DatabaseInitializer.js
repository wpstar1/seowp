import React, { useEffect, useState } from 'react';
import { initializeDatabase } from '../services/dbService';
import prisma from '../lib/prisma';
import { migrateLocalStorageToDatabase } from '../services/prismaService';

/**
 * 데이터베이스 초기화 컴포넌트
 * 앱이 시작될 때 데이터베이스 연결을 설정하고 필요한 테이블을 생성합니다.
 * Prisma 클라이언트를 통한 PostgreSQL 연결도 설정합니다.
 */
const DatabaseInitializer = () => {
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const setupDatabase = async () => {
      try {
        console.log('데이터베이스 초기화 시작...');
        
        // Prisma 연결 테스트
        try {
          await prisma.$queryRaw`SELECT 1`;
          console.log('Prisma 데이터베이스 연결 성공!');
          
          // 로컬 스토리지에서 데이터베이스로 마이그레이션
          const migrationResult = await migrateLocalStorageToDatabase();
          if (migrationResult.success) {
            console.log('로컬 스토리지 데이터 마이그레이션 성공:', migrationResult.message);
          } else {
            console.warn('마이그레이션 중 문제 발생:', migrationResult.error);
          }
          
          setInitialized(true);
        } catch (prismaError) {
          console.error('Prisma 데이터베이스 연결 실패:', prismaError);
          
          // Prisma 연결 실패 시 기존 방식으로 폴백
          console.log('기존 Vercel Postgres 연결 시도 중...');
          const result = await initializeDatabase();
          
          if (result.success) {
            console.log('기존 데이터베이스 초기화 완료!');
            setInitialized(true);
          } else {
            console.error('기존 데이터베이스 초기화 실패:', result.error);
            setError(result.error);
          }
        }
      } catch (err) {
        console.error('데이터베이스 초기화 오류:', err);
        setError(err.message || '데이터베이스 초기화 중 오류가 발생했습니다.');
      }
    };

    setupDatabase();
  }, []);

  // 초기화가 실패한 경우 오류 메시지 표시
  if (error) {
    return (
      <div className="database-error">
        <h3>데이터베이스 연결 오류</h3>
        <p>{error}</p>
        <p>
          <small>
            데이터베이스 연결에 실패했습니다. 로컬 스토리지를 사용한 제한된 기능으로 실행됩니다.
            관리자에게 문의하세요.
          </small>
        </p>
      </div>
    );
  }

  // 컴포넌트는 UI를 렌더링하지 않습니다.
  return null;
};

export default DatabaseInitializer;
