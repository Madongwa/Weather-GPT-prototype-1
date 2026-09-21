import { getDeviceId } from '../utils/deviceId'

// VITE_API_BASE points at the deployed backend in production (set as a
// Vercel project env var); falls back to the local FastAPI dev server
// when unset, which is the case for plain `npm run dev`.
const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8000'

/**
 * Shared fetch wrapper for every backend call that needs device
 * attribution (alerts, sos, reports, notifications, checkins) — attaches
 * X-Device-Id automatically so individual API modules don't each have to
 * remember to. `authToken`, when passed, adds the admin bearer header
 * (see api/admin.js) for the small set of admin-only routes.
 */
export async function apiFetch(path, { authToken, ...options } = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'X-Device-Id': getDeviceId(),
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...options.headers,
    },
  })

  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    throw new Error(`Request to ${path} failed (${response.status}): ${detail}`)
  }

  return response.status === 204 ? null : response.json()
}
