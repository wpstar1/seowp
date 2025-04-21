import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// 로컬 인증 컨텍스트
import { AuthProvider, useAuth } from './contexts/LocalAuthContext';

// 컴포넌트 가져오기
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import UpgradeVIP from './components/Auth/UpgradeVIP';
import Dashboard from './components/Dashboard';
import ContentCreator from './ContentCreator'; // 기존 콘텐츠 생성기 컴포넌트
import NotFound from './components/NotFound';

// 보호된 라우트 컴포넌트
const ProtectedRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();
  
  if (loading) {
    return <div className="loading-container">로딩 중...</div>;
  }
  
  if (!currentUser) {
    return <Navigate to="/login" />;
  }
  
  return children;
};

// 앱 라우터 컴포넌트
const AppRouter = () => {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* 인증 관련 라우트 */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* 보호된 라우트 */}
          <Route path="/" element={
            <ProtectedRoute>
              <ContentCreator />
            </ProtectedRoute>
          } />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/content-creator" element={
            <ProtectedRoute>
              <ContentCreator />
            </ProtectedRoute>
          } />
          <Route path="/upgrade-vip" element={
            <ProtectedRoute>
              <UpgradeVIP />
            </ProtectedRoute>
          } />
          
          {/* 404 페이지 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        
        {/* 토스트 알림 컨테이너 */}
        <ToastContainer 
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
      </AuthProvider>
    </Router>
  );
};

export default AppRouter;
