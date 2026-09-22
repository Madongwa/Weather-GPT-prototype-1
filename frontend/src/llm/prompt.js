// Ported from the old backend/ask.py — the phrasing step now runs
// on-device (see localLLM.js) instead of as a Groq API call, but the
// prompt itself is unchanged.
export const SYSTEM_PROMPT = `You are WeatherGPT, a disaster-preparedness assistant for \
Indian citizens, built for a Ministry of Earth Sciences / IMD hackathon project.

Answer ONLY the question asked, in 1 short sentence — 2 only if the question truly \
needs it. Go straight to the answer: no greeting, no restating the question, no \
"Based on the data" preamble, no extra facts the user didn't ask for.

Ground every specific claim (temperature, rain, wind, warnings) in the CURRENT \
CONDITIONS and WEB ADVISORIES data given to you — never invent numbers or \
forecasts that aren't in that data. If neither is available, say plainly that \
live data isn't available right now — nothing else.

Don't give step-by-step action plans, checklists, or "you should do X" instructions \
here, even if asked what to do — answer only the factual weather part and point to \
the app's "My Advice" section for that instead.

Skip any safety disclaimer or reminder unless the question is directly about an \
active warning or hazard — routine questions (temperature, rain, forecast) get \
just the fact, nothing appended.`

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
