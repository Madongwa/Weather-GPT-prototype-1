import { useAppSettings } from '../../context/AppSettingsContext'
import GroundedFooter from '../GroundedFooter/GroundedFooter'
import DemoTag from '../DemoTag/DemoTag'
import './AnswerCard.css'

// Placeholder content — real answers (and real timestamps) arrive once
// the weather/arbiter logic is built. For now this just proves the layout.
const SAMPLE_ANSWER = 'Storm likely by 2 PM — hold off on harvesting until tomorrow.'

/**
 * The slim card below the mic bubble showing the latest answer, plus a
 * footer row indicating it's "Grounded" (backed by real sources) and
 * where/when it came from. The source label swaps to "Cached" when
 * offline, since we'd be showing a stored answer rather than a fresh one.
 *
 * Reads `isOnline` and `demoMode` from Context instead of taking them as
 * props — this card is used from the Ask screen today, but the same
 * pattern (grounded answer + demo tag) will show up on Alerts and My
 * Advice too, and Context means none of those call sites have to know
 * or care about wiring these two values through.
 */
function AnswerCard() {
  const { isOnline, demoMode } = useAppSettings()
  const sourceLabel = isOnline ? 'IMD + Open-Meteo · 12 min ago' : 'Cached · 12 min ago'

  return (
    <div className="answer-card">
      {demoMode === 'demo' && <DemoTag />}
      <p className="answer-card__text">{SAMPLE_ANSWER}</p>

      <GroundedFooter grounded sourceLabel={sourceLabel} />
    </div>
  )
}

export default AnswerCard
