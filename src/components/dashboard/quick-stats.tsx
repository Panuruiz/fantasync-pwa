'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Gamepad2, Users, Clock, Trophy } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { getUserStats } from '@/lib/api/dashboard'

const statIcons = {
  games: Gamepad2,
  characters: Users,
  hours: Clock,
  friends: Users,
  achievements: Trophy,
}

export function QuickStats() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['user-stats'],
    queryFn: getUserStats,
  })

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-6 animate-pulse">
            <div className="h-6 bg-muted rounded mb-2" />
            <div className="h-8 bg-muted rounded" />
          </Card>
        ))}
      </div>
    )
  }

  const statsData = [
    {
      label: 'Active Games',
      value: stats?.activeGames || 0,
      icon: Gamepad2,
      color: 'text-blue-600',
    },
    {
      label: 'Characters',
      value: stats?.totalCharacters || 0,
      icon: Users,
      color: 'text-green-600',
    },
    {
      label: 'Hours Played',
      value: stats?.hoursPlayed || 0,
      icon: Clock,
      color: 'text-purple-600',
    },
    {
      label: 'Friends',
      value: stats?.friendsCount || 0,
      icon: Users,
      color: 'text-orange-600',
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {statsData.map((stat, index) => {
        const Icon = stat.icon
        return (
          <Card key={index} className="transition-all hover:shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2 mb-2">
                <Icon className={`h-5 w-5 ${stat.color}`} />
                <span className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </span>
              </div>
              <div className="text-3xl font-bold">
                {stat.value.toLocaleString()}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}