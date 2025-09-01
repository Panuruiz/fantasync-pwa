import { Suspense } from 'react'
import { DashboardHeader } from '@/components/dashboard/dashboard-header'
import { DashboardSidebar } from '@/components/dashboard/dashboard-sidebar'
import { DashboardSkeleton } from '@/components/dashboard/dashboard-skeleton'
import { BottomNav } from '@/components/dashboard/bottom-nav'
import { UserProvider } from '@/providers/user-provider'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <UserProvider>
      <div className="min-h-screen bg-background">
      {/* Mobile header */}
      <div className="lg:hidden">
        <DashboardHeader />
      </div>
      
      <div className="lg:grid lg:grid-cols-5">
        {/* Desktop sidebar */}
        <div className="hidden lg:block lg:col-span-1 lg:border-r">
          <DashboardSidebar />
        </div>
        
        {/* Main content */}
        <main className="lg:col-span-4">
          {/* Desktop header */}
          <div className="hidden lg:block border-b">
            <DashboardHeader />
          </div>
          
          <Suspense fallback={<DashboardSkeleton />}>
            <div className="container mx-auto px-4 py-6 pb-20 lg:pb-6">
              {children}
            </div>
          </Suspense>
        </main>
      </div>
      
      {/* Mobile bottom navigation */}
      <BottomNav />
    </div>
    </UserProvider>
  )
}