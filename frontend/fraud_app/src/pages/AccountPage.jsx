// src/pages/AccountPage.jsx
import React, { useState } from 'react';
import { apiService } from '../services/api';

export default function AccountPage({ currentUser, setActivePage }) {
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const handleSendOTP = async () => {
    await apiService.sendOTP(currentUser.email);
    setOtpSent(true);
    alert(`ส่งรหัส OTP ไปยังอีเมล ${currentUser.email} เรียบร้อยแล้ว`);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    await apiService.changePassword(otp, newPassword);
    alert('เปลี่ยนรหัสผ่านสำเร็จ');
    setOtpSent(false);
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('คุณแน่ใจหรือว่าต้องการลบบัญชีผู้ใช้นี้? การกระทำนี้ไม่สามารถยกเลิกได้')) {
      await apiService.deleteAccount(currentUser.id);
      alert('ลบบัญชีสำเร็จ');
      setActivePage('login');
    }
  };

  return (
    <div className="container">
      <div className="upload-card">
        <h2>จัดการบัญชีผู้ใช้</h2>
        <p>อีเมลปัจจุบัน: <strong>{currentUser?.email}</strong></p>

        <hr style={{ margin: '20px 0' }} />

        <h3>เปลี่ยนรหัสผ่าน</h3>
        {!otpSent ? (
          <button className="previewButton" onClick={handleSendOTP}>
            ส่ง OTP ไปยังอีเมลเพื่อเปลี่ยนรหัสผ่าน
          </button>
        ) : (
          <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '300px' }}>
            <input
              type="text"
              placeholder="กรอกรหัส OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="รหัสผ่านใหม่"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            <button type="submit" className="submitButton">ยืนยันการเปลี่ยนรหัสผ่าน</button>
          </form>
        )}

        <hr style={{ margin: '20px 0' }} />

        <h3 style={{ color: 'red' }}>พื้นที่อันตราย</h3>
        <button className="submitButton" style={{ background: '#dc2626' }} onClick={handleDeleteAccount}>
          ลบบัญชีผู้ใช้
        </button>
      </div>
    </div>
  );
}