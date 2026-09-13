// src/components/Navbar.jsx
import React from 'react';
import { apiService } from '../services/api';

export default function Navbar({ activePage, setActivePage, currentUser, setCurrentUser }) {
  if (activePage === 'login' || activePage === 'register' || activePage === 'terms') {
    return null;
  }

  const handleLogout = async () => {
    await apiService.logout();
    setCurrentUser(null);
    setActivePage('login');
  };

  return (
    <nav className="navbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button
          className="btn-new-work"
          onClick={() => setActivePage('upload')}
        >
          + งานใหม่
        </button>
        <span
          className="navbar-brand"
          style={{ cursor: 'pointer' }}
          onClick={() => setActivePage('home')}
        >
          ระบบตรวจสอบบัญชี SME
        </span>
      </div>
      <div className="user-menu" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <span onClick={() => setActivePage('account')} style={{ cursor: 'pointer' }}>👤 {currentUser.email}</span>
        <button onClick={handleLogout}>ออกจากระบบ</button>
      </div>
    </nav>
  );
}