import WeatherIcon from '../../components/WeatherIcon/WeatherIcon'
import './NextHoursStrip.css'

function formatHour(isoTime) {
  return new Date(isoTime).toLocaleTimeString([], { hour: 'numeric' })
}

/**
 * Horizontally scrollable on narrower widths; on wide desktop the flex
 * items just wrap to fill the row instead of scrolling, since there's
 * room to show all of them at once (see NextHoursStrip.css).
 */
function NextHoursStrip({ hourly }) {
  if (!hourly || hourly.length === 0) {
    return <p className="next-hours__empty">Hourly forecast not available right now.</p>
  }

  return (
    <div className="next-hours">
      {hourly.map((hour) => (
        <div key={hour.time} className="next-hours__card">
          <span className="next-hours__time">{formatHour(hour.time)}</span>
          <WeatherIcon condition={hour.condition} size={26} />
          <span className="next-hours__temp">{Math.round(hour.temperature_c)}°</span>
          <span className="next-hours__rain">{Math.round(hour.precipitation_probability_percent)}%</span>
        </div>
      ))}
    </div>
  )
}

export default NextHoursStrip
