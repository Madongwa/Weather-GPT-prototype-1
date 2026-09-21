/**
 * Every `created_at`/`expires_at` field from our own backend comes from
 * SQLite's `CURRENT_TIMESTAMP` (see backend/db.py) — a real UTC instant,
 * but serialized as a naive string like "2026-09-21 13:10:51" with no
 * "T" separator or "Z"/offset marker. `new Date(...)` on a string in
 * that shape is treated as LOCAL time by JS engines, not UTC, so every
 * "time ago" / formatted date silently shifted by the device's UTC
 * offset — on an IST device (UTC+5:30) a alert issued seconds ago read
 * as "Issued 6h ago". Explicitly marking the string as UTC before
 * parsing fixes it. Open-Meteo-derived timestamps (weather fetched_at,
 * hourly forecast times) are a different, already-correct case — those
 * come back already in the district's local time by Open-Meteo's own
 * design — and should keep using `new Date()` directly, not this.
 */
export function parseUtcDate(sqliteTimestamp) {
  return new Date(`${sqliteTimestamp.replace(' ', 'T')}Z`)
}
