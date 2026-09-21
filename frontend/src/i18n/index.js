import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en.json'
import te from './locales/te.json'
import hi from './locales/hi.json'
import ur from './locales/ur.json'

/**
 * Only static UI chrome (nav labels, buttons, titles, disclaimers) is
 * translated here — role and district names, and anything that comes
 * from the backend or the LLM (weather text, alert descriptions, Ask
 * screen answers), stay in English. Translating live/dynamic content
 * needs a real translation service, not a static key file — see
 * constants/languages.js for the fuller note on why that's a separate,
 * later piece of work.
 *
 * These four languages' translations are a first pass by a non-native
 * speaker (this codebase's author) and should be reviewed by someone
 * fluent before this ships for real — they're a working mechanism, not
 * verified translation quality.
 */
i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    te: { translation: te },
    hi: { translation: hi },
    ur: { translation: ur },
  },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false }, // React already escapes — avoid double-escaping.
})

export default i18n
