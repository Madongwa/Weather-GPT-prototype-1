import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppSettings } from '../../context/AppSettingsContext'
import { DEMO_MODE_OPTIONS } from '../../constants/demoModes'
import { getBackendStatus } from '../../api/status'
import { simulateAlert } from '../../api/alerts'
import { createNotification } from '../../api/notifications'
import { isSpeechSynthesisSupported } from '../../utils/speech'
import { useSpeechRecognitionSupport } from '../../hooks/useSpeechRecognitionSupport'
import './TrustSourcesScreen.css'

const SOURCE_LABELS = {
  open_meteo: 'Open-Meteo',
  groq_llm: 'Groq (LLM)',
  tavily_search: 'Tavily (web search)',
  imd: 'IMD',
  wis2_ndma_cap: 'WIS2.0 / NDMA CAP',
  database: 'Database (SQLite)',
}

const SOURCE_WHY = {
  open_meteo: 'A free public forecast API — the only weather source actually wired up live.',
  groq_llm:
    'Phrases the Ask screen\'s answers from whatever the Grounding Layer found. "Connected" means an API key is configured, not that a request was just made.',
  tavily_search:
    'Searches the live web for each question, biased toward IMD and NDMA — the real second grounding source alongside Open-Meteo. Falls back to Open-Meteo-only grounding if unreachable.',
  imd: 'IMD has no public API of its own — Tavily searches mausam.imd.gov.in directly instead, so this stays a "stub" for a dedicated IMD integration even though real IMD content does reach answers now.',
  wis2_ndma_cap: 'No public feed access exists — same reasoning as IMD.',
  database: "If this status board loaded at all, the database answered — it's local to this backend.",
}

const STATUS_BADGE = {
  connected: { label: 'Connected', className: 'trust-screen__badge--connected' },
  unreachable: { label: 'Unreachable', className: 'trust-screen__badge--unreachable' },
  unconfigured: { label: 'Unconfigured', className: 'trust-screen__badge--unconfigured' },
  stub: { label: 'Stub', className: 'trust-screen__badge--stub' },
}

const SCENARIOS = [
  { key: 'thunderstorm', label: 'Thunderstorm' },
  { key: 'heat_wave', label: 'Heat wave' },
  { key: 'heavy_rain', label: 'Heavy rain' },
  { key: 'cyclone', label: 'Cyclone' },
]

/**
 * The "prove we're not black-boxing it" screen. Three things live here:
 * Demo Mode (already real), a status board pulled from the backend's
 * real /status route plus two client-only checks (STT/TTS), and the
 * "How this works" breakdown tagging specific computations LIVE/STUB.
 */
