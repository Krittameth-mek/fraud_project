const BASE_URL = 'http://127.0.0.1:8000/api';

async function request(path, options = {}) {
  const token = localStorage.getItem('auth_token');
  const headers = { ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.detail || data.message || 'เกิดข้อผิดพลาดจาก Server');
  }
  return data;
}

export const apiService = {
  async login(email, password) {
    const result = await request('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    localStorage.setItem('auth_token', result.token);
    return result;
  },

  async register(email, password) {
    return request('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
  },

  async getCurrentUser() {
    return request('/auth/me');
  },

  async logout() {
    try {
      return await request('/auth/logout', { method: 'POST' });
    } finally {
      localStorage.removeItem('auth_token');
    }
  },

  async sendOTP(email) {
    return { success: true, message: `ส่ง OTP ไปยัง ${email} เรียบร้อยแล้ว` };
  },

  async changePassword(otp, newPassword) {
    return { success: true, message: 'เปลี่ยนรหัสผ่านเรียบร้อย' };
  },

  async deleteAccount(userId) {
    const result = await request(`/auth/account/${userId}`, { method: 'DELETE' });
    localStorage.removeItem('auth_token');
    return result;
  },

  // Process / History Endpoints (now call backend)
  async getProcessList(query = '', searchType = 'uploadDate') {
    const url = new URL(`${BASE_URL}/process/list`);
    if (query) url.searchParams.append('query', query);
    if (searchType) url.searchParams.append('type', searchType);
    return request(`${url.pathname}${url.search}`);
  },

  async renameProcess(id, newTitle) {
    return request(`/process/${id}/rename`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newTitle }),
    });
  },

  async deleteProcess(id) {
    return request(`/process/${id}`, { method: 'DELETE' });
  },

  // Upload & LLM Prompt Endpoints
  async uploadStatement(file, password) {
    const formData = new FormData();
    formData.append('file', file);
    if (password) formData.append('password', password);

    return request('/upload/statement', {
      method: 'POST',
      body: formData,
    });
  },

  async uploadFiles(bankFile, ledgerFile, password) {
    const formData = new FormData();
    formData.append('bank_statement', bankFile);
    formData.append('internal_ledger', ledgerFile);
    if (password) formData.append('password', password);

    return request('/upload/files', {
      method: 'POST',
      body: formData,
    });
  },

  async applyLLMPrompt(promptText, currentData, processId = null) {
    return request('/llm/adjust', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: promptText, data: currentData, processId }),
    });
  },

  async startProcessing(datasetId) {
    return request('/process/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ datasetId }),
    });
  },

  // Summary & Graph Data
  async getSummaryData(processId) {
    return request(`/summary/${processId}`);
  },
};