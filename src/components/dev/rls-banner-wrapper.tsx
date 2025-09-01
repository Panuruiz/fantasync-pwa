'use client'

import dynamic from 'next/dynamic'

// Dynamically import RLSStatusBanner with no SSR
// This component will only load and render on the client side
const RLSStatusBanner = dynamic(
  () => import('./rls-status-banner').then(mod => mod.RLSStatusBanner),
  { 
    ssr: false,
    loading: () => null 
  }
)

export function RLSBannerWrapper() {
  // Only render in development mode
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return <RLSStatusBanner />
}