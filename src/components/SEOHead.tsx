import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useLanguage } from '../hooks/useLanguage'
import StructuredData from './StructuredData'

type SEOHeadProps = {
  title?: string
  description?: string
  page?: 'home' | 'login' | 'register' | 'discussions' | 'sessions' | 'company'
}

export default function SEOHead({ title, description, page = 'home' }: SEOHeadProps) {
  const { t } = useTranslation(['common', 'landing'])
  const { currentLanguage } = useLanguage()

  useEffect(() => {
    // Update document language
    document.documentElement.lang = currentLanguage

    // Default meta information based on page
    let pageTitle = title
    let pageDescription = description

    if (!pageTitle) {
      switch (page) {
        case 'home':
          pageTitle = t('landing:hero.title', 'Veche — the home of participatory democracy')
          break
        case 'login':
          pageTitle = `${t('auth:login.title', 'Log in')} - Veche`
          break
        case 'register':
          pageTitle = `${t('auth:register.title', 'Create founder account')} - Veche`
          break
        case 'discussions':
          pageTitle = `${t('nav.discussions', 'Discussions')} - Veche`
          break
        case 'sessions':
          pageTitle = `${t('nav.sessions', 'Sessions')} - Veche`
          break
        case 'company':
          pageTitle = `${t('nav.company', 'Company')} - Veche`
          break
        default:
          pageTitle = 'Veche'
      }
    }

    if (!pageDescription) {
      pageDescription = t('landing:hero.subtitle', 'Shape decisions together. Join as a founder to start your organization and build consensus through structured discussions.')
    }

    // Update document title
    document.title = pageTitle

    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]')
    if (metaDescription) {
      metaDescription.setAttribute('content', pageDescription)
    } else {
      const meta = document.createElement('meta')
      meta.name = 'description'
      meta.content = pageDescription
      document.head.appendChild(meta)
    }

    // Update Open Graph tags
    let ogTitle = document.querySelector('meta[property="og:title"]')
    if (!ogTitle) {
      ogTitle = document.createElement('meta')
      ogTitle.setAttribute('property', 'og:title')
      document.head.appendChild(ogTitle)
    }
    ogTitle.setAttribute('content', pageTitle)

    let ogDescription = document.querySelector('meta[property="og:description"]')
    if (!ogDescription) {
      ogDescription = document.createElement('meta')
      ogDescription.setAttribute('property', 'og:description')
      document.head.appendChild(ogDescription)
    }
    ogDescription.setAttribute('content', pageDescription)

    let ogLocale = document.querySelector('meta[property="og:locale"]')
    if (!ogLocale) {
      ogLocale = document.createElement('meta')
      ogLocale.setAttribute('property', 'og:locale')
      document.head.appendChild(ogLocale)
    }
    ogLocale.setAttribute('content', currentLanguage === 'ru' ? 'ru_RU' : 'en_US')

    // Add hreflang tags for language alternatives
    const currentPath = window.location.pathname
    const baseUrl = window.location.origin
    
    // Remove existing hreflang tags
    document.querySelectorAll('link[hreflang]').forEach(link => link.remove())
    
    // Get path without language prefix for hreflang
    const pathSegments = currentPath.split('/').filter(Boolean)
    const hasLangPrefix = ['en', 'ru'].includes(pathSegments[0])
    const pathWithoutLang = hasLangPrefix ? '/' + pathSegments.slice(1).join('/') : currentPath
    
    // Add hreflang for both languages
    const languages = ['en', 'ru']
    languages.forEach(lang => {
      const hreflangLink = document.createElement('link')
      hreflangLink.rel = 'alternate'
      hreflangLink.hreflang = lang
      hreflangLink.href = `${baseUrl}/${lang}${pathWithoutLang}`
      document.head.appendChild(hreflangLink)
    })
    
    // Add x-default hreflang (defaults to English)
    const defaultLink = document.createElement('link')
    defaultLink.rel = 'alternate'
    defaultLink.hreflang = 'x-default'
    defaultLink.href = `${baseUrl}/en${pathWithoutLang}`
    document.head.appendChild(defaultLink)

    // Add canonical URL
    let canonicalLink = document.querySelector('link[rel="canonical"]')
    if (!canonicalLink) {
      canonicalLink = document.createElement('link')
      canonicalLink.setAttribute('rel', 'canonical')
      document.head.appendChild(canonicalLink)
    }
    canonicalLink.setAttribute('href', `${baseUrl}/${currentLanguage}${pathWithoutLang}`)

  }, [currentLanguage, t, title, description, page])

  // Determine structured data type based on page
  const getStructuredDataType = (): 'WebSite' | 'WebPage' | 'Organization' | 'SoftwareApplication' => {
    if (page === 'home') return 'WebSite'
    if (page === 'company') return 'Organization'
    return 'WebPage'
  }

  return (
    <>
      <StructuredData 
        type={getStructuredDataType()}
        data={
          page === 'home' 
            ? { 
                potentialAction: {
                  '@type': 'RegisterAction',
                  target: `${window.location.origin}/${currentLanguage}/register`,
                  name: t('auth:register.title', 'Create founder account')
                }
              }
            : {}
        }
      />
    </>
  )
}
