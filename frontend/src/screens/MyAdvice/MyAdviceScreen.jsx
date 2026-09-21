import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAppSettings } from '../../context/AppSettingsContext'
import { useWeather } from '../../hooks/useWeather'
import { stepsForRole } from '../../data/adviceRules'
import { SAMPLE_WEATHER } from '../../data/sampleWeather'
import ListenButton from '../../components/ListenButton/ListenButton'
import DemoTag from '../../components/DemoTag/DemoTag'
import RouteCheck from './RouteCheck'
import './MyAdviceScreen.css'

/**
 * Numbered, role-tuned guidance steps — data-driven (see adviceRules.js)
 * so swapping in a real deterministic rules engine later doesn't mean
 * rewriting this component. Each step has a real Listen button (Web
 * Speech synthesis) and an "Ask about this" button that jumps to Ask
 * with the step pre-filled as the question.
 */
function MyAdviceScreen() {
  const { role, district, demoMode } = useAppSettings()
  const { t } = useTranslation()
  const isDemo = demoMode === 'demo'
  const navigate = useNavigate()

  const { data: liveWeather } = useWeather(isDemo ? null : district)
  const weather = isDemo ? SAMPLE_WEATHER : liveWeather
  const steps = stepsForRole(role, weather, { district })

  const askAboutStep = (stepText) => {
    navigate('/ask', { state: { prefill: `About this advice: "${stepText}"` } })
  }

  return (
    <div className="my-advice-screen">
      <h1 className="my-advice-screen__title">{t('myAdvice.title')}</h1>

      <p className="my-advice-screen__disclaimer">{t('myAdvice.disclaimer')}</p>

      <div className="my-advice-screen__meta">
        <span>
          {t('myAdvice.forRole')}: {role}
        </span>
        {isDemo && <DemoTag />}
      </div>

      {steps.length === 0 ? (
        <p className="my-advice-screen__empty">{t('myAdvice.noGuidance')}</p>
      ) : (
        <ol className="my-advice-screen__steps">
          {steps.map((step, index) => (
            <li key={step.id} className="my-advice-screen__step">
              <span className="my-advice-screen__step-number">{index + 1}</span>
              <p className="my-advice-screen__step-text">{step.stepText}</p>
              <div className="my-advice-screen__step-actions">
                <ListenButton text={step.stepText} />
                <button
                  type="button"
                  className="my-advice-screen__ask-button"
                  onClick={() => askAboutStep(step.stepText)}
                >
                  {t('common.askAboutThis')}
                </button>
              </div>
            </li>
          ))}
        </ol>
      )}

      {role === 'Driver' && <RouteCheck origin={district} isDemo={isDemo} />}
    </div>
  )
}

export default MyAdviceScreen
