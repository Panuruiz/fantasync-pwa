'use client'

import { useState } from 'react'
import { kickPlayer } from '@/lib/api/games'
import { useGameStore } from '@/stores/game-store'
import type { Game, GamePlayer } from '@/types/game'
import CreateInviteDialog from './create-invite-dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { 
  Crown, 
  Users, 
  UserPlus, 
  MoreVertical, 
  UserMinus, 
  MessageCircle,
  Circle
} from 'lucide-react'

interface PlayerListProps {
  game: Game
  currentUserId: string
}

export default function PlayerList({ game, currentUserId }: PlayerListProps) {
  const { removeUserFromGame } = useGameStore()

  const isGameMaster = game.masterId === currentUserId
  const activePlayers = game.players?.filter(p => p.isActive) || []

  // Separate master and players
  const master = activePlayers.find(p => p.role === 'MASTER')
  const regularPlayers = activePlayers.filter(p => p.role !== 'MASTER')

  const handleKickPlayer = async (playerId: string) => {
    try {
      await kickPlayer(game.id, playerId)
      removeUserFromGame(game.id, playerId)
    } catch (error) {
      console.error('Failed to kick player:', error)
    }
  }


  const getPresenceStatus = (player: GamePlayer) => {
    // TODO: Get actual presence from game store
    return Math.random() > 0.5 ? 'online' : 'offline'
  }

  const getPresenceColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'text-green-500'
      case 'away':
        return 'text-yellow-500'
      case 'busy':
        return 'text-red-500'
      default:
        return 'text-gray-400'
    }
  }

  const formatJoinDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return new Intl.DateTimeFormat('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: dateObj.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    }).format(dateObj)
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2">
            <Users className="h-4 w-4" />
            Players ({activePlayers.length}/{game.maxPlayers})
          </h3>
          
          {isGameMaster && activePlayers.length < game.maxPlayers && (
            <CreateInviteDialog gameId={game.id}>
              <Button size="sm" variant="outline">
                <UserPlus className="h-4 w-4" />
              </Button>
            </CreateInviteDialog>
          )}
        </div>
      </div>

      {/* Players List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {/* Game Master */}
          {master && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <Crown className="h-3 w-3" />
                Game Master
              </h4>
              <PlayerCard 
                player={master} 
                game={game}
                currentUserId={currentUserId}
                onKick={handleKickPlayer}
                formatJoinDate={formatJoinDate}
              />
            </div>
          )}

          {/* Regular Players */}
          {regularPlayers.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">
                Players ({regularPlayers.length})
              </h4>
              <div className="space-y-2">
                {regularPlayers.map((player) => (
                  <PlayerCard
                    key={player.id}
                    player={player}
                    game={game}
                    currentUserId={currentUserId}
                    onKick={handleKickPlayer}
                    formatJoinDate={formatJoinDate}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Empty slots */}
          {activePlayers.length < game.maxPlayers && (
            <div className="space-y-2">
              {Array.from({ length: game.maxPlayers - activePlayers.length }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-2 rounded-lg border-2 border-dashed border-muted"
                >
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    <UserPlus className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-muted-foreground">Empty slot</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

interface PlayerCardProps {
  player: GamePlayer
  game: Game
  currentUserId: string
  onKick: (playerId: string) => void
  formatJoinDate: (date: Date | string) => string
}

function PlayerCard({ player, game, currentUserId, onKick, formatJoinDate }: PlayerCardProps) {
  const isCurrentUser = player.userId === currentUserId
  const isGameMaster = game.masterId === currentUserId
  const canKick = isGameMaster && !isCurrentUser && player.role !== 'MASTER'
  
  // Mock presence - in real app, get from presence store
  const presenceStatus = Math.random() > 0.5 ? 'online' : 'offline'
  
  return (
    <div className={`
      flex items-center gap-3 p-2 rounded-lg transition-colors
      ${isCurrentUser ? 'bg-primary/5 border border-primary/20' : 'hover:bg-muted/50'}
    `}>
      {/* Avatar with presence indicator */}
      <div className="relative">
        <Avatar className="h-8 w-8">
          <AvatarImage src={player.user?.avatarUrl || undefined} />
          <AvatarFallback className="text-xs">
            {player.user?.username?.charAt(0)?.toUpperCase() || '?'}
          </AvatarFallback>
        </Avatar>
        <Circle 
          className={`absolute -bottom-1 -right-1 h-3 w-3 border-2 border-background rounded-full fill-current ${
            presenceStatus === 'online' ? 'text-green-500' : 'text-gray-400'
          }`} 
        />
      </div>

      {/* Player info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">
            {player.user?.username || 'Unknown Player'}
            {isCurrentUser && ' (You)'}
          </span>
          {player.role === 'MASTER' && (
            <Crown className="h-3 w-3 text-yellow-500" />
          )}
          {player.role === 'SPECTATOR' && (
            <Badge variant="secondary" className="text-xs">
              Spectator
            </Badge>
          )}
        </div>
        <div className="text-xs text-muted-foreground">
          Joined {formatJoinDate(player.joinedAt)}
        </div>
      </div>

      {/* Actions */}
      {(canKick || !isCurrentUser) && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {!isCurrentUser && (
              <DropdownMenuItem>
                <MessageCircle className="h-4 w-4 mr-2" />
                Send Message
              </DropdownMenuItem>
            )}
            {canKick && (
              <DropdownMenuItem 
                onClick={() => onKick(player.userId)}
                className="text-red-600"
              >
                <UserMinus className="h-4 w-4 mr-2" />
                Kick Player
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  )
}