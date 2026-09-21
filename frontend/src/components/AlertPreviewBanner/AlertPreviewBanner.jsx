import { Link } from 'react-router-dom'
import { useAlerts } from '../../hooks/useAlerts'
import './AlertPreviewBanner.css'

const SEVERITY_MODIFIER = {
  'Be aware': 'aware',
  'Be prepared': 'prepared',
  'Be careful': 'careful',
}

function timeAgo(isoTime) {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(isoTime).getTime()) / 60000))
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `Issued ${minutes}m ago`
  return `Issued ${Math.round(minutes / 60)}h ago`
}

/**
 * Compact "top alert" strip for the Home dashboard — shows the single
 * most recent alert with a count badge for the rest, and links through
 * to the full Alerts screen. Shares useAlerts with that screen so both
 * agree on real-vs-sample data instead of drifting apart.
 *
 * The subtext reads "Issued Xm/h ago" (from the alert's real created_at)
 * rather than a "Starts in ~4 hours" countdown — we don't have a
 * predicted onset time in the data model, and inventing one would break
 * the honesty pattern the rest of the app follows.
 *
 * Renders nothing when there are no alerts — an empty state here would
 * just be visual noise above the speak button.
 */
function AlertPreviewBanner({ district }) {
  const { alerts } = useAlerts(district)

  if (alerts.length === 0) return null

  const [topAlert, ...rest] = alerts

  return (
    <Link
      to="/alerts"
      className={`alert-preview alert-preview--${SEVERITY_MODIFIER[topAlert.severity] ?? 'aware'}`}
    >
      <span className="alert-preview__icon-wrap">
        <svg style={{ width: 'var(--icon-lg)', height: 'var(--icon-lg)' }} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M12 3.5 2 20.5h20L12 3.5Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path d="M12 10v4.5M12 17.5v.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        <span className="alert-preview__dot" aria-hidden="true" />
      </span>

      <span className="alert-preview__body">
        <span className="alert-preview__title">{topAlert.hazard_type}</span>
        <span className="alert-preview__meta">{timeAgo(topAlert.created_at)}</span>
      </span>

      {rest.length > 0 && <span className="alert-preview__badge">+{rest.length}</span>}
      <span className="alert-preview__chevron" aria-hidden="true">
        ›
      </span>
    </Link>
  )
}

export default AlertPreviewBanner
