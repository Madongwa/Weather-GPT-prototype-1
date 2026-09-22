// Ported from backend/ask.py's _validate_answer — a rule-based check
// (not a second LLM call), run here instead of server-side now that the
// phrasing LLM itself runs on-device. Regex against text already in
// hand, so it adds no latency or cost. If the answer names a specific
// alert level that doesn't appear anywhere in the data the model was
// actually given, that's a plausible hallucination rather than a
// grounded claim, so a caveat is appended rather than silently trusting it.
const SEVERITY_TERMS =
  /\b(red alert|orange alert|yellow alert|green alert|red warning|orange warning|yellow warning|extremely severe cyclonic storm|very severe cyclonic storm|severe cyclonic storm)\b/gi

const WORD_RE = /[a-zA-Z']+/g

/**
 * Catches the two failure modes small on-device models actually produced
 * in testing (SmolLM2-360M, then again under a noisy prompt): a
 * repeated-token loop ("the the the...") and outright word-salad
 * (stray parens/hashes, no real sentence structure). Deliberately crude
 * — not trying to judge quality, just "is this even language" — because
 * a false positive here just means falling back to the plain grounded
 * fact below, never to something worse.
 */
function isDegenerate(answer) {
  const trimmed = answer.trim()
  if (!trimmed) return true

  const words = trimmed.toLowerCase().match(WORD_RE) || []
  if (words.length < 2) return true

  const counts = new Map()
  for (const w of words) counts.set(w, (counts.get(w) ?? 0) + 1)
  const maxCount = Math.max(...counts.values())
  if (words.length >= 6 && maxCount / words.length > 0.3) return true // repetition loop

  const cleanChars = (trimmed.match(/[a-zA-Z0-9\s.,'!?°%-]/g) || []).length
  if (cleanChars / trimmed.length < 0.85) return true // too much symbol noise to be a real sentence

  // Word-salad garbage (e.g. "and Ref. of# deal-include>/ Generally (include#')")
  // often reads as mostly-clean by the ratio check above — the junk is sparse,
  // just structurally wrong. A plain conversational sentence never legitimately
  // contains markup/code punctuation like this, so any of it at all is a signal.
  const junkChars = (trimmed.match(/[(){}<>#/\[\]|`_~*^]/g) || []).length
  if (junkChars >= 2) return true

  return false
}

/** A plain, always-correct sentence built straight from the grounding data — no LLM involved. */
function buildFallbackAnswer({ weatherSummary, district }) {
  return weatherSummary
    ? `Current conditions in ${district}: ${weatherSummary}.`
    : `Live weather data isn't available right now for ${district}.`
}

export function validateAnswer(answer, groundingText, fallbackContext) {
  if (isDegenerate(answer)) {
    return buildFallbackAnswer(fallbackContext)
  }

  const mentioned = new Set([...answer.matchAll(SEVERITY_TERMS)].map((m) => m[0].toLowerCase()))
  if (mentioned.size === 0) return answer

  const groundingLower = groundingText.toLowerCase()
  const unsupported = [...mentioned].filter((term) => !groundingLower.includes(term))
  if (unsupported.length === 0) return answer

  return (
    `${answer}\n\n(Note: this mentions an alert level not found in the current data — ` +
    'verify with IMD directly before acting on it.)'
  )
}
