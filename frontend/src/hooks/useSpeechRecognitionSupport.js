import { useEffect, useState } from 'react'
import { checkSpeechRecognitionSupported } from '../utils/speech'

/**
 * Whether speech-to-text is available on this device — starts `false`
 * and flips once the native availability check resolves (see
 * utils/speech.js), rather than blocking render on it. Used by Trust &
 * Sources' status board, which needs to know up front rather than only
 * discovering support/lack of it when the user taps a mic button.
 */
export function useSpeechRecognitionSupport() {
  const [supported, setSupported] = useState(false)

  useEffect(() => {
    let cancelled = false
    checkSpeechRecognitionSupported().then((result) => {
      if (!cancelled) setSupported(result)
    })
    return () => {
      cancelled = true
    }
  }, [])

  return supported
}
