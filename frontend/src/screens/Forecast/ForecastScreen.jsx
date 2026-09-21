import { useTranslation } from 'react-i18next'
import ScreenPlaceholder from '../../components/ScreenPlaceholder/ScreenPlaceholder'

function ForecastScreen() {
  const { t } = useTranslation()

  return (
    <ScreenPlaceholder
      title={t('forecast.title')}
      phase="a later phase"
      note="The multi-day outlook — extends beyond Home's next-hours strip into a several-day forecast view, once a source that goes that far out is wired in."
    />
  )
}

export default ForecastScreen
