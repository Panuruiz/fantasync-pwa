import { Suspense } from 'react'
import { QuickStats } from '@/components/dashboard/quick-stats'
import { ActiveGames } from '@/components/dashboard/active-games'
import { FriendsWidget } from '@/components/dashboard/friends-widget'
import { ActivityFeed } from '@/components/dashboard/activity-feed'
import { CreateGameButton } from '@/components/dashboard/create-game-button'
import { WelcomeSection } from '@/components/dashboard/welcome-section'

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Welcome section */}
      <WelcomeSection />

      {/* Quick stats */}
      <Suspense fallback={<div className="h-24 bg-muted rounded-lg animate-pulse" />}>
        <QuickStats />
      </Suspense>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Games */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Active Games</h2>
            <CreateGameButton />
          </div>
          
          <Suspense fallback={<div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>}>
            <ActiveGames />
          </Suspense>
        </div>

        {/* Right column - Social and activity */}
        <div className="space-y-6">
          <Suspense fallback={<div className="h-64 bg-muted rounded-lg animate-pulse" />}>
            <FriendsWidget />
          </Suspense>
          
          <Suspense fallback={<div className="h-80 bg-muted rounded-lg animate-pulse" />}>
            <ActivityFeed />
          </Suspense>
        </div>
      </div>
    </div>
  )
}