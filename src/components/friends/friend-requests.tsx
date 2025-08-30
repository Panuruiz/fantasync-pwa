'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getFriendRequests, acceptFriendRequest, rejectFriendRequest } from '@/lib/api/friends'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Check, X, Clock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'

export function FriendRequests() {
  const queryClient = useQueryClient()
  
  const { data: requests, isLoading } = useQuery({
    queryKey: ['friend-requests'],
    queryFn: getFriendRequests,
  })

  const acceptMutation = useMutation({
    mutationFn: acceptFriendRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friend-requests'] })
      queryClient.invalidateQueries({ queryKey: ['friends'] })
      toast.success('Friend request accepted!')
    },
    onError: () => {
      toast.error('Failed to accept friend request')
    },
  })

  const rejectMutation = useMutation({
    mutationFn: rejectFriendRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friend-requests'] })
      toast.success('Friend request rejected')
    },
    onError: () => {
      toast.error('Failed to reject friend request')
    },
  })

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="h-16 bg-muted rounded animate-pulse" />
        ))}
      </div>
    )
  }

  if (!requests || requests.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No pending requests</p>
      </div>
    )
  }

  const receivedRequests = requests.filter(req => req.type === 'received')
  const sentRequests = requests.filter(req => req.type === 'sent')

  return (
    <div className="space-y-4">
      {receivedRequests.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-2 text-blue-600">
            Received ({receivedRequests.length})
          </h4>
          <div className="space-y-2">
            {receivedRequests.map((request) => (
              <div key={request.id} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={request.avatarUrl} alt={request.username} />
                    <AvatarFallback>
                      {request.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">{request.username}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(request.createdAt, { addSuffix: true })}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-1">
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => acceptMutation.mutate(request.id)}
                    disabled={acceptMutation.isPending}
                    className="h-8 w-8 p-0"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => rejectMutation.mutate(request.id)}
                    disabled={rejectMutation.isPending}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {sentRequests.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-2 text-orange-600">
            Sent ({sentRequests.length})
          </h4>
          <div className="space-y-2">
            {sentRequests.map((request) => (
              <div key={request.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={request.avatarUrl} alt={request.username} />
                    <AvatarFallback>
                      {request.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">{request.username}</p>
                    <p className="text-xs text-muted-foreground">
                      Sent {formatDistanceToNow(request.createdAt, { addSuffix: true })}
                    </p>
                  </div>
                </div>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}