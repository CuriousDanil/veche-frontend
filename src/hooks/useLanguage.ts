import { useContext, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { LanguageContext, type LanguageContextValue } from '../context/LanguageContext'
import { isSupportedLanguage } from '../lib/i18n'

// Custom hook to use language context
export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}

// Hook for language-aware navigation
export function useLanguageNavigate() {
  const navigate = useNavigate()
  const location = useLocation()
  const { currentLanguage } = useLanguage()
  
  return useCallback((path: string, options?: { replace?: boolean }) => {
    // Always use the current language context for navigation
    const languagePath = path.startsWith('/') 
      ? `/${currentLanguage}${path}` 
      : `/${currentLanguage}/${path}`
    
    navigate(languagePath, options)
  }, [navigate, currentLanguage])
}
