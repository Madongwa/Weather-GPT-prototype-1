import { SpeechRecognition } from '@capacitor-community/speech-recognition'

/**
 * Speech-to-text used to be a thin wrapper around the browser's native
 * Web Speech API (SpeechRecognition/webkitSpeechRecognition) — fine on
 * desktop Chrome, but that API does not exist at all inside an Android
 * WebView (which is what the packaged app actually runs in — see
 * capacitor.config.json / android/). @capacitor-community/speech-
 * recognition (v7.0.1) bridges to the real native Android speech
 * recognizer instead, which is why every function here is async and
 * involves an explicit permission step: on Android this triggers a real
 * system permission dialog the first time, not a silent browser prompt.
 *
 * Text-to-speech (`speak`, below) is untouched — window.speechSynthesis
 * is a standard Web API that Android's WebView does support.
 */
export const isSpeechSynthesisSupported = 'speechSynthesis' in window

/**
 * Whether speech-to-text is available on this device at all. Async
 * (unlike the old Web Speech API's synchronous `Boolean(...)` check)
 * because it asks the native platform, not just the JS engine — see
 * useSpeechRecognitionSupport() for the React-friendly version of this
 * check, used where a component needs to know up front (e.g. Trust &
 * Sources' status board).
 */
export async function checkSpeechRecognitionSupported() {
  try {
    const { available } = await SpeechRecognition.available()
    return available
  } catch {
    return false
  }
}

/**
 * Starts one listening session and resolves with the recognized text,
 * or rejects with a specific, user-facing message — device doesn't
 * support it, microphone permission denied, or no speech detected —
 * rather than a generic failure. Callers show that message rather than
 * leaving the mic button looking like it silently did nothing.
 */
export async function listenOnce({ lang = 'en-IN' } = {}) {
  const { available } = await SpeechRecognition.available()
  if (!available) {
    throw new Error('Speech recognition is not available on this device.')
  }

  const permission = await SpeechRecognition.requestPermissions()
  if (permission.speechRecognition !== 'granted') {
    throw new Error('Microphone permission was denied — try typing instead.')
  }

  const { matches } = await SpeechRecognition.start({
    language: lang,
    maxResults: 1,
    partialResults: false,
    popup: false,
  })

  if (!matches || matches.length === 0) {
    throw new Error('No speech detected — try again.')
  }

  return matches[0]
}

/** Speaks `text` aloud. Silently does nothing if unsupported or empty. */
export function speak(text) {
  if (!isSpeechSynthesisSupported || !text) return
  window.speechSynthesis.cancel() // don't let utterances stack/overlap
  window.speechSynthesis.speak(new SpeechSynthesisUtterance(text))
}
