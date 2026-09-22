import './ThinkingIndicator.css'

/**
 * Shown in place of the answer text while a turn is still in progress
 * (see AskContext's handleAsk) — the on-device model's first load reads
 * a ~500MB file, which can take anywhere from several seconds to over a
 * minute depending on the device, so a plain unmoving "Thinking…" label
 * reads as broken/frozen. This shows real, moving progress instead: a
 * percentage while the model file loads, then a bouncing-dots "typing"
 * indicator once it's actually generating the answer.
 */
function ThinkingIndicator({ status, progress }) {
  if (status === 'loading-model') {
    return (
      <div className="thinking-indicator">
        <div className="thinking-indicator__bar-track">
          <div className="thinking-indicator__bar-fill" style={{ width: `${progress}%` }} />
        </div>
        <span className="thinking-indicator__label">Loading offline AI model… {progress}%</span>
      </div>
    )
  }

  return (
    <div className="thinking-indicator thinking-indicator--dots" aria-label="Thinking">
      <span className="thinking-indicator__dot" />
      <span className="thinking-indicator__dot" />
      <span className="thinking-indicator__dot" />
    </div>
  )
}

export default ThinkingIndicator
