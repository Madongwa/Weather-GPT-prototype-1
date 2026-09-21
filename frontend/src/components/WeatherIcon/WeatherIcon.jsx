/**
 * Picks one of four hand-drawn stroke icons from a condition string
 * (the text backend/weather.py's describe_weather_code() returns, or
 * the matching sample-data strings) — no icon library, just inline SVG
 * so there's no new dependency for four shapes.
 */
function WeatherIcon({ condition = '', size = 32 }) {
  const props = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    'aria-hidden': true,
  }

  if (/thunderstorm/i.test(condition)) {
    return (
      <svg {...props}>
        <path
          d="M7 15a4 4 0 0 1 .5-7.96A5.5 5.5 0 0 1 18 9.5 4 4 0 0 1 17 15H7Z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path d="M13 14l-2.5 4h2L11 22" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }

  if (/rain|drizzle|shower/i.test(condition)) {
    return (
      <svg {...props}>
        <path
          d="M7 14a4 4 0 0 1 .5-7.96A5.5 5.5 0 0 1 18 8.5 4 4 0 0 1 17 14H7Z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path d="M9 17v3M13 17v3M17 17v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    )
  }

  if (/cloud|overcast|fog/i.test(condition)) {
    return (
      <svg {...props}>
        <path
          d="M7 17a4.5 4.5 0 0 1 .5-8.97A6 6 0 0 1 19 10a4.5 4.5 0 0 1-1 7H7Z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>
    )
  }

  // Default: sun-behind-cloud (clear/partly-clear/unrecognized).
  return (
    <svg {...props}>
      <circle cx="8" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 2.5v1.4M8 12.1v1.4M2.5 8h1.4M12.1 8h1.4M4.3 4.3l1 1M11.7 4.3l-1 1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path
        d="M9 18a4.5 4.5 0 0 1 .4-8.98A6 6 0 0 1 21 11a4.5 4.5 0 0 1-1 7H9Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
        fill="var(--color-bg)"
      />
    </svg>
  )
}

export default WeatherIcon
