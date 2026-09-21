import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppSettings } from '../../context/AppSettingsContext'
import { createReport, listReports } from '../../api/reports'
import PeopleReportCard from './PeopleReportCard'
import './CommunityReportsScreen.css'

const REPORT_TYPES = ['Flooding', 'Damage', 'Waterlogging']

/**
 * Split out of Alerts & Field Reports into its own top-level screen so
 * crowdsourced, unverified reports get their own address — distinct
 * from the Alerts screen, which now shows official warning material
 * only. The dashed-border PeopleReportCard styling still keeps these
 * visually separate from AlertCard even on their own screen.
 */
function CommunityReportsScreen() {
  const { district } = useAppSettings()
  const { t } = useTranslation()
  const [reports, setReports] = useState([])
  const [showReportForm, setShowReportForm] = useState(false)
  const [reportType, setReportType] = useState(REPORT_TYPES[0])
  const [reportLocation, setReportLocation] = useState('')
  const [reportText, setReportText] = useState('')

  const refreshReports = () => {
    listReports(district)
      .then(setReports)
      .catch(() => setReports([]))
  }

  useEffect(refreshReports, [district])

  const handleReportSubmit = async (event) => {
    event.preventDefault()
    try {
      await createReport({
        report_type: reportType,
        description: reportText,
        location_text: reportLocation,
        district,
      })
      setReportText('')
      setReportLocation('')
      setShowReportForm(false)
      refreshReports()
    } catch {
      // Leave the form open with its content intact so the user can retry.
    }
  }

  return (
    <div className="community-reports-screen">
      <div className="community-reports-screen__header">
        <h1 className="community-reports-screen__title">{t('communityReports.title')}</h1>
        <button
          type="button"
          className="community-reports-screen__report-button"
          onClick={() => setShowReportForm((prev) => !prev)}
        >
          {showReportForm ? t('common.cancel') : t('communityReports.reportSomething')}
        </button>
      </div>
      <p className="community-reports-screen__note">{t('communityReports.note')}</p>

      {showReportForm && (
        <form className="community-reports-screen__form" onSubmit={handleReportSubmit}>
          <select value={reportType} onChange={(event) => setReportType(event.target.value)}>
            {REPORT_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Location (optional)"
            value={reportLocation}
            onChange={(event) => setReportLocation(event.target.value)}
          />
          <textarea
            placeholder="What are you seeing?"
            value={reportText}
            onChange={(event) => setReportText(event.target.value)}
          />
          <button type="submit" className="community-reports-screen__submit">
            {t('common.submit')}
          </button>
        </form>
      )}

      {reports.length === 0 ? (
        <p className="community-reports-screen__empty">{t('communityReports.noReports')}</p>
      ) : (
        <div className="community-reports-screen__list">
          {reports.map((report) => (
            <PeopleReportCard key={report.id} report={report} />
          ))}
        </div>
      )}
    </div>
  )
}

export default CommunityReportsScreen
