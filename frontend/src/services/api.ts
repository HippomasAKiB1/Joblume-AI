import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '';

if (!import.meta.env.VITE_API_URL) {
  console.warn('VITE_API_URL is not set. API requests will be sent to the current origin. Set VITE_API_URL in Vercel for deployed frontend.');
}

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('joblume_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('joblume_token');
      localStorage.removeItem('joblume_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ── Auth ─────────────────────────────────────────────────
export const authAPI = {
  register: (data: { full_name: string; email: string; password: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
};

// ── User ─────────────────────────────────────────────────
export const userAPI = {
  getProfile: () => api.get('/user/profile'),
  updateProfile: (data: { full_name?: string; email?: string }) =>
    api.put('/user/profile', data),
};

// ── Resumes ──────────────────────────────────────────────
export const resumeAPI = {
  create: (data: { title: string; template_name: string; json_data: object }) =>
    api.post('/resume/create', data),
  list: () => api.get('/resume/list'),
  get: (id: string) => api.get(`/resume/${id}`),
  update: (id: string, data: { title?: string; template_name?: string; json_data?: object }) =>
    api.put(`/resume/${id}`, data),
  delete: (id: string) => api.delete(`/resume/${id}`),
  exportPDF: (id: string) => api.get(`/resume/${id}/export/pdf`, { responseType: 'blob' }),
  exportDOCX: (id: string) => api.get(`/resume/${id}/export/docx`, { responseType: 'blob' }),
};

// ── AI ───────────────────────────────────────────────────
export const aiAPI = {
  tailorJob: (data: { resume_id: string; job_description: string }) =>
    api.post('/ai/tailor-job', data),
  generateCoverLetter: (data: { resume_id: string; job_title: string; company_name: string; job_description: string }) =>
    api.post('/ai/generate-cover-letter', data),
  atsScore: (data: { resume_id: string }) =>
    api.post('/ai/ats-score', data),
  uploadJD: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.post('/ai/upload-jd', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  refineResume: (data: { json_data: object }) =>
    api.post('/ai/refine-resume', data),
};

// ── Applications ─────────────────────────────────────────
export const applicationAPI = {
  create: (data: { company: string; position: string; status: string; applied_date: string; notes?: string }) =>
    api.post('/applications/create', data),
  list: () => api.get('/applications/list'),
  update: (id: string, data: object) => api.put(`/applications/${id}`, data),
  delete: (id: string) => api.delete(`/applications/${id}`),
};

export default api;
