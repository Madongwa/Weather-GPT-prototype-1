import { useTranslation } from 'react-i18next'
import './AboutScreen.css'

const PROBLEM_STATEMENT = [
  { label: 'Problem statement ID', value: '26068' },
  {
    label: 'Title',
    value: 'WeatherGPT: Conversational AI for Weather Forecasting, Alerts, and Climate Information',
  },
  { label: 'Theme', value: 'Disaster Management' },
  { label: 'Organization', value: 'Ministry of Earth Sciences (MoES) / India Meteorological Department (IMD)' },
  { label: 'Team', value: 'Parallax' },
]

const PIPELINE_STEPS = [
  {
    name: 'Grounding Layer',
    note: 'Pulls real weather and hazard data from live sources — Open-Meteo today, with IMD and NDMA CAP feeds stubbed until public API access exists — before any answer gets generated.',
  },
  {
    name: 'Arbiter',
    note: 'Cross-checks sources when more than one is live, and decides what can be stated as fact versus what needs a caveat.',
  },
  {
    name: 'LLM phrasing',
    note: "Claude turns the grounded facts into a clear, conversational answer in the user's chosen language — it never invents numbers the Grounding Layer didn't supply.",
  },
]

/**
 * Built for real this session (not a placeholder) — a static summary
 * a judge can skim in a few seconds: problem statement metadata plus a
 * short, honest description of how an answer actually gets produced.
 * Same card styling as Trust & Sources for visual consistency, but this
 * screen is static content, not live controls.
 */
function AboutScreen() {
  const { t } = useTranslation()

  return (
    <div className="about-screen">
      <h1 className="about-screen__title">{t('about.title')}</h1>

      <section className="about-screen__card">
        <dl className="about-screen__meta">
          {PROBLEM_STATEMENT.map((row) => (
            <div key={row.label} className="about-screen__meta-row">
              <dt>{row.label}</dt>
              <dd>{row.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="about-screen__card">
        <h2 className="about-screen__section-title">How an answer gets built</h2>
        <ol className="about-screen__pipeline">
          {PIPELINE_STEPS.map((step, index) => (
            <li key={step.name} className="about-screen__pipeline-step">
              <span className="about-screen__pipeline-number">{index + 1}</span>
              <div>
                <p className="about-screen__pipeline-name">{step.name}</p>
                <p className="about-screen__pipeline-note">{step.note}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="about-screen__card">
        <h2 className="about-screen__section-title">Built for real conditions</h2>
        <p className="about-screen__note">
          Every data source is a real or mocked adapter, never silently one pretending to be the
          other — screens label themselves Grounded, Demo, or Sample so nothing overstates its own
          certainty. Connectivity loss degrades in steps too: live network, then cached data, then
          static sample content — never a blank screen.
        </p>
      </section>
    </div>
  )
}

export default AboutScreen
