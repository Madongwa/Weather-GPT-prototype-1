import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import './Sidebar.css'

/*
 * Grouped into four sections so a 12-item list still reads as
 * navigable rather than one long undifferentiated column: core weather
 * features, safety/emergency features, personalization, and meta/
 * settings. `label: null` renders no divider above the first group —
 * Home/Ask/Forecast need no explanation, they're just "the app."
 */
const NAV_GROUPS = [
  {
    label: null,
    items: [
      { to: '/', key: 'nav.home' },
      { to: '/ask', key: 'nav.ask' },
      { to: '/forecast', key: 'nav.forecast' },
    ],
  },
  {
    label: 'nav.groupSafety',
    items: [
      { to: '/alerts', key: 'nav.alerts' },
      { to: '/sos', key: 'nav.sos' },
      { to: '/community-reports', key: 'nav.communityReports' },
      { to: '/notifications', key: 'nav.notifications' },
    ],
  },
  {
    label: 'nav.groupYou',
    items: [
      { to: '/advice', key: 'nav.myAdvice' },
      { to: '/role', key: 'nav.yourRole' },
      { to: '/history', key: 'nav.history' },
    ],
  },
  {
    label: 'nav.groupMore',
    items: [
      { to: '/trust', key: 'nav.trustSources' },
      { to: '/offline', key: 'nav.offline' },
      { to: '/settings', key: 'nav.settings' },
      { to: '/about', key: 'nav.about' },
    ],
  },
]

/**
 * The nav drawer. On narrow screens it's an off-canvas panel toggled by
 * the header's hamburger button (`open`/`onClose` are lifted up to
 * AppShell, which owns that state). On wide screens (see Sidebar.css)
 * the exact same markup is pinned open permanently — one component
 * covers both layouts instead of maintaining two.
 *
 * `NavLink` (vs. plain `Link`) knows whether its own route is currently
 * active and lets us style it differently — that's the `isActive` flag
 * below.
 */
function Sidebar({ open, onClose }) {
  const { t } = useTranslation()

  return (
    <>
      {/* The backdrop only renders while open on mobile, so it only
          intercepts clicks then; the wide-screen persistent sidebar has
          no backdrop because CSS hides it there regardless of `open`. */}
      {open && (
        <button type="button" className="sidebar__backdrop" aria-label="Close menu" onClick={onClose} />
      )}

      <nav className={`sidebar ${open ? 'sidebar--open' : ''}`} aria-label="Main navigation">
        <p className="sidebar__title">WeatherGPT</p>
        {NAV_GROUPS.map((group, groupIndex) => (
          <div className="sidebar__group" key={group.label ?? `group-${groupIndex}`}>
            {group.label && <p className="sidebar__group-label">{t(group.label)}</p>}
            <ul className="sidebar__list">
              {group.items.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.to === '/'}
                    className={({ isActive }) =>
                      `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`
                    }
                    onClick={onClose}
                  >
                    {t(item.key)}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </>
  )
}

export default Sidebar
