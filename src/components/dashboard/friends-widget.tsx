'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Users, UserPlus } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { getFriends } from '@/lib/api/friends'
import { OnlineIndicator } from '@/components/friends/online-indicator'
import Link from 'next/link'

export function FriendsWidget() {
  const { data: friends, isLoading } = useQuery({
    queryKey: ['friends'],
    queryFn: getFriends,
  })

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Friends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3">
                <div className="h-8 w-8 bg-muted rounded-full animate-pulse" />
                <div className="h-4 bg-muted rounded w-24 animate-pulse" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const onlineFriends = friends?.filter(friend => friend.status === 'online') || []
  const totalFriends = friends?.length || 0

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg">Friends</CardTitle>
        <Button variant="ghost" size="icon" asChild>
          <Link href="/friends">
            <UserPlus className="h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Online ({onlineFriends.length}/{totalFriends})
          </span>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/friends">View All</Link>
          </Button>
        </div>

        {onlineFriends.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No friends online</p>
          </div>
        ) : (
          <div className="space-y-3">
            {onlineFriends.slice(0, 5).map((friend) => (
              <div key={friend.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={friend.avatarUrl} alt={friend.username} />
                      <AvatarFallback>
                        {friend.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <OnlineIndicator 
                      status={friend.status} 
                      className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5" 
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">{friend.username}</p>
                    {friend.currentGameId && (
                      <p className="text-xs text-muted-foreground">In game</p>
                    )}
                  </div>
                </div>
                <Badge variant="outline" className="text-xs">
                  {friend.status}
                </Badge>
              </div>
            ))}
            
            {onlineFriends.length > 5 && (
              <Button variant="ghost" size="sm" className="w-full" asChild>
                <Link href="/friends">
                  +{onlineFriends.length - 5} more online
                </Link>
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}