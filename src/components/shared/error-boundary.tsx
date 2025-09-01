'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  resetOnNavigation?: boolean
  feature?: string
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    this.setState({ error, errorInfo })
    
    // Log to error tracking service in production
    if (process.env.NODE_ENV === 'production') {
      // TODO: Log to Sentry or similar service
      console.error(`Error in ${this.props.feature || 'component'}:`, {
        error: error.toString(),
        componentStack: errorInfo.componentStack,
        feature: this.props.feature,
      })
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return <>{this.props.fallback}</>
      }

      // Default error UI
      return (
        <div className="flex items-center justify-center min-h-[400px] p-4">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Something went wrong
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {this.props.feature 
                  ? `An error occurred in the ${this.props.feature} feature.`
                  : 'An unexpected error occurred while rendering this component.'
                }
              </p>
              
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="p-3 rounded-lg bg-muted/50 border border-destructive/20">
                  <p className="text-xs font-mono text-destructive">
                    {this.state.error.toString()}
                  </p>
                  {this.state.errorInfo && (
                    <details className="mt-2">
                      <summary className="text-xs cursor-pointer text-muted-foreground hover:text-foreground">
                        Component Stack
                      </summary>
                      <pre className="text-xs mt-2 overflow-auto max-h-40">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </div>
              )}
              
              <div className="flex gap-2">
                <Button onClick={this.handleReset} variant="default">
                  <RefreshCcw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
                <ErrorBoundaryHomeButton />
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

// Separate component to use hooks
function ErrorBoundaryHomeButton() {
  const router = useRouter()
  
  return (
    <Button onClick={() => router.push('/dashboard')} variant="outline">
      <Home className="h-4 w-4 mr-2" />
      Go to Dashboard
    </Button>
  )
}

// Feature-specific error boundaries with custom messages
export function CharacterErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      feature="Character Sheet"
      fallback={
        <Card className="p-6">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-destructive" />
            <h3 className="text-lg font-semibold mb-2">Character Data Error</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Unable to load character information. Please refresh the page or contact support if the issue persists.
            </p>
            <Button onClick={() => window.location.reload()}>
              <RefreshCcw className="h-4 w-4 mr-2" />
              Refresh Page
            </Button>
          </div>
        </Card>
      }
    >
      {children}
    </ErrorBoundary>
  )
}

export function CombatErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      feature="Combat Tracker"
      fallback={
        <Card className="p-6">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-destructive" />
            <h3 className="text-lg font-semibold mb-2">Combat System Error</h3>
            <p className="text-sm text-muted-foreground mb-4">
              The combat tracker encountered an issue. Your game data is safe, please refresh to continue.
            </p>
            <Button onClick={() => window.location.reload()}>
              <RefreshCcw className="h-4 w-4 mr-2" />
              Refresh Page
            </Button>
          </div>
        </Card>
      }
    >
      {children}
    </ErrorBoundary>
  )
}

export function NotesErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      feature="Notes"
      fallback={
        <Card className="p-6">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-destructive" />
            <h3 className="text-lg font-semibold mb-2">Notes System Error</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Unable to load notes. Your data is safe and will be available once the issue is resolved.
            </p>
            <Button onClick={() => window.location.reload()}>
              <RefreshCcw className="h-4 w-4 mr-2" />
              Refresh Page
            </Button>
          </div>
        </Card>
      }
    >
      {children}
    </ErrorBoundary>
  )
}