import { useTranslation } from 'react-i18next'
import ScreenPlaceholder from '../../components/ScreenPlaceholder/ScreenPlaceholder'

function HistoryScreen() {
  const { t } = useTranslation()

  return (
    <ScreenPlaceholder
      title={t('history.title')}
      phase="a later phase"
      note="A browsable log of past questions and answers across sessions — distinct from the Ask screen's pane, which only holds the current, in-session conversation."
    />
  )
}

export default HistoryScreen
