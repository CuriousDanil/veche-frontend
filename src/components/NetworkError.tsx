import { useTranslation } from 'react-i18next'

type NetworkErrorProps = {
  onRetry?: () => void
  message?: string
  inline?: boolean
}

export default function NetworkError({ onRetry, message, inline = false }: NetworkErrorProps) {
  const { t } = useTranslation('errors')

  const errorMessage = message || t('network.subtitle', 'Unable to connect to our servers.')

  if (inline) {
    return (
      <div className="card" style={{ 
        textAlign: 'center', 
        padding: 'var(--space-lg)',
        border: '1px solid var(--red)',
        backgroundColor: 'rgba(239, 68, 68, 0.05)'
      }}>
        <div style={{ fontSize: '2rem', marginBottom: 'var(--space-md)' }}>🌐</div>
        <h3 className="mb-2">{t('network.title', 'Connection Problem')}</h3>
        <p className="text-secondary mb-4">{errorMessage}</p>
        <div className="button-group">
          {onRetry && (
            <button className="primary-button" onClick={onRetry}>
              {t('network.actions.retry', 'Try Again')}
            </button>
          )}
          <button className="secondary-button" onClick={() => window.location.reload()}>
            {t('network.actions.refresh', 'Refresh Page')}
          </button>
        </div>
      </div>
    )
  }

  // Full page version
  return (
    <div className="container container-narrow">
      <div className="text-center mt-12 mb-8">
        <div style={{ fontSize: '4rem', marginBottom: 'var(--space-lg)', opacity: 0.8 }}>
          🌐
        </div>
        
        <h1 className="mb-4" style={{ fontSize: 'var(--text-4xl)', fontWeight: 700 }}>
          {t('network.title', 'Connection Problem')}
        </h1>
        
        <p className="text-secondary mb-4" style={{ fontSize: 'var(--text-lg)' }}>
          {errorMessage}
        </p>
        
        <p className="text-tertiary mb-8" style={{ fontSize: 'var(--text-base)' }}>
          {t('network.description', 'Please check your internet connection and try again.')}
        </p>
        
        <div className="button-group">
          {onRetry && (
            <button className="primary-button" onClick={onRetry}>
              {t('network.actions.retry', 'Try Again')}
            </button>
          )}
          <button className="secondary-button" onClick={() => window.location.reload()}>
            {t('network.actions.refresh', 'Refresh Page')}
          </button>
        </div>
      </div>
    </div>
  )
}
