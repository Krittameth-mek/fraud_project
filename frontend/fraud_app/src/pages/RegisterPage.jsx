// src/pages/RegisterPage.jsx
import React, { useState } from 'react';
import { apiService } from '../services/api';

export default function RegisterPage({ setActivePage }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState('');

  // Real-time Email Validation
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // Real-time Password Strength Check
  const getPasswordStrength = (pass) => {
    if (!pass) return { text: '', color: '' };
    if (pass.length < 8) return { text: 'อ่อนเกินไป (ต้องยาว 8 ตัวขึ้นไป)', color: 'red' };
    const hasNum = /\d/.test(pass);
    const hasSpecial = /[!@#$%^&*]/.test(pass);
    if (hasNum && hasSpecial) return { text: 'แข็งแรงมาก', color: 'green' };
    return { text: 'ปานกลาง (ควรมีตัวเลขและอักขระพิเศษ)', color: 'orange' };
  };

  const passStrength = getPasswordStrength(password);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!isEmailValid || passStrength.color === 'red' || !acceptedTerms) {
      alert('กรุณากรอกข้อมูลให้ถูกต้องและยอมรับข้อตกลงก่อนลงทะเบียน');
      return;
    }
    try {
      await apiService.register(email, password);
      alert('ลงทะเบียนสำเร็จ! กรุณาเข้าสู่ระบบ');
      setActivePage('login');
    } catch (registerError) {
      setError(registerError.message);
    }
  };

  return (
    <div className="auth-card">
      <h2>ลงทะเบียน</h2>
      {error && <p className="validation-msg invalid">{error}</p>}
      <form onSubmit={handleRegister}>
        <div>
          <input
            type="email"
            placeholder="อีเมล"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          {email && (
            <span className={`validation-msg ${isEmailValid ? 'valid' : 'invalid'}`}>
              {isEmailValid ? '✓ รูปแบบอีเมลถูกต้อง' : '✕ รูปแบบอีเมลไม่ถูกต้อง'}
            </span>
          )}
        </div>

        <div>
          <input
            type="password"
            placeholder="รหัสผ่าน"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {password && (
            <span className="validation-msg" style={{ color: passStrength.color }}>
              ความแข็งแรง: {passStrength.text}
            </span>
          )}
        </div>

        <div className="terms-checkbox">
          <input
            type="checkbox"
            id="terms"
            checked={acceptedTerms}
            onChange={(e) => setAcceptedTerms(e.target.checked)}
          />
          <label htmlFor="terms">
            ฉันยอมรับ{' '}
            <span className="link-text" onClick={() => setActivePage('terms')}>
              Term of Services
            </span>
          </label>
        </div>

        <button
          type="submit"
          className="submitButton"
          disabled={!isEmailValid || passStrength.color === 'red' || !acceptedTerms}
        >
          ลงทะเบียน
        </button>
      </form>
      <div className="divider">หรือ</div>
      <button className="google-btn" onClick={() => setActivePage('home')}>
        ลงทะเบียนด้วย Google
      </button>
      <p style={{ marginTop: '16px' }}>
        มีบัญชีอยู่แล้ว?{' '}
        <span className="link-text" onClick={() => setActivePage('login')}>
          เข้าสู่ระบบ
        </span>
      </p>
    </div>
  );
}