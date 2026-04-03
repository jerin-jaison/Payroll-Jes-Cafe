import axios from 'axios'

const API_BASE = '/api'

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT token on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`
  }
  return config
})

// Auto-refresh token on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      const refresh = localStorage.getItem('refresh_token')
      if (refresh) {
        try {
          const { data } = await axios.post(`${API_BASE}/auth/token/refresh/`, { refresh })
          localStorage.setItem('access_token', data.access)
          api.defaults.headers.common['Authorization'] = `Bearer ${data.access}`
          return api(original)
        } catch {
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          window.location.href = '/admin-panel/login'
        }
      }
    }
    return Promise.reject(error)
  }
)

export default api

// ─── API HELPERS ─────────────────────────────────────────────────────────────

export const authAPI = {
  login: (username, password) => api.post('/auth/login/', { username, password }),
  me: () => api.get('/auth/me/'),
}

export const categoryAPI = {
  list: () => api.get('/categories/'),
  create: (data) => api.post('/categories/', data),
  update: (id, data) => api.patch(`/categories/${id}/`, data),
  delete: (id) => api.delete(`/categories/${id}/`),
}

export const menuAPI = {
  list: (params) => api.get('/menu/', { params }),
  get: (id) => api.get(`/menu/${id}/`),
  create: (data) => api.post('/menu/', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, data) => api.patch(`/menu/${id}/`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id) => api.delete(`/menu/${id}/`),
}

export const tableAPI = {
  list: () => api.get('/tables/'),
  create: (data) => api.post('/tables/', data),
  update: (id, data) => api.patch(`/tables/${id}/`, data),
  updateStatus: (id, status) => api.patch(`/tables/${id}/update_status/`, { status }),
  delete: (id) => api.delete(`/tables/${id}/`),
}

export const employeeAPI = {
  list: () => api.get('/employees/'),
  create: (data) => api.post('/employees/', data),
  update: (id, data) => api.patch(`/employees/${id}/`, data),
  delete: (id) => api.delete(`/employees/${id}/`),
  updateHours: (id, hours) => api.patch(`/employees/${id}/update_hours/`, { worked_hours: hours }),
}

export const orderAPI = {
  list: (params) => api.get('/orders/', { params }),
  get: (id) => api.get(`/orders/${id}/`),
  create: (data) => api.post('/orders/', data),
  updateStatus: (id, status) => api.patch(`/orders/${id}/update_status/`, { status }),
  pay: (id, data) => api.post(`/orders/${id}/pay/`, data),
  receipt: (id) => api.get(`/orders/${id}/receipt/`, { responseType: 'blob' }),
}

export const transactionAPI = {
  list: (params) => api.get('/transactions/', { params }),
  exportCSV: (params) => api.get('/transactions/export/', { params: { ...params, format: 'csv' }, responseType: 'blob' }),
  exportPDF: (params) => api.get('/transactions/export/', { params: { ...params, format: 'pdf' }, responseType: 'blob' }),
}

export const expenseAPI = {
  list: (params) => api.get('/expenses/', { params }),
  create: (data) => api.post('/expenses/', data),
  update: (id, data) => api.patch(`/expenses/${id}/`, data),
  delete: (id) => api.delete(`/expenses/${id}/`),
}

export const dashboardAPI = {
  stats: () => api.get('/dashboard/'),
}

export const profitAPI = {
  get: (params) => api.get('/profit/', { params }),
}

export const reportAPI = {
  generate: (data) => api.post('/reports/generate/', data, { responseType: 'blob' }),
}

export const inventoryAPI = {
  get: () => api.get('/inventory/'),
  update: (data) => api.patch('/inventory/', data),
}
