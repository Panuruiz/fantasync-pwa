import { Suspense } from 'react'
import { FriendsList } from '@/components/friends/friends-list'
import { FriendRequests } from '@/components/friends/friend-requests'
import { AddFriendButton } from '@/components/friends/add-friend-button'
import { Card } from '@/components/ui/card'

export default function FriendsPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Friends</h1>
        <AddFriendButton />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Friend requests */}
        <div className="lg:col-span-1">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Pending Requests</h2>
            <Suspense fallback={<div className="space-y-3">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="h-16 bg-muted rounded animate-pulse" />
              ))}
            </div>}>
              <FriendRequests />
            </Suspense>
          </Card>
        </div>

        {/* Friends list */}
        <div className="lg:col-span-2">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">All Friends</h2>
            <Suspense fallback={<div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-muted rounded animate-pulse" />
              ))}
            </div>}>
              <FriendsList />
            </Suspense>
          </Card>
        </div>
      </div>
    </div>
  )
}