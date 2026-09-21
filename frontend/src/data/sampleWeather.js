// Shown only in Demo Mode, so nothing here ever has to agree with real
// data — shaped exactly like backend/weather.py's real response so the
// Home dashboard and My Advice screen can use either interchangeably
// without an if/else on every field.
function hourLabel(hoursFromNow) {
  const date = new Date(Date.now() + hoursFromNow * 3600000)
  return date.toISOString().slice(0, 13) + ':00'
}

function dayLabel(daysFromNow) {
  return new Date(Date.now() + daysFromNow * 86400000).toISOString().slice(0, 10)
}

export const SAMPLE_WEATHER = {
  fetched_at: new Date().toISOString(),
  temperature_c: 31,
  feels_like_c: 34,
  precipitation_mm: 4,
  humidity_percent: 68,
  wind_speed_kmh: 18,
  condition: 'Slight rain',
  high_c: 33,
  low_c: 24,
  rain_chance_percent: 60,
  forecast: [1, 2, 3].map((offset, index) => ({
    date: dayLabel(offset),
    condition: ['Partly cloudy', 'Slight rain', 'Thunderstorm'][index],
    high_c: [33, 30, 29][index],
    low_c: [24, 23, 22][index],
    precipitation_probability_percent: [20, 60, 75][index],
  })),
  hourly: Array.from({ length: 10 }, (_, i) => ({
    time: hourLabel(i),
    temperature_c: 31 - Math.round(i / 2),
    precipitation_probability_percent: Math.min(75, 20 + i * 6),
    condition: i < 3 ? 'Partly cloudy' : i < 7 ? 'Slight rain' : 'Thunderstorm',
  })),
}
