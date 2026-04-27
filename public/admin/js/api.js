/**
 * API 请求层 - 管理后台
 */
const API_BASE = '';

function getToken() {
  return localStorage.getItem('admin_token');
}

function getAuthHeaders() {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

async function request(url, options = {}) {
  const fullUrl = (API_BASE || window.location.origin) + url;
  const config = {
    ...options,
    headers: { ...getAuthHeaders(), ...options.headers }
  };
  let res;
  try {
    res = await fetch(fullUrl, config);
  } catch (err) {
    throw new Error('网络错误，请确认后端已启动');
  }
  const data = await res.json().catch(() => ({}));

  if (res.status === 401) {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    window.location.hash = '#/login';
    throw new Error(data.message || '登录已过期');
  }

  if (res.status >= 400) {
    throw new Error(data.message || data.error || '请求失败');
  }

  return data;
}

const AdminAPI = {
  // 登录
  async login(username, password) {
    const res = await request('/api/auth/admin/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    return res.data;
  },

  // 班主任
  async getTeachers(page = 1, pageSize = 10, search = '') {
    const params = new URLSearchParams({ page, pageSize });
    if (search) params.append('search', search);
    const res = await request(`/api/admin/teachers?${params}`);
    return res.data;
  },
  async createTeacher(data) {
    const res = await request('/api/admin/teachers', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return res.data;
  },
  async deleteTeacher(id) {
    const res = await request(`/api/admin/teachers/${id}`, { method: 'DELETE' });
    return res.data;
  },

  // 学生
  async getStudents(page = 1, pageSize = 10, classId = '', search = '') {
    const params = new URLSearchParams({ page, pageSize });
    if (classId) params.append('classId', classId);
    if (search) params.append('search', search);
    const res = await request(`/api/admin/students?${params}`);
    return res.data;
  },
  async importStudents(file) {
    const formData = new FormData();
    formData.append('file', file);
    const token = getToken();
    const res = await fetch(`${API_BASE}/api/admin/students/import`, {
      method: 'POST',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      body: formData
    });
    const data = await res.json();
    if (res.status === 401) {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      window.location.hash = '#/login';
      throw new Error('登录已过期');
    }
    if (res.status >= 400) throw new Error(data.message || '导入失败');
    return data.data;
  },

  async deleteStudents(studentIds) {
    const res = await request('/api/admin/students/batch-delete', {
      method: 'POST',
      body: JSON.stringify({ studentIds })
    });
    return res.data;
  },

  async deleteStudentsByClasses(classIds) {
    const res = await request('/api/admin/students/batch-delete-by-classes', {
      method: 'POST',
      body: JSON.stringify({ classIds })
    });
    return res.data;
  },

  // 学期
  async getSemesters() {
    const res = await request('/api/admin/semesters');
    return res.data;
  },
  async createSemester(data) {
    const res = await request('/api/admin/semesters', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return res.data;
  },
  async updateSemester(id, data) {
    const res = await request(`/api/admin/semesters/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    return res.data;
  },
  async activateSemester(id) {
    const res = await request(`/api/admin/semesters/${id}/activate`, {
      method: 'PATCH'
    });
    return res.data;
  },

  // 班级
  async getClasses() {
    const res = await request('/api/admin/classes');
    return res.data;
  },
  async createClass(data) {
    const res = await request('/api/admin/classes', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return res.data;
  },
  async deleteClass(id) {
    const res = await request(`/api/admin/classes/${id}`, { method: 'DELETE' });
    return res.data;
  },
  async batchCreateClasses(prefix, start, end) {
    const res = await request('/api/admin/classes/batch', {
      method: 'POST',
      body: JSON.stringify({ prefix: String(prefix ?? ''), start: String(start ?? ''), end: String(end ?? '') })
    });
    return res.data;
  },

  // 积分记录
  async getScoreRecords(params = {}) {
    const q = new URLSearchParams(params);
    const res = await request(`/api/admin/score-records?${q}`);
    return res.data;
  },

  // 操作日志
  async getOperationLogs(params = {}) {
    const q = new URLSearchParams(params);
    const res = await request(`/api/admin/operation-logs?${q}`);
    return res.data;
  },

  // 导出（使用 fetch 携带 token，触发下载）
  async exportStudents(classId, semesterId, search) {
    const params = new URLSearchParams();
    if (classId) params.append('classId', classId);
    if (semesterId) params.append('semesterId', semesterId);
    if (search) params.append('search', search);
    const res = await fetch(`${API_BASE}/api/admin/export/students?${params}`, {
      headers: getAuthHeaders()
    });
    if (res.status === 401) {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      window.location.hash = '#/login';
      throw new Error('登录已过期');
    }
    if (!res.ok) throw new Error(res.status === 404 ? '未找到匹配的学生' : '导出失败');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `学生信息_${Date.now()}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  },
  async exportRecords(params = {}) {
    const q = new URLSearchParams(params);
    const res = await fetch(`${API_BASE}/api/admin/export/records?${q}`, {
      headers: getAuthHeaders()
    });
    if (res.status === 401) {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      window.location.hash = '#/login';
      throw new Error('登录已过期');
    }
    if (!res.ok) throw new Error(res.status === 404 ? '未找到匹配的数据' : '导出失败');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `积分记录_${Date.now()}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  }
};
