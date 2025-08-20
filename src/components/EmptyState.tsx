import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useLanguageNavigate } from '../hooks/useLanguage'

type EmptyStateProps = {
  icon?: string
  title: string
  description?: string
  primaryAction?: {
    label: string
    onClick?: () => void
    href?: string
  }
  secondaryAction?: {
    label: string
    onClick?: () => void
    href?: string
  }
  size?: 'small' | 'medium' | 'large'
}

export default function EmptyState({ 
  icon = '📋', 
  title, 
  description, 
  primaryAction, 
  secondaryAction,
  size = 'medium'
}: EmptyStateProps) {
  const { t } = useTranslation('common')
  const languageNavigate = useLanguageNavigate()

  const sizeStyles = {
    small: {
      container: 'py-6',
      icon: '2rem',
      title: 'var(--text-lg)',
      description: 'var(--text-sm)'
    },
    medium: {
      container: 'py-8',
      icon: '3rem', 
      title: 'var(--text-xl)',
      description: 'var(--text-base)'
    },
    large: {
      container: 'py-12',
      icon: '4rem',
      title: 'var(--text-2xl)',
      description: 'var(--text-lg)'
    }
  }

  const styles = sizeStyles[size]

  const handlePrimaryAction = () => {
    if (primaryAction?.onClick) {
      primaryAction.onClick()
    } else if (primaryAction?.href) {
      languageNavigate(primaryAction.href)
    }
  }

  const handleSecondaryAction = () => {
    if (secondaryAction?.onClick) {
      secondaryAction.onClick()
    } else if (secondaryAction?.href) {
      languageNavigate(secondaryAction.href)
    }
  }

  return (
    <div className={`text-center ${styles.container}`}>
      <div 
        style={{ 
          fontSize: styles.icon, 
          marginBottom: 'var(--space-md)',
          opacity: 0.7
        }}
      >
        {icon}
      </div>
      
      <h3 
        className="text-secondary mb-2" 
        style={{ fontSize: styles.title, fontWeight: 600 }}
      >
        {title}
      </h3>
      
      {description && (
        <p 
          className="text-tertiary mb-6" 
          style={{ fontSize: styles.description }}
        >
          {description}
        </p>
      )}
      
      {(primaryAction || secondaryAction) && (
        <div className="button-group">
          {primaryAction && (
            primaryAction.href ? (
              <Link to={primaryAction.href} className="primary-button">
                {primaryAction.label}
              </Link>
            ) : (
              <button className="primary-button" onClick={handlePrimaryAction}>
                {primaryAction.label}
              </button>
            )
          )}
          
          {secondaryAction && (
            secondaryAction.href ? (
              <Link to={secondaryAction.href} className="secondary-button">
                {secondaryAction.label}
              </Link>
            ) : (
              <button className="secondary-button" onClick={handleSecondaryAction}>
                {secondaryAction.label}
              </button>
            )
          )}
        </div>
      )}
    </div>
  )
}
