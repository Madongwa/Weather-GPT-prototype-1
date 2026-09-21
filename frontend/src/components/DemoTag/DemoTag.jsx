import './DemoTag.css'

/**
 * The small amber "Sample data" pill shown on any card whose content is
 * illustrative rather than real — first used on AnswerCard, now also on
 * HomeScreen's district card. Pulled into its own component for the same
 * reason as GroundedFooter: two call sites agreeing by construction
 * instead of by copy-paste.
 */
function DemoTag() {
  return <span className="demo-tag">Sample data</span>
}

export default DemoTag
