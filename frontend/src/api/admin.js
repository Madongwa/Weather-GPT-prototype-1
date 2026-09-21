import { apiFetch } from './client'

export const adminLogin = (password) =>
  apiFetch('/admin/login', { method: 'POST', body: JSON.stringify({ password }) })
