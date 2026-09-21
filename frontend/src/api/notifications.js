import { apiFetch } from './client'

export const listNotifications = () => apiFetch('/notifications')

export const createNotification = (payload) =>
  apiFetch('/notifications', { method: 'POST', body: JSON.stringify(payload) })

export const markNotificationRead = (id) => apiFetch(`/notifications/${id}/read`, { method: 'POST' })

export const markAllNotificationsRead = () => apiFetch('/notifications/read-all', { method: 'POST' })
