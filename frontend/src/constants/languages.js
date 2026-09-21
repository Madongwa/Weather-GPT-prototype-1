// The language picker now really does translate the app's static UI
// chrome (nav, buttons, titles, disclaimers) — see src/i18n/index.js —
// but role/district names and anything from the backend or the LLM
// still render in English regardless of this setting; those would need
// a real translation service, not a static key file, and that's a
// separate, later piece of work.
export const LANGUAGES = ['English', 'Telugu', 'Hindi', 'Urdu']

export const DEFAULT_LANGUAGE = LANGUAGES[0]

// Maps the display name stored in AppSettingsContext to the i18next
// language code its locale files are keyed by.
export const LANGUAGE_CODES = {
  English: 'en',
  Telugu: 'te',
  Hindi: 'hi',
  Urdu: 'ur',
}

// BCP-47 locale tags for the device's native speech recognizer/synthesizer
// (see utils/speech.js) — a different mapping from LANGUAGE_CODES above,
// since those are Android/Web Speech locale tags, not i18next's codes.
// Every SpeakButton/ListenButton call site must pass one of these rather
// than assuming English — the recognizer and synthesizer both silently
// default to en-IN otherwise, regardless of the selected app language.
export const SPEECH_LOCALES = {
  English: 'en-IN',
  Telugu: 'te-IN',
  Hindi: 'hi-IN',
  Urdu: 'ur-IN',
}
