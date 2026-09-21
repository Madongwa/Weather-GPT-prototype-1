import './PeopleReportCard.css'

/**
 * Deliberately different border/card style from AlertCard — a dashed
 * amber border instead of the official card's solid neutral one — so
 * community reports can never be visually confused with government data.
 */
function PeopleReportCard({ report }) {
  return (
    <div className="people-report-card">
      <div className="people-report-card__top">
        <span className="people-report-card__type">{report.report_type}</span>
        <span className="people-report-card__time">{new Date(report.created_at).toLocaleString()}</span>
      </div>
      {report.location_text && <p className="people-report-card__location">📍 {report.location_text}</p>}
      {report.description && <p className="people-report-card__description">{report.description}</p>}
    </div>
  )
}

export default PeopleReportCard
