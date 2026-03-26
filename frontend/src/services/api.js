import axios from "axios";

// In development: CRA proxy forwards /api to localhost:5000
// In production (Docker): Nginx proxies /api to the backend container
const API_BASE_URL = process.env.REACT_APP_API_URL || "/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 10000,
});

// Attach JWT token to every request automatically
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401 responses globally — clear token and redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authService = {
  login: (email, password) => api.post("/auth/login", { email, password }),
  getMe: () => api.get("/auth/me"),
};

// ─── Students ─────────────────────────────────────────────────────────────────
export const studentService = {
  getAll: () => api.get("/students"),
  getById: (id) => api.get(`/students/${id}`),
  create: (data) => api.post("/students", data),
  update: (id, data) => api.put(`/students/${id}`, data),
  delete: (id) => api.delete(`/students/${id}`),
  getParents: () => api.get("/students/parents"),
};

// ─── Attendance ───────────────────────────────────────────────────────────────
export const attendanceService = {
  record: (data) => api.post("/attendance", data),
  recordBulk: (data) => api.post("/attendance/bulk", data),
  getByStudent: (studentId, params) =>
    api.get(`/attendance/${studentId}`, { params }),
  getByClass: (params) => api.get("/attendance/class", { params }),
  update: (id, data) => api.put(`/attendance/${id}`, data),
};

// ─── Scores ───────────────────────────────────────────────────────────────────
export const scoreService = {
  add: (data) => api.post("/scores", data),
  getByStudent: (studentId, params) =>
    api.get(`/scores/${studentId}`, { params }),
  update: (id, data) => api.put(`/scores/${id}`, data),
  delete: (id) => api.delete(`/scores/${id}`),
};

export default api;
