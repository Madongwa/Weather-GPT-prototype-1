import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAsk } from '../../context/AskContext'
import SpeakButton from '../../components/SpeakButton/SpeakButton'
import AnswerCard from '../../components/AnswerCard/AnswerCard'
import AskInputBar from '../../components/AskInputBar/AskInputBar'
import ChatTurn from '../../components/ChatTurn/ChatTurn'
import './AskScreen.css'

const EXAMPLE_QUESTIONS = [
  'Is there a cyclone warning?',
  'Should I harvest today?',
  'Is it safe to drive?',
  'Will it rain tomorrow?',
]

/**
 * Below the desktop breakpoint (see src/styles/breakpoints.js) this is
 * a single column: mic button, one answer card, example chips, input
 * bar. At desktop it splits into two panes — left keeps the mic and
 * input, right becomes a scrollable conversation history — so the
 * Grounded/Unverified pattern stays visible the whole time instead of
 * only appearing after you ask something.
 *
 * The hero heading, alert preview, quick actions, and forecast that
 * used to live on this screen moved to the Home dashboard — this
 * screen is the dedicated conversation view, reached from Home's quick
 * actions or the sidebar, not a second copy of Home's hero section.
 * Conversation state itself lives in AskContext (see AskProvider),
 * shared with Home's hero card so a question asked from either screen
 * shows up in both.
 */
function AskScreen() {
  const location = useLocation()
  const { conversation, handleAsk } = useAsk()
  // My Advice's "Ask about this" button navigates here with router state
  // (location.state.prefill) instead of a global — it's a one-shot
  // handoff for this navigation, not a setting worth putting in Context.
  const [draft, setDraft] = useState(location.state?.prefill ?? '')

  return (
    <div className="ask-screen">
      <div className="ask-screen__interaction">
        <SpeakButton onResult={handleAsk} />

        {/* Mobile-only single answer card — hidden at desktop, where
            the history pane on the right shows every turn instead. */}
        <div className="ask-screen__mobile-answer">
          <AnswerCard />
        </div>

        <div className="ask-screen__chips">
          {EXAMPLE_QUESTIONS.map((question) => (
            <button
              key={question}
              type="button"
              className="ask-screen__chip"
              onClick={() => setDraft(question)}
            >
              {question}
            </button>
          ))}
        </div>

        <AskInputBar value={draft} onValueChange={setDraft} onSubmit={handleAsk} />

        <p className="ask-screen__disclaimer">
          Answers here are factual — for what to do, see{' '}
          <Link to="/advice">My Advice</Link>.
        </p>
      </div>

      <aside className="ask-screen__history" aria-label="Conversation history">
        <h2 className="ask-screen__history-title">Conversation</h2>
        <div className="ask-screen__history-list">
          {conversation.map((turn) => (
            <ChatTurn key={turn.id} {...turn} />
          ))}
        </div>
      </aside>
    </div>
  )
}

export default AskScreen
