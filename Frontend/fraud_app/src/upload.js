import React, { useState } from 'react';
import './upload.css';

const PREVIEW_COLUMNS = [
  { key: 'date', label: 'วันที่' },
  { key: 'time', label: 'เวลา' },
  { key: 'item', label: 'รายการ' },
  { key: 'amount', label: 'จำนวนเงิน' },
  { key: 'balance', label: 'ยอดคงเหลือ' },
  { key: 'channel', label: 'ช่องทาง' },
  { key: 'detail', label: 'รายละเอียด' },
];

export const buildPreviewRows = (transactions = []) =>
  (transactions || []).map((txn) => ({
    date: txn.date || '',
    time: txn.time || '',
    item: txn.item || '',
    amount: txn.amount || '',
    balance: txn.balance || '',
    channel: txn.channel || '',
    detail: txn.detail || '',
  }));

export default function UploadComponent() {
  const [bankFile, setBankFile] = useState(null);
  const [internalFile, setInternalFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [password, setPassword] = useState('');
  const [previewRows, setPreviewRows] = useState([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState('');

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!bankFile || !internalFile) {
      alert('กรุณาเลือกไฟล์ให้ครบทั้ง 2 ไฟล์ก่อนครับ');
      return;
    }

    setLoading(true);
    setResult(null);

    const formData = new FormData();
    formData.append('bank_statement', bankFile);
    formData.append('internal_ledger', internalFile);
    if (password) formData.append('password', password);

    try {
      const response = await fetch('http://127.0.0.1:8000/api/upload/files', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const text = await response.text();
        setResult({ status: 'error', message: `Server returned ${response.status}`, code: response.status, body: text });
      } else {
        try {
          const data = await response.json();
          setResult(data);
        } catch (e) {
          const text = await response.text();
          setResult({ status: 'success', message: 'Received non-JSON response', body: text });
        }
      }
    } catch (error) {
      setResult({ status: 'error', message: error.message || 'ไม่สามารถเชื่อมต่อกับ Server ได้' });
    } finally {
      setLoading(false);
    }
  };

  const handlePreviewBankData = async () => {
    if (!bankFile) {
      alert('กรุณาเลือกไฟล์ Bank Statement ก่อนครับ');
      return;
    }

    setPreviewLoading(true);
    setPreviewError('');
    setPreviewRows([]);

    const formData = new FormData();
    formData.append('file', bankFile);
    if (password) formData.append('password', password);

    try {
      const response = await fetch('http://127.0.0.1:8000/api/upload/statement', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.detail || `Server returned ${response.status}`);
      }

      const transactions = Array.isArray(data?.transactions) ? data.transactions : [];
      setPreviewRows(buildPreviewRows(transactions));
    } catch (error) {
      setPreviewError(error.message || 'ไม่สามารถดึงข้อมูลจาก backend ได้');
    } finally {
      setPreviewLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="upload-card">
        <div className="upload-header">
          <h2>ระบบอัปโหลดเอกสารบัญชี</h2>
          <p>เลือกไฟล์ทั้ง 2 ฉบับเพื่อเริ่มตรวจสอบความเสี่ยง</p>
        </div>

        <form onSubmit={handleUpload} className="upload-form">
          <div className="upload-section">
            <label className="label">1. ไฟล์ Bank Statement</label>
            <div className="file-box">
              <label className="upload-button">
                <span>เลือกไฟล์</span>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setBankFile(e.target.files[0])}
                />
              </label>
              <div className="file-actions">
                <span>{bankFile ? bankFile.name : 'เลือกไฟล์ PDF ของ Bank Statement'}</span>
                <button
                  type="button"
                  className="previewButton"
                  onClick={handlePreviewBankData}
                  disabled={!bankFile || previewLoading}
                >
                  {previewLoading ? 'กำลังโหลด...' : 'แสดงผลข้อมูล'}
                </button>
              </div>
            </div>
          </div>

          <div className="upload-section">
            <label className="label">2. ไฟล์บัญชีภายในบริษัท</label>
            <div className="file-box">
              <label className="upload-button">
                <span>เลือกไฟล์</span>
                <input
                  type="file"
                  accept=".csv, .xlsx, .xls"
                  onChange={(e) => setInternalFile(e.target.files[0])}
                />
              </label>
              <span>{internalFile ? internalFile.name : 'เลือกไฟล์ .csv / .xlsx / .xls'}</span>
            </div>
          </div>

          <div className="upload-section">
            <label className="label">รหัสผ่านไฟล์ (ถ้ามี)</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="รหัสผ่าน (optional)"
              style={{ width: '100%', padding: '8px', marginTop: '8px' }}
            />
          </div>

          <button type="submit" disabled={loading} className="submitButton">
            {loading ? 'กำลังประมวลผล...' : 'เริ่มตรวจสอบข้อมูล'}
          </button>
        </form>

        {previewError && <p className="previewError">{previewError}</p>}

        {previewRows.length > 0 && (
          <div className="previewContainer">
            <h3>ข้อมูล Bank Statement ที่ได้จาก backend</h3>
            <div className="tableWrapper">
              <table className="previewTable">
                <thead>
                  <tr>
                    {PREVIEW_COLUMNS.map((column) => (
                      <th key={column.key}>{column.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((row, index) => (
                    <tr key={`${row.date}-${row.time}-${index}`}>
                      <td>{row.date}</td>
                      <td>{row.time}</td>
                      <td>{row.item}</td>
                      <td>{row.amount}</td>
                      <td>{row.balance}</td>
                      <td>{row.channel}</td>
                      <td>{row.detail}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {result && (
          <div className="resultContainer">
            <h3>ผลการทำงาน ({result.status})</h3>
            <p>{result.message}</p>
            <pre className="jsonViewer">{JSON.stringify(result, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
}