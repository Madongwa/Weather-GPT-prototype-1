import { useEffect, useState } from 'react'
import { getCached, setCached } from '../utils/offlineCache'

// Same VITE_API_BASE override as api/client.js.
const WEATHER_URL = `${import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8000'}/weather`

/**
 * Fetches live current-conditions data for a district from the backend's
 * /weather route, which calls the real Open-Meteo API — nothing here is
 * mocked. Pass `null` (rather than skipping the hook) when the caller
 * doesn't want a live fetch right now — e.g. HomeScreen passes `null` in
 * Demo Mode so this never runs against real Demo data.
 *
 * Returns `{ data, error, loading }` instead of just the data, because
 * the caller needs to tell "still loading" apart from "fetch failed"
 * apart from "succeeded" to show the right Grounded/Unverified state.
 */
export function useWeather(district) {
  const [state, setState] = useState({ data: null, error: null, loading: Boolean(district) })

  useEffect(() => {
    if (!district) {
      setState({ data: null, error: null, loading: false })
      return
    }

    let cancelled = false
    setState({ data: null, error: null, loading: true })

    const cacheKey = `weather.${district}`

    fetch(`${WEATHER_URL}?district=${encodeURIComponent(district)}`)
      .then((response) => {
        if (!response.ok) throw new Error(`Unexpected status ${response.status}`)
        return response.json()
      })
      .then((data) => {
        if (cancelled) return
        setCached(cacheKey, data)
        setState({ data, error: null, loading: false })
      })
      .catch((error) => {
        if (cancelled) return
        // Offline or the request failed — fall back to the last real
        // fetch for this district rather than a bare error, but flagged
        // `stale` so callers can show it as "cached", not live.
        const cached = getCached(cacheKey)
        if (cached) {
          setState({ data: { ...cached.data, stale: true, cachedAt: cached.fetchedAt }, error, loading: false })
        } else {
          setState({ data: null, error, loading: false })
        }
      })

    return () => {
      cancelled = true
    }
  }, [district])

  return state
}
