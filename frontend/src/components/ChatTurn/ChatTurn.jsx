import GroundedFooter from '../GroundedFooter/GroundedFooter'
import ListenButton from '../ListenButton/ListenButton'
import './ChatTurn.css'

/**
 * One question/answer pair in the desktop Ask screen's conversation
 * history: the user's question as a right-aligned accent bubble, and
 * the assistant's answer as a card with the same GroundedFooter
 * AnswerCard uses — so scrolling this list is a live demonstration of
 * the grounding/citation feature, not just a chat transcript.
 */
function ChatTurn({ question, answer, grounded, sourceLabel }) {
  return (
    <div className="chat-turn">
      <p className="chat-turn__question">{question}</p>

      <div className="chat-turn__answer">
        <div className="chat-turn__answer-row">
          <p className="chat-turn__answer-text">{answer}</p>
          <ListenButton text={answer} />
        </div>
        <GroundedFooter grounded={grounded} sourceLabel={sourceLabel} />
      </div>
    </div>
  )
}

export default ChatTurn
