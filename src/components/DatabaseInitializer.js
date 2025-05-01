import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import '../styles/database.css';

/**
 * 데이터베이스 초기화 컴포넌트
 * 애플리케이션이 시작될 때 데이터베이스 연결을 초기화하고
 * 연결 상태에 따라 UI를 표시합니다.
 */
function DatabaseInitializer() {
  const [status, setStatus] = useState('checking');
  const [message, setMessage] = useState('데이터베이스 연결 확인 중...');

  useEffect(() => {
    const checkConnection = async () => {
      try {
        setMessage('Supabase 연결 확인 중...');
        
        // Supabase 연결 테스트
        const { data, error } = await supabase.from('users').select('count', { count: 'exact' }).limit(1);
        
        if (error) {
          console.error('Supabase 연결 오류:', error);
          setStatus('error');
          setMessage('Supabase 연결 실패. 로컬 스토리지 모드로 작동합니다.');
        } else {
          console.log('Supabase 연결 성공!');
          setStatus('connected');
          setMessage('Supabase 연결 성공! 서비스를 이용할 수 있습니다.');
        }
      } catch (error) {
        console.error('데이터베이스 연결 확인 오류:', error);
        setStatus('error');
        setMessage('Supabase 연결 실패. 로컬 스토리지 모드로 작동합니다.');
      } finally {
        // 3초 후 메시지 숨기기
        setTimeout(() => {
          setMessage('');
        }, 3000);
      }
    };

    checkConnection();
  }, []);

  if (!message) return null;

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
}

export default DatabaseInitializer;
