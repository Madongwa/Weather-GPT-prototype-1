import { generateAnswer } from '../llm/localLLM'

// Same VITE_API_BASE override as api/client.js.
const ASK_URL = `${import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8000'}/ask`

/**
 * Fetches live grounding data (weather + a web search, see
 * backend/ask.py) from the backend, then phrases the actual answer
 * on-device via a bundled local LLM (see src/llm/localLLM.js) — no
 * cloud LLM call happens anywhere in this path anymore. The backend
 * call can fail (or the district can be unknown) without failing the
 * question: the local model still answers, just without live grounding.
 */
export async function askQuestion({ question, district, role, onLoadProgress, onGenerating, onToken }) {
  let context = { weather_summary: null, grounded: false, source_label: 'No live data available', sources: [] }

  try {
    const response = await fetch(ASK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, district, role }),
    })
    if (response.ok) context = await response.json()
  } catch {
    // Backend unreachable — fall through with the ungrounded default
    // context above; the on-device model still answers.
  }

  const answer = await generateAnswer({
    question,
    district,
    role,
    weatherSummary: context.weather_summary,
    advisories: context.sources ?? [],
    onLoadProgress,
    onGenerating,
    onToken,
  })

  return {
    answer,
    grounded: context.grounded,
    source_label: context.source_label,
    sources: context.sources ?? [],
  }
}
