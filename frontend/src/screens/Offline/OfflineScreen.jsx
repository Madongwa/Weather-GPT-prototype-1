import { useEffect, useState } from 'react'
import { getCached, listCachedKeys } from '../../utils/offlineCache'
import './OfflineScreen.css'

const STALE_AFTER_MS = 30 * 60 * 1000

function labelForKey(key) {
  const [bucket, ...rest] = key.split('.')
  const detail = rest.join('.')
  if (bucket === 'weather') return `Weather — ${detail}`
  if (bucket === 'alerts') return `Alerts — ${detail === 'all' ? 'all districts' : detail}`
  return key
}

function formatAge(isoTime) {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(isoTime).getTime()) / 60000))
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.round(hours / 24)}d ago`
}

/**
 * What this device still has saved from the last successful fetch (see
 * utils/offlineCache.js, wired into useWeather/useAlerts) — used
 * automatically when a live request fails. Not a settings screen:
 * nothing here is editable, it exists so offline fallback behavior
 * isn't a black box — a visitor can see exactly what's stored and how
 * stale it is, the same "show your work" pattern Trust & Sources uses
 * for the live/mock data question.
 */
function OfflineScreen() {
  const [entries, setEntries] = useState([])

  useEffect(() => {
    const rows = listCachedKeys()
      .map((key) => ({ key, ...getCached(key) }))
      .filter((entry) => entry.data)
      .sort((a, b) => new Date(b.fetchedAt) - new Date(a.fetchedAt))
    setEntries(rows)
  }, [])

  return (
    <div className="offline-screen">
      <h1 className="offline-screen__title">Offline & Sync</h1>
      <p className="offline-screen__disclaimer">
        What this device still has saved from the last successful fetch — used automatically when
        a live request fails, instead of showing an error.
      </p>

      {entries.length === 0 ? (
        <p className="offline-screen__empty">
          Nothing cached yet — visit Home or Alerts & Field Reports while online to store a copy.
        </p>
      ) : (
        <ul className="offline-screen__list">
          {entries.map((entry) => {
            const stale = Date.now() - new Date(entry.fetchedAt).getTime() > STALE_AFTER_MS
            return (
              <li
                key={entry.key}
                className={`offline-screen__item ${stale ? 'offline-screen__item--stale' : ''}`}
              >
                <span className="offline-screen__item-label">{labelForKey(entry.key)}</span>
                <span className="offline-screen__item-age">Last saved {formatAge(entry.fetchedAt)}</span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

export default OfflineScreen
