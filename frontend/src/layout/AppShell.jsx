import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Header from '../components/Header/Header'
import Sidebar from './Sidebar'
import DemoBanner from './DemoBanner'
import StatusStrip from './StatusStrip'
import InstallPrompt from '../components/InstallPrompt/InstallPrompt'
import OnboardingTour from '../components/OnboardingTour/OnboardingTour'
import { useAppSettings } from '../context/AppSettingsContext'
import './AppShell.css'

/**
 * The shared frame around every screen: header, nav drawer, demo
 * banner, and status strip all render here exactly once, and whichever
 * screen matches the current URL renders inside `<Outlet />`. This is
 * what React Router calls a "layout route" — see App.jsx for how it's
 * wired into the route tree.
 */
function AppShell() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { isOnline } = useAppSettings()
  const location = useLocation()
  const isHome = location.pathname === '/'

  return (
    <div className="shell">
      <Sidebar open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <div className="shell__content">
        {/* Home owns a richer header of its own (logo, location, role/
            district/language pills, online status, settings) — see
            HomeHeader.jsx. Rendering both that AND this Header's
            wordmark/online-dot, plus StatusStrip's role/district/
            language pills, would show the same state twice from two
            different places. So on Home: Header renders hamburger-only
            (still needed to open the drawer on mobile — HomeHeader
            doesn't own that), and StatusStrip doesn't render at all.
            Every other screen keeps both exactly as before. */}
        <Header isOnline={isOnline} onMenuClick={() => setDrawerOpen((prev) => !prev)} hideBranding={isHome} />
        <DemoBanner />
        {!isHome && <StatusStrip />}

        <main className="shell__main">
          <Outlet />
        </main>
      </div>

      <InstallPrompt />
      <OnboardingTour />
    </div>
  )
}

export default AppShell
