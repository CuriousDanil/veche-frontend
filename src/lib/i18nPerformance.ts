import { loadNamespace, type SupportedLanguage } from './i18n'

// Translation cache for performance optimization
const translationCache = new Map<string, any>()
const preloadPromises = new Map<string, Promise<void>>()

// Preload translations for better performance
export async function preloadTranslations(
  namespaces: string[], 
  languages: SupportedLanguage[] = ['en', 'ru']
): Promise<void> {
  const promises = []
  
  for (const language of languages) {
    for (const namespace of namespaces) {
      const cacheKey = `${language}-${namespace}`
      
      if (!translationCache.has(cacheKey) && !preloadPromises.has(cacheKey)) {
        const promise = loadNamespace(namespace, language).then(() => {
          translationCache.set(cacheKey, true)
          preloadPromises.delete(cacheKey)
        }).catch(error => {
          console.warn(`Failed to preload ${namespace} for ${language}:`, error)
          preloadPromises.delete(cacheKey)
        })
        
        preloadPromises.set(cacheKey, promise)
        promises.push(promise)
      }
    }
  }
  
  await Promise.allSettled(promises)
}

// Preload critical translations that are likely to be needed
export async function preloadCriticalTranslations(): Promise<void> {
  const criticalNamespaces = ['common', 'errors', 'auth']
  await preloadTranslations(criticalNamespaces)
}

// Preload translations for a specific page
export async function preloadPageTranslations(page: string): Promise<void> {
  const pageNamespaces: Record<string, string[]> = {
    discussions: ['discussions', 'common'],
    sessions: ['sessions', 'common'],
    company: ['company', 'common'],
    auth: ['auth', 'common'],
    landing: ['landing', 'common']
  }
  
  const namespaces = pageNamespaces[page] || ['common']
  await preloadTranslations(namespaces)
}

// Smart preloading based on user navigation patterns
export class TranslationPreloader {
  private visitedPages = new Set<string>()
  private preloadTimer: NodeJS.Timeout | null = null
  
  // Track page visits to predict future needs
  trackPageVisit(page: string): void {
    this.visitedPages.add(page)
    
    // Debounced preloading
    if (this.preloadTimer) {
      clearTimeout(this.preloadTimer)
    }
    
    this.preloadTimer = setTimeout(() => {
      this.predictAndPreload()
    }, 1000)
  }
  
  // Predict likely next pages and preload their translations
  private async predictAndPreload(): Promise<void> {
    const predictions = this.getPredictions()
    
    for (const page of predictions) {
      if (!this.visitedPages.has(page)) {
        await preloadPageTranslations(page).catch(() => {
          // Silent fail for predictions
        })
      }
    }
  }
  
  // Simple prediction logic based on common user flows
  private getPredictions(): string[] {
    const visited = Array.from(this.visitedPages)
    const predictions = new Set<string>()
    
    // Landing → Auth pages
    if (visited.includes('landing')) {
      predictions.add('auth')
    }
    
    // Auth → Company
    if (visited.includes('auth')) {
      predictions.add('company')
    }
    
    // Company → Discussions or Sessions
    if (visited.includes('company')) {
      predictions.add('discussions')
      predictions.add('sessions')
    }
    
    // Discussions → Sessions (and vice versa)
    if (visited.includes('discussions')) {
      predictions.add('sessions')
    }
    if (visited.includes('sessions')) {
      predictions.add('discussions')
    }
    
    return Array.from(predictions)
  }
  
  // Cleanup
  destroy(): void {
    if (this.preloadTimer) {
      clearTimeout(this.preloadTimer)
    }
    this.visitedPages.clear()
  }
}

// Global preloader instance
export const globalPreloader = new TranslationPreloader()

// Performance monitoring for translations
export function measureTranslationPerformance() {
  const startTime = performance.now()
  
  return {
    end: (operation: string) => {
      const endTime = performance.now()
      const duration = endTime - startTime
      
      if (import.meta.env.MODE === 'development') {
        console.log(`Translation ${operation} took ${duration.toFixed(2)}ms`)
      }
      
      return duration
    }
  }
}

// Cache cleanup for memory management
export function cleanupTranslationCache(): void {
  translationCache.clear()
  preloadPromises.clear()
}
