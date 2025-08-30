import { Suspense } from 'react'
import { SettingsLayout } from '@/components/settings/settings-layout'

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Settings</h1>
      </div>

      <Suspense fallback={<div className="h-96 bg-muted rounded-lg animate-pulse" />}>
        <SettingsLayout />
      </Suspense>
    </div>
  )
}