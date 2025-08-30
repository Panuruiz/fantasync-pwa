'use client'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { 
  Home, 
  Users, 
  Gamepad2, 
  Settings, 
  User,
  Plus,
  MessageSquare 
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Games', href: '/games', icon: Gamepad2 },
  { name: 'Friends', href: '/friends', icon: Users },
  { name: 'Messages', href: '/messages', icon: MessageSquare },
]

const secondaryNavigation = [
  { name: 'Profile', href: '/profile', icon: User },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export function DashboardSidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-screen flex-col bg-background border-r">
      <div className="flex h-16 items-center px-4 border-b">
        <Link href="/dashboard" className="font-bold text-xl">
          Fantasync
        </Link>
      </div>
      
      <nav className="flex-1 space-y-1 p-4">
        <div className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link key={item.name} href={item.href}>
                <Button
                  variant={isActive ? 'secondary' : 'ghost'}
                  className={cn(
                    'w-full justify-start',
                    isActive && 'bg-secondary'
                  )}
                >
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.name}
                </Button>
              </Link>
            )
          })}
        </div>

        <div className="pt-4 space-y-1 border-t">
          <Button className="w-full justify-start" size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Create Game
          </Button>
        </div>

        <div className="pt-4 space-y-1 border-t">
          {secondaryNavigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link key={item.name} href={item.href}>
                <Button
                  variant={isActive ? 'secondary' : 'ghost'}
                  className={cn(
                    'w-full justify-start',
                    isActive && 'bg-secondary'
                  )}
                >
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.name}
                </Button>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}