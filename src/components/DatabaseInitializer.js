import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/database.css';
import { connectDB } from '../lib/mongodb';

/**
 * 데이터베이스 초기화 컴포넌트
 * 애플리케이션이 시작될 때 데이터베이스 연결을 초기화하고
 * 연결 상태에 따라 UI를 표시합니다.
 */
const DatabaseInitializer = () => {
  const [status, setStatus] = useState('checking');
  const [message, setMessage] = useState('데이터베이스 연결 확인 중...');
  
  // 데이터베이스 연결 상태 확인
  useEffect(() => {
    const checkDatabaseConnection = async () => {
      try {
        setStatus('checking');
        setMessage('MongoDB 연결 확인 중...');
        
        // MongoDB 연결 시도
        const connected = await connectDB();
        
        if (connected) {
          setStatus('connected');
          setMessage('MongoDB 연결 성공! 서비스를 이용할 수 있습니다.');
          
          // 로컬 환경에서 API 테스트 (실제 서비스에서는 사용하지 않음)
          try {
            const response = await axios.get('/api/health-check');
            console.log('API 상태 확인:', response.data);
          } catch (apiError) {
            console.log('API 상태 확인 중 오류 (무시 가능):', apiError.message);
          }
        } else {
          setStatus('error');
          setMessage('MongoDB 연결 실패. 로컬 스토리지 모드로 작동합니다.');
        }
      } catch (error) {
        console.error('데이터베이스 연결 확인 중 오류:', error);
        setStatus('error');
        setMessage('MongoDB 연결 오류. 로컬 스토리지 모드로 작동합니다.');
      }
    };
    
    checkDatabaseConnection();
  }, []);
  
  // 상태별 클래스 설정
  const getStatusClass = () => {
    switch (status) {
      case 'connected':
        return 'database-status-success';
      case 'error':
        return 'database-status-error';
      default:
        return 'database-status-checking';
    }
  };
  
  return (
    <div className={`database-status ${getStatusClass()}`}>
      <p>{message}</p>
    </div>
  );
};

export default DatabaseInitializer;
