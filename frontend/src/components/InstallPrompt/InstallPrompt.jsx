import { useEffect, useState } from 'react'
import './InstallPrompt.css'

const DISMISS_KEY = 'weathergpt.installPromptDismissed'

/**
 * Real `beforeinstallprompt` wiring, not a fake "install" button —
 * Chrome/Edge only fire that event once the page already qualifies as
 * installable (manifest + service worker present, served over HTTPS or
 * localhost). This panel renders nothing until the browser actually
 * offers install, so it never promises something that isn't there.
 */
function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(DISMISS_KEY) === '1')

  useEffect(() => {
    const handler = (event) => {
      event.preventDefault()
      setDeferredPrompt(event)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  if (!deferredPrompt || dismissed) return null

  const handleInstall = async () => {
    deferredPrompt.prompt()
    await deferredPrompt.userChoice
    setDeferredPrompt(null)
  }

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, '1')
    setDismissed(true)
  }

  return (
    <div className="install-prompt">
      <p className="install-prompt__text">Install WeatherGPT for quicker, offline-friendly access.</p>
      <div className="install-prompt__actions">
        <button type="button" className="install-prompt__install" onClick={handleInstall}>
          Install
        </button>
        <button type="button" className="install-prompt__dismiss" onClick={handleDismiss}>
          Not now
        </button>
      </div>
    </div>
  )
}

export default InstallPrompt
