import { apiFetch } from './client'

export const listAlerts = (district) =>
  apiFetch(`/alerts${district ? `?district=${encodeURIComponent(district)}` : ''}`)

export const getAlert = (id) => apiFetch(`/alerts/${id}`)

export const simulateAlert = (scenario, district) =>
  apiFetch(`/alerts/simulate/${scenario}${district ? `?district=${encodeURIComponent(district)}` : ''}`, {
    method: 'POST',
  })

export const issueAlert = (payload, authToken) =>
  apiFetch('/alerts', { method: 'POST', body: JSON.stringify(payload), authToken })

export const advanceAlert = (id, authToken) =>
  apiFetch(`/alerts/${id}/advance`, { method: 'POST', authToken })
