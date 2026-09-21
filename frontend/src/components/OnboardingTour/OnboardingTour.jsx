import { useState } from 'react'
import './OnboardingTour.css'

const DISMISS_KEY = 'weathergpt.tourDismissed'

const STEPS = [
  { title: 'Tap to speak', body: 'Ask a weather or safety question out loud, or type it — either works.' },
  { title: 'Open the menu', body: 'The hamburger icon (top-left) gets you to every screen — Alerts, My Advice, and more.' },
  { title: 'Check Alerts', body: 'Official alerts, Send SOS, and community reports all live under Alerts & Field Reports.' },
]

/**
 * A simple step-through overlay, shown once per browser (localStorage
 * flag) and dismissible at any point. Simplified from "point at the
 * actual DOM element" to a centered card describing where to look —
 * true anchored tooltips would need real positioning logic against
 * each target element, which isn't built here.
 */
function OnboardingTour() {
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(DISMISS_KEY) === '1')
  const [stepIndex, setStepIndex] = useState(0)

  if (dismissed) return null

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, '1')
    setDismissed(true)
  }

  const step = STEPS[stepIndex]
  const isLastStep = stepIndex === STEPS.length - 1

  return (
    <div className="onboarding-tour">
      <div className="onboarding-tour__card">
        <p className="onboarding-tour__step-count">
          {stepIndex + 1} / {STEPS.length}
        </p>
        <h2 className="onboarding-tour__title">{step.title}</h2>
        <p className="onboarding-tour__body">{step.body}</p>
        <div className="onboarding-tour__actions">
          <button type="button" className="onboarding-tour__skip" onClick={dismiss}>
            Skip
          </button>
          <button
            type="button"
            className="onboarding-tour__next"
            onClick={() => (isLastStep ? dismiss() : setStepIndex((i) => i + 1))}
          >
            {isLastStep ? 'Got it' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default OnboardingTour
