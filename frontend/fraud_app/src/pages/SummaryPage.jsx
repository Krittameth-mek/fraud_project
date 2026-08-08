// src/pages/SummaryPage.jsx
import React, { useEffect, useState } from 'react';
import { apiService } from '../services/api';

export default function SummaryPage({ processId, setActivePage }) {
  const [summaryData, setSummaryData] = useState(null);
  const [hoveredPoint, setHoveredPoint] = useState(null);

  useEffect(() => {
    apiService.getSummaryData(processId).then(setSummaryData);
  }, [processId]);

  if (!summaryData) return <div className="container">กำลังโหลดข้อมูลสรุปผล...</div>;

  const getColorClass = (type) => {
    if (type === 'BOTH') return 'dot-red';
    if (type === 'RULE') return 'dot-orange';
    if (type === 'MODEL') return 'dot-yellow';
    return 'dot-normal';
  };

  return (
    <div className="container">
      <h2>หน้าสรุปผลการประมวลผล</h2>
      <p>รหัสการประมวลผล: {processId}</p>

      {/* Indicator Legend */}
      <div className="chart-legend" style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
        <span><strong style={{ color: 'red' }}>● สีแดง:</strong> ผิดปกติจาก Model & Rule</span>
        <span><strong style={{ color: 'orange' }}>● สีส้ม:</strong> ผิดปกติจาก Rule เท่านั้น</span>
        <span><strong style={{ color: '#eab308' }}>● สีเหลือง:</strong> ผิดปกติจาก Model เท่านั้น</span>
      </div>

      {/* Simulated Interactive Graph */}
      <div className="chart-container" style={{ height: '320px', borderBottom: '2px solid #ccc', display: 'flex', alignItems: 'flex-end', gap: '32px', padding: '20px' }}>
        {summaryData.chartData.map((item, idx) => (
          <div
            key={idx}
            className="chart-bar-wrapper"
            style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
            onMouseEnter={() => setHoveredPoint(item)}
            onMouseLeave={() => setHoveredPoint(null)}
          >
            {/* Risk Highlight Dot */}
            {item.anomalyType && (
              <div className={`anomaly-dot ${getColorClass(item.anomalyType)}`} />
            )}

            {/* Visual Bar representing transaction count */}
            <div
              className="chart-bar"
              style={{ height: `${item.count * 8}px`, width: '40px', background: '#3b82f6', borderRadius: '4px' }}
            />
            <span style={{ fontSize: '12px', marginTop: '8px' }}>{item.date}</span>
          </div>
        ))}
      </div>

      {/* Tooltip Details on Hover */}
      {hoveredPoint && (
        <div className="tooltip-box" style={{ marginTop: '20px', padding: '16px', background: '#f8fafc', borderLeft: '4px solid #2563eb' }}>
          <h4>รายละเอียดจุดที่เลือก ({hoveredPoint.date})</h4>
          <p>จำนวนรายการ: {hoveredPoint.count} รายการ</p>
          <p>สถานะเตือน: {hoveredPoint.details}</p>
        </div>
      )}

      <button className="previewButton" style={{ marginTop: '24px' }} onClick={() => setActivePage('home')}>
        กลับหน้าหลัก
      </button>
    </div>
  );
}