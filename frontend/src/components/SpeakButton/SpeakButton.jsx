import { useState } from 'react'
import { isSpeechRecognitionSupported, listenOnce } from '../../utils/speech'
import './SpeakButton.css'

/**
 * The big tappable mic button — a plain circle (not the original
 * organic "blob" shape) so it reads consistently wherever it's reused.
 * Uses the browser's native SpeechRecognition API (see utils/speech.js)
 * — real speech-to-text, no backend call and no API key, but support
 * varies by browser (reliable in Chrome/Edge; unsupported in Firefox as
 * of this writing). When unsupported, tapping shows a brief message
 * instead of pretending to listen.
 *
 * Shared between the Home screen's hero card and the Ask screen (see
 * AskContext for the conversation state both feed into) — extracted
 * once so neither has its own copy of the listening/unsupported state
 * machine to keep in sync.
 *
 * `onResult(transcript)` is called with the recognized text.
 */
function SpeakButton({ onResult }) {
  const [listening, setListening] = useState(false)
  const [unsupported, setUnsupported] = useState(false)

  const handleClick = async () => {
    if (listening) return

    if (!isSpeechRecognitionSupported) {
      setUnsupported(true)
      setTimeout(() => setUnsupported(false), 2500)
      return
    }

    setListening(true)
    try {
      const transcript = await listenOnce()
      onResult?.(transcript)
    } catch {
      // No speech detected, mic permission denied, etc. — just stop
      // listening; the user can tap again.
    } finally {
      setListening(false)
    }
  }

  const label = unsupported
    ? 'Speech recognition not supported in this browser'
    : listening
      ? 'Listening…'
      : 'Tap to talk'

  return (
    <div className="speak-button">
      <button
        type="button"
        className="speak-button__circle"
        onClick={handleClick}
        aria-pressed={listening}
        aria-label={listening ? 'Stop listening' : 'Tap to talk'}
      >
        {/* The pulsing ring is only rendered while listening, so it only
            exists in the DOM (and only animates) when needed. */}
        {listening && <span className="speak-button__ring" aria-hidden="true" />}

        <svg
          className="speak-button__icon"
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
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

      <p className="speak-button__label">{label}</p>
    </div>
  )
}

export default SpeakButton
