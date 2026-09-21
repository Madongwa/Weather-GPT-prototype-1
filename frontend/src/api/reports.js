import { apiFetch } from './client'

export const listReports = (district) =>
  apiFetch(`/reports${district ? `?district=${encodeURIComponent(district)}` : ''}`)

export const createReport = (payload) =>
  apiFetch('/reports', { method: 'POST', body: JSON.stringify(payload) })
