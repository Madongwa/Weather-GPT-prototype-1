const STORAGE_KEY = 'weathergpt.deviceId'

/**
 * A random per-browser identifier, generated once and cached in
 * localStorage. This is the "identity-lite" half of the app's auth
 * model (see backend/auth.py): citizens never log in, but SOS reports,
 * People's Reports, and notifications still need something to
 * attribute to "whoever sent this" without asking who they are.
 */
export function getDeviceId() {
  let id = localStorage.getItem(STORAGE_KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(STORAGE_KEY, id)
  }
  return id
}
