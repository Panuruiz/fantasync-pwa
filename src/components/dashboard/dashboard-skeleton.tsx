export function DashboardSkeleton() {
  return (
    <div className="container mx-auto px-4 py-6 space-y-8">
      {/* Welcome section skeleton */}
      <div className="space-y-2">
        <div className="h-8 bg-muted rounded w-64 animate-pulse" />
        <div className="h-5 bg-muted rounded w-48 animate-pulse" />
      </div>

      {/* Quick stats skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="p-6 bg-muted rounded-lg animate-pulse">
            <div className="h-6 bg-background/20 rounded mb-2" />
            <div className="h-8 bg-background/20 rounded" />
          </div>
        ))}
      </div>

      {/* Main content grid skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Games section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <div className="h-8 bg-muted rounded w-32 animate-pulse" />
            <div className="h-10 bg-muted rounded w-24 animate-pulse" />
          </div>
          
          {/* Game cards */}
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">
          {/* Friends widget */}
          <div className="h-64 bg-muted rounded-lg animate-pulse" />
          
          {/* Activity feed */}
          <div className="h-80 bg-muted rounded-lg animate-pulse" />
        </div>
      </div>
    </div>
  )
}