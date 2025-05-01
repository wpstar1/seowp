import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/SupabaseAuthContext';
import './Auth.css';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const { login, currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // 이미 로그인한 경우 메인 페이지로 이동
    if (currentUser) {
      navigate('/');
    }
    
    // location state에서 메시지 가져오기
    if (location.state?.message) {
      setMessage(location.state.message);
    }
  }, [currentUser, navigate, location]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 로컬 인증 시스템으로 로그인
      const result = await login(username, password);
      
      if (result.success) {
        // 로그인 성공, 메인 페이지로 이동
        navigate('/');
      } else {
        setError(result.error || '로그인 중 오류가 발생했습니다');
      }
    } catch (error) {
      console.error('로그인 에러:', error);
      setError('로그인 중 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-form-container">
        <h2>로그인</h2>
        {message && <div className="auth-success">{message}</div>}
        {error && <div className="auth-error">{error}</div>}
        
        <form onSubmit={handleLogin} className="auth-form">
          <div className="form-group">
            <label htmlFor="username">아이디</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="아이디"
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
              placeholder="비밀번호"
              required
            />
          </div>
          
          <button 
            type="submit" 
            className="auth-button" 
            disabled={loading}
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>
        
        <div className="auth-links">
          <p>계정이 없으신가요? <Link to="/register">회원가입</Link></p>
          <p><Link to="/forgot-password">비밀번호를 잊으셨나요?</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Login;
