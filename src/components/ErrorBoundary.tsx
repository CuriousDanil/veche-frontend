import { Component, ReactNode } from 'react'

type Props = { children: ReactNode }
type State = { hasError: number; lastError: string | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: 0, lastError: null }

  static getDerivedStateFromError(error: unknown): State {
    return { hasError: Date.now(), lastError: error instanceof Error ? error.message : String(error) }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="container">
          <div className="card" style={{ padding: 16 }}>
            <h3>Something went wrong</h3>
            <p style={{ color: 'var(--text-secondary)' }}>{this.state.lastError}</p>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}


