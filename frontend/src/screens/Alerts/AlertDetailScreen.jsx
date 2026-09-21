import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAppSettings } from '../../context/AppSettingsContext'
import { advanceAlert, getAlert } from '../../api/alerts'
import SeverityTag from '../../components/SeverityTag/SeverityTag'
import LifecycleStepper from '../../components/LifecycleStepper/LifecycleStepper'
import ListenButton from '../../components/ListenButton/ListenButton'
import { parseUtcDate } from '../../utils/parseUtcDate'
import './AlertDetailScreen.css'

const SESSION_KEY = 'weathergpt.adminToken'

function AlertDetailScreen() {
  const { alertId } = useParams()
  const { role } = useAppSettings()
  const [alert, setAlert] = useState(null)
  const [notFound, setNotFound] = useState(false)

  const load = () => {
    getAlert(alertId)
      .then(setAlert)
      .catch(() => setNotFound(true))
  }

  useEffect(load, [alertId])

  const handleAdvance = async () => {
    const token = sessionStorage.getItem(SESSION_KEY)
    if (!token) return
    try {
      await advanceAlert(alertId, token)
      load()
    } catch {
      // Session likely expired — the official can re-sign-in on the
      // Alerts list and try again.
    }
  }

  if (notFound) {
    return (
      <div className="alert-detail-screen">
        <Link to="/alerts" className="alert-detail-screen__back">
          ← Back to Alerts
        </Link>
        <p className="alert-detail-screen__empty">This alert doesn't exist or has been removed.</p>
      </div>
    )
  }

  if (!alert) {
    return (
      <div className="alert-detail-screen">
        <p className="alert-detail-screen__empty">Loading…</p>
      </div>
    )
  }

  return (
    <div className="alert-detail-screen">
      <Link to="/alerts" className="alert-detail-screen__back">
        ← Back to Alerts
      </Link>

      <div className="alert-detail-screen__top">
        <h1>{alert.hazard_type}</h1>
        <SeverityTag severity={alert.severity} />
      </div>

      <LifecycleStepper status={alert.status} size="large" />

      <div className="alert-detail-screen__description-row">
        <p className="alert-detail-screen__description">{alert.description}</p>
        <ListenButton text={`${alert.hazard_type}. ${alert.description}`} />
      </div>

      <dl className="alert-detail-screen__facts">
        <dt>District</dt>
        <dd>{alert.district ?? 'Not specified'}</dd>
        <dt>Issued</dt>
        <dd>{parseUtcDate(alert.created_at).toLocaleString()}</dd>
        <dt>Valid until</dt>
        <dd>{alert.expires_at ? parseUtcDate(alert.expires_at).toLocaleString() : 'Ongoing'}</dd>
        <dt>Source</dt>
        <dd>{alert.is_simulated ? 'Scenario simulator (Trust & Sources)' : 'Official'}</dd>
      </dl>

      {role === 'Emergency official' && alert.status !== 'Resolved' && (
        <button type="button" className="alert-detail-screen__advance" onClick={handleAdvance}>
          Advance to next stage
        </button>
      )}
    </div>
  )
}

export default AlertDetailScreen
