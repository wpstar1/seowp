import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/LocalAuthContext';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Logout from './components/Auth/Logout';
import AdminDashboard from './pages/AdminDashboard';

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
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
        </Routes>
      </Router>
    </AuthProvider>
  </React.StrictMode>
);