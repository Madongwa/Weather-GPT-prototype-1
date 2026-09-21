import { apiFetch } from './client'

export const createCheckin = (payload) =>
  apiFetch('/checkins', { method: 'POST', body: JSON.stringify(payload) })

export const getLatestCheckin = () => apiFetch('/checkins/latest')
