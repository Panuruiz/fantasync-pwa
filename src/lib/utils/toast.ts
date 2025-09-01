import { toast as sonnerToast } from 'sonner'
import { analyzeRLSError, type RLSErrorInfo } from './rls-helper'

interface ToastOptions {
  title?: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  duration?: number
}

export const toast = {
  success: (message: string, options?: ToastOptions) => {
    sonnerToast.success(options?.title || message, {
      description: options?.description,
      action: options?.action,
      duration: options?.duration || 4000,
    })
  },

  error: (message: string, options?: ToastOptions) => {
    sonnerToast.error(options?.title || message, {
      description: options?.description || 'Please try again or contact support if the problem persists.',
      action: options?.action || {
        label: 'Retry',
        onClick: () => window.location.reload(),
      },
      duration: options?.duration || 6000, // Errors stay longer
    })
  },

  info: (message: string, options?: ToastOptions) => {
    sonnerToast.info(options?.title || message, {
      description: options?.description,
      action: options?.action,
      duration: options?.duration || 4000,
    })
  },

  warning: (message: string, options?: ToastOptions) => {
    sonnerToast.warning(options?.title || message, {
      description: options?.description,
      action: options?.action,
      duration: options?.duration || 5000,
    })
  },

  loading: (message: string, options?: ToastOptions) => {
    return sonnerToast.loading(options?.title || message, {
      description: options?.description,
    })
  },

  promise: <T,>(
    promise: Promise<T>,
    options: {
      loading: string
      success: string | ((data: T) => string)
      error: string | ((error: any) => string)
    }
  ) => {
    return sonnerToast.promise(promise, options)
  },

  dismiss: (toastId?: string | number) => {
    sonnerToast.dismiss(toastId)
  },

  custom: (component: React.ReactNode, options?: any) => {
    sonnerToast.custom(
      (_id: string | number) => component as React.ReactElement,
      options
    )
  },
}

// Error handler for API calls with enhanced RLS support
export function handleApiError(error: any, context?: string): void {
  console.error(`API Error${context ? ` in ${context}` : ''}:`, error)
  
  // First check if it's an RLS error
  const rlsInfo = analyzeRLSError(error)
  
  if (rlsInfo.isRLSError) {
    // Handle RLS errors specially
    handleRLSError(rlsInfo, context)
    return
  }
  
  let errorMessage = 'An unexpected error occurred'
  let errorDescription = 'Please try again later'
  let actions: { label: string; onClick: () => void }[] = []
  
  if (error?.message) {
    errorMessage = error.message
  }
  
  // Handle specific Supabase errors
  if (error?.code) {
    switch (error.code) {
      case '23505': // Unique violation
        errorMessage = 'This item already exists'
        errorDescription = 'Please use a different name or identifier'
        actions = [
          {
            label: 'Go Back',
            onClick: () => window.history.back()
          }
        ]
        break
      case '23503': // Foreign key violation
        errorMessage = 'Related data not found'
        errorDescription = 'The requested operation references data that does not exist'
        break
      case '401':
        errorMessage = 'Authentication required'
        errorDescription = 'Please log in to continue'
        actions = [
          {
            label: 'Login',
            onClick: () => { window.location.href = '/login' }
          }
        ]
        break
      case 'PGRST116': // Not found
        errorMessage = 'Data not found'
        errorDescription = 'The requested item could not be found'
        actions = [
          {
            label: 'Go to Dashboard',
            onClick: () => { window.location.href = '/dashboard' }
          }
        ]
        break
      default:
        if (error.code.startsWith('P')) {
          // Prisma errors
          errorMessage = 'Database error'
          errorDescription = `Error code: ${error.code}. Please contact support if this persists.`
        }
    }
  }
  
  // Network errors
  if (error?.name === 'NetworkError' || !navigator.onLine) {
    errorMessage = 'Network error'
    errorDescription = 'Please check your internet connection'
    actions = [
      {
        label: 'Retry',
        onClick: () => window.location.reload()
      },
      {
        label: 'Check Status',
        onClick: () => { window.open('https://status.supabase.com', '_blank') }
      }
    ]
  }
  
  // Default retry action if no specific actions
  if (actions.length === 0) {
    actions = [
      {
        label: 'Retry',
        onClick: () => window.location.reload()
      }
    ]
  }
  
  // Show the error toast with the first action
  toast.error(errorMessage, {
    description: errorDescription,
    action: actions[0] ? {
      label: actions[0].label,
      onClick: actions[0].onClick
    } : undefined,
    duration: 8000, // Longer for errors
  })
  
  // If there are multiple actions, show them in console
  if (actions.length > 1) {
    console.log('Additional recovery options:', actions.slice(1))
  }
}

// Specific handler for RLS errors
function handleRLSError(rlsInfo: RLSErrorInfo, context?: string): void {
  const contextMessage = context ? ` during ${context}` : ''
  
  if (rlsInfo.requiresPolicyApplication) {
    // Show a special toast for policy application
    toast.error(`Database Permission Error${contextMessage}`, {
      description: 'RLS policies need to be applied to your Supabase database. Click below for instructions.',
      action: rlsInfo.actions[0] ? {
        label: rlsInfo.actions[0].label,
        onClick: () => rlsInfo.actions[0].action()
      } : undefined,
      duration: 10000, // Stay longer for important messages
    })
    
    // Log additional help in console
    console.group('🔒 RLS Policy Application Required')
    console.log('Quick fix: Run this command in your terminal:')
    console.log('%cnpm run apply-rls', 'background: #000; color: #0f0; padding: 4px 8px; border-radius: 4px;')
    console.log('\nOr follow the manual steps at:', rlsInfo.helpUrl)
    console.groupEnd()
  } else {
    // Regular permission denied
    toast.error(`Permission Denied${contextMessage}`, {
      description: rlsInfo.message,
      action: rlsInfo.actions[0] ? {
        label: rlsInfo.actions[0].label,
        onClick: () => rlsInfo.actions[0].action()
      } : undefined,
      duration: 6000,
    })
  }
  
  // Show development mode hint if applicable
  if (rlsInfo.canBypass && process.env.NODE_ENV === 'development') {
    console.log(
      '%c💡 Dev Tip: You can bypass RLS in development mode',
      'background: #ff0; color: #000; padding: 4px 8px; border-radius: 4px;'
    )
    console.log('Run in console: localStorage.setItem("rls_bypass_enabled", "true")')
  }
}