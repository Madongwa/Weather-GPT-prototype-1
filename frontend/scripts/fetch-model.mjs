// Downloads the on-device LLM's GGUF weights into public/models/ so
// they get bundled straight into the Vite build (and from there, the
// Capacitor Android APK) — see src/llm/localLLM.js. Not run
// automatically on `npm install`: it's a ~500MB download, so it's a
// separate opt-in step (`npm run model:fetch`), documented in the
// frontend README, before `npm run build` / `npx cap sync`.
import { createWriteStream, existsSync, mkdirSync } from 'node:fs'
import { pipeline } from 'node:stream/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

// Gemma-3-270M-it — tried SmolLM2-360M-Instruct first (too weak, degenerated
// into repeated-token loops under noisy grounding context), then
// Llama-3.2-1B-Instruct (coherent, but its ~800MB download OOM-crashed a
// real phone). Gemma-3-270M-it is the smallest of the three (~253MB) —
// Google's current small on-device model. See src/llm/localLLM.js, and
// answerValidator.js for the fallback if this one turns out weak too.
const MODEL_URL = 'https://huggingface.co/unsloth/gemma-3-270m-it-GGUF/resolve/main/gemma-3-270m-it-Q4_K_M.gguf'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const destDir = path.join(__dirname, '..', 'public', 'models')
const destPath = path.join(destDir, path.basename(MODEL_URL))

async function main() {
  if (existsSync(destPath)) {
    console.log(`Model already present at ${destPath}, skipping download.`)
    return
  }

  mkdirSync(destDir, { recursive: true })
  console.log(`Downloading ${MODEL_URL}`)

  const response = await fetch(MODEL_URL, { redirect: 'follow' })
  if (!response.ok || !response.body) {
    throw new Error(`Download failed: HTTP ${response.status}`)
  }

  const total = Number(response.headers.get('content-length') ?? 0)
  let loaded = 0
  let lastLoggedPercent = -1

  const progressStream = new (await import('node:stream')).Transform({
    transform(chunk, _encoding, callback) {
      loaded += chunk.length
      if (total) {
        const percent = Math.floor((loaded / total) * 100)
        if (percent !== lastLoggedPercent) {
          lastLoggedPercent = percent
          process.stdout.write(`\r  ${percent}% (${(loaded / 1e6).toFixed(0)}MB / ${(total / 1e6).toFixed(0)}MB)`)
        }
      }
      callback(null, chunk)
    },
  })

  const tmpPath = `${destPath}.part`
  await pipeline(response.body, progressStream, createWriteStream(tmpPath))
  await (await import('node:fs/promises')).rename(tmpPath, destPath)
  process.stdout.write('\n')
  console.log(`Saved to ${destPath}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
