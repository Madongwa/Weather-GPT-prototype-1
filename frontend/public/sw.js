/**
 * Minimal service worker: network-first for same-origin GET requests,
 * falling back to a cached copy only when the network fails. The
 * previous version of this file was accidentally cache-first (checked
 * the cache before the network, so once something was cached it could
 * stay stale indefinitely — including across a dev-server restart with
 * genuinely new code, which is exactly what happened and is why this
 * comment exists). Network-first means the cache is purely a fallback
 * for "offline," never a reason to see old content while online.
 *
 * This does NOT precache the hashed JS/CSS bundle Vite produces at
 * build time — doing that correctly needs a build-time manifest (a
 * tool like vite-plugin-pwa generates one). This hand-written version
 * only caches opportunistically as pages are visited, so the very
 * first visit after a fresh install still needs network access once.
 */

// Bumped so `activate` below purges the old (buggy, cache-first) cache
// instead of continuing to serve whatever it had already stored.
const CACHE_NAME = 'weathergpt-shell-v2'

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET' || !request.url.startsWith(self.location.origin)) return

  // The on-device LLM's model file (see src/llm/localLLM.js) is a
  // ~500MB static asset already bundled into the app — cloning and
  // writing a response that size into Cache Storage on every load is
  // pure overhead (and a real risk of stalling/OOMing on a memory-
  // constrained phone) for a file that never needs an offline fallback
  // in the first place. Let the browser handle it directly instead.
  if (request.url.includes('/models/')) return

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy))
        }
        return response
      })
      .catch(() => caches.open(CACHE_NAME).then((cache) => cache.match(request))),
  )
})
