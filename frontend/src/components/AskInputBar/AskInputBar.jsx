import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { isSpeechRecognitionSupported, listenOnce } from '../../utils/speech'
import './AskInputBar.css'

/**
 * Bottom row: a decorative sparkle icon, a pill-shaped text input, and
 * a mic button. The <label> is real but visually hidden — screen
 * readers announce it, sighted users just see the placeholder.
 *
 * Shared between the Home screen's hero section and the Ask screen —
 * extracted once so neither has its own copy of the submit/mic logic
 * to keep in sync.
 *
 * Pressing Enter while focused in the text input already submits this
 * `<form>` natively. `onSubmit` is called with the trimmed message, and
 * the input clears — the same thing tapping the mic (once it finishes
 * listening) does too, via the same code path.
 *
 * `value`/`onValueChange` are optional — pass both to let a parent
 * control the text (AskScreen does this so the example-question chips
 * can populate the input), or omit both and this component manages its
 * own state internally. This is the standard "optionally controlled
 * component" pattern: one component, two usage styles.
 */
function AskInputBar({ value, onValueChange, onSubmit }) {
  const { t } = useTranslation()
  const [internalMessage, setInternalMessage] = useState('')
  const [listening, setListening] = useState(false)
  const isControlled = value !== undefined
  const message = isControlled ? value : internalMessage
  const setMessage = isControlled ? onValueChange : setInternalMessage

  const handleSubmit = (event) => {
    event.preventDefault()
    const trimmed = message.trim()
    if (!trimmed) return
    onSubmit?.(trimmed)
    setMessage('')
  }

  const handleMicClick = async () => {
    if (listening || !isSpeechRecognitionSupported) return
    setListening(true)
    try {
      const transcript = await listenOnce()
      onSubmit?.(transcript)
    } catch {
      // No speech detected, permission denied, etc. — just stop listening.
    } finally {
      setListening(false)
    }
  }

  return (
    <form className="ask-input-bar" onSubmit={handleSubmit}>
      <div className="ask-input-bar__field">
        <span className="ask-input-bar__sparkle" aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z"
              fill="currentColor"
            />
          </svg>
        </span>

        <label htmlFor="chat-input" className="visually-hidden">
          {t('ask.typeYourMessage')}
        </label>
        <input
          id="chat-input"
          type="text"
          className="ask-input-bar__input"
          placeholder={t('ask.typeYourMessage')}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
        />
      </div>

      {isSpeechRecognitionSupported && (
        <button
          type="button"
          className={`ask-input-bar__mic ${listening ? 'ask-input-bar__mic--listening' : ''}`}
          aria-label={listening ? 'Listening…' : 'Speak your question'}
          onClick={handleMicClick}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3Z"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M19 11a7 7 0 0 1-14 0M12 18v3"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      )}
    </form>
  )
}

export default AskInputBar
