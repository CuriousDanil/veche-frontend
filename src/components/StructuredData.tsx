import { useEffect } from 'react'
import { useLanguage } from '../hooks/useLanguage'
import { useTranslation } from 'react-i18next'

type StructuredDataProps = {
  type: 'WebSite' | 'WebPage' | 'Organization' | 'SoftwareApplication'
  data?: Record<string, any>
}

export default function StructuredData({ type, data = {} }: StructuredDataProps) {
  const { currentLanguage } = useLanguage()
  const { t } = useTranslation(['common', 'landing'])

  useEffect(() => {
    const baseUrl = window.location.origin
    
    const structuredData = {
      '@context': 'https://schema.org',
      '@type': type,
      inLanguage: currentLanguage,
      ...getTypeSpecificData(type, baseUrl, currentLanguage, t),
      ...data
    }

    // Remove existing structured data
    const existingScript = document.querySelector('script[type="application/ld+json"]')
    if (existingScript) {
      existingScript.remove()
    }

    // Add new structured data
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.textContent = JSON.stringify(structuredData, null, 2)
    document.head.appendChild(script)

    return () => {
      // Cleanup on unmount
      const scriptToRemove = document.querySelector('script[type="application/ld+json"]')
      if (scriptToRemove) {
        scriptToRemove.remove()
      }
    }
  }, [type, data, currentLanguage, t])

  return null
}

function getTypeSpecificData(
  type: string, 
  baseUrl: string, 
  language: string, 
  t: (key: string, fallback?: string) => string
): Record<string, any> {
  switch (type) {
    case 'WebSite':
      return {
        name: 'Veche',
        description: t('landing:hero.subtitle', 'Shape decisions together. Join as a founder to start your organization and build consensus through structured discussions.'),
        url: baseUrl,
        alternateName: ['Вече', 'Veche Platform'],
        keywords: language === 'ru' 
          ? ['демократия', 'голосование', 'обсуждения', 'организации', 'консенсус', 'партисипативное управление']
          : ['democracy', 'voting', 'discussions', 'organizations', 'consensus', 'participatory governance'],
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web Browser',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
          availability: 'https://schema.org/InStock'
        }
      }

    case 'Organization':
      return {
        name: 'Veche',
        description: t('landing:hero.subtitle'),
        url: baseUrl,
        logo: `${baseUrl}/vite.svg`,
        sameAs: [],
        foundingDate: '2024',
        applicationCategory: 'Governance Software',
        serviceType: 'Democratic Decision Making Platform'
      }

    case 'SoftwareApplication':
      return {
        name: 'Veche Platform',
        description: t('landing:hero.subtitle'),
        url: baseUrl,
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web Browser',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD'
        },
        featureList: language === 'ru' ? [
          'Структурированные обсуждения',
          'Демократическое голосование',
          'Управление организацией',
          'Многораундовое голосование',
          'Управление партиями'
        ] : [
          'Structured Discussions',
          'Democratic Voting',
          'Organization Management',
          'Multi-round Voting',
          'Party Management'
        ]
      }

    case 'WebPage':
    default:
      return {
        name: t('meta.title', 'Veche - Democratic Decision Making Platform'),
        description: t('landing:hero.subtitle'),
        url: window.location.href,
        isPartOf: {
          '@type': 'WebSite',
          name: 'Veche',
          url: baseUrl
        },
        inLanguage: language,
        potentialAction: {
          '@type': 'RegisterAction',
          target: `${baseUrl}/${language}/register`,
          name: language === 'ru' ? 'Регистрация' : 'Register'
        }
      }
  }
}
