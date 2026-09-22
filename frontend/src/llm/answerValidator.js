// Ported from backend/ask.py's _validate_answer — a rule-based check
// (not a second LLM call), run here instead of server-side now that the
// phrasing LLM itself runs on-device. Regex against text already in
// hand, so it adds no latency or cost. If the answer names a specific
// alert level that doesn't appear anywhere in the data the model was
// actually given, that's a plausible hallucination rather than a
// grounded claim, so a caveat is appended rather than silently trusting it.
const SEVERITY_TERMS =
  /\b(red alert|orange alert|yellow alert|green alert|red warning|orange warning|yellow warning|extremely severe cyclonic storm|very severe cyclonic storm|severe cyclonic storm)\b/gi

export function validateAnswer(answer, groundingText) {
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
