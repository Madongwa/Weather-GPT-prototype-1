import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppSettings } from '../../context/AppSettingsContext'
import { LANGUAGES } from '../../constants/languages'
import './SettingsScreen.css'

const UNITS = [
  { value: 'C', label: '°C' },
  { value: 'F', label: '°F' },
]

const NOTIFICATION_PREFS = [
  { key: 'severeAlerts', label: 'Severe weather alerts' },
  { key: 'communityReports', label: 'New community reports near me' },
  { key: 'weeklyDigest', label: 'Weekly forecast digest' },
]

/**
 * User-preference concerns only — language, units, notification prefs.
 * Demo Mode and the data-source status board stay on Trust & Sources,
 * which remains the transparency/demo-control page; this screen is
 * purely "how I want the app to behave for me."
 *
 * The language picker reuses AppSettingsContext's real `language`
 * state (same value the old StatusStrip/HomeHeader pills drove) rather
 * than reimplementing it. Units and notification prefs are new here —
 * both UI-only mocks for this session, called out explicitly below
 * rather than silently pretending to be wired up.
 */
function SettingsScreen() {
  const { language, setLanguage } = useAppSettings()
  const { t } = useTranslation()
  const [unit, setUnit] = useState('C')
  const [notifPrefs, setNotifPrefs] = useState({
    severeAlerts: true,
    communityReports: false,
    weeklyDigest: false,
  })

  const toggleNotifPref = (key) => {
    setNotifPrefs((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div className="settings-screen">
      <h1 className="settings-screen__title">{t('settings.title')}</h1>

      <section className="settings-screen__card">
        <h2 className="settings-screen__section-title">{t('settings.languageTitle')}</h2>
        <div className="settings-screen__options">
          {LANGUAGES.map((option) => (
            <button
              key={option}
              type="button"
              className={`settings-screen__option ${
                language === option ? 'settings-screen__option--active' : ''
              }`}
              aria-pressed={language === option}
              onClick={() => setLanguage(option)}
            >
              {option}
            </button>
          ))}
        </div>
      </section>

      <section className="settings-screen__card">
        <h2 className="settings-screen__section-title">{t('settings.unitsTitle')}</h2>
        <p className="settings-screen__note">
          TODO: UI-only for now — switching this doesn't convert displayed temperatures yet.
        </p>
        <div className="settings-screen__options">
          {UNITS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`settings-screen__option ${
                unit === option.value ? 'settings-screen__option--active' : ''
              }`}
              aria-pressed={unit === option.value}
              onClick={() => setUnit(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </section>

      <section className="settings-screen__card">
        <h2 className="settings-screen__section-title">{t('settings.notificationsTitle')}</h2>
        <p className="settings-screen__note">
          TODO: UI-only for now — these switches aren't wired to real push notifications yet.
        </p>
        <div className="settings-screen__toggle-list">
          {NOTIFICATION_PREFS.map((pref) => (
            <label key={pref.key} className="settings-screen__toggle-row">
              <span>{pref.label}</span>
              <input
                type="checkbox"
                checked={notifPrefs[pref.key]}
                onChange={() => toggleNotifPref(pref.key)}
              />
            </label>
          ))}
        </div>
      </section>
    </div>
  )
}

export default SettingsScreen
