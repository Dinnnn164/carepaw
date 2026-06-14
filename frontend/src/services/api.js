import axios from 'axios';

const API = axios.create({ baseURL: '/api' });

API.interceptors.request.use(cfg => {
  const token = localStorage.getItem('token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

API.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  login: (d) => API.post('/auth/login', d),
  register: (d) => API.post('/auth/register', d),
  me: () => API.get('/auth/me'),
  updateProfile: (d) => API.put('/auth/profile', d),
};

export const animalsAPI = {
  getAll: (params) => API.get('/animals', { params }),
  getOne: (id) => API.get(`/animals/${id}`),
  create: (d) => API.post('/animals', d),
  update: (id, d) => API.put(`/animals/${id}`, d),
  review: (id, d) => API.put(`/animals/${id}/review`, d),
  delete: (id) => API.delete(`/animals/${id}`),
};

export const sheltersAPI = {
  getAll: (params) => API.get('/shelters', { params }),
  getOne: (id) => API.get(`/shelters/${id}`),
  create: (d) => API.post('/shelters', d),
  update: (id, d) => API.put(`/shelters/${id}`, d),
  getMy: () => API.get('/shelters/my/info'),
};

export const applicationsAPI = {
  getAll: (params) => API.get('/applications', { params }),
  create: (d) => API.post('/applications', d),
  updateStatus: (id, d) => API.put(`/applications/${id}`, d),
  cancel: (id) => API.put(`/applications/${id}/cancel`),
};

export const statsAPI = {
  general: () => API.get('/stats/general'),
  admin: () => API.get('/stats/admin'),
  shelter: () => API.get('/stats/shelter'),
};

export const usersAPI = {
  getAll: (params) => API.get('/users', { params }),
  toggleActive: (id) => API.put(`/users/${id}/toggle`),
  changeRole: (id, role) => API.put(`/users/${id}/role`, { role }),
  delete: (id) => API.delete(`/users/${id}`),
};

export const aiAPI = {
  chat: (d) => API.post('/ai/chat', d),
};

export const postsAPI = {
  getAll: (params) => API.get('/posts', { params }),
  getOne: (id) => API.get(`/posts/${id}`),
  create: (d) => API.post('/posts', d),
  delete: (id) => API.delete(`/posts/${id}`),
};

export default API;