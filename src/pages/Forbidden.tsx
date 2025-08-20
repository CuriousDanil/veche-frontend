import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLanguageNavigate } from '../hooks/useLanguage'
import { useLanguage } from '../hooks/useLanguage'
import ErrorPage from '../components/ErrorPage'

export default function Forbidden() {
  const { t } = useTranslation('errors')
  const languageNavigate = useLanguageNavigate()
  const { currentLanguage } = useLanguage()
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    // Update countdown every second
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval)
          languageNavigate('/')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [languageNavigate])

  const getCountdownMessage = () => {
    if (countdown <= 0) {
      return t('page403.redirecting', 'Redirecting to welcome page...')
    }

    if (currentLanguage === 'ru') {
      // Russian pluralization rules for seconds
      const mod10 = countdown % 10
      const mod100 = countdown % 100
      
      if (mod100 >= 11 && mod100 <= 14) {
        return t('page403.descriptionWithCountdown_many', { count: countdown })
      } else if (mod10 === 1) {
        return t('page403.descriptionWithCountdown', { count: countdown })
      } else if (mod10 >= 2 && mod10 <= 4) {
        return t('page403.descriptionWithCountdown_2', { count: countdown })
      } else {
        return t('page403.descriptionWithCountdown_many', { count: countdown })
      }
    }

    // English pluralization
    return t('page403.descriptionWithCountdown', 'You will be redirected to the welcome page in {{count}} seconds.', { count: countdown })
  }

  return (
    <ErrorPage 
      type="403"
      title={t('page403.title', 'Access Forbidden')}
      subtitle={t('page403.subtitle', 'You don\'t have permission to access this resource.')}
      description={getCountdownMessage()}
    />
  )
}