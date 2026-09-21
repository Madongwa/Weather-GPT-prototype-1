import { useTranslation } from 'react-i18next'
import './Header.css'

/**
 * Top row: hamburger menu button (left, opens/closes the nav drawer via
 * `onMenuClick`, owned by AppShell) and a connectivity indicator (right)
 * driven by the /health check result.
 *
 * The wordmark is only shown at desktop widths (see Header.css), where
 * the sidebar is always pinned open — the hamburger has nothing left to
 * toggle there, so it's hidden and the header carries the app name
 * instead of sitting mostly empty.
 *
 * `hideBranding` is set on the Home route, where HomeHeader already
 * shows the wordmark and its own online-status pill — this drops just
 * that duplicated content while keeping the hamburger, which is still
 * the only way to open the drawer on mobile there.
 */
function Header({ isOnline, onMenuClick, hideBranding = false }) {
  const { t } = useTranslation()

  return (
    <header className="header">
      <button type="button" className="header__menu-btn" aria-label="Open menu" onClick={onMenuClick}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M4 7h16M4 12h16M4 17h16"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>

      {!hideBranding && (
        <>
          <span className="header__wordmark">WeatherGPT</span>

          <div className="header__status">
            <span
              className={`header__dot ${isOnline ? 'header__dot--online' : 'header__dot--offline'}`}
              aria-hidden="true"
            />
            {/* Only show the text label when offline — the dot alone is
                enough when things are working, but "why is nothing
                loading" deserves an explicit word. */}
            {!isOnline && <span className="header__status-label">{t('common.offline')}</span>}
          </div>
        </>
      )}
    </header>
  )
}

export default Header
