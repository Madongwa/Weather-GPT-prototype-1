import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppSettings } from '../context/AppSettingsContext'
import './DemoBanner.css'

const DISMISS_KEY = 'weathergpt.demoBannerDismissed'

/**
 * Thin app-wide banner shown whenever Demo Mode is active (see Trust &
 * Sources for the switch). Uses sessionStorage rather than localStorage
 * for the dismissal flag — sessionStorage clears itself when the tab/
 * window closes, which is exactly what "dismissible per session" means:
 * it won't nag you again this visit, but it's back next time you open
 * the app, in case Demo Mode is still on.
 */
function DemoBanner() {
  const { demoMode } = useAppSettings()
  const { t } = useTranslation()
  const [dismissed, setDismissed] = useState(() => sessionStorage.getItem(DISMISS_KEY) === '1')

  if (demoMode !== 'demo' || dismissed) return null

  const dismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, '1')
    setDismissed(true)
  }

  return (
    <div className="demo-banner">
      <span>{t('demoBanner.text')}</span>
      <button type="button" className="demo-banner__dismiss" onClick={dismiss} aria-label="Dismiss">
        ×
      </button>
    </div>
  )
}

export default DemoBanner
