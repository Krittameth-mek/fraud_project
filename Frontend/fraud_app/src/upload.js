import React, { useState } from 'react';
import './upload.css'; // นำเข้าไฟล์ CSS สำหรับสไตล์

export default function UploadComponent() {
  const [bankFile, setBankFile] = useState(null);
  const [internalFile, setInternalFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!bankFile || !internalFile) {
      alert("กรุณาเลือกไฟล์ให้ครบทั้ง 2 ใบก่อนครับ");
      return;
    }

    setLoading(true);
    setResult(null);

    // 1. สร้าง FormData เพื่อแพ็กไฟล์
    const formData = new FormData();
    // ชื่อ Key (ตัวหนังสือสีส้ม) ต้องตรงกับชื่อตัวแปรใน FastAPI เป๊ะๆ
    formData.append("bank_statement", bankFile);
    formData.append("internal_ledger", internalFile);

    try {
      // 2. ยิง API ไปที่ URL ของ FastAPI
      const response = await fetch("http://127.0.0.1:8000/upload-files", {
        method: "POST",
        body: formData, // ส่ง formData ไปใน body
      });

      const data = await response.json();
      setResult(data); // เก็บผลลัพธ์จาก FastAPI ลง State
    } catch (error) {
      console.error("Error uploading files:", error);
      setResult({ status: "error", message: "ไม่สามารถเชื่อมต่อกับ Server ได้" });
    } finally {
      setLoading(false);
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
                  accept=".csv, .xlsx, .xls"
                  onChange={(e) => setBankFile(e.target.files[0])}
                />
              </label>
              <label className="upload-button">
                <span>อัปโหลดไฟล์ PDF</span>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setBankFile(e.target.files[0])}
                />
              </label>
              <span>{bankFile ? bankFile.name : 'เลือกไฟล์ .csv / .xlsx / .xls หรือ PDF'}</span>
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
              <label className="upload-button">
                <span>อัปโหลดไฟล์ PDF</span>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setInternalFile(e.target.files[0])}
                />
              </label>
              <span>{internalFile ? internalFile.name : 'เลือกไฟล์ .csv / .xlsx / .xls หรือ PDF'}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="submitButton"
          >
            {loading ? 'กำลังประมวลผล...' : 'เริ่มตรวจสอบข้อมูล'}
          </button>
        </form>

        {result && (
          <div className="resultContainer">
            <h3>ผลการทำงาน ({result.status})</h3>
            <p>{result.message}</p>

            {result.status === 'success' && (
              <pre className="jsonViewer">
                {JSON.stringify(result, null, 2)}
              </pre>
            )}
          </div>
        )}
      </div>
    </div>
  );
}