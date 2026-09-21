import { useEffect, useState } from 'react'

// Same VITE_API_BASE override as api/client.js — see that file's comment.
const HEALTH_URL = `${import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8000'}/health`

/**
 * Pings the backend's /health endpoint once when the component using this
 * hook mounts, and returns whether it responded successfully. This is
 * what drives the teal/amber connectivity dot in the header.
 *
 * Returns `false` until the check finishes or if it fails — so the UI
 * starts in the "offline" state and flips to "online" only once we've
 * actually heard back from the server.
 */
export function useHealthCheck() {
  const [isOnline, setIsOnline] = useState(false)

  useEffect(() => {
    // Guards against setting state after the component has already
    // unmounted, which React warns about (e.g. if the fetch resolves
    // after the user has navigated away).
    let cancelled = false

    fetch(HEALTH_URL)
      .then((response) => {
        if (!response.ok) throw new Error(`Unexpected status ${response.status}`)
        return response.json()
      })
      .then((data) => {
        if (!cancelled) setIsOnline(data.status === 'ok')
      })
      .catch(() => {
        if (!cancelled) setIsOnline(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  return isOnline
}
