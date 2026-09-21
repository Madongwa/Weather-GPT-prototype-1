import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppSettings } from '../../context/AppSettingsContext'
import { listSos, relaySos, sendSos } from '../../api/sos'
import './SosScreen.css'

const QUICK_NEEDS = ['I am here', 'Doctor', 'Water', 'Food', 'Danger', 'Trapped', 'Road blocked', 'I am safe']
const ARM_TIMEOUT_MS = 3000

/**
 * Deliberately red/amber instead of the app's usual teal, and its own
 * top-level nav item/route (not nested under Alerts) — a distinct
 * screen so it's never confused with a normal chat message or with
 * official alert content.
 */
function SosScreen() {
  const { district } = useAppSettings()
  const { t } = useTranslation()
  const [selectedNeeds, setSelectedNeeds] = useState([])
  const [peopleCount, setPeopleCount] = useState(1)
  const [medicalNeeded, setMedicalNeeded] = useState(false)
  const [detail, setDetail] = useState('')
  const [armed, setArmed] = useState(false)
  const [sentLog, setSentLog] = useState([])
  const [sendError, setSendError] = useState('')
  const [relayingId, setRelayingId] = useState(null)
  const armTimer = useRef(null)

  useEffect(() => {
    listSos()
      .then(setSentLog)
      .catch(() => setSentLog([]))
    return () => clearTimeout(armTimer.current)
  }, [])

  const toggleNeed = (need) => {
    setSelectedNeeds((prev) => (prev.includes(need) ? prev.filter((item) => item !== need) : [...prev, need]))
  }

  // Arm-then-fire: the first tap only arms the button (relabels it, no
  // request sent yet); a second tap within ARM_TIMEOUT_MS actually
  // sends. Arming silently expires back to normal if not confirmed.
  // This exists specifically to prevent an accidental SOS from a single
  // stray tap — a deliberate UX safety pattern, not a missing feature.
  const handleSendClick = async () => {
    if (!armed) {
      setArmed(true)
      armTimer.current = setTimeout(() => setArmed(false), ARM_TIMEOUT_MS)
      return
    }

    clearTimeout(armTimer.current)
    setArmed(false)
    setSendError('')

    try {
      const sent = await sendSos({
        needs: selectedNeeds,
        people_count: peopleCount,
        medical_needed: medicalNeeded,
        detail,
        district,
      })
      setSentLog((prev) => [sent, ...prev])
      setSelectedNeeds([])
      setDetail('')
    } catch {
      setSendError('Could not send just now — check your connection and try again.')
    }
  }

  // The one real state change behind "Simulate relay": a per-message
  // button (not the always-animating decoration above it) that actually
  // calls the backend and updates that message's own relay_status once
  // it returns — still a simulation (see the hop-path caption's own
  // caveat), but now backed by a real request/response instead of pure
  // CSS animation.
  const handleRelay = async (sosId) => {
    setRelayingId(sosId)
    try {
      const updated = await relaySos(sosId)
      setSentLog((prev) => prev.map((entry) => (entry.id === sosId ? updated : entry)))
    } catch {
      // Best-effort demo action — leave the entry as it was, the button
      // stays available so the person can just try again.
    } finally {
      setRelayingId(null)
    }
  }

  return (
    <div className="sos-screen">
      <h1 className="sos-screen__title">{t('sos.title')}</h1>

      <div className="sos-screen__quick-needs">
        {QUICK_NEEDS.map((need) => (
          <button
            key={need}
            type="button"
            className={`sos-screen__need ${selectedNeeds.includes(need) ? 'sos-screen__need--selected' : ''}`}
            onClick={() => toggleNeed(need)}
          >
            {need}
          </button>
        ))}
      </div>

      <div className="sos-screen__row">
        <span>{t('sos.peopleWithYou')}</span>
        <div className="sos-screen__stepper">
          <button type="button" onClick={() => setPeopleCount((n) => Math.max(1, n - 1))} aria-label="Decrease">
            −
          </button>
          <span>{peopleCount}</span>
          <button type="button" onClick={() => setPeopleCount((n) => n + 1)} aria-label="Increase">
            +
          </button>
        </div>
      </div>

      <label className="sos-screen__toggle">
        <input
          type="checkbox"
          checked={medicalNeeded}
          onChange={(event) => setMedicalNeeded(event.target.checked)}
        />
        {t('sos.medicalHelpNeeded')}
      </label>

      <textarea
        className="sos-screen__detail"
        placeholder={t('sos.additionalDetail')}
        value={detail}
        onChange={(event) => setDetail(event.target.value)}
      />

      <button
        type="button"
        className={`sos-screen__send ${armed ? 'sos-screen__send--armed' : ''}`}
        onClick={handleSendClick}
      >
        {armed ? t('sos.tapAgainToSend') : t('sos.title')}
      </button>

      {sendError && <p className="sos-screen__error">{sendError}</p>}

      <p className="sos-screen__offline-note">{t('sos.offlineNote')}</p>
      {/*
        TODO: the line above is currently a UI promise only. Real offline
        delivery needs a service-worker background-sync queue (PWA work);
        right now a send attempted while offline just fails with the
        error message above rather than silently queuing and retrying.
      */}

      <div className="sos-screen__hop-path" aria-label="How your message travels — concept demo, not a real relay">
        <span className="sos-screen__hop-node">📱</span>
        <span className="sos-screen__hop-line" />
        <span className="sos-screen__hop-node">📱</span>
        <span className="sos-screen__hop-line" />
        <span className="sos-screen__hop-node">📡</span>
      </div>
      <p className="sos-screen__hop-caption">
        Concept demo — illustrates a peer-to-peer relay idea, not a real P2P transport.
      </p>

      <h2 className="sos-screen__log-title">{t('sos.yourSentMessages')}</h2>
      {sentLog.length === 0 ? (
        <p className="sos-screen__empty">{t('sos.nothingSentYet')}</p>
      ) : (
        <ul className="sos-screen__log">
          {sentLog.map((entry) => (
            <li key={entry.id} className="sos-screen__log-item">
              <div className="sos-screen__log-row">
                <span>{entry.needs.join(', ') || 'SOS'}</span>
                <span className="sos-screen__log-status">{entry.status}</span>
              </div>
              <div className="sos-screen__log-relay">
                {entry.relay_status ? (
                  <span className="sos-screen__log-relay-done">
                    <span aria-hidden="true">📱 → 📡</span> {entry.relay_status}
                  </span>
                ) : (
                  <button
                    type="button"
                    className="sos-screen__relay-button"
                    onClick={() => handleRelay(entry.id)}
                    disabled={relayingId === entry.id}
                  >
                    {relayingId === entry.id ? 'Relaying…' : 'Simulate relay'}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default SosScreen
