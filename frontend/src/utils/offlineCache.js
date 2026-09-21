const PREFIX = 'weathergpt.cache.'

/**
 * A thin localStorage cache for "last known good" data — matches the
 * pattern AppSettingsContext already uses for persisted settings, no
 * new dependency (IndexedDB/Dexie) pulled in for what's really just a
 * handful of small JSON blobs. Each entry is `{ data, fetchedAt }` so a
 * consumer can show both the stale data and how stale it is, instead of
 * silently pretending a cached value is live.
 *
 * Deliberately not a generic "offline queue" — nothing here gets synced
 * back out. It's read-only stand-in data for when a live fetch fails,
 * for exactly the screens (Home's weather card, alerts) that already
 * have an honest "Sample data" fallback for the no-real-data case; this
 * is the same idea for the had-real-data-once-but-not-right-now case.
 */
export function setCached(key, data) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify({ data, fetchedAt: new Date().toISOString() }))
  } catch {
    // Storage full or unavailable (private browsing, etc.) — caching is
    // a nice-to-have, never worth failing the caller over.
  }
}

export function getCached(key) {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

// Lets the Offline & Sync screen list every bucket without hardcoding
// the key list twice — it just asks localStorage what's actually there.
export function listCachedKeys() {
  const keys = []
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i)
    if (key?.startsWith(PREFIX)) keys.push(key.slice(PREFIX.length))
  }
  return keys
}
