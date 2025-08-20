import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLanguage } from '../hooks/useLanguage'
import type { SupportedLanguage } from '../lib/i18n'

type LanguageSwitcherProps = {
  compact?: boolean
  className?: string
}

const LANGUAGE_NAMES: Record<SupportedLanguage, { native: string; english: string; flag: string }> = {
  en: { native: 'English', english: 'English', flag: '🇺🇸' },
  ru: { native: 'Русский', english: 'Russian', flag: '🇷🇺' }
}

export default function LanguageSwitcher({ compact = false, className = '' }: LanguageSwitcherProps) {
  const { t } = useTranslation('common')
  const { currentLanguage, changeLanguage, isLoading, supportedLanguages } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)

  const handleLanguageChange = async (language: SupportedLanguage) => {
    if (language !== currentLanguage && !isLoading) {
      await changeLanguage(language)
      setIsOpen(false)
    }
  }

  const toggleDropdown = () => {
    setIsOpen(!isOpen)
  }

  const handleKeyDown = (e: React.KeyboardEvent, language: SupportedLanguage) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleLanguageChange(language)
    }
  }

  const currentLangInfo = LANGUAGE_NAMES[currentLanguage]

  if (compact) {
    return (
      <div className={`language-switcher-compact ${className}`} style={{ position: 'relative' }}>
        <button
          className="secondary-button"
          onClick={toggleDropdown}
          disabled={isLoading}
          aria-label={t('language.switch')}
          aria-expanded={isOpen}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-xs)',
            minWidth: '80px',
          }}
        >
          <span>{currentLangInfo.flag}</span>
          <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>
            {currentLanguage.toUpperCase()}
          </span>
          <span style={{ 
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', 
            transition: 'transform 0.2s ease',
            fontSize: 'var(--text-xs)'
          }}>
            ▼
          </span>
        </button>
        
        {isOpen && (
          <div 
            className="language-dropdown card"
            style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: 'var(--space-xs)',
              minWidth: '160px',
              zIndex: 1000,
              padding: 'var(--space-xs)',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            {supportedLanguages.map((language) => {
              const langInfo = LANGUAGE_NAMES[language]
              const isActive = language === currentLanguage
              
              return (
                <button
                  key={language}
                  className={`language-option ${isActive ? 'active' : ''}`}
                  onClick={() => handleLanguageChange(language)}
                  onKeyDown={(e) => handleKeyDown(e, language)}
                  disabled={isActive || isLoading}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-sm)',
                    width: '100%',
                    padding: 'var(--space-sm)',
                    background: isActive ? 'var(--accent-blue)' : 'transparent',
                    color: isActive ? 'white' : 'var(--text-primary)',
                    border: 'none',
                    borderRadius: 'var(--radius)',
                    cursor: isActive ? 'default' : 'pointer',
                    fontSize: 'var(--text-sm)',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      (e.target as HTMLElement).style.background = 'var(--border-light)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      (e.target as HTMLElement).style.background = 'transparent'
                    }
                  }}
                >
                  <span>{langInfo.flag}</span>
                  <span style={{ flex: 1, textAlign: 'left' }}>
                    {langInfo.native}
                  </span>
                  {isActive && (
                    <span style={{ fontSize: 'var(--text-xs)' }}>✓</span>
                  )}
                </button>
              )
            })}
          </div>
        )}
        
        {/* Click outside handler */}
        {isOpen && (
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 999,
            }}
            onClick={() => setIsOpen(false)}
          />
        )}
      </div>
    )
  }

  // Full version (non-compact)
  return (
    <div className={`language-switcher ${className}`}>
      <label style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>
        {t('language.switch')}
      </label>
      <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-xs)' }}>
        {supportedLanguages.map((language) => {
          const langInfo = LANGUAGE_NAMES[language]
          const isActive = language === currentLanguage
          
          return (
            <button
              key={language}
              className={isActive ? 'primary-button' : 'secondary-button'}
              onClick={() => handleLanguageChange(language)}
              disabled={isActive || isLoading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-xs)',
                opacity: isLoading && !isActive ? 0.6 : 1,
              }}
            >
              <span>{langInfo.flag}</span>
              <span>{langInfo.native}</span>
              {isActive && (
                <span style={{ fontSize: 'var(--text-xs)' }}>✓</span>
              )}
            </button>
          )
        })}
      </div>
      {isLoading && (
        <div style={{ 
          fontSize: 'var(--text-xs)', 
          color: 'var(--text-secondary)', 
          marginTop: 'var(--space-xs)' 
        }}>
          {t('buttons.loading')}
        </div>
      )}
    </div>
  )
}
