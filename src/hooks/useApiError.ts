import { useTranslation } from 'react-i18next'
import { useCallback } from 'react'

export function useApiError() {
  const { t } = useTranslation('errors')

  const translateError = useCallback((error: any): string => {
    if (!error) return t('api.serverError', 'Server error. Please try again later.')

    const errorMessage = error.message || String(error)

    // Network errors
    if (errorMessage.includes('NETWORK') || errorMessage.includes('fetch')) {
      return t('network.subtitle', 'Unable to connect to our servers.')
    }

    // HTTP status codes
    if (errorMessage.includes('400')) {
      return t('api.badRequest', 'Invalid request. Please check your input.')
    }
    
    if (errorMessage.includes('401')) {
      return t('unauthorized.subtitle', 'You don\'t have permission to view this page.')
    }
    
    if (errorMessage.includes('404')) {
      return t('api.notFound', 'The requested resource was not found.')
    }
    
    if (errorMessage.includes('409')) {
      return t('api.conflict', 'There was a conflict with your request.')
    }
    
    if (errorMessage.includes('429')) {
      return t('api.tooManyRequests', 'Too many requests. Please wait a moment.')
    }
    
    if (errorMessage.includes('500')) {
      return t('api.serverError', 'Server error. Please try again later.')
    }
    
    if (errorMessage.includes('503')) {
      return t('api.serviceUnavailable', 'Service temporarily unavailable.')
    }

    // Timeout errors
    if (errorMessage.includes('timeout') || errorMessage.includes('TIMEOUT')) {
      return t('api.timeout', 'Request timed out. Please try again.')
    }

    // Default fallback
    return errorMessage || t('common:errors.unknown', 'An unexpected error occurred.')
  }, [t])

  const getErrorType = useCallback((error: any): '404' | '500' | 'network' | 'unauthorized' => {
    if (!error) return '500'

    const errorMessage = error.message || String(error)

    if (errorMessage.includes('NETWORK') || errorMessage.includes('fetch')) {
      return 'network'
    }
    
    if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
      return 'unauthorized'
    }
    
    if (errorMessage.includes('404')) {
      return '404'
    }

    return '500'
  }, [])

  return { translateError, getErrorType }
}
