import './GroundedFooter.css'

/**
 * The small footer row under an answer: a status pill (teal dot +
 * "Grounded" when backed by real sources, amber dot + "Unverified" when
 * sources are stale or conflict) plus where/when the answer came from.
 *
 * Pulled out of AnswerCard into its own component because ChatTurn (the
 * desktop conversation-history list) needs the exact same footer for
 * every past answer — extracting it once guarantees both places always
 * agree visually, instead of two copies slowly drifting apart.
 */
function GroundedFooter({ grounded = true, sourceLabel }) {
  return (
    <div className="grounded-footer">
      <span
        className={`grounded-footer__status ${
          grounded ? 'grounded-footer__status--grounded' : 'grounded-footer__status--unverified'
        }`}
      >
        <span className="grounded-footer__dot" aria-hidden="true" />
        {grounded ? 'Grounded' : 'Unverified'}
      </span>
      <span className="grounded-footer__source">{sourceLabel}</span>
    </div>
  )
}

export default GroundedFooter
