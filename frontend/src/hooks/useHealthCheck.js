import { useEffect, useState } from 'react'

// Same VITE_API_BASE override as api/client.js — see that file's comment.
const HEALTH_URL = `${import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8000'}/health`
const POLL_INTERVAL_MS = 20000

/**
 * Pings the backend's /health endpoint on mount and then every
 * POLL_INTERVAL_MS, returning whether the most recent check succeeded.
 * This is what drives the teal/amber connectivity dot in the header.
 *
 * Polling (not just a single on-mount check) matters specifically on
 * Android: a cold app launch can win the race against the WebView's
 * network stack still coming up, so a single failed first attempt used
 * to leave the whole session stuck showing "Offline" even once the
 * network was clearly fine seconds later — there was no way for the
 * status to self-correct. This also means a real mid-session
 * connectivity change (wifi drops, plane mode) now reflects within
 * POLL_INTERVAL_MS instead of only ever showing whatever the very
 * first check happened to see.
 *
 * Returns `false` until the first check finishes or if it fails — so
 * the UI starts in the "offline" state and flips to "online" only once
 * we've actually heard back from the server.
 */
export function useHealthCheck() {
  const [isOnline, setIsOnline] = useState(false)

  useEffect(() => {
    // Guards against setting state after the component has already
    // unmounted, which React warns about (e.g. if a fetch resolves
    // after the provider using this hook has gone away).
    let cancelled = false

    const check = () => {
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
    }

    check()
    const intervalId = setInterval(check, POLL_INTERVAL_MS)

    return () => {
      cancelled = true
      clearInterval(intervalId)
    }
  }, [])

  return isOnline
}
