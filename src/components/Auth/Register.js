import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/SupabaseAuthContext';
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
    
    // 비밀번호 길이 확인 (4자리 이상)
    if (password.length < 4) {
      setError('비밀번호는 4자리 이상이어야 합니다');
      return;
    }
    
    setLoading(true);
    
    try {
      // 회원가입 시도
      console.log('회원가입 시도:', username);
      
      // 회원가입 요청 - 이메일은 백엔드에서 자동 생성
      const result = await register({
        username,
        password
      });
      
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
      // 오류 메시지 상세화
      if (error.message) {
        setError(error.message);
      } else {
        setError('회원가입 중 오류가 발생했습니다');
      }
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
              placeholder="아이디 입력"
              required
            />
            <small className="form-text">
              영문자, 숫자를 포함한 4~20자 (관리자는 1111)
            </small>
          </div>
          
          <div className="form-group">
            <label htmlFor="password">비밀번호</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호 입력 (4자 이상)"
              required
            />
            <small className="form-text">
              최소 4자 이상으로 입력해 주세요
            </small>
          </div>
          
          <div className="form-group">
            <label htmlFor="confirm-password">비밀번호 확인</label>
            <input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="비밀번호 재입력"
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
