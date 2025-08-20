import { useNavigate } from 'react-router-dom'
import { useCallback } from 'react'
import { handleAuthError, withAuthErrorHandling } from '../lib/authErrorHandler'

export function useAuthErrorHandler() {
  const navigate = useNavigate()

  const handleError = useCallback((error: any) => {
    return handleAuthError(error, navigate)
  }, [navigate])

  const withErrorHandling = useCallback(<T>(apiCall: () => Promise<T>): Promise<T> => {
    return withAuthErrorHandling(apiCall, navigate)
  }, [navigate])

  return { handleError, withErrorHandling }
}
