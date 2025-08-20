import { createContext, useState, useEffect, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom'
import { 
  changeLanguage as changeI18nLanguage, 
  loadCoreTranslations,
  isSupportedLanguage,
  type SupportedLanguage 
} from '../lib/i18n'
import { globalPreloader, measureTranslationPerformance } from '../lib/i18nPerformance'

export type LanguageContextValue = {
  currentLanguage: SupportedLanguage
  isLoading: boolean
  changeLanguage: (language: SupportedLanguage) => Promise<void>
  t: (key: string, options?: any) => string
  supportedLanguages: readonly SupportedLanguage[]
}

export const LanguageContext = createContext<LanguageContextValue | null>(null)

type LanguageProviderProps = {
  children: React.ReactNode
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  
  const [isLoading, setIsLoading] = useState(false)
  
  // Extract language from current URL or use stored preference
  const urlLanguage = useMemo(() => {
    const pathSegments = location.pathname.split('/').filter(Boolean)
    const potentialLang = pathSegments[0]
    
    // If URL has a valid language prefix, use it
    if (isSupportedLanguage(potentialLang)) {
      return potentialLang
    }
    
    // If no language in URL, check stored preference
    const storedLang = localStorage.getItem('veche-language')
    if (storedLang && isSupportedLanguage(storedLang)) {
      return storedLang
    }
    
    // Default to English
    return 'en'
  }, [location.pathname])
  
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>(urlLanguage)
  const [isInitialized, setIsInitialized] = useState(false)

  // One-time initialization
  useEffect(() => {
    if (isInitialized) return
    
    const initializeTranslations = async () => {
      try {
        const initLang = urlLanguage
        
        // Load core translations
        await loadCoreTranslations(initLang)
        
        // Set language state
        setCurrentLanguage(initLang)
        
        // Update i18n
        await changeI18nLanguage(initLang)
        
        setIsInitialized(true)
      } catch (error) {
        console.error('Error initializing translations:', error)
      }
    }
    
    initializeTranslations()
  }, [urlLanguage, isInitialized])

  // Handle URL language changes (only when language actually changes)
  useEffect(() => {
    if (!isInitialized) return
    
    if (urlLanguage !== currentLanguage) {
      setCurrentLanguage(urlLanguage)
      changeI18nLanguage(urlLanguage).catch(console.error)
    }
  }, [urlLanguage, currentLanguage, isInitialized])

  // Change language function
  const handleChangeLanguage = useCallback(async (newLanguage: SupportedLanguage) => {
    if (newLanguage === currentLanguage || isLoading) return
    
    setIsLoading(true)
    
    try {
      // Load translations
      await loadCoreTranslations(newLanguage)
      
      // Change i18n language
      await changeI18nLanguage(newLanguage)
      
      // Get path without current language prefix
      const pathSegments = location.pathname.split('/').filter(Boolean)
      const hasLangPrefix = isSupportedLanguage(pathSegments[0])
      const pathWithoutLang = hasLangPrefix 
        ? '/' + pathSegments.slice(1).join('/')
        : location.pathname
      
      // Store language preference
      localStorage.setItem('veche-language', newLanguage)
      
      // Track page visit for preloading predictions
      const currentPage = pathSegments[hasLangPrefix ? 1 : 0] || 'home'
      globalPreloader.trackPageVisit(currentPage)
      
      // Navigate to new language URL
      const newPath = `/${newLanguage}${pathWithoutLang}${location.search}${location.hash}`
      navigate(newPath, { replace: true })
      
    } catch (error) {
      console.error('Error changing language:', error)
    } finally {
      setIsLoading(false)
    }
  }, [currentLanguage, isLoading, location, navigate])

  const value = useMemo<LanguageContextValue>(() => ({
    currentLanguage,
    isLoading,
    changeLanguage: handleChangeLanguage,
    t,
    supportedLanguages: ['en', 'ru'] as const
  }), [currentLanguage, isLoading, handleChangeLanguage, t])

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}