import { Link } from 'react-router-dom'
import './VerdictCard.css'

// Order matters: position along the gauge arc, left (calm) to right
// (severe). Uses the exact same 3-tier vocabulary as SeverityTag/
// AlertPreviewBanner ('Be aware' / 'Be prepared' / 'Be careful') plus
// two extra bands this card alone needs — 'clear' (no active alerts,
// a state the alert list itself has no label for) and 'unknown' (both
// weather and alerts failed to load, so there's nothing honest to show
// on the arc at all).
const BANDS = {
  clear: { fraction: 0.06, color: 'var(--color-teal)', label: 'All clear' },
  'Be aware': { fraction: 0.3, color: 'var(--color-teal)', label: 'Be aware' },
  'Be prepared': { fraction: 0.65, color: 'var(--color-amber)', label: 'Be prepared' },
  'Be careful': { fraction: 0.94, color: 'var(--color-red)', label: 'Be careful' },
  unknown: { fraction: 0.5, color: 'var(--color-text-faint)', label: "Can't check now" },
}

const SEVERITY_RANK = { 'Be aware': 1, 'Be prepared': 2, 'Be careful': 3 }

const CENTER = 100
const RADIUS = 78
const NEEDLE_RADIUS = 62

function mostSevere(alerts) {
  return alerts.reduce(
    (worst, alert) => ((SEVERITY_RANK[alert.severity] ?? 0) > (SEVERITY_RANK[worst?.severity] ?? 0) ? alert : worst),
    null,
  )
}

function pointOnArc(fraction, radius) {
  const angleDeg = 180 - fraction * 180
  const angleRad = (angleDeg * Math.PI) / 180
  return {
    x: CENTER + radius * Math.cos(angleRad),
    y: CENTER - radius * Math.sin(angleRad),
  }
}

/**
 * A single at-a-glance risk gauge for the district — sits above
 * everything else on Home because it's meant to answer "do I need to
 * worry right now?" before a visitor reads anything else. Deliberately
 * built only from data the app already fetches (the most severe active
 * alert, via the same useAlerts hook AlertPreviewBanner uses) rather
 * than a new severity model, so this can never disagree with the Alerts
 * screen about what's actually happening.
 */
function VerdictCard({ alerts, alertsUnavailable, weatherGrounded, district, isDemo }) {
  const cantCheck = !isDemo && weatherGrounded === false && alertsUnavailable
  const topAlert = mostSevere(alerts)

  let bandKey = 'clear'
  if (cantCheck) bandKey = 'unknown'
  else if (topAlert) bandKey = topAlert.severity

  const band = BANDS[bandKey] ?? BANDS.clear
  const needleTip = pointOnArc(band.fraction, NEEDLE_RADIUS)
  const arcStart = pointOnArc(0, RADIUS)
  const arcEnd = pointOnArc(1, RADIUS)

  const description = cantCheck
    ? 'Weather and alerts are both unavailable right now — try again shortly.'
    : topAlert
      ? `${topAlert.hazard_type} in ${district}`
      : `No active hazards detected for ${district}.`

  return (
    <section className="verdict-card">
      <svg className="verdict-card__gauge" viewBox="0 0 200 110" aria-hidden="true">
        <defs>
          <linearGradient id="verdict-gauge-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--color-teal)" />
            <stop offset="50%" stopColor="var(--color-amber)" />
            <stop offset="100%" stopColor="var(--color-red)" />
          </linearGradient>
        </defs>
        <path
          d={`M ${arcStart.x} ${arcStart.y} A ${RADIUS} ${RADIUS} 0 0 1 ${arcEnd.x} ${arcEnd.y}`}
          fill="none"
          stroke={cantCheck ? 'var(--color-card-border)' : 'url(#verdict-gauge-gradient)'}
          strokeWidth="14"
          strokeLinecap="round"
        />
        <line
          x1={CENTER}
          y1={CENTER}
          x2={needleTip.x}
          y2={needleTip.y}
          stroke={band.color}
          strokeWidth="3"
          strokeLinecap="round"
        />
        <circle cx={CENTER} cy={CENTER} r="6" fill={band.color} />
      </svg>

      <p className="verdict-card__label" style={{ color: band.color }}>
        {band.label}
      </p>
      <p className="verdict-card__description">{description}</p>

      {!cantCheck && topAlert && (
        <Link to="/alerts" className="verdict-card__link">
          View alerts
        </Link>
      )}
    </section>
  )
}

export default VerdictCard
