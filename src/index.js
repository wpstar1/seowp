import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
// 원래 App 파일 사용 (디자인 변경)
import App from './App.js';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/LocalAuthContext';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Logout from './components/Auth/Logout';
import AdminPanel from './components/Admin/AdminPanel';

const container = document.getElementById('root');
const root = createRoot(container);

// 라우팅 복원
root.render(
  <React.StrictMode>
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/logout" element={<Logout />} />
          <Route path="/admin" element={<AdminPanel />} />
        </Routes>
      </Router>
    </AuthProvider>
  </React.StrictMode>
);