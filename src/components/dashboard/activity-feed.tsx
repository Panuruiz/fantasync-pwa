'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  MessageCircle, 
  UserPlus, 
  Gamepad2, 
  TrendingUp,
  Activity,
  MoreHorizontal
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { getActivityFeed } from '@/lib/api/dashboard'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'
import type { ActivityItem } from '@/types/dashboard'

const activityIcons = {
  message: MessageCircle,
  game_update: Gamepad2,
  friend_request: UserPlus,
  level_up: TrendingUp,
}

const activityColors = {
  message: 'text-blue-500',
  game_update: 'text-green-500',
  friend_request: 'text-purple-500',
  level_up: 'text-orange-500',
}

interface ActivityItemCardProps {
  activity: ActivityItem
}

function ActivityItemCard({ activity }: ActivityItemCardProps) {
  const Icon = activityIcons[activity.type] || Activity
  const colorClass = activityColors[activity.type] || 'text-muted-foreground'

  return (
    <div className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
      <div className={`mt-1 ${colorClass}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-sm truncate">{activity.title}</h4>
          <span className="text-xs text-muted-foreground ml-2">
            {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
          </span>
        </div>
        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
          {activity.description}
        </p>
        {activity.gameId && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="mt-2 h-6 px-2 text-xs"
            asChild
          >
            <Link href={`/game/${activity.gameId}`}>
              View Game
            </Link>
          </Button>
        )}
      </div>
      {!activity.read && (
        <div className="h-2 w-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
      )}
    </div>
  )
}

export function ActivityFeed() {
  const { data: activities, isLoading, error } = useQuery({
    queryKey: ['activity-feed'],
    queryFn: getActivityFeed,
  })

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3">
                <div className="h-4 w-4 bg-muted rounded animate-pulse" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
                  <div className="h-3 bg-muted rounded w-1/2 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-6">
            <p>Failed to load activity. Please try again later.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg">Recent Activity</CardTitle>
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        {!activities || activities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <div>
              <h3 className="font-medium">No recent activity</h3>
              <p className="text-sm">Join games and add friends to see activity here!</p>
            </div>
          </div>
        ) : (
          <div className="space-y-1 max-h-96 overflow-y-auto">
            {activities.map((activity) => (
              <ActivityItemCard key={activity.id} activity={activity} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}