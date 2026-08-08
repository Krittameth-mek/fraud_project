// src/pages/TermsPage.jsx
import React from 'react';

export default function TermsPage({ setActivePage }) {
  return (
    <div className="container" style={{ textAlign: 'center', marginTop: '50px' }}>
      <h2>Term of Services</h2>
      <p>หน้าว่างสําหรับอ่านข้อตกลงการใช้งาน (Terms of Service)</p>
      <button className="previewButton" onClick={() => setActivePage('register')}>
        ย้อนกลับไปหน้าลงทะเบียน
      </button>
    </div>
  );
}