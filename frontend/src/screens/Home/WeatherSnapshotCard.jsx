import WeatherIcon from '../../components/WeatherIcon/WeatherIcon'
import GroundedFooter from '../../components/GroundedFooter/GroundedFooter'
import DemoTag from '../../components/DemoTag/DemoTag'
import './WeatherSnapshotCard.css'

// Sized via the --icon-md token (inline style, since a plain SVG
// width/height attribute can't reference a CSS custom property).
const STAT_ICON_SIZE = { width: 'var(--icon-md)', height: 'var(--icon-md)' }

const STAT_ICONS = {
  feelsLike: (
    <svg style={STAT_ICON_SIZE} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 14V4a2 2 0 0 0-4 0v10a4 4 0 1 0 4 0Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  ),
  rain: (
    <svg style={STAT_ICON_SIZE} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M8 13a3.5 3.5 0 0 1 .4-6.98A5 5 0 0 1 18 7.5 3.5 3.5 0 0 1 17 13H8Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M10 16v2M14 16v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  humidity: (
    <svg style={STAT_ICON_SIZE} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  ),
  wind: (
    <svg style={STAT_ICON_SIZE} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 8h11a2.5 2.5 0 1 0-2.5-2.5M3 16h14a2.5 2.5 0 1 1-2.5 2.5M3 12h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  ),
}

/**
 * "Today" snapshot — big current temp/condition plus four stat pills.
 * `weather` is either the real useWeather() data (outside Demo Mode) or
 * data/sampleWeather.js (inside it) — same shape either way, so this
 * component doesn't need to know which.
 */
function WeatherSnapshotCard({ weather, loading, grounded, sourceLabel, isDemo }) {
  return (
    <section id="weather-snapshot" className="weather-snapshot">
      <div className="weather-snapshot__top">
        <div>
          <p className="weather-snapshot__label">Today {isDemo && <DemoTag />}</p>
          {loading || !weather ? (
            <p className="weather-snapshot__loading">Checking current conditions…</p>
          ) : (
            <>
              <p className="weather-snapshot__temp">{Math.round(weather.temperature_c)}°</p>
              <p className="weather-snapshot__condition">{weather.condition}</p>
              <p className="weather-snapshot__highlow">
                High {Math.round(weather.high_c ?? weather.temperature_c)}° · Low{' '}
                {Math.round(weather.low_c ?? weather.temperature_c)}°
              </p>
            </>
          )}
        </div>
        <div className="weather-snapshot__icon">
          <WeatherIcon condition={weather?.condition ?? ''} size={52} />
        </div>
      </div>

      {weather && <GroundedFooter grounded={grounded} sourceLabel={sourceLabel} />}

      {weather && (
        <div className="weather-snapshot__stats">
          <div className="weather-snapshot__stat">
            {STAT_ICONS.feelsLike}
            <span className="weather-snapshot__stat-label">Feels like</span>
            <span className="weather-snapshot__stat-value">{Math.round(weather.feels_like_c ?? weather.temperature_c)}°</span>
          </div>
          <div className="weather-snapshot__stat">
            {STAT_ICONS.rain}
            <span className="weather-snapshot__stat-label">Rain chance</span>
            <span className="weather-snapshot__stat-value">{Math.round(weather.rain_chance_percent ?? 0)}%</span>
          </div>
          <div className="weather-snapshot__stat">
            {STAT_ICONS.humidity}
            <span className="weather-snapshot__stat-label">Humidity</span>
            <span className="weather-snapshot__stat-value">{Math.round(weather.humidity_percent)}%</span>
          </div>
          <div className="weather-snapshot__stat">
            {STAT_ICONS.wind}
            <span className="weather-snapshot__stat-label">Wind</span>
            <span className="weather-snapshot__stat-value">{Math.round(weather.wind_speed_kmh)} km/h</span>
          </div>
        </div>
      )}
    </section>
  )
}

export default WeatherSnapshotCard
