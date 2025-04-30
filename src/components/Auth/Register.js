import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/LocalAuthContext';
import './Auth.css';

const Register = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { register, login, currentUser } = useAuth();
  
  useEffect(() => {
    // 이미 로그인한 경우 메인 페이지로 이동
    if (currentUser) {
      navigate('/');
    }
  }, [currentUser, navigate]);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    
    // 비밀번호 확인
    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다');
      return;
    }
    
    setLoading(true);
    
    try {
      // 로그인 전에 기존 데이터 확인
      console.log('회원가입 시도:', username);
      
      // 로컬 인증 시스템으로 회원가입 - confirmPassword도 전달
      const result = await register(username, password, confirmPassword);
      
      if (result.success) {
        console.log('회원가입 성공:', username);
        
        // 자동 로그인 시도
        const loginResult = await login(username, password);
        if (loginResult.success) {
          // 회원가입 및 로그인 성공, 메인 화면으로 이동
          navigate('/');
        } else {
          // 회원가입은 성공했지만 로그인 실패, 로그인 페이지로 이동
          navigate('/login');
        }
      } else {
        setError(result.error || '회원가입 중 오류가 발생했습니다');
      }
    } catch (error) {
      console.error('회원가입 에러:', error);
      setError('회원가입 중 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-form-container">
        <h2>회원가입</h2>
        {error && <div className="auth-error">{error}</div>}
        
        <form onSubmit={handleRegister} className="auth-form">
          <div className="form-group">
            <label htmlFor="username">아이디</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="아이디 (3자 이상)"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">비밀번호</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호 (4자 이상)"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="confirm-password">비밀번호 확인</label>
            <input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="비밀번호 확인"
              required
            />
          </div>
          
          <button 
            type="submit" 
            className="auth-button" 
            disabled={loading}
          >
            {loading ? '처리 중...' : '회원가입'}
          </button>
        </form>
        
        <div className="auth-links">
          <p>이미 계정이 있으신가요? <Link to="/login">로그인</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Register;
