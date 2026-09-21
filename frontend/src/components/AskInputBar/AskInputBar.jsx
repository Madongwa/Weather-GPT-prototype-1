import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { listenOnce } from '../../utils/speech'
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
 * `<form>` natively, but that's not a visible affordance — especially
 * on mobile, where the on-screen keyboard's return key varies (Go,
 * Search, a bare checkmark) and nothing next to the field hints that
 * typing and hitting return does anything. So once there's text, a
 * dedicated send button replaces the mic button in the same slot (same
 * pattern as WhatsApp/ChatGPT) — the mic is only useful when the field
 * is empty anyway, since it's a shortcut for typing.
 *
 * `onSubmit` is called with the trimmed message, and the input clears —
 * the same thing tapping the mic (once it finishes listening) does too,
 * via the same code path.
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
  const [micError, setMicError] = useState('')
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
    if (listening) return
    setListening(true)
    setMicError('')
    try {
      const transcript = await listenOnce()
      onSubmit?.(transcript)
    } catch (error) {
      // Device doesn't support it, permission denied, or no speech
      // detected — show why rather than leaving the button looking
      // like it silently did nothing; the field is still there to
      // type into either way.
      setMicError(error.message || 'Could not start listening — try typing instead.')
      setTimeout(() => setMicError(''), 3000)
    } finally {
      setListening(false)
    }
  }

  return (
    <>
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

        {message.trim() ? (
          <button type="submit" className="ask-input-bar__send" aria-label="Send">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M4 12h16M13 5l7 7-7 7"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        ) : (
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

      {micError && <p className="ask-input-bar__error">{micError}</p>}
    </>
  )
}

export default AskInputBar
