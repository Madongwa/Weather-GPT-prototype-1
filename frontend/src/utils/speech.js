/**
 * Thin wrappers around the browser's native Web Speech APIs — no
 * backend, no API key, no account. Support varies by browser (best in
 * Chrome/Edge; Firefox has no SpeechRecognition at all as of this
 * writing), so every caller checks the `is*Supported` flag and degrades
 * gracefully instead of assuming these work everywhere.
 */

const SpeechRecognitionImpl = window.SpeechRecognition || window.webkitSpeechRecognition

export const isSpeechRecognitionSupported = Boolean(SpeechRecognitionImpl)
export const isSpeechSynthesisSupported = 'speechSynthesis' in window

/**
 * Starts one listening session and resolves with the recognized text,
 * or rejects (no speech detected, mic permission denied, unsupported).
 */
export function listenOnce({ lang = 'en-IN' } = {}) {
  return new Promise((resolve, reject) => {
    if (!isSpeechRecognitionSupported) {
      reject(new Error('Speech recognition is not supported in this browser.'))
      return
    }

    const recognition = new SpeechRecognitionImpl()
    recognition.lang = lang
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    recognition.onresult = (event) => resolve(event.results[0][0].transcript)
    recognition.onerror = (event) => reject(new Error(event.error || 'Speech recognition failed'))

    recognition.start()
  })
}

/** Speaks `text` aloud. Silently does nothing if unsupported or empty. */
export function speak(text) {
  if (!isSpeechSynthesisSupported || !text) return
  window.speechSynthesis.cancel() // don't let utterances stack/overlap
  window.speechSynthesis.speak(new SpeechSynthesisUtterance(text))
}
