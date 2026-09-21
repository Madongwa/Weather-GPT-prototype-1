import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppSettingsProvider } from './context/AppSettingsContext'
import { AskProvider } from './context/AskContext'
import AppShell from './layout/AppShell'
import HomeScreen from './screens/Home/HomeScreen'
import AskScreen from './screens/Ask/AskScreen'
import ForecastScreen from './screens/Forecast/ForecastScreen'
import MyAdviceScreen from './screens/MyAdvice/MyAdviceScreen'
import AlertsScreen from './screens/Alerts/AlertsScreen'
import AlertDetailScreen from './screens/Alerts/AlertDetailScreen'
import SosScreen from './screens/Sos/SosScreen'
import CommunityReportsScreen from './screens/CommunityReports/CommunityReportsScreen'
import NotificationsScreen from './screens/Notifications/NotificationsScreen'
import YourRoleScreen from './screens/YourRole/YourRoleScreen'
import HistoryScreen from './screens/History/HistoryScreen'
import TrustSourcesScreen from './screens/TrustSources/TrustSourcesScreen'
import OfflineScreen from './screens/Offline/OfflineScreen'
import SettingsScreen from './screens/Settings/SettingsScreen'
import AboutScreen from './screens/About/AboutScreen'

/*
 * React Router matches the current browser URL to a screen component.
 * We're using it instead of a plain `useState` for "which screen is
 * showing" because we want real per-screen URLs — e.g. the Alert Detail
 * view has its own address like /alerts/3 — and normal browser
 * back/forward behavior as you move between screens.
 *
 * <Route element={<AppShell />}> with nested child routes is a "layout
 * route": AppShell (header, drawer, banner, status strip) always
 * renders, and whichever child route matches the URL renders inside it
 * via AppShell's <Outlet />.
 */
function App() {
  return (
    <BrowserRouter>
      <AppSettingsProvider>
        <AskProvider>
          <Routes>
            <Route element={<AppShell />}>
              <Route path="/" element={<HomeScreen />} />
              <Route path="/ask" element={<AskScreen />} />
              <Route path="/forecast" element={<ForecastScreen />} />
              <Route path="/advice" element={<MyAdviceScreen />} />
              <Route path="/alerts" element={<AlertsScreen />} />
              <Route path="/alerts/:alertId" element={<AlertDetailScreen />} />
              <Route path="/sos" element={<SosScreen />} />
              <Route path="/community-reports" element={<CommunityReportsScreen />} />
              <Route path="/notifications" element={<NotificationsScreen />} />
              <Route path="/role" element={<YourRoleScreen />} />
              <Route path="/history" element={<HistoryScreen />} />
              <Route path="/trust" element={<TrustSourcesScreen />} />
              <Route path="/offline" element={<OfflineScreen />} />
              <Route path="/settings" element={<SettingsScreen />} />
              <Route path="/about" element={<AboutScreen />} />
            </Route>
          </Routes>
        </AskProvider>
      </AppSettingsProvider>
    </BrowserRouter>
  )
}

export default App
