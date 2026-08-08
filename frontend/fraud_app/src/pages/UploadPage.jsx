// src/pages/UploadPage.jsx
import React, { useState } from 'react';
import { apiService } from '../services/api';
import UploadComponent, { buildPreviewRows } from '../upload';

const PRESET_PROMPTS = [
  { label: 'แปลงวันที่ YYYY-MM-DD', prompt: 'ปรับรูปแบบวันที่ให้อยู่ในฟอร์แมต YYYY-MM-DD ทั้งหมด' },
  { label: 'รวมช่องรายการ', prompt: 'นำข้อความที่อยู่ในช่องรายการ ช่องทาง และรายละเอียด มารวมกัน' },
  { label: 'กรองยอดยกมา', prompt: 'กรองรายการที่มีคำว่า ยอดยกมา หรือ ยอดคงเหลือยกมา ออกจากตาราง' },
  { label: 'แยกภาษี/ส่วนลด', prompt: 'คำนวณแยกส่วนลดและภาษีมูลค่าเพิ่ม 7% ออกจากจำนวนเงินสุทธิ' },
  { label: 'ระบุหมวดหมู่รับ-จ่าย', prompt: 'จำแนกหมวดหมู่รายรับและรายจ่ายจากข้อความในรายการให้อัตโนมัติ' },
];

export default function UploadPage({ setActivePage, setSelectedProcessId }) {
  const [sourceType, setSourceType] = useState('local'); // 'local' | 'existing'
  const [bankFile, setBankFile] = useState(null);
  const [internalFile, setInternalFile] = useState(null);
  const [password, setPassword] = useState('');
  
  const [rawTransactions, setRawTransactions] = useState([]);
  const [promptText, setPromptText] = useState('');
  const [loading, setLoading] = useState(false);

  // Pagination State
  const [pageSize, setPageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);

  const handlePreviewBank = async () => {
    if (!bankFile) return alert('กรุณาเลือกไฟล์ Statement ก่อน');
    setLoading(true);
    try {
      const res = await apiService.uploadStatement(bankFile, password);
      if (res.transactions) {
        setRawTransactions(res.transactions);
      }
    } catch (e) {
      alert('เกิดข้อผิดพลาดในการดึงข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyPrompt = async () => {
    if (!promptText.trim()) return;
    setLoading(true);
    const res = await apiService.applyLLMPrompt(promptText, rawTransactions);
    setRawTransactions(res.updatedData);
    setLoading(false);
    alert(`ประยุกต์ใช้ Prompt: "${promptText}" สำเร็จ`);
  };

  const handleStartProcess = async () => {
    const res = await apiService.startProcessing('dataset_123');
    setSelectedProcessId(res.processId);
    setActivePage('summary');
  };

  // Pagination Calculation
  const totalItems = rawTransactions.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedRows = buildPreviewRows(rawTransactions).slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="container">
      <div className="upload-card">
        <h2>อัปโหลดและประมวลผลข้อมูล</h2>

        {/* Option: Local file vs Existing File */}
        <div style={{ marginBottom: '16px', display: 'flex', gap: '12px' }}>
          <button
            className={`tab-item ${sourceType === 'local' ? 'active' : ''}`}
            onClick={() => setSourceType('local')}
          >
            เลือกไฟล์จากในเครื่อง
          </button>
          <button
            className={`tab-item ${sourceType === 'existing' ? 'active' : ''}`}
            onClick={() => setSourceType('existing')}
          >
            เลือกไฟล์ที่เคยอัปโหลดแล้ว
          </button>
        </div>

        {sourceType === 'local' ? (
          <UploadComponent
            onUploadSuccess={(transactions) => {
              setRawTransactions(transactions);
              setCurrentPage(1);
            }}
          />
        ) : (
          <div className="upload-section">
            <label className="label">เลือกรายการไฟล์เก่าจากระบบ</label>
            <select style={{ width: '100%', padding: '8px' }}>
              <option>Statement_July_2026.pdf (อัปโหลดเมื่อ 01/08/2026)</option>
              <option>Ledger_Q2_2026.xlsx (อัปโหลดเมื่อ 15/07/2026)</option>
            </select>
          </div>
        )}

        {/* Prompt Tuning Section */}
        {rawTransactions.length > 0 && (
          <div className="prompt-section" style={{ marginTop: '24px' }}>
            <h3>ปรับแต่งข้อมูลด้วย LLM Prompt</h3>
            <div className="preset-prompts">
              {PRESET_PROMPTS.map((p, idx) => (
                <button
                  key={idx}
                  className="chip-btn"
                  onClick={() => setPromptText(p.prompt)}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <input
                type="text"
                placeholder="พิมพ์ Prompt เพื่อปรับแก้ข้อมูลคร่าว ๆ..."
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                style={{ flex: 1, padding: '8px' }}
              />
              <button className="submitButton" onClick={handleApplyPrompt}>
                ส่ง Prompt
              </button>
            </div>
          </div>
        )}

        {/* Preview Table with Pagination & Height Limit */}
        {rawTransactions.length > 0 && (
          <div className="previewContainer">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3>ตัวอย่างข้อมูลที่อ่านได้ ({totalItems} รายการ)</h3>
              <div>
                <label style={{ marginRight: '8px', fontSize: '14px' }}>แสดงทีละ:</label>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                >
                  <option value={20}>20 รายการ</option>
                  <option value={30}>30 รายการ</option>
                  <option value={50}>50 รายการ</option>
                </select>
              </div>
            </div>

            {/* Overflow Box Limit to ~20 items */}
            <div className="tableWrapper" style={{ maxHeight: '480px', overflowY: 'auto' }}>
              <table className="previewTable">
                <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                  <tr>
                    <th>วันที่</th>
                    <th>เวลา</th>
                    <th>รายการ</th>
                    <th>จำนวนเงิน</th>
                    <th>ยอดคงเหลือ</th>
                    <th>ช่องทาง</th>
                    <th>รายละเอียด</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedRows.map((row, idx) => (
                    <tr key={idx}>
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

            {/* Pagination Controls */}
            <div className="pagination-controls" style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end', gap: '8px', alignItems: 'center' }}>
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
              >
                ก่อนหน้า
              </button>
              <span>
                หน้า {currentPage} จาก {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                ถัดไป
              </button>
            </div>
          </div>
        )}

        {/* Start Processing Button */}
        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <button
            className="submitButton"
            style={{ width: '100%', padding: '14px', fontSize: '16px' }}
            onClick={handleStartProcess}
          >
            เริ่มการประมวลผล
          </button>
        </div>
      </div>
    </div>
  );
}