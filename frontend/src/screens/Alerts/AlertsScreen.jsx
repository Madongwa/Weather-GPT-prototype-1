import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAppSettings } from '../../context/AppSettingsContext'
import { useAlerts } from '../../hooks/useAlerts'
import { DISTRICT_COORDINATES } from '../../constants/districtCoordinates'
import HazardMap from '../../components/HazardMap/HazardMap'
import DemoTag from '../../components/DemoTag/DemoTag'
import AlertCard from './AlertCard'
import AdminIssuePanel from './AdminIssuePanel'
import './AlertsScreen.css'

/**
 * Official warning material only — severity, lifecycle status, alert
 * detail view. SOS and crowdsourced Community Reports used to live in
 * sections on this same screen; they're now their own top-level nav
 * items/routes (see SosScreen and CommunityReportsScreen) so official
 * data and unverified/emergency content never share one page.
 *
 * Unlike Home/Ask, this screen always tries the real backend first
 * regardless of Demo Mode — Trust & Sources' scenario simulators write
 * real (if fake-content) rows here, so this list needs to reflect the
 * real database to show them. Only on an actual fetch failure does it
 * fall back to static sample alerts, tagged accordingly — the same
 * graceful-degradation shape as everywhere else, just triggered by the
 * fetch outcome instead of the Demo Mode flag directly.
 */
function AlertsScreen() {
  const { district, role } = useAppSettings()
  const { t } = useTranslation()
  const { alerts, usingSampleAlerts, refresh: refreshAlerts } = useAlerts(district)

  const center = DISTRICT_COORDINATES[district] ?? DISTRICT_COORDINATES.Hyderabad

  return (
    <div className="alerts-screen">
      <div className="alerts-screen__header">
        <h1 className="alerts-screen__title">{t('alerts.title')}</h1>
        <div className="alerts-screen__header-actions">
          <Link to="/community-reports" className="alerts-screen__reports-link">
            {t('alerts.viewCommunityReports')}
          </Link>
          <Link to="/sos" className="alerts-screen__sos-button">
            {t('alerts.sendSos')}
          </Link>
        </div>
      </div>

      <HazardMap
        center={center}
        radiusKm={55}
        markers={alerts
          .filter((alert) => !alert.district || alert.district === district)
          .map((alert) => ({ id: alert.id, lat: center[0], lon: center[1], label: alert.hazard_type }))}
      />

      {role === 'Emergency official' && <AdminIssuePanel district={district} onIssued={refreshAlerts} />}

      <section className="alerts-screen__section">
        <div className="alerts-screen__section-header">
          <h2>{t('alerts.officialAlerts')}</h2>
          {usingSampleAlerts && <DemoTag />}
        </div>
        {alerts.length === 0 ? (
          <p className="alerts-screen__empty">{t('alerts.noAlerts')}</p>
        ) : (
          <div className="alerts-screen__list">
            {alerts.map((alert) => (
              <AlertCard key={alert.id} alert={alert} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

export default AlertsScreen
