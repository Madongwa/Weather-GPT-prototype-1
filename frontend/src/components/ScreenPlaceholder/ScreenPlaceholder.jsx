import './ScreenPlaceholder.css'

/**
 * Shared "not built yet" card, used by every screen this session leaves
 * as a stub, so it's obvious in the nav which parts are real vs. still
 * coming, without five near-identical one-off components.
 */
function ScreenPlaceholder({ title, phase, note }) {
  return (
    <div className="screen-placeholder">
      <h1 className="screen-placeholder__title">{title}</h1>
      <div className="screen-placeholder__card">
        <p className="screen-placeholder__phase">Coming in {phase}</p>
        <p className="screen-placeholder__note">{note}</p>
      </div>
    </div>
  )
}

export default ScreenPlaceholder
