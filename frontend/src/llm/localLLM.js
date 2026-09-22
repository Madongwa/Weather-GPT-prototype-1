// On-device LLM phrasing step — replaces the old Groq API call (see
// backend/ask.py's git history). Runs llama.cpp compiled to WASM
// (wllama) entirely inside the app's WebView, against a small
// instruct model, so no cloud LLM call happens anywhere in this path.
import { Capacitor } from '@capacitor/core'
import { Wllama } from '@wllama/wllama/esm/index.js'
import wllamaWasmUrl from '@wllama/wllama/esm/wasm/wllama.wasm?url'
import { SYSTEM_PROMPT, buildUserContent, formatAdvisories } from './prompt'
import { validateAnswer } from './answerValidator'

// In the packaged Android app, the model is bundled into the APK at
// build time (see scripts/fetch-model.mjs, run before `npx cap sync`)
// so answers work fully offline once installed — not committed to git
// (frontend/.gitignore) because of its size. On the website, bundling
// the same ~270MB file isn't an option (Vercel rejects any single
// deployment file over 100MB), so the browser build instead streams it
// straight from Hugging Face's CDN and lets wllama cache it in
// IndexedDB (see `useCache` below) so only the very first question
// pays the download.
const MODEL_FILENAME = 'SmolLM2-360M-Instruct-Q4_K_M.gguf'
const MODEL_URL = Capacitor.isNativePlatform()
  ? `/models/${MODEL_FILENAME}`
  : `https://huggingface.co/bartowski/SmolLM2-360M-Instruct-GGUF/resolve/main/${MODEL_FILENAME}`

let wllamaInstance = null
let loadPromise = null

function getInstance() {
  if (!wllamaInstance) {
    wllamaInstance = new Wllama({ default: wllamaWasmUrl })
  }
  return wllamaInstance
}

/**
 * Loads the bundled model into memory. Idempotent — safe to call on
 * every question; after the first call it just reuses the in-flight or
 * already-resolved load. `progressCallback` only fires for the call
 * that actually starts the load — later concurrent callers just await
 * the same promise without progress events, which is fine since the UI
 * only has one turn loading at a time anyway.
 */
export function loadModel({ progressCallback } = {}) {
  if (!loadPromise) {
    const wllama = getInstance()
    loadPromise = wllama.loadModelFromUrl(MODEL_URL, {
      // The system prompt + grounding text + one question comfortably
      // fits well under 1000 tokens (no multi-turn history is kept per
      // request) — a smaller context means a smaller KV cache to
      // allocate and walk, which speeds up every request a little.
      n_ctx: 2048,
      // Native app: already a local bundled asset, no point caching it a
      // second time in IndexedDB. Website: MODEL_URL is a remote HF
      // download, so this is what makes every question after the first
      // one skip re-downloading ~270MB.
      useCache: !Capacitor.isNativePlatform(),
      progressCallback,
    })
  }
  return loadPromise
}

/**
 * HEAD-checks that the model file is reachable (bundled locally in the
 * app, or on Hugging Face's CDN on the website) without loading the
 * full model into memory — used by Trust & Sources' status row instead
 * of triggering a multi-hundred-MB load just to show a dot.
 */
export async function checkLocalModelAvailable() {
  try {
    const response = await fetch(MODEL_URL, { method: 'HEAD' })
    return response.ok
  } catch {
    return false
  }
}

export class LocalLLMUnavailableError extends Error {}

/**
 * Mirrors the old backend/ask.py answer_question() — same system
 * prompt, same grounding shape, same rule-based severity-claim
 * validator — but runs the actual LLM call on-device.
 *
 * `onLoadProgress({ loaded, total })` fires while the (first-time,
 * ~500MB) model load is in progress; `onGenerating()` fires once
 * loading is done and token generation actually starts; `onToken(text)`
 * fires with each partial answer as it streams in — together these are
 * what let the UI show real "loading model NN%" / "thinking" /
 * streaming-text states instead of an opaque, unmoving spinner.
 */
export async function generateAnswer({
  question,
  district,
  role,
  weatherSummary,
  advisories,
  onLoadProgress,
  onGenerating,
  onToken,
}) {
  try {
    await loadModel({ progressCallback: onLoadProgress })
  } catch (err) {
    throw new LocalLLMUnavailableError(err?.message ?? String(err))
  }

  onGenerating?.()

  const wllama = getInstance()
  const userContent = buildUserContent({ question, district, role, weatherSummary, advisories })

  let fullText = ''
  try {
    await wllama.createChatCompletion({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userContent },
      ],
      // The system prompt now asks for 1 short sentence (2 at most) —
      // real answers run well under 60 tokens, so this is a hard
      // ceiling against a runaway generation, not a target. Also
      // caps worst-case wait time, which matters more on-device than
      // it would server-side.
      max_tokens: 80,
      temperature: 0.3,
      // A model this small (360M) will readily fall into a degenerate
      // loop — repeating one word (e.g. "the the the...") until it hits
      // max_tokens — especially with noisy grounding text in context.
      // Penalizing tokens it already used over the last 64 is what
      // actually breaks that loop; temperature alone doesn't.
      penalty_repeat: 1.3,
      penalty_last_n: 64,
      stream: true,
      onData: (chunk) => {
        const delta = chunk.choices[0]?.delta?.content
        if (delta) {
          fullText += delta
          onToken?.(fullText)
        }
      },
    })
  } catch (err) {
    throw new LocalLLMUnavailableError(err?.message ?? String(err))
  }

  const groundingText = `${weatherSummary ?? ''}\n${formatAdvisories(advisories)}`
  return validateAnswer(fullText.trim(), groundingText)
}
