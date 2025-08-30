'use client'

import { useQuery } from '@tanstack/react-query'
import { getFriends } from '@/lib/api/friends'
import { FriendCard } from './friend-card'
import { Users } from 'lucide-react'

export function FriendsList() {
  const { data: friends, isLoading, error } = useQuery({
    queryKey: ['friends'],
    queryFn: getFriends,
  })

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-muted rounded animate-pulse" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center text-muted-foreground">
        <p>Failed to load friends. Please try again later.</p>
      </div>
    )
  }

  if (!friends || friends.length === 0) {
    return (
      <div className="text-center space-y-4 py-8">
        <Users className="h-16 w-16 mx-auto text-muted-foreground/50" />
        <div>
          <h3 className="text-lg font-semibold">No friends yet</h3>
          <p className="text-muted-foreground">
            Start by sending friend requests to other players!
          </p>
        </div>
      </div>
    )
  }

  const onlineFriends = friends.filter(friend => friend.status === 'online')
  const offlineFriends = friends.filter(friend => friend.status !== 'online')

  return (
    <div className="space-y-6">
      {onlineFriends.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-green-600 mb-3">
            Online ({onlineFriends.length})
          </h3>
          <div className="space-y-2">
            {onlineFriends.map((friend) => (
              <FriendCard key={friend.id} friend={friend} />
            ))}
          </div>
        </div>
      )}

      {offlineFriends.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-3">
            Offline ({offlineFriends.length})
          </h3>
          <div className="space-y-2">
            {offlineFriends.map((friend) => (
              <FriendCard key={friend.id} friend={friend} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}