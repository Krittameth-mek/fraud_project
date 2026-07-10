import React, { useState } from 'react';

function UploadComponent() {
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
    <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto' }}>
      <h2>ระบบอัปโหลดเอกสารบัญชี</h2>
      
      <form onSubmit={handleUpload}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>1. ไฟล์ Bank Statement:</label>
          <input 
            type="file" 
            accept=".csv, .xlsx, .xls"
            onChange={(e) => setBankFile(e.target.files[0])} 
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>2. ไฟล์ บัญชีภายในบริษัท:</label>
          <input 
            type="file" 
            accept=".csv, .xlsx, .xls"
            onChange={(e) => setInternalFile(e.target.files[0])} 
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "กำลังประมวลผล..." : "เริ่มตรวจสอบข้อมูล"}
        </button>
      </form>

      {/* ส่วนแสดงผลลัพธ์จาก FastAPI */}
      {result && (
        <div style={{ marginTop: '20px', padding: '15px', border: '1px solid #ccc', borderRadius: '5px' }}>
          <h3>ผลการทำงาน ({result.status})</h3>
          <p>{result.message}</p>
          
          {result.status === "success" && (
            <pre style={{ background: '#f4f4f4', padding: '10px', overflowX: 'auto' }}>
              {JSON.stringify(result, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}

export default UploadComponent;