// src/pages/HomePage.jsx
import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';

export default function HomePage({ setActivePage, setSelectedProcessId }) {
  const [activeTab, setActiveTab] = useState('uploadDate');
  const [searchQuery, setSearchQuery] = useState('');
  const [processList, setProcessList] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');

  const tabs = [
    { key: 'uploadDate', label: 'วันที่อัปโหลด' },
    { key: 'lastOpened', label: 'วันที่เปิดดูล่าสุด' },
    { key: 'dataDate', label: 'ข้อมูลวันที่ถูกอัปโหลด' },
    { key: 'title', label: 'ชื่อการประมวลผล' },
  ];

  useEffect(() => {
    loadList();
  }, [searchQuery, activeTab]);

  const loadList = async () => {
    const data = await apiService.getProcessList(searchQuery, activeTab);
    setProcessList(data);
  };

  const handleRename = async (e, id) => {
    e.stopPropagation();
    if (!editTitle.trim()) return;
    await apiService.renameProcess(id, editTitle);
    setEditingId(null);
    loadList();
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (window.confirm('คุณต้องการลบการประมวลผลนี้จากระบบใช่หรือไม่?')) {
      await apiService.deleteProcess(id);
      loadList();
    }
  };

  const handleItemClick = (id) => {
    setSelectedProcessId(id);
    setActivePage('summary');
  };

  return (
    <div className="container">
      {/* YouTube-style Search Bar with Tabs */}
      <div className="search-container">
        <div className="search-bar">
          <input
            type="text"
            placeholder="ค้นหารายการการประมวลผล..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="tabs-bar">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              className={`tab-item ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Process Entries List */}
      <div className="process-list">
        {processList.map((item) => (
          <div
            key={item.id}
            className="process-item"
            onClick={() => handleItemClick(item.id)}
          >
            <div className="process-info">
              {editingId === item.id ? (
                <div onClick={(e) => e.stopPropagation()} style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                  />
                  <button onClick={(e) => handleRename(e, item.id)}>บันทึก</button>
                </div>
              ) : (
                <h3>{item.title}</h3>
              )}
              <p>
                อัปโหลด: {item.uploadDate} | เปิดล่าสุด: {item.lastOpened} | วันที่ข้อมูล: {item.dataDate}
              </p>
            </div>

            <div className="process-actions">
              <button
                className="icon-btn"
                title="เปลี่ยนชื่อ"
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingId(item.id);
                  setEditTitle(item.title);
                }}
              >
                ✏️
              </button>
              <button
                className="icon-btn delete"
                title="ลบรายการ"
                onClick={(e) => handleDelete(e, item.id)}
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}