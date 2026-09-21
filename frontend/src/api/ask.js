// Same local dev address pattern as useHealthCheck.js / useWeather.js.
const ASK_URL = 'http://127.0.0.1:8000/ask'

/**
 * Calls the backend's /ask route — a real Claude call grounded in live
 * weather data server-side (see backend/ask.py). This is a plain async
 * function rather than a hook because it's triggered by a user action
 * (submitting a question), not something a component needs on mount.
 */
export async function askQuestion({ question, district, role }) {
  const response = await fetch(ASK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, district, role }),
  })

  if (!response.ok) throw new Error(`Unexpected status ${response.status}`)
  return response.json()
}
