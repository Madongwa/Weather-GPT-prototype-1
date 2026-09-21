import { useEffect, useState } from 'react'
import { listAlerts } from '../api/alerts'
import { SAMPLE_ALERTS } from '../screens/Alerts/sampleAlerts'

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

  const refresh = () => {
    listAlerts(district)
      .then((data) => {
        setAlerts(data)
        setUsingSampleAlerts(false)
      })
      .catch(() => {
        setAlerts(SAMPLE_ALERTS)
        setUsingSampleAlerts(true)
      })
  }

  useEffect(refresh, [district])

  return { alerts, usingSampleAlerts, refresh }
}
