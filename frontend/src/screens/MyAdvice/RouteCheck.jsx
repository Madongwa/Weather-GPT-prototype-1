import { useState } from 'react'
import { DISTRICTS } from '../../constants/districts'
import { useWeather } from '../../hooks/useWeather'
import { SAMPLE_WEATHER } from '../../data/sampleWeather'
import PickerPopover from '../../layout/PickerPopover'
import DemoTag from '../../components/DemoTag/DemoTag'
import './RouteCheck.css'

function ConditionFacts({ weather, loading, error }) {
  if (loading) return <p className="route-check__column-status">Loading…</p>
  if (error) return <p className="route-check__column-status">Could not fetch conditions.</p>
  if (!weather) return null
  return (
    <ul className="route-check__facts">
      <li>{weather.condition}</li>
      <li>{weather.temperature_c}°C</li>
      <li>Wind {weather.wind_speed_kmh} km/h</li>
      <li>Rain {weather.precipitation_mm} mm</li>
    </ul>
  )
}

/**
 * Driver-only: compares live conditions at the current district against
 * a second, user-picked district — e.g. checking the destination before
 * a drive. Deliberately shows both sides side-by-side and lets the
 * driver judge, rather than computing a single "route is safe/unsafe"
 * verdict — we have no actual road/route data, only two point
 * conditions, so a computed verdict would be a fabricated claim.
 */
function RouteCheck({ origin, isDemo }) {
  const fallbackDestination = DISTRICTS.find((d) => d !== origin) ?? DISTRICTS[0]
  const [destination, setDestination] = useState(fallbackDestination)
  const [pickerOpen, setPickerOpen] = useState(false)

  const liveOrigin = useWeather(isDemo ? null : origin)
  const liveDestination = useWeather(isDemo ? null : destination)

  const originState = isDemo ? { data: SAMPLE_WEATHER, loading: false, error: null } : liveOrigin
  const destinationState = isDemo ? { data: SAMPLE_WEATHER, loading: false, error: null } : liveDestination

  return (
    <section className="route-check">
      <div className="route-check__header">
        <h2 className="route-check__title">Compare route conditions</h2>
        {isDemo && <DemoTag />}
      </div>
      <p className="route-check__disclaimer">
        Conditions at each end of your route — not a route safety verdict. Use your own judgment
        and follow official road advisories.
      </p>

      <div className="route-check__columns">
        <div className="route-check__column">
          <p className="route-check__column-label">From: {origin}</p>
          <ConditionFacts
            weather={originState.data}
            loading={originState.loading}
            error={originState.error}
          />
        </div>

        <div className="route-check__column route-check__column--dest">
          <button type="button" className="route-check__dest-pill" onClick={() => setPickerOpen((v) => !v)}>
            To: {destination}
          </button>
          {pickerOpen && (
            <PickerPopover
              options={DISTRICTS}
              value={destination}
              onSelect={(value) => {
                setDestination(value)
                setPickerOpen(false)
              }}
              onClose={() => setPickerOpen(false)}
            />
          )}
          <ConditionFacts
            weather={destinationState.data}
            loading={destinationState.loading}
            error={destinationState.error}
          />
        </div>
      </div>
    </section>
  )
}

export default RouteCheck
