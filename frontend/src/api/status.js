import { apiFetch } from './client'

export const getBackendStatus = () => apiFetch('/status')
