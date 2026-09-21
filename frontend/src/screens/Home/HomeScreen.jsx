import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Geolocation } from '@capacitor/geolocation'
import { useAppSettings } from '../../context/AppSettingsContext'
import { useAsk } from '../../context/AskContext'
import { useWeather } from '../../hooks/useWeather'
import { findNearestDistrict } from '../../utils/nearestDistrict'
import { createCheckin } from '../../api/checkins'
import { whatsAppShareUrl } from '../../utils/share'
import { SAMPLE_WEATHER } from '../../data/sampleWeather'
import SpeakButton from '../../components/SpeakButton/SpeakButton'
import AskInputBar from '../../components/AskInputBar/AskInputBar'
import AlertPreviewBanner from '../../components/AlertPreviewBanner/AlertPreviewBanner'
import HomeHeader from './HomeHeader'
import WeatherSnapshotCard from './WeatherSnapshotCard'
import NextHoursStrip from './NextHoursStrip'
import AdviceTeaser from './AdviceTeaser'
import './HomeScreen.css'

function scrollToSection(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function formatFetchedAt(isoTime) {
  const parsed = new Date(isoTime)
  if (Number.isNaN(parsed.getTime())) return 'just now'
  return parsed.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

/**
 * The dashboard — everything a person wants on opening the app, one
 * scrollable page instead of hunting through screens. See HomeHeader,
 * WeatherSnapshotCard, NextHoursStrip, and AdviceTeaser for the bigger
 * sections; the hero ask card and quick actions are simple enough to
 * stay inline here.
 */
function HomeScreen() {
  const { district, setDistrict, role, setRole, demoMode } = useAppSettings()
  const { handleAsk, hearAloud, setHearAloud } = useAsk()
  const { t } = useTranslation()
  const isDemo = demoMode === 'demo'

  const { data, error, loading } = useWeather(isDemo ? null : district)
  const weather = isDemo ? SAMPLE_WEATHER : data
  const grounded = isDemo || Boolean(data)
  const sourceLabel = isDemo
    ? 'Sample data'
    : loading
      ? 'Loading'
      : data
        ? `Open-Meteo · ${formatFetchedAt(data.fetched_at)}`
        : error
          ? 'Unreachable'
          : 'Unavailable'

  const [locating, setLocating] = useState(false)
  const [locationMessage, setLocationMessage] = useState('')
  const [checkinMessage, setCheckinMessage] = useState('')

  // The browser's navigator.geolocation doesn't apply here — the app
  // runs inside an Android WebView (see android/), where @capacitor/
  // geolocation bridges to the real native location APIs instead. That
  // means an explicit permission step: requestPermissions() triggers a
  // real system dialog the first time (not a silent browser prompt),
  // and getCurrentPosition() only runs once that's granted.
  const handleUseLocation = async () => {
    setLocating(true)
    setLocationMessage('')
    try {
      const permission = await Geolocation.requestPermissions()
      if (permission.location !== 'granted' && permission.coarseLocation !== 'granted') {
        setLocationMessage(`Location access denied — using ${district} instead.`)
        return
      }
      // A longer timeout than the plugin's 10s default — a real cold GPS
      // fix (and the emulator's simulated one, set via Extended
      // Controls or `adb emu geo fix`) can take longer than that,
      // enableHighAccuracy prefers GPS over network location, which is
      // what a mocked emulator location actually feeds.
      const position = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 20000 })
      const nearest = findNearestDistrict(position.coords.latitude, position.coords.longitude)
      setDistrict(nearest)
      setLocationMessage(`Closest sample district: ${nearest}.`)
    } catch {
      setLocationMessage(`Location access denied — using ${district} instead.`)
    } finally {
      setLocating(false)
    }
  }

  const handleSafeCheckin = async (status) => {
    setCheckinMessage('')
    try {
      await createCheckin({ status, district })
      setCheckinMessage(status === 'safe' ? "Marked yourself safe. Share it with family below." : 'Marked that you need help.')
    } catch {
      setCheckinMessage('Could not reach the backend just now.')
    }
  }

  const shareText = `I'm safe. Checking in from ${district} via WeatherGPT.`

  return (
    <div className="home-screen">
      <HomeHeader />

      <button type="button" className="home-screen__location-link" onClick={handleUseLocation} disabled={locating}>
        {locating ? t('home.locating') : t('home.useMyLocation')}
      </button>
      {locationMessage && <p className="home-screen__location-message">{locationMessage}</p>}

      <section className="home-screen__hero">
        <p className="home-screen__hero-subtitle">{t('ask.heading')}</p>
        <SpeakButton onResult={handleAsk} />
      </section>

      <AlertPreviewBanner district={district} />

      <div className="home-screen__quick-actions">
        <button
          type="button"
          className={`home-screen__quick-action ${hearAloud ? 'home-screen__quick-action--active' : ''}`}
          onClick={() => setHearAloud((prev) => !prev)}
        >
          <span className="home-screen__quick-icon" aria-hidden="true">
            <svg style={{ width: 'var(--icon-lg)', height: 'var(--icon-lg)' }} viewBox="0 0 24 24" fill="none">
              <path d="M4 9v6h4l5 5V4L8 9H4Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
              <path d="M16.5 8.5a5 5 0 0 1 0 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </span>
          {t('ask.quickListen')}
        </button>

        <button type="button" className="home-screen__quick-action" onClick={() => scrollToSection('weather-snapshot')}>
          <span className="home-screen__quick-icon" aria-hidden="true">
            <svg style={{ width: 'var(--icon-lg)', height: 'var(--icon-lg)' }} viewBox="0 0 24 24" fill="none">
              <rect x="4" y="5" width="16" height="15" rx="2" stroke="currentColor" strokeWidth="1.8" />
              <path d="M4 9h16M8 3v4M16 3v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </span>
          {t('ask.quickForecast')}
        </button>

        <button type="button" className="home-screen__quick-action" onClick={() => scrollToSection('advice-teaser')}>
          <span className="home-screen__quick-icon" aria-hidden="true">
            <svg style={{ width: 'var(--icon-lg)', height: 'var(--icon-lg)' }} viewBox="0 0 24 24" fill="none">
              <path
                d="M9 11l2 2 4-4M20 12a8 8 0 1 1-3.2-6.4"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          {t('ask.quickAdvice')}
        </button>

        <Link to="/settings" className="home-screen__quick-action">
          <span className="home-screen__quick-icon" aria-hidden="true">
            <svg style={{ width: 'var(--icon-lg)', height: 'var(--icon-lg)' }} viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
              <path
                d="M19.4 13.5a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.04 1.56V19.9a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.04-1.56 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.56-1.04H4.1a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.56-1.04 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34H10.24a1.7 1.7 0 0 0 1.04-1.56V4.1a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1.04 1.56 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87V10.24a1.7 1.7 0 0 0 1.56 1.04h.1a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.56 1.04Z"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          {t('ask.quickSettings')}
        </Link>
      </div>

      <WeatherSnapshotCard weather={weather} loading={loading && !isDemo} grounded={grounded} sourceLabel={sourceLabel} isDemo={isDemo} />

      <NextHoursStrip hourly={weather?.hourly} />

      <AdviceTeaser role={role} setRole={setRole} weather={weather} isDemo={isDemo} />

      <div className="home-screen__checkin">
        <h3 className="home-screen__checkin-title">{t('home.checkIn')}</h3>
        <div className="home-screen__checkin-buttons">
          <button type="button" className="home-screen__checkin-safe" onClick={() => handleSafeCheckin('safe')}>
            {t('home.imSafe')}
          </button>
          <button type="button" className="home-screen__checkin-help" onClick={() => handleSafeCheckin('need_help')}>
            {t('home.needHelp')}
          </button>
        </div>
        {checkinMessage && (
          <p className="home-screen__checkin-message">
            {checkinMessage}{' '}
            <a href={whatsAppShareUrl(shareText)} target="_blank" rel="noreferrer">
              {t('common.share')}
            </a>
          </p>
        )}
      </div>

      <AskInputBar onSubmit={handleAsk} />
    </div>
  )
}

export default HomeScreen
