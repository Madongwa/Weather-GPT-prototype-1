import { useTranslation } from 'react-i18next'
import { isSpeechSynthesisSupported, speak } from '../../utils/speech'
import './ListenButton.css'

/**
 * A small "Listen" icon button that reads `text` aloud via the browser's
 * native speech synthesis (utils/speech.js) — real TTS, no backend, no
 * API key. Renders nothing when the browser doesn't support it, rather
 * than showing a button that silently does nothing when tapped.
 */
function ListenButton({ text }) {
  const { t } = useTranslation()
  if (!isSpeechSynthesisSupported) return null

  return (
    <button
      type="button"
      className="listen-button"
      aria-label={t('common.listen')}
      onClick={() => speak(text)}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M4 9v6h4l5 5V4L8 9H4Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path
          d="M16.5 8.5a5 5 0 0 1 0 7"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    </button>
  )
}

export default ListenButton
