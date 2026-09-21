import { useCallback, useEffect, useState } from 'react'
import { listAlerts } from '../api/alerts'
import { SAMPLE_ALERTS } from '../screens/Alerts/sampleAlerts'
import { getCached, setCached } from '../utils/offlineCache'

/**
 * Shared alert-fetching logic — used by the Alerts screen's full list
 * and the Ask screen's compact preview banner, so both agree on the
 * same graceful-degradation behavior instead of drifting apart.
 *
 * Unlike Home/Ask's weather card, this always tries the real backend
 * first regardless of Demo Mode — Trust & Sources' scenario simulators
 * write real (if fake-content) rows here, so callers need to see the
 * real database to show them. Only on an actual fetch failure does it
 * fall back to static sample alerts, tagged accordingly.
 */
export function useAlerts(district) {
  const [alerts, setAlerts] = useState([])
  const [usingSampleAlerts, setUsingSampleAlerts] = useState(false)

  const refresh = useCallback(() => {
    const cacheKey = `alerts.${district ?? 'all'}`
    listAlerts(district)
      .then((data) => {
        setCached(cacheKey, data)
        setAlerts(data)
        setUsingSampleAlerts(false)
      })
      .catch(() => {
        // Prefer the last real fetch for this district over the static
        // sample set, when one exists — closer to what's actually true
        // than always-the-same demo alerts, but still marked as not-live
        // via usingSampleAlerts so callers keep treating it as a
        // fallback, not a fresh answer.
        const cached = getCached(cacheKey)
        setAlerts(cached ? cached.data : SAMPLE_ALERTS)
        setUsingSampleAlerts(true)
      })
  }, [district])

  // Polled, not just fetched once — the backend now auto-advances
  // simulated alerts' lifecycle on every read (see backend/alerts.py's
  // "lazy advancement on read"), which only becomes visible in the UI if
  // something actually re-fetches periodically. 15s keeps the demo
  // simulators' Detected -> Issued -> Live -> Resolved progression
  // visible without an explicit user action, without hammering the
  // backend the way a 1-2s interval would.
  useEffect(() => {
    refresh()
    const interval = setInterval(refresh, 15000)
    return () => clearInterval(interval)
  }, [refresh])

  return { alerts, usingSampleAlerts, refresh }
}
