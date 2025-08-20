import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useLanguageNavigate } from '../hooks/useLanguage'
import SEOHead from './SEOHead'

type ErrorPageProps = {
  type: '404' | '403' | '500' | 'network' | 'unauthorized'
  title?: string
  subtitle?: string
  description?: string
  showRetry?: boolean
  onRetry?: () => void
}

export default function ErrorPage({ 
  type, 
  title, 
  subtitle, 
  description, 
  showRetry = false, 
  onRetry 
}: ErrorPageProps) {
  const { t } = useTranslation('errors')
  const languageNavigate = useLanguageNavigate()

  // Get error content based on type
  const errorContent = {
    title: title || t(`page${type}.title`),
    subtitle: subtitle || t(`page${type}.subtitle`),
    description: description || t(`page${type}.description`)
  }

  const getErrorIcon = (type: string) => {
    switch (type) {
      case '404': return '🔍'
      case '403': return '🚫'
      case '500': return '⚠️'
      case 'network': return '🌐'
      case 'unauthorized': return '🔒'
      default: return '❌'
    }
  }

  const handleGoHome = () => {
    languageNavigate('/')
  }

  const handleGoBack = () => {
    window.history.back()
  }

  const getActionButtons = () => {
    switch (type) {
      case '404':
        return (
          <div className="button-group">
            <button className="primary-button" onClick={handleGoHome}>
              {t('page404.actions.home', 'Go to Home')}
            </button>
            <button className="secondary-button" onClick={handleGoBack}>
              {t('page404.actions.back', 'Go Back')}
            </button>
            <Link to="/discussions" className="secondary-button">
              {t('page404.actions.discussions', 'View Discussions')}
            </Link>
          </div>
        )
      case '500':
        return (
          <div className="button-group">
            <button className="primary-button" onClick={() => window.location.reload()}>
              {t('page500.actions.refresh', 'Refresh Page')}
            </button>
            <button className="secondary-button" onClick={handleGoHome}>
              {t('page500.actions.home', 'Go to Home')}
            </button>
          </div>
        )
      case 'network':
        return (
          <div className="button-group">
            {showRetry && onRetry && (
              <button className="primary-button" onClick={onRetry}>
                {t('network.actions.retry', 'Try Again')}
              </button>
            )}
            <button className="secondary-button" onClick={() => window.location.reload()}>
              {t('network.actions.refresh', 'Refresh Page')}
            </button>
            <button className="secondary-button" onClick={handleGoHome}>
              {t('common:buttons.cancel', 'Cancel')}
            </button>
          </div>
        )
      case '403':
        return (
          <div className="button-group">
            <button className="primary-button" onClick={handleGoHome}>
              {t('page403.actions.home', 'Go to Home')}
            </button>
            <Link to="/login" className="secondary-button">
              {t('page403.actions.login', 'Log In')}
            </Link>
            <button className="secondary-button" onClick={handleGoBack}>
              {t('page403.actions.back', 'Go Back')}
            </button>
          </div>
        )
      case 'unauthorized':
        return (
          <div className="button-group">
            <Link to="/login" className="primary-button">
              {t('unauthorized.actions.login', 'Log In')}
            </Link>
            <button className="secondary-button" onClick={handleGoHome}>
              {t('unauthorized.actions.home', 'Go to Home')}
            </button>
            <Link to="/register" className="secondary-button">
              {t('unauthorized.actions.register', 'Create Account')}
            </Link>
          </div>
        )
      default:
        return (
          <button className="primary-button" onClick={handleGoHome}>
            {t('common:buttons.back', 'Go Back')}
          </button>
        )
    }
  }

  return (
    <div className="container container-narrow">
      <SEOHead 
        title={`${errorContent.title} - Veche`}
        description={errorContent.description}
      />
      
      <div className="text-center mt-12 mb-8">
        <div 
          style={{ 
            fontSize: '4rem', 
            marginBottom: 'var(--space-lg)',
            opacity: 0.8
          }}
        >
          {getErrorIcon(type)}
        </div>
        
        <h1 className="mb-4" style={{ fontSize: 'var(--text-4xl)', fontWeight: 700 }}>
          {errorContent.title}
        </h1>
        
        <p className="text-secondary mb-4" style={{ fontSize: 'var(--text-lg)' }}>
          {errorContent.subtitle}
        </p>
        
        <p className="text-tertiary mb-8" style={{ fontSize: 'var(--text-base)' }}>
          {errorContent.description}
        </p>
        
        {getActionButtons()}
      </div>
      
      {/* Error details for development */}
      {import.meta.env.MODE === 'development' && (
        <div className="card mt-8" style={{ 
          background: 'var(--border-light)', 
          border: '1px solid var(--border)',
          fontSize: 'var(--text-sm)'
        }}>
          <div className="font-medium mb-2">Development Info:</div>
          <div>Error Type: {type}</div>
          <div>Current URL: {window.location.href}</div>
          <div>User Agent: {navigator.userAgent.split(' ')[0]}</div>
        </div>
      )}
    </div>
  )
}
