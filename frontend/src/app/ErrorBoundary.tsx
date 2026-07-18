import { Component, type ErrorInfo, type ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

/**
 * React class-based error boundary.
 * Catches any unhandled render errors and renders a fallback UI.
 * Wrap around top-level route components or sensitive data sections.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // In production, this would ship to a monitoring service (e.g. Sentry)
    console.error('[AIPAS ErrorBoundary]', error, info.componentStack)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '80vh',
            gap: '16px',
            padding: '24px',
            textAlign: 'center',
          }}
        >
          <h2 style={{ color: 'var(--danger)', fontSize: '1.5rem', fontWeight: 700 }}>
            500 — System Error
          </h2>
          <p style={{ color: 'var(--muted-foreground)', maxWidth: '480px' }}>
            An unexpected error occurred in this component. Our engineering team has been notified.
          </p>
          <p
            style={{
              fontFamily: 'var(--font-family-mono)',
              fontSize: '12px',
              color: 'var(--muted-foreground)',
              background: 'var(--muted)',
              padding: '8px 12px',
              borderRadius: '6px',
              maxWidth: '600px',
              wordBreak: 'break-word',
            }}
          >
            {this.state.error?.message}
          </p>
          <button
            onClick={this.handleReset}
            style={{
              padding: '8px 20px',
              background: 'var(--primary)',
              color: 'var(--primary-foreground)',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '14px',
            }}
          >
            Retry
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
