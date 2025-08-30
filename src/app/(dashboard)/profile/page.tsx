import { Suspense } from 'react'
import { ProfileHeader } from '@/components/profile/profile-header'
import { ProfileSettings } from '@/components/profile/profile-settings'
import { Card } from '@/components/ui/card'

export default function ProfilePage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Profile</h1>
      </div>

      <Suspense fallback={
        <div className="space-y-6">
          <div className="h-48 bg-muted rounded-lg animate-pulse" />
          <div className="h-96 bg-muted rounded-lg animate-pulse" />
        </div>
      }>
        <ProfileHeader />
        <Card className="p-6">
          <ProfileSettings />
        </Card>
      </Suspense>
    </div>
  )
}