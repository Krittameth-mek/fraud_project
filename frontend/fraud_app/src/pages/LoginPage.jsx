// src/pages/LoginPage.jsx
import React, { useState } from 'react';
import { apiService } from '../services/api';

export default function LoginPage({ setActivePage, setCurrentUser }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await apiService.login(email, password);
      setCurrentUser(res.user);
      setActivePage('home');
    } catch (loginError) {
      setError(loginError.message);
    }
  };

  return (
    <div className="auth-card">
      <h2>เข้าสู่ระบบ</h2>
      {error && <p className="validation-msg invalid">{error}</p>}
      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="อีเมล"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="รหัสผ่าน"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit" className="submitButton">เข้าสู่ระบบ</button>
      </form>
      <div className="divider">หรือ</div>
      <button className="google-btn" onClick={handleLogin}>
        เข้าสู่ระบบด้วย Google
      </button>
      <p style={{ marginTop: '16px' }}>
        ยังไม่มีบัญชี?{' '}
        <span className="link-text" onClick={() => setActivePage('register')}>
          ลงทะเบียน
        </span>
      </p>
    </div>
  );
}