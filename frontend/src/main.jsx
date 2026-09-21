import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './i18n' // side-effect import: runs i18next.init() before anything renders
import './styles/breakpoints.css'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Registered after the initial render, not blocking it — the service
// worker (public/sw.js) is a progressive enhancement (runtime caching
// for the app shell), and `beforeinstallprompt` (see InstallPrompt.jsx)
// only fires once a service worker is registered, which is why this is
// here rather than left out entirely.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Registration can fail (e.g. not served over HTTPS/localhost) —
      // the app works fine without it, just without offline caching.
    })
  })
}
