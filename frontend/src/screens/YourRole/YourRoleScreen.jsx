import { useTranslation } from 'react-i18next'
import { useAppSettings } from '../../context/AppSettingsContext'
import { ROLES } from '../../constants/roles'
import './YourRoleScreen.css'

/**
 * A grid of the 10 personas. Selecting one calls `setRole` from
 * Context — the same setter the status-strip pill already used — so
 * this screen and that pill can never disagree about the current role.
 *
 * The persona names themselves (ROLES) stay in English even when the
 * UI language is Telugu/Hindi/Urdu — they're stored identifiers that
 * adviceRules.js and the backend compare directly (`role === 'Farmer'`),
 * so translating just the label would desync the display from the
 * value being matched against. Only this screen's own chrome (title,
 * note) is translated.
 */
function YourRoleScreen() {
  const { role, setRole } = useAppSettings()
  const { t } = useTranslation()

  return (
    <div className="your-role-screen">
      <h1 className="your-role-screen__title">{t('yourRole.title')}</h1>
      <p className="your-role-screen__note">{t('yourRole.note')}</p>

      <div className="your-role-screen__grid">
        {ROLES.map((option) => (
          <button
            key={option}
            type="button"
            className={`your-role-screen__card ${option === role ? 'your-role-screen__card--active' : ''}`}
            aria-pressed={option === role}
            onClick={() => setRole(option)}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  )
}

export default YourRoleScreen
