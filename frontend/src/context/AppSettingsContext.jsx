import { createContext, useContext, useEffect, useState } from 'react'
import i18n from '../i18n'
import { useHealthCheck } from '../hooks/useHealthCheck'
import { DEFAULT_ROLE } from '../constants/roles'
import { DEFAULT_DISTRICT } from '../constants/districts'
import { DEFAULT_LANGUAGE, LANGUAGE_CODES } from '../constants/languages'
import { DEFAULT_DEMO_MODE } from '../constants/demoModes'

const STORAGE_KEY = 'weathergpt.appSettings'

/*
 * React Context in a nutshell: it lets any component below the Provider
 * read (and update) this data by calling `useAppSettings()`, without
 * every component in between having to accept it as a prop just to pass
 * it further down ("prop drilling"). Role, district, language, demo
 * mode, and connectivity are needed by the status strip, the drawer,
 * and screens/components scattered all over the route tree (AnswerCard,
 * Trust & Sources, eventually Alerts and Notifications) — threading
 * five props through every screen and layout component between App and
 * those consumers would be a lot of pointless plumbing. Context skips
 * the plumbing.
 *
 * The trade-off: anything read from Context re-renders every component
 * that reads it whenever it changes, whereas a prop only re-renders the
 * component it's passed to. That's fine for slow-changing app-wide
 * settings like these, but it's why we don't put fast-changing local
 * state (like an input's current text) in Context.
 */
const AppSettingsContext = createContext(null)

function loadPersisted() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    // Corrupt or missing storage — fall back to defaults below.
    return {}
  }
}

export function AppSettingsProvider({ children }) {
  const persisted = loadPersisted()
  const [role, setRole] = useState(persisted.role ?? DEFAULT_ROLE)
  const [district, setDistrict] = useState(persisted.district ?? DEFAULT_DISTRICT)
  const [language, setLanguage] = useState(persisted.language ?? DEFAULT_LANGUAGE)
  const [demoMode, setDemoMode] = useState(persisted.demoMode ?? DEFAULT_DEMO_MODE)

  // Same backend health check the header dot always showed — called
  // once here instead of separately in every screen that needs it, so
  // Header, AnswerCard, and (later) Alerts/Trust & Sources all see the
  // same online/offline value from a single fetch.
  const isOnline = useHealthCheck()

  // localStorage persists across reloads and browser restarts (unlike
  // plain useState, which resets to its initial value on every reload).
  // We re-save on every change so picking a different district, say,
  // survives a refresh.
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ role, district, language, demoMode }))
  }, [role, district, language, demoMode])

  // Keeps i18next (which drives every `t('...')` call in the UI) and the
  // document's text direction in sync with the `language` setting.
  // Urdu is written right-to-left — `dir="rtl"` on <html> is what flips
  // layout direction for RTL scripts; without it, Urdu text would
  // render in an LTR-laid-out page, which looks wrong to a reader.
  useEffect(() => {
    const code = LANGUAGE_CODES[language] ?? 'en'
    i18n.changeLanguage(code)
    document.documentElement.dir = code === 'ur' ? 'rtl' : 'ltr'
  }, [language])

  const value = {
    role,
    setRole,
    district,
    setDistrict,
    language,
    setLanguage,
    demoMode,
    setDemoMode,
    isOnline,
  }

  return <AppSettingsContext.Provider value={value}>{children}</AppSettingsContext.Provider>
}

export function useAppSettings() {
  const ctx = useContext(AppSettingsContext)
  if (!ctx) {
    throw new Error('useAppSettings must be used inside an AppSettingsProvider')
  }
  return ctx
}
