import React, { useState } from 'react';
import './upload.css';
import { apiService } from './services/api';

export function buildPreviewRows(transactions = []) {
  return transactions.map((txn, index) => ({
    id: index + 1,
    date: txn?.date ?? '',
    time: txn?.time ?? '',
    item: txn?.item ?? '',
    amount: txn?.amount ?? '',
    balance: txn?.balance ?? '',
    channel: txn?.channel ?? '',
    detail: txn?.detail ?? '',
  }));
}

export default function UploadComponent({ onUploadSuccess, onUploadError }) {
  const [bankFile, setBankFile] = useState(null);
  const [internalFile, setInternalFile] = useState(null);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!bankFile) {
      alert('กรุณาเลือกไฟล์ Statement ก่อนครับ');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await apiService.uploadStatement(bankFile, password);
      const transactions = response?.transactions ?? [];
      setResult(response);

      if (response?.status === 'success' || transactions.length > 0) {
        onUploadSuccess?.(transactions);
      } else {
        onUploadError?.(response);
      }
    } catch (error) {
      console.error('Error uploading files:', error);
      const errorResult = { status: 'error', message: 'ไม่สามารถเชื่อมต่อกับ Server ได้' };
      setResult(errorResult);
      onUploadError?.(errorResult);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="upload-form">
      <div className="upload-header">
        <h2>ระบบอัปโหลดเอกสารบัญชี</h2>
        <p>เลือกไฟล์ทั้ง 2 ฉบับเพื่อเริ่มตรวจสอบความเสี่ยง</p>
      </div>

      <form onSubmit={handleUpload} className="upload-form">
        <div className="upload-section">
          <label className="label">1. ไฟล์ Bank Statement</label>
          <div className="file-box">
            <label className="upload-button">
              <span>เลือกไฟล์ PDF</span>
              <input type="file" accept=".pdf" onChange={(e) => setBankFile(e.target.files[0])} />
            </label>
            <span>{bankFile ? bankFile.name : 'เลือกไฟล์ PDF ของธนาคาร'}</span>
          </div>
        </div>

        <div className="upload-section">
          <label className="label">2. ไฟล์บัญชีภายในบริษัท</label>
          <div className="file-box">
            <label className="upload-button">
              <span>เลือกไฟล์ Excel</span>
              <input type="file" accept=".xlsx, .xls" onChange={(e) => setInternalFile(e.target.files[0])} />
            </label>
            <span>{internalFile ? internalFile.name : 'เลือกไฟล์ Excel ของบริษัท'}</span>
          </div>
        </div>

        <div className="upload-section">
          <label className="label">รหัสผ่าน PDF (ถ้ามี)</label>
          <input
            type="password"
            placeholder="รหัสผ่าน"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="upload-input"
          />
        </div>

        <button type="submit" disabled={loading} className="submitButton">
          {loading ? 'กำลังประมวลผล...' : 'เริ่มตรวจสอบข้อมูล'}
        </button>
      </form>

      {result && (
        <div className="resultContainer">
          <h3>ผลการทำงาน ({result.status})</h3>
          <p>{result.message || 'สำเร็จ'}</p>
          {result.status === 'success' && (
            <pre className="jsonViewer">{JSON.stringify(result, null, 2)}</pre>
          )}
        </div>
      )}
    </div>
  );
}
