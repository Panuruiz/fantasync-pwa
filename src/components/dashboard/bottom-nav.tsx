'use client'

import { Button } from '@/components/ui/button'
import { Home, Gamepad2, Users, MessageSquare, Plus } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Home', href: '/dashboard', icon: Home },
  { name: 'Games', href: '/games', icon: Gamepad2 },
  { name: 'Create', href: '/games/create', icon: Plus },
  { name: 'Friends', href: '/friends', icon: Users },
  { name: 'Messages', href: '/messages', icon: MessageSquare },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t">
      <nav className="flex items-center justify-around px-2 py-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          const isCreate = item.name === 'Create'
          
          if (isCreate) {
            return (
              <Link key={item.name} href={item.href}>
                <Button
                  size="sm"
                  className="h-12 w-12 rounded-full bg-primary hover:bg-primary/90"
                >
                  <item.icon className="h-5 w-5" />
                </Button>
              </Link>
            )
          }
          
          return (
            <Link key={item.name} href={item.href} className="flex-1">
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  'flex-col h-16 w-full space-y-1 text-xs font-normal',
                  isActive && 'text-primary bg-primary/10'
                )}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.name}</span>
              </Button>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}