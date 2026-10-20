import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '';

if (!import.meta.env.VITE_API_URL) {
  console.warn('VITE_API_URL is not set. API requests will be sent to the current origin. Set VITE_API_URL in Vercel for deployed frontend.');
}

// In-memory access token storage (never written to localStorage)
let inMemoryToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  inMemoryToken = token;
};

export const getAuthToken = () => inMemoryToken;

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // Required for transmitting HTTP-only refresh cookies
});

// Attach in-memory JWT access token to every request
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (inMemoryToken) {
    config.headers.Authorization = `Bearer ${inMemoryToken}`;
  }
  return config;
});

// Response interceptor: automatic token refresh on 401 with infinite-loop guard
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Avoid refresh loops for auth endpoints
    const url = originalRequest?.url || '';
    const isAuthEndpoint =
      url.includes('/auth/login') ||
      url.includes('/auth/register') ||
      url.includes('/auth/refresh') ||
      url.includes('/auth/logout') ||
      url.includes('/auth/forgot-password') ||
      url.includes('/auth/reset-password');

    if (error.response?.status === 401 && !originalRequest?._retry && !isAuthEndpoint) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshResponse = await api.post('/auth/refresh');
        const newToken = refreshResponse.data.access_token;
        setAuthToken(newToken);
        processQueue(null, newToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
        }
        return api(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        setAuthToken(null);
        window.dispatchEvent(new CustomEvent('auth:expired'));
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
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
  refresh: () => api.post('/auth/refresh'),
  logout: () => api.post('/auth/logout'),
  forgotPassword: (data: { email: string }) =>
    api.post('/auth/forgot-password', data),
  resetPassword: (data: { token: string; new_password: string }) =>
    api.post('/auth/reset-password', data),
};

// ── User ─────────────────────────────────────────────────
export const userAPI = {
  getProfile: () => api.get('/user/profile'),
  updateProfile: (data: { full_name?: string; email?: string }) =>
    api.put('/user/profile', data),
  upgradeSubscription: (code: string) =>
    api.post('/user/upgrade', { code }),
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

// ── Administration ───────────────────────────────────────
export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  listUsers: () => api.get('/admin/users'),
};

export default api;
