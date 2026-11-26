import { Component } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from './Icon.jsx'

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="page page--narrow" style={{ paddingTop: 64 }}>
          <div className="card" style={{ padding: 32, textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
              <span className="status status--fake" style={{ padding: 12, borderRadius: '50%' }}>
                <Icon name="alert" size={32} />
              </span>
            </div>
            <h2 style={{ marginBottom: 8 }}>Something went wrong</h2>
            <p className="muted" style={{ marginBottom: 20 }}>
              {this.state.error?.message || 'An unexpected rendering error occurred.'}
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button
                type="button"
                className="btn btn--secondary"
                onClick={() => this.setState({ hasError: false, error: null })}
              >
                Try again
              </button>
              <Link className="btn btn--primary" to="/recruiter/inbox">
                Back to Inbox
              </Link>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
