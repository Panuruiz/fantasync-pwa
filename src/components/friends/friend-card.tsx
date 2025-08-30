'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { MoreHorizontal, MessageCircle, Gamepad2, UserMinus, Ban } from 'lucide-react'
import { OnlineIndicator } from './online-indicator'
import type { Friend } from '@/types/dashboard'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { removeFriend, blockUser } from '@/lib/api/friends'
import { toast } from 'sonner'

interface FriendCardProps {
  friend: Friend
}

export function FriendCard({ friend }: FriendCardProps) {
  const queryClient = useQueryClient()

  const removeFriendMutation = useMutation({
    mutationFn: () => removeFriend(friend.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] })
      toast.success(`Removed ${friend.username} from friends`)
    },
    onError: () => {
      toast.error('Failed to remove friend')
    },
  })

  const blockUserMutation = useMutation({
    mutationFn: () => blockUser(friend.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] })
      toast.success(`Blocked ${friend.username}`)
    },
    onError: () => {
      toast.error('Failed to block user')
    },
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500'
      case 'away': return 'bg-yellow-500'
      case 'busy': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online': return 'Online'
      case 'away': return 'Away'
      case 'busy': return 'Busy'
      default: return 'Offline'
    }
  }

  return (
    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex items-center space-x-3">
        <div className="relative">
          <Avatar className="h-10 w-10">
            <AvatarImage src={friend.avatarUrl} alt={friend.username} />
            <AvatarFallback>
              {friend.username.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <OnlineIndicator 
            status={friend.status} 
            className="absolute -bottom-1 -right-1" 
          />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <p className="font-medium truncate">{friend.username}</p>
            <Badge variant="secondary" className="text-xs">
              {getStatusText(friend.status)}
            </Badge>
          </div>
          
          {friend.statusMessage && (
            <p className="text-sm text-muted-foreground truncate">
              {friend.statusMessage}
            </p>
          )}
          
          {friend.currentGameId && (
            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              <Gamepad2 className="h-3 w-3" />
              <span>In game</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MessageCircle className="h-4 w-4" />
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <MessageCircle className="mr-2 h-4 w-4" />
              Send Message
            </DropdownMenuItem>
            {friend.currentGameId && (
              <DropdownMenuItem>
                <Gamepad2 className="mr-2 h-4 w-4" />
                Join Game
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-destructive"
              onClick={() => removeFriendMutation.mutate()}
              disabled={removeFriendMutation.isPending}
            >
              <UserMinus className="mr-2 h-4 w-4" />
              Remove Friend
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="text-destructive"
              onClick={() => blockUserMutation.mutate()}
              disabled={blockUserMutation.isPending}
            >
              <Ban className="mr-2 h-4 w-4" />
              Block User
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}