import { apiFetch } from './client'

export const sendSos = (payload) => apiFetch('/sos', { method: 'POST', body: JSON.stringify(payload) })

export const listSos = () => apiFetch('/sos')

export const relaySos = (sosId) => apiFetch(`/sos/${sosId}/relay`, { method: 'POST' })
