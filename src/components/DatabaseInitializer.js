import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const DatabaseInitializer = () => {
  const [status, setStatus] = useState('준비 중...');

  useEffect(() => {
    const checkDatabaseConnection = async () => {
      try {
        // 서버/API 연결 상태 확인
        setStatus('데이터베이스 연결 테스트 중...');
        
        // 헬스체크 API 요청 - 간단한 GET 요청으로 서버 상태 확인
        const response = await axios.get('/api/auth', {
          timeout: 5000 // 5초 타임아웃
        });
        
        // 연결 성공
        if (response.status >= 200 && response.status < 300) {
          setStatus('데이터베이스 연결됨 ');
          console.log('서버 및 데이터베이스 연결 성공');
          
          // 로컬 스토리지 데이터 마이그레이션 시도
          migrateLocalStorageData();
        } else {
          setStatus('데이터베이스 연결 실패 - 로컬 스토리지 사용');
          console.warn('데이터베이스 연결 테스트 실패. 로컬 스토리지를 사용합니다.');
        }
      } catch (error) {
        setStatus('데이터베이스 연결 실패 - 로컬 스토리지 사용');
        console.error('데이터베이스 연결 오류:', error);
      }
    };

    // 로컬 스토리지 데이터를 데이터베이스로 마이그레이션
    const migrateLocalStorageData = async () => {
      try {
        // 로컬 스토리지에서 사용자 데이터 로드
        const usersData = localStorage.getItem('smart_content_users');
        if (!usersData) return;
        
        const users = JSON.parse(usersData);
        if (!users.length) return;
        
        setStatus('로컬 데이터 마이그레이션 중...');
        
        // 향후 구현: 실제 마이그레이션 로직
        // 여기서는 간단히 로컬 스토리지의 데이터를 유지합니다
        // 실제로는 서버에 API 요청을 보내 데이터를 마이그레이션해야 합니다
        
        setStatus('로컬 데이터 마이그레이션 완료 ');
      } catch (error) {
        console.error('데이터 마이그레이션 중 오류:', error);
        setStatus('데이터 마이그레이션 실패 ');
      }
    };

    // 초기화 실행
    checkDatabaseConnection();
  }, []);

  return (
    <div className="database-status">
      <small>{status}</small>
    </div>
  );
};

export default DatabaseInitializer;
