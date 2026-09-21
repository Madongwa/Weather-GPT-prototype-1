import { Link } from 'react-router-dom'
import { ROLES } from '../../constants/roles'
import { topDoAndAvoid } from '../../data/adviceRules'
import DemoTag from '../../components/DemoTag/DemoTag'
import './AdviceTeaser.css'

/**
 * A preview of My Advice, not a copy of it — just the single top DO and
 * top AVOID for whichever role is selected, sourced from the same
 * {roleTags, predicate, stepText} rule data the full screen uses (see
 * src/data/adviceRules.js), so the two screens can never show
 * contradictory advice for the same role/weather combination.
 *
 * The role pills here read/write the same `role` in AppSettingsContext
 * that /role (Your Role) uses — selecting one here is the same action,
 * just reachable without leaving Home.
 */
function AdviceTeaser({ role, setRole, weather, isDemo, district }) {
  const { doStep, avoidStep } = topDoAndAvoid(role, weather, { district })

  return (
    <section id="advice-teaser" className="advice-teaser">
      <div className="advice-teaser__header">
        <div className="advice-teaser__title-row">
          <h2 className="advice-teaser__title">Advice for your work</h2>
          {isDemo && <DemoTag />}
        </div>
        <Link to="/role" className="advice-teaser__choose-link">
          Choose your work
        </Link>
      </div>

      <div className="advice-teaser__role-pills">
        {ROLES.map((option) => (
          <button
            key={option}
            type="button"
            className={`advice-teaser__role-pill ${option === role ? 'advice-teaser__role-pill--active' : ''}`}
            aria-pressed={option === role}
            onClick={() => setRole(option)}
          >
            {option}
          </button>
        ))}
      </div>

      <div className="advice-teaser__cards">
        <div className="advice-teaser__card advice-teaser__card--do">
          <span className="advice-teaser__card-icon" aria-hidden="true">
            <svg style={{ width: 'var(--icon-md)', height: 'var(--icon-md)' }} viewBox="0 0 24 24" fill="none">
              <path d="M5 12.5l4.5 4.5L19 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <p className="advice-teaser__card-title">Do this</p>
          <p className="advice-teaser__card-text">{doStep?.stepText ?? 'No specific guidance right now.'}</p>
        </div>

        <div className="advice-teaser__card advice-teaser__card--avoid">
          <span className="advice-teaser__card-icon" aria-hidden="true">
            <svg style={{ width: 'var(--icon-md)', height: 'var(--icon-md)' }} viewBox="0 0 24 24" fill="none">
              <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </span>
          <p className="advice-teaser__card-title">Avoid this</p>
          <p className="advice-teaser__card-text">{avoidStep?.stepText ?? 'Nothing specific to avoid right now.'}</p>
        </div>
      </div>

      <Link to="/advice" className="advice-teaser__full-link">
        See full advice
      </Link>
    </section>
  )
}

export default AdviceTeaser
