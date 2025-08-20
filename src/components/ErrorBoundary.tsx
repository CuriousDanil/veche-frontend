import { Component, ReactNode } from 'react'
import ErrorPage from './ErrorPage'

type Props = { children: ReactNode }
type State = { hasError: boolean; error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    // Log error for debugging in development
    if (import.meta.env.MODE === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo)
    }
    
    // In production, you might want to send this to an error reporting service
    // Example: errorReportingService.captureException(error, { extra: errorInfo })
  }

  render() {
    if (this.state.hasError) {
      // Determine error type based on error message
      const isNetworkError = this.state.error?.message?.includes('NETWORK') || 
                            this.state.error?.message?.includes('fetch')
      
      const isAuthError = this.state.error?.message?.includes('401') || 
                         this.state.error?.message?.includes('Unauthorized')
      
      const isForbiddenError = this.state.error?.message?.includes('403') || 
                              this.state.error?.message?.includes('Forbidden')

      if (isNetworkError) {
        return (
          <ErrorPage 
            type="network" 
            showRetry 
            onRetry={() => window.location.reload()}
          />
        )
      }

      if (isForbiddenError) {
        return <ErrorPage type="403" />
      }

      if (isAuthError) {
        return <ErrorPage type="unauthorized" />
      }

      // Generic server error for other cases
      return (
        <ErrorPage 
          type="500" 
          description={this.state.error?.message}
        />
      )
    }
    
    return this.props.children
  }
}


