import './SeverityTag.css'

const SEVERITY_CLASS = {
  'Be aware': 'severity-tag--aware',
  'Be prepared': 'severity-tag--prepared',
  'Be careful': 'severity-tag--careful',
}

/** Color-coded 3-tier severity pill: green=Be aware, amber=Be prepared, red=Be careful. */
function SeverityTag({ severity }) {
  return (
    <span className={`severity-tag ${SEVERITY_CLASS[severity] ?? ''}`}>{severity}</span>
  )
}

export default SeverityTag
