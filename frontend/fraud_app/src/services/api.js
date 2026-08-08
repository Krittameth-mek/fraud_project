const BASE_URL = 'http://127.0.0.1:8000/api';

export const apiService = {
  // Authentication Endpoints
  async login(email, password) {
    // TODO Backend: POST /api/auth/login
    return { token: 'mock-jwt-token', user: { email, name: 'SME User' } };
  },

  async register(email, password) {
    // TODO Backend: POST /api/auth/register
    return { success: true, message: 'ลงทะเบียนสำเร็จ' };
  },

  async sendOTP(email) {
    // TODO Backend: POST /api/auth/send-otp
    return { success: true, message: `ส่ง OTP ไปยัง ${email} เรียบร้อยแล้ว` };
  },

  async changePassword(otp, newPassword) {
    // TODO Backend: POST /api/auth/change-password
    return { success: true, message: 'เปลี่ยนรหัสผ่านเรียบร้อย' };
  },

  async deleteAccount(userId) {
    // TODO Backend: DELETE /api/auth/account/:id
    return { success: true, message: 'ลบบัญชีเรียบร้อยแล้ว' };
  },

  // Process / History Endpoints
  async getProcessList(query = '', searchType = 'uploadDate') {
    // TODO Backend: GET /api/process/list?query=...&type=...
    return [
      {
        id: 'proc_001',
        title: 'การประมวลผลวันที่ 01/08/2026',
        uploadDate: '2026-08-01 10:30',
        lastOpened: '2026-08-05 14:20',
        dataDate: '2026-07-01',
      },
      {
        id: 'proc_002',
        title: 'การประมวลผลวันที่ 15/07/2026',
        uploadDate: '2026-07-15 09:12',
        lastOpened: '2026-07-20 11:00',
        dataDate: '2026-06-01',
      },
    ];
  },

  async renameProcess(id, newTitle) {
    // TODO Backend: PATCH /api/process/:id/rename
    return { success: true, id, newTitle };
  },

  async deleteProcess(id) {
    // TODO Backend: DELETE /api/process/:id
    return { success: true, id };
  },

  // Upload & LLM Prompt Endpoints
  async uploadStatement(file, password) {
    const formData = new FormData();
    formData.append('file', file);
    if (password) formData.append('password', password);

    const res = await fetch(`${BASE_URL}/upload/statement`, {
      method: 'POST',
      body: formData,
    });
    return res.json();
  },

  async uploadFiles(bankFile, ledgerFile, password) {
    const formData = new FormData();
    formData.append('bank_statement', bankFile);
    formData.append('internal_ledger', ledgerFile);
    if (password) formData.append('password', password);

    const res = await fetch(`${BASE_URL}/upload/files`, {
      method: 'POST',
      body: formData,
    });
    return res.json();
  },

  async applyLLMPrompt(promptText, currentData) {
    // TODO Backend: POST /api/llm/adjust
    return { success: true, updatedData: currentData, appliedPrompt: promptText };
  },

  async startProcessing(datasetId) {
    // TODO Backend: POST /api/process/start
    const today = new Date().toLocaleDateString('th-TH');
    return {
      processId: `proc_${Date.now()}`,
      title: `การประมวลผลวันที่ ${today}`,
    };
  },

  // Summary & Graph Data
  async getSummaryData(processId) {
    // TODO Backend: GET /api/summary/:id
    return {
      processId,
      chartData: [
        { date: '2026-07-01', count: 12, anomalyType: null, details: 'ปกติ' },
        { date: '2026-07-02', count: 25, anomalyType: 'BOTH', details: 'ยอดไม่ตรงกันและ Model ตรวจพบความเสี่ยงสูง (รายการที่ 3)' },
        { date: '2026-07-03', count: 18, anomalyType: 'RULE', details: 'ยอดไม่ตรงในรายการเดียวกัน (รายการที่ 7)' },
        { date: '2026-07-04', count: 30, anomalyType: 'MODEL', details: 'Model ตรวจพบรูปแบบธุรกรรมผิดปกติ (รายการที่ 12)' },
        { date: '2026-07-05', count: 15, anomalyType: null, details: 'ปกติ' },
      ],
    };
  },
};