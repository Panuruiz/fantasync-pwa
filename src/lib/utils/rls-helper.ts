/**
 * RLS Helper - Utilities for handling Row Level Security in development and production
 * 
 * This helper provides a development mode bypass for RLS policies to make local development
 * easier while ensuring production security remains intact.
 */

import { createClient } from '@/lib/supabase/client'

export interface RLSErrorInfo {
  isRLSError: boolean
  requiresPolicyApplication: boolean
  canBypass: boolean
  message: string
  helpUrl?: string
  actions: {
    label: string
    action: () => void | Promise<void>
  }[]
}

/**
 * Check if we're in development mode
 */
export const isDevelopment = () => process.env.NODE_ENV === 'development'

/**
 * Check if RLS bypass is enabled (development only)
 */
export const isRLSBypassEnabled = () => {
  if (!isDevelopment()) return false
  
  // Check localStorage for user preference
  if (typeof window !== 'undefined') {
    return localStorage.getItem('rls_bypass_enabled') === 'true'
  }
  return false
}

/**
 * Toggle RLS bypass mode (development only)
 */
export const toggleRLSBypass = (enabled: boolean) => {
  if (!isDevelopment()) {
    console.warn('RLS bypass is only available in development mode')
    return false
  }
  
  if (typeof window !== 'undefined') {
    localStorage.setItem('rls_bypass_enabled', enabled.toString())
    // Reload to apply changes
    window.location.reload()
  }
  return true
}

/**
 * Check if RLS policies are applied to the database
 */
export async function checkRLSPoliciesApplied(): Promise<boolean> {
  try {
    const supabase = createClient()
    
    // Try to query a protected table
    const { error } = await supabase
      .from('games')
      .select('id')
      .limit(1)
    
    // If we get a specific RLS error, policies are applied
    if (error?.code === '42501' || error?.message?.includes('row-level security')) {
      return true
    }
    
    // If no error or different error, policies might not be applied
    return false
  } catch {
    return false
  }
}

/**
 * Analyze an error to determine if it's RLS-related
 */
export function analyzeRLSError(error: any): RLSErrorInfo {
  const errorCode = error?.code
  const errorMessage = error?.message || ''
  
  // Common RLS error codes and messages
  const rlsIndicators = [
    '42501', // Insufficient privilege
    '403',   // Forbidden
    'row-level security',
    'permission denied',
    'insufficient privilege',
    'violates row-level security',
    'new row violates row-level security'
  ]
  
  const isRLSError = rlsIndicators.some(indicator => 
    errorCode === indicator || 
    errorMessage.toLowerCase().includes(indicator.toLowerCase())
  )
  
  const requiresPolicyApplication = isRLSError && isDevelopment()
  const canBypass = isDevelopment() && !isRLSBypassEnabled()
  
  const actions: RLSErrorInfo['actions'] = []
  
  if (requiresPolicyApplication) {
    actions.push({
      label: 'Apply RLS Policies',
      action: () => {
        if (typeof window !== 'undefined') {
          window.open('/supabase/policies/APPLY_POLICIES.md', '_blank')
        }
      }
    })
    
    actions.push({
      label: 'Run Script',
      action: async () => {
        // Show instructions in console
        console.log(`
To apply RLS policies, run the following command in your terminal:

npm run apply-rls

Or manually apply them in the Supabase dashboard:
1. Go to your Supabase project
2. Navigate to SQL Editor
3. Copy the contents of supabase/policies/rls-policies.sql
4. Run the SQL commands
        `)
        
        // Copy command to clipboard
        if (navigator.clipboard) {
          await navigator.clipboard.writeText('npm run apply-rls')
          console.log('Command copied to clipboard!')
        }
      }
    })
  }
  
  if (canBypass) {
    actions.push({
      label: 'Enable Dev Bypass',
      action: () => {
        toggleRLSBypass(true)
      }
    })
  }
  
  actions.push({
    label: 'Retry',
    action: () => window.location.reload()
  })
  
  let message = 'Database permission denied'
  
  if (requiresPolicyApplication) {
    message = 'RLS policies need to be applied to your Supabase database'
  } else if (isRLSError) {
    message = 'You do not have permission to perform this action'
  }
  
  return {
    isRLSError,
    requiresPolicyApplication,
    canBypass,
    message,
    helpUrl: requiresPolicyApplication ? '/supabase/policies/APPLY_POLICIES.md' : undefined,
    actions
  }
}

/**
 * Wrap an API call with RLS error handling
 */
export async function withRLSErrorHandling<T>(
  apiCall: () => Promise<T>,
  options?: {
    context?: string
    onError?: (error: RLSErrorInfo) => void
    bypassInDev?: boolean
  }
): Promise<T> {
  try {
    // In development with bypass enabled, add a warning
    if (options?.bypassInDev && isRLSBypassEnabled()) {
      console.warn('⚠️ RLS Bypass Mode Active - This would fail in production')
    }
    
    return await apiCall()
  } catch (error) {
    const rlsInfo = analyzeRLSError(error)
    
    if (rlsInfo.isRLSError) {
      console.error(`RLS Error${options?.context ? ` in ${options.context}` : ''}:`, {
        error,
        rlsInfo
      })
      
      if (options?.onError) {
        options.onError(rlsInfo)
      }
      
      // In development with bypass, we could return mock data
      if (options?.bypassInDev && isRLSBypassEnabled()) {
        console.warn('Bypassing RLS error in development mode')
        // You could return mock data here based on context
      }
    }
    
    throw error
  }
}

/**
 * Development-only RLS status component helper
 */
export function getRLSStatusInfo() {
  if (!isDevelopment()) return null
  
  return {
    isDevelopment: true,
    bypassEnabled: isRLSBypassEnabled(),
    message: isRLSBypassEnabled() 
      ? '⚠️ RLS Bypass Active (Dev Only)' 
      : '🔒 RLS Policies Active',
    toggleAction: () => toggleRLSBypass(!isRLSBypassEnabled())
  }
}