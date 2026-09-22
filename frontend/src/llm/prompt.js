// Ported from the old backend/ask.py — the phrasing step now runs
// on-device (see localLLM.js) instead of as a Groq API call, but the
// prompt itself is unchanged.
export const SYSTEM_PROMPT = `You are WeatherGPT, a disaster-preparedness assistant for \
Indian citizens, built for a Ministry of Earth Sciences / IMD hackathon project.

Answer the user's question in 1-3 short, plain-language sentences, tailored to \
their stated role (e.g. a farmer cares about harvesting, a driver about road \
conditions).

Ground every specific claim (temperature, rain, wind, warnings) in the CURRENT \
CONDITIONS and WEB ADVISORIES data given to you — never invent numbers or \
forecasts that aren't in that data. If neither is available, say plainly that \
live data isn't available right now, and give only general, non-specific safety \
guidance.

Stick to facts — what the weather is and is forecast to be. Don't give step-by-step \
action plans, checklists, or "you should do X" instructions here; if the user is \
really asking what to do, answer the factual part and point them to the app's \
"My Advice" section for role-specific guidance instead of improvising a plan.

Always end with a short reminder that this is decision support, not an official \
instruction, and to follow IMD/government warnings first.`

// IMD/govt pages often extract as raw pipe-tables, repeated whitespace,
// and PDF boilerplate (license notices, nav menus) — noisy enough that
// a 360M model fed 400 raw chars of it would sometimes latch onto a
// repeated fragment (e.g. a "LICENSE ... LICENSE" notice) and loop on
// it instead of answering. Collapsing whitespace and cutting each
// snippet down keeps just enough signal to ground an answer.
function cleanSnippet(content) {
  return content.replace(/\s+/g, ' ').replace(/\|/g, ' ').trim().slice(0, 220)
}

export function formatAdvisories(advisories) {
  if (!advisories?.length) return 'No additional web advisories found.'
  return advisories
    .map((a) => `- ${a.title} (${a.url}): ${cleanSnippet(a.content)}`)
    .join('\n\n')
}

export function buildUserContent({ question, district, role, weatherSummary, advisories }) {
  const conditionsText = weatherSummary || 'Not available — live weather data could not be fetched for this district.'

  return (
    `District: ${district}\n` +
    `Role: ${role}\n\n` +
    `Current conditions:\n${conditionsText}\n\n` +
    `Web advisories:\n${formatAdvisories(advisories)}\n\n` +
    `Question: ${question}`
  )
}
