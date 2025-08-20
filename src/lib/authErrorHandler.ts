import { clearAccessToken } from './auth'

export function handleAuthError(error: any, navigate?: (path: string) => void) {
  // Check if this is an authentication error
  if (
    error?.message?.includes('401') ||
    error?.message?.includes('Unauthorized') ||
    error?.message?.includes('Authentication') ||
    error?.message?.includes('Token') ||
    (error?.status === 401)
  ) {
    // Clear any stored auth data
    clearAccessToken()
    
    // Redirect to welcome page
    if (navigate) {
      navigate('/')
    } else {
      // Fallback to window location if navigate is not available
      window.location.href = '/'
    }
    
    return true // Indicates that this was an auth error
  }
  
  return false // Not an auth error
}

// Wrapper for API calls that automatically handles auth errors
export async function withAuthErrorHandling<T>(
  apiCall: () => Promise<T>,
  navigate?: (path: string) => void
): Promise<T> {
  try {
    return await apiCall()
  } catch (error) {
    const wasAuthError = handleAuthError(error, navigate)
    if (wasAuthError) {
      throw new Error('Authentication failed. Redirecting to login.')
    }
    throw error // Re-throw non-auth errors
  }
}
