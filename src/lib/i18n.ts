import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import HttpBackend from 'i18next-http-backend'

const SUPPORTED_LANGUAGES = ['en', 'ru'] as const
export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number]

// Language detection configuration
const detectionOptions = {
  // Detection order and from where user language should be detected
  order: ['path', 'localStorage', 'navigator', 'htmlTag'],
  
  // Keys or params to lookup language from
  lookupFromPathIndex: 0,
  lookupLocalStorage: 'veche-language',
  
  // Cache user language on
  caches: ['localStorage'],
  
  // Optional expire and domain for set cookie
  cookieMinutes: 10080, // 7 days
  
  // Optional set cookie options, reference:[MDN Set-Cookie docs](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie)
  cookieOptions: { path: '/', sameSite: 'strict' }
}

const i18nConfig = {
  fallbackLng: 'en',
  supportedLngs: SUPPORTED_LANGUAGES,
  
  // Load translation files lazily
  load: 'languageOnly',
  
  // Namespace separation and loading
  ns: ['common', 'auth', 'company', 'discussions', 'sessions', 'landing', 'errors'],
  defaultNS: 'common',
  
  // React i18next options
  react: {
    useSuspense: false, // We'll handle loading states manually
    bindI18n: 'languageChanged',
    bindI18nStore: '',
    transEmptyNodeValue: '', 
    transSupportBasicHtmlNodes: true,
    transKeepBasicHtmlNodesFor: ['br', 'strong', 'i', 'em']
  },
  
  // Pluralization rules for Russian
  pluralSeparator: '_',
  
  // Interpolation options
  interpolation: {
    escapeValue: false // React already does escaping
  },
  
  // Debug in development
  debug: import.meta.env.MODE === 'development',
  
  // Missing key handling
  saveMissing: import.meta.env.MODE === 'development',
  missingKeyHandler: import.meta.env.MODE === 'development' 
    ? (lng: string, ns: string, key: string) => {
        console.warn(`Missing translation key: ${ns}:${key} for language: ${lng}`)
      }
    : undefined
}

// Initialize i18n
i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    ...i18nConfig,
    detection: detectionOptions,
    
    // HTTP backend configuration
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    }
  })

// Helper to validate supported language
export const isSupportedLanguage = (lang: string): lang is SupportedLanguage => {
  return SUPPORTED_LANGUAGES.includes(lang as SupportedLanguage)
}

// Helper to get current language or fallback
export const getCurrentLanguage = (): SupportedLanguage => {
  const current = i18n.language
  return isSupportedLanguage(current) ? current : 'en'
}

// Helper to change language with proper URL update
export const changeLanguage = async (language: SupportedLanguage) => {
  await i18n.changeLanguage(language)
  // Store in localStorage for persistence
  localStorage.setItem('veche-language', language)
}

// Load translation namespace dynamically
export const loadNamespace = async (namespace: string, language?: SupportedLanguage) => {
  const lng = language || getCurrentLanguage()
  
  if (i18n.hasResourceBundle(lng, namespace)) {
    return // Already loaded
  }
  
  // Use i18n.loadNamespaces for proper loading with backend
  try {
    await i18n.loadNamespaces(namespace)
  } catch (error) {
    console.error(`Error loading translation namespace ${namespace}:`, error)
    
    // Manual fallback if needed
    try {
      const response = await fetch(`/locales/${lng}/${namespace}.json`)
      if (response.ok) {
        const translations = await response.json()
        i18n.addResourceBundle(lng, namespace, translations)
      }
    } catch (fallbackError) {
      console.error(`Manual fallback also failed for ${namespace}:`, fallbackError)
    }
  }
}

// Load all core namespaces
export const loadCoreTranslations = async (language?: SupportedLanguage) => {
  const lng = language || getCurrentLanguage()
  const namespaces = ['common', 'auth', 'company', 'discussions', 'sessions', 'landing', 'errors']
  
  try {
    // Load all namespaces for the target language
    await i18n.loadNamespaces(namespaces)
    await i18n.changeLanguage(lng)
  } catch (error) {
    console.error('Error loading core translations:', error)
    // Fallback to loading each namespace individually
    await Promise.allSettled(namespaces.map(ns => loadNamespace(ns, lng)))
  }
}

export default i18n
