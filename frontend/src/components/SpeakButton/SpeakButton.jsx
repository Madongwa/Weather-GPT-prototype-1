import { useState } from 'react'
import { useAppSettings } from '../../context/AppSettingsContext'
import { SPEECH_LOCALES } from '../../constants/languages'
import { listenOnce } from '../../utils/speech'
import './SpeakButton.css'

/**
 * The big tappable mic button — a plain circle (not the original
 * organic "blob" shape) so it reads consistently wherever it's reused.
 * Talks to the device's native speech recognizer via the
 * @capacitor-community/speech-recognition plugin (see utils/speech.js)
 * — the app runs inside an Android WebView (see android/), where the
 * browser's own SpeechRecognition API doesn't exist at all, so this
 * can't be a plain Web Speech API call. `listenOnce()` handles the
 * availability check and the (real, native, first-time-only) permission
 * dialog internally and throws a specific message on failure, which is
 * shown here rather than the button silently doing nothing.
 *
 * Shared between the Home screen's hero card and the Ask screen (see
 * AskContext for the conversation state both feed into) — extracted
 * once so neither has its own copy of the listening/error state
 * machine to keep in sync.
 *
 * `onResult(transcript)` is called with the recognized text.
 */
function SpeakButton({ onResult }) {
  const { language } = useAppSettings()
  const [listening, setListening] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const handleClick = async () => {
    if (listening) return

    setListening(true)
    setErrorMessage('')
    try {
      const transcript = await listenOnce({ lang: SPEECH_LOCALES[language] })
      onResult?.(transcript)
    } catch (error) {
      setErrorMessage(error.message || 'Could not start listening — try typing instead.')
      setTimeout(() => setErrorMessage(''), 3000)
    } finally {
      setListening(false)
    }
  }

  const label = errorMessage || (listening ? 'Listening…' : 'Tap to talk')

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
