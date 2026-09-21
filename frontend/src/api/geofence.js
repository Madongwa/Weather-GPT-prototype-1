import { apiFetch } from './client'

export const checkGeofence = (latitude, longitude, district) =>
  apiFetch(
    `/geofence/check?latitude=${latitude}&longitude=${longitude}&district=${encodeURIComponent(district)}`,
  )
