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
