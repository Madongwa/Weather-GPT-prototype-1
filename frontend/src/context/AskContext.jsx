import { createContext, useContext, useState } from 'react'
import { useAppSettings } from './AppSettingsContext'
import { SPEECH_LOCALES } from '../constants/languages'
import { askQuestion } from '../api/ask'
import { speak } from '../utils/speech'
import { SAMPLE_CONVERSATION } from '../data/sampleConversation'

/*
 * Separate from AppSettingsContext on purpose — that context's own
 * docstring already makes the case for why: role/district/language are
 * slow-changing settings, but a conversation grows with every question
 * asked, and every consumer of AppSettingsContext would re-render on
 * every new chat turn if the two were merged. Splitting them means
 * Sidebar/StatusStrip (which only care about settings) never re-render
 * because someone asked a question.
 *
 * This is what lets Home's hero card and the Ask screen's conversation
 * history show the same underlying chat — both call useAsk() instead of
 * keeping their own separate copies that could drift out of sync.
 */
const AskContext = createContext(null)

export function AskProvider({ children }) {
  const { district, role, demoMode, language } = useAppSettings()
  const [conversation, setConversation] = useState(SAMPLE_CONVERSATION)
  const [hearAloud, setHearAloud] = useState(false)

  // Replaces one turn (matched by id) with an updated version — used
  // below to carry a turn through its status states (see handleAsk)
  // as the on-device model loads, then generates, then finishes.
  const updateTurn = (id, changes) => {
    setConversation((prev) => prev.map((turn) => (turn.id === id ? { ...turn, ...changes } : turn)))
    // Only speak once the real (or sample) answer actually lands — not
    // a loading-progress or in-progress streamed update.
    if (hearAloud && changes.status === 'done' && changes.answer) speak(changes.answer, SPEECH_LOCALES[language])
  }

  const handleAsk = async (question) => {
    const id = `turn-${Date.now()}`
    setConversation((prev) => [
      ...prev,
      { id, question, answer: '', status: 'loading-model', progress: 0, grounded: false, sourceLabel: 'Loading' },
    ])

    // Demo Mode never calls the backend — same honesty mechanism as the
    // Home screen's weather card and Trust & Sources' Demo Mode switch.
    if (demoMode === 'demo') {
      updateTurn(id, {
        answer:
          'Sample answer — switch Demo Mode to IMD-only or Hybrid in Trust & Sources to get a real, live response.',
        status: 'done',
        grounded: true,
        sourceLabel: 'Sample data',
      })
      return
    }

    try {
      const data = await askQuestion({
        question,
        district,
        role,
        // The on-device model's first load reads a ~500MB file — this
        // is what lets the UI show real "loading model NN%" progress
        // instead of an indefinite spinner during that wait.
        onLoadProgress: ({ loaded, total }) => {
          updateTurn(id, { status: 'loading-model', progress: total ? Math.floor((loaded / total) * 100) : 0 })
        },
        onGenerating: () => updateTurn(id, { status: 'thinking', progress: 100 }),
        onToken: (partialAnswer) => updateTurn(id, { answer: partialAnswer }),
      })
      updateTurn(id, {
        answer: data.answer,
        status: 'done',
        grounded: data.grounded,
        sourceLabel: data.source_label,
        sources: data.sources ?? [],
      })
    } catch {
      updateTurn(id, {
        answer: 'Could not get an answer just now — the on-device model may still be loading.',
        status: 'done',
        grounded: false,
        sourceLabel: 'Unreachable',
      })
    }
  }

  const value = { conversation, handleAsk, hearAloud, setHearAloud }

  return <AskContext.Provider value={value}>{children}</AskContext.Provider>
}

export function useAsk() {
  const ctx = useContext(AskContext)
  if (!ctx) {
    throw new Error('useAsk must be used inside an AskProvider')
  }
  return ctx
}
