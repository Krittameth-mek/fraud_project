// src/components/Navbar.jsx
import React from 'react';

export default function Navbar({ activePage, setActivePage, currentUser }) {
  if (activePage === 'login' || activePage === 'register' || activePage === 'terms') {
    return null;
  }

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
      <div className="user-menu" onClick={() => setActivePage('account')} style={{ cursor: 'pointer' }}>
        <span>👤 {currentUser ? currentUser.email : 'บัญชีของฉัน'}</span>
      </div>
    </nav>
  );
}