import { useAppSettings } from '../../context/AppSettingsContext'
import { useAsk } from '../../context/AskContext'
import GroundedFooter from '../GroundedFooter/GroundedFooter'
import DemoTag from '../DemoTag/DemoTag'
import ThinkingIndicator from '../ThinkingIndicator/ThinkingIndicator'
import './AnswerCard.css'

/**
 * The slim card below the mic bubble showing the latest answer, plus a
 * footer row indicating it's "Grounded" (backed by real sources) and
 * where/when it came from. This is the only place a mobile visitor ever
 * sees an answer — the desktop conversation-history pane (see
 * AskScreen.css) is hidden below the 900px breakpoint — so it reads the
 * real conversation from AskContext (shared with Home's hero card and
 * the desktop history) rather than a static placeholder.
 *
 * Reads `demoMode` from Context instead of taking it as a prop — the
 * same pattern (grounded answer + demo tag) will show up on Alerts and
 * My Advice too, and Context means none of those call sites have to
 * know or care about wiring it through.
 */
function AnswerCard() {
  const { demoMode } = useAppSettings()
  const { conversation } = useAsk()
  const latestTurn = conversation[conversation.length - 1]

  if (!latestTurn) return null

  return (
    <div className="answer-card">
      {demoMode === 'demo' && <DemoTag />}
      {latestTurn.status === 'loading-model' || (latestTurn.status === 'thinking' && !latestTurn.answer) ? (
        <ThinkingIndicator status={latestTurn.status} progress={latestTurn.progress} />
      ) : (
        <p className="answer-card__text">{latestTurn.answer}</p>
      )}

      <GroundedFooter grounded={latestTurn.grounded} sourceLabel={latestTurn.sourceLabel} />

      {latestTurn.sources?.length > 0 && (
        <div className="answer-card__sources">
          <span className="answer-card__sources-label">Based on:</span>
          <ul className="answer-card__sources-list">
            {latestTurn.sources.map((source) => (
              <li key={source.url}>
                <a href={source.url} target="_blank" rel="noopener noreferrer">
                  {source.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default AnswerCard
