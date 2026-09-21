import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import SeverityTag from '../../components/SeverityTag/SeverityTag'
import LifecycleStepper from '../../components/LifecycleStepper/LifecycleStepper'
import ListenButton from '../../components/ListenButton/ListenButton'
import { whatsAppShareUrl } from '../../utils/share'
import './AlertCard.css'

const STALE_AFTER_MS = 1000 * 60 * 60 // an hour

function AlertCard({ alert }) {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const isStale = Date.now() - new Date(alert.created_at).getTime() > STALE_AFTER_MS
  const shareText = `WeatherGPT alert (${alert.severity}): ${alert.hazard_type} — ${alert.description}`

  return (
    <div className="alert-card">
      <div className="alert-card__top">
        <span className="alert-card__hazard">{alert.hazard_type}</span>
        <SeverityTag severity={alert.severity} />
      </div>

      <p className="alert-card__description">{alert.description}</p>

      <LifecycleStepper status={alert.status} />

      <div className="alert-card__meta">
        {alert.is_simulated && <span className="alert-card__tag alert-card__tag--simulated">Simulated</span>}
        {isStale && <span className="alert-card__tag alert-card__tag--stale">May be outdated</span>}
      </div>

      <div className="alert-card__actions">
        <ListenButton text={`${alert.hazard_type}. ${alert.description}`} />
        <Link to={`/alerts/${alert.id}`} className="alert-card__action-link">
          {t('common.viewDetails')}
        </Link>
        <button
          type="button"
          className="alert-card__action-link"
          onClick={() =>
            navigate('/ask', {
              state: { prefill: `About this alert: ${alert.hazard_type} — ${alert.description}` },
            })
          }
        >
          {t('common.askAboutThis')}
        </button>
        <a
          href={whatsAppShareUrl(shareText)}
          target="_blank"
          rel="noreferrer"
          className="alert-card__action-link"
        >
          {t('common.share')}
        </a>
      </div>
    </div>
  )
}

export default AlertCard
