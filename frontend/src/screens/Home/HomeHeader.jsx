import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAppSettings } from '../../context/AppSettingsContext'
import { DISTRICTS, stateForDistrict } from '../../constants/districts'
import { ROLES } from '../../constants/roles'
import { LANGUAGES } from '../../constants/languages'
import PickerPopover from '../../layout/PickerPopover'
import './HomeHeader.css'

/**
 * Home's own header — the single source of truth for role, district,
 * language, and online status on this screen. AppShell's global Header
 * and StatusStrip both skip rendering their equivalent pieces on the
 * Home route specifically (see AppShell.jsx) rather than being hidden
 * with CSS, so there's exactly one place reading/writing each of these
 * values here — no risk of two widgets drifting out of sync.
 *
 * Only one picker (role/district/language) can be open at a time —
 * same pattern StatusStrip used, tracked as a single piece of state
 * instead of three separate booleans.
 *
 * The settings gear routes to /settings — user-preference concerns
 * (language, units, notification prefs). Demo Mode and the data source
 * board stay on Trust & Sources, a separate transparency/demo-control
 * page, not a generic settings destination.
 */
function HomeHeader() {
  const { role, setRole, district, setDistrict, language, setLanguage, isOnline } = useAppSettings()
  const [openPicker, setOpenPicker] = useState(null)

  const togglePicker = (name) => setOpenPicker((prev) => (prev === name ? null : name))
  const closePicker = () => setOpenPicker(null)

  return (
    <header className="home-header">
      <div className="home-header__identity">
        <span className="home-header__logo" aria-hidden="true">
          <svg style={{ width: 'var(--icon-lg)', height: 'var(--icon-lg)' }} viewBox="0 0 24 24" fill="none">
            <path
              d="M7 17a4.5 4.5 0 0 1 .5-8.97A6 6 0 0 1 19 10a4.5 4.5 0 0 1-1 7H7Z"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <div>
          <p className="home-header__name">WeatherGPT</p>
          <div className="home-header__pill-wrap">
            <button type="button" className="home-header__location" onClick={() => togglePicker('district')}>
              {district}, {stateForDistrict(district)}
            </button>
            {openPicker === 'district' && (
              <PickerPopover
                options={DISTRICTS}
                value={district}
                onSelect={(value) => {
                  setDistrict(value)
                  closePicker()
                }}
                onClose={closePicker}
              />
            )}
          </div>
        </div>
      </div>

      <div className="home-header__actions">
        <div className="home-header__pill-wrap">
          <button type="button" className="home-header__role-pill" onClick={() => togglePicker('role')}>
            {role}
          </button>
          {openPicker === 'role' && (
            <PickerPopover
              options={ROLES}
              value={role}
              onSelect={(value) => {
                setRole(value)
                closePicker()
              }}
              onClose={closePicker}
            />
          )}
        </div>

        <span className={`home-header__online-pill ${isOnline ? 'home-header__online-pill--online' : ''}`}>
          <svg style={{ width: 'var(--icon-md)', height: 'var(--icon-md)' }} viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M5 9a11 11 0 0 1 14 0M8 12.5a6.5 6.5 0 0 1 8 0M11 16a2 2 0 0 1 2 0"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
          {isOnline ? 'Online' : 'Offline'}
        </span>

        <div className="home-header__pill-wrap">
          <button type="button" className="home-header__language-pill" onClick={() => togglePicker('language')}>
            {language}
          </button>
          {openPicker === 'language' && (
            <PickerPopover
              options={LANGUAGES}
              value={language}
              onSelect={(value) => {
                setLanguage(value)
                closePicker()
              }}
              onClose={closePicker}
            />
          )}
        </div>

        <Link to="/settings" className="home-header__settings" aria-label="Settings">
          <svg style={{ width: 'var(--icon-lg)', height: 'var(--icon-lg)' }} viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
            <path
              d="M19.4 13.5a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.04 1.56V19.9a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.04-1.56 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.56-1.04H4.1a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.56-1.04 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34H10.24a1.7 1.7 0 0 0 1.04-1.56V4.1a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1.04 1.56 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87V10.24a1.7 1.7 0 0 0 1.56 1.04h.1a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.56 1.04Z"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
      </div>
    </header>
  )
}

export default HomeHeader
