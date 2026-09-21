import './LifecycleStepper.css'

const STAGES = ['Detected', 'Issued', 'Live', 'Resolved']

/** Horizontal Detected -> Issued -> Live -> Resolved progress indicator. */
function LifecycleStepper({ status, size = 'small' }) {
  const currentIndex = STAGES.indexOf(status)

  return (
    <ol className={`lifecycle-stepper lifecycle-stepper--${size}`}>
      {STAGES.map((stage, index) => (
        <li
          key={stage}
          className={`lifecycle-stepper__stage ${
            index <= currentIndex ? 'lifecycle-stepper__stage--done' : ''
          } ${index === currentIndex ? 'lifecycle-stepper__stage--current' : ''}`}
        >
          <span className="lifecycle-stepper__dot" aria-hidden="true" />
          <span className="lifecycle-stepper__label">{stage}</span>
        </li>
      ))}
    </ol>
  )
}

export default LifecycleStepper