function TrustSourcesScreen() {
  const { demoMode, setDemoMode, district } = useAppSettings()
  const { t } = useTranslation()
  const [status, setStatus] = useState(null)
  const [statusError, setStatusError] = useState(false)
  const [simulateMessage, setSimulateMessage] = useState('')
  const speechRecognitionSupported = useSpeechRecognitionSupport()

  const refreshStatus = () => {
    setStatusError(false)
    getBackendStatus()
      .then(setStatus)
      .catch(() => setStatusError(true))
  }

  useEffect(refreshStatus, [])

  const handleSimulate = async (scenario) => {
    setSimulateMessage('')
    try {
      await simulateAlert(scenario.key, district)
      await createNotification({
        title: `${scenario.label} (simulated)`,
        body: `A ${scenario.label.toLowerCase()} scenario was injected for ${district}. Check Alerts & Field Reports.`,
        level: 'warning',
      }).catch(() => {})
      setSimulateMessage(`${scenario.label} injected for ${district} — check Alerts & Field Reports.`)
    } catch {
      setSimulateMessage('Could not reach the backend to inject that scenario.')
    }
  }

  return (
    <div className="trust-screen">
      <h1 className="trust-screen__title">{t('trustSources.title')}</h1>

      <section className="trust-screen__card">
        <h2 className="trust-screen__section-title">{t('trustSources.demoModeTitle')}</h2>
        <p className="trust-screen__section-note">
          Controls how much of the app shows real data vs. mock/sample data.
          Every screen that shows data checks this and labels itself
          accordingly — it's what keeps the app honest about what's real
          during a demo.
        </p>

        <div className="trust-screen__demo-options">
          {DEMO_MODE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`trust-screen__demo-option ${
                demoMode === option.value ? 'trust-screen__demo-option--active' : ''
              }`}
              onClick={() => setDemoMode(option.value)}
              aria-pressed={demoMode === option.value}
            >
              <span className="trust-screen__demo-label">{option.label}</span>
              <span className="trust-screen__demo-desc">{option.description}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="trust-screen__card">
        <div className="trust-screen__section-header">
          <h2 className="trust-screen__section-title">{t('trustSources.dataSourcesTitle')}</h2>
          <button type="button" className="trust-screen__recheck" onClick={refreshStatus}>
            {t('trustSources.recheck')}
          </button>
        </div>

        {statusError && (
          <p className="trust-screen__section-note">Could not reach the backend to check status.</p>
        )}

        <ul className="trust-screen__source-list">
          {status &&
            Object.entries(SOURCE_LABELS).map(([key, label]) => (
              <SourceRow key={key} label={label} status={status[key]} why={SOURCE_WHY[key]} />
            ))}
          <SourceRow
            label="Speech-to-text"
            status={speechRecognitionSupported ? 'connected' : 'unconfigured'}
            why="Native device speech recognition via the @capacitor-community/speech-recognition plugin — no backend, no API key. Requires a one-time microphone permission grant."
          />
          <SourceRow
            label="Text-to-speech"
            status={isSpeechSynthesisSupported ? 'connected' : 'unconfigured'}
            why="Also entirely browser-side (Speech Synthesis API) — same reasoning as speech-to-text."
          />
        </ul>
      </section>

      <section className="trust-screen__card">
        <h2 className="trust-screen__section-title">{t('trustSources.howThisWorksTitle')}</h2>
        <ul className="trust-screen__how-list">
          <HowRow
            label="Nearest-district / distance-to-hazard calculation"
            tag="LIVE"
            note="Real haversine great-circle distance math (backend/geofence.py)."
          />
          <HowRow
            label="Point-in-polygon warning-zone check"
            tag="LIVE"
            note="Real ray-casting algorithm — but running on simplified rectangular district boundaries, not survey-accurate GIS shapes."
          />
          <HowRow
            label="Weather grounding for Ask answers"
            tag="LIVE"
            note="The answer is only marked Grounded when a live Open-Meteo fetch, a live web search, or both actually succeeded."
          />
          <HowRow
            label="Multi-source Arbiter (cross-checking conflicting sources)"
            tag="LIVE"
            note="Open-Meteo and a live Tavily web search (biased toward IMD/NDMA) both feed the same answer now — a real second source exists. Still simple, though: both get handed to the LLM together rather than being algorithmically reconciled if they disagree."
          />
        </ul>
      </section>

      <section className="trust-screen__card">
        <h2 className="trust-screen__section-title">{t('trustSources.scenarioSimulatorsTitle')}</h2>
        <p className="trust-screen__section-note">
          Injects a real (but clearly labeled Simulated) alert for a few minutes — a way to
          trigger a live demo moment on command. Intended for Demo Mode.
        </p>
        <div className="trust-screen__scenarios">
          {SCENARIOS.map((scenario) => (
            <button
              key={scenario.key}
              type="button"
              className="trust-screen__scenario-button"
              onClick={() => handleSimulate(scenario)}
            >
              {scenario.label}
            </button>
          ))}
        </div>
        {simulateMessage && <p className="trust-screen__section-note">{simulateMessage}</p>}
      </section>
    </div>
  )
}

function SourceRow({ label, status, why }) {
  const [expanded, setExpanded] = useState(false)
  const badge = STATUS_BADGE[status] ?? STATUS_BADGE.stub

  return (
    <li className="trust-screen__source-row">
      <div className="trust-screen__source-top">
        <span>{label}</span>
        <span className={`trust-screen__badge ${badge.className}`}>{badge.label}</span>
        <button type="button" className="trust-screen__why" onClick={() => setExpanded((prev) => !prev)}>
          Why?
        </button>
      </div>
      {expanded && <p className="trust-screen__why-text">{why}</p>}
    </li>
  )
}

function HowRow({ label, tag, note }) {
  return (
    <li className="trust-screen__how-row">
      <div className="trust-screen__how-top">
        <span>{label}</span>
        <span className={`trust-screen__how-tag trust-screen__how-tag--${tag.toLowerCase()}`}>{tag}</span>
      </div>
      <p className="trust-screen__how-note">{note}</p>
    </li>
  )
}

export default TrustSourcesScreen
