'use client'

import { useEffect, useState } from 'react'
import { getRLSStatusInfo, toggleRLSBypass, checkRLSPoliciesApplied } from '@/lib/utils/rls-helper'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Shield, ShieldOff, AlertTriangle, X } from 'lucide-react'

export function RLSStatusBanner() {
  const [statusInfo, setStatusInfo] = useState(getRLSStatusInfo())
  const [policiesApplied, setPoliciesApplied] = useState<boolean | null>(null)
  const [dismissed, setDismissed] = useState(false)
  
  useEffect(() => {
    // Only run in development
    if (process.env.NODE_ENV !== 'development') return
    
    // Check if RLS policies are applied
    checkRLSPoliciesApplied().then(setPoliciesApplied)
    
    // Check if banner was dismissed this session
    const wasDismissed = sessionStorage.getItem('rls_banner_dismissed') === 'true'
    setDismissed(wasDismissed)
  }, [])
  
  // Don't show in production or if dismissed
  if (!statusInfo || dismissed) return null
  
  const handleToggle = () => {
    toggleRLSBypass(!statusInfo.bypassEnabled)
    setStatusInfo(getRLSStatusInfo())
  }
  
  const handleDismiss = () => {
    setDismissed(true)
    sessionStorage.setItem('rls_banner_dismissed', 'true')
  }
  
  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md animate-in slide-in-from-bottom-5 bg-background">
      <Alert className={statusInfo.bypassEnabled ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/20' : 'border-green-500 bg-green-50 dark:bg-green-950/20'}>
        <div className="flex items-start gap-3">
          {statusInfo.bypassEnabled ? (
            <ShieldOff className="h-4 w-4 text-orange-600 dark:text-orange-400 mt-0.5" />
          ) : (
            <Shield className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5" />
          )}
          
          <div className="flex-1">
            <AlertDescription className="text-sm">
              <div className="font-semibold mb-1">
                {statusInfo.message}
              </div>
              
              {policiesApplied === false && (
                <div className="flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400 mb-2">
                  <AlertTriangle className="h-3 w-3" />
                  RLS policies not detected in database
                </div>
              )}
              
              <div className="flex items-center gap-2 mt-2">
                <Button
                  size="sm"
                  variant={statusInfo.bypassEnabled ? "destructive" : "outline"}
                  onClick={handleToggle}
                  className="h-7 text-xs"
                >
                  {statusInfo.bypassEnabled ? 'Disable Bypass' : 'Enable Bypass'}
                </Button>
                
                {policiesApplied === false && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open('/supabase/policies/APPLY_POLICIES.md', '_blank')}
                    className="h-7 text-xs"
                  >
                    Apply Policies
                  </Button>
                )}
              </div>
            </AlertDescription>
          </div>
          
          <button
            onClick={handleDismiss}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Dismiss banner"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </Alert>
    </div>
  )
}