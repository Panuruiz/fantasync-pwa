'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useGameStore } from '@/stores/game-store'
import { useUserStore } from '@/stores/user-store'
import type { Game } from '@/types/game'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { 
  ArrowLeft, 
  Crown, 
  Users, 
  MessageCircle, 
  Settings, 
  MoreVertical,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2
} from 'lucide-react'

interface GameHeaderProps {
  game: Game
}

export default function GameHeader({ game }: GameHeaderProps) {
  const router = useRouter()
  const { 
    isChatOpen, 
    isPlayerListOpen, 
    toggleChat, 
    togglePlayerList 
  } = useGameStore()
  
  const { id: userId } = useUserStore()
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const isGameMaster = game.masterId === userId
  const activePlayers = game.players?.filter(p => p.isActive) || []
  const onlineCount = activePlayers.length // TODO: Get actual online count from presence

  const formatGameSystem = (system: string) => {
    switch (system) {
      case 'DND5E':
        return 'D&D 5e'
      case 'PATHFINDER2E':
        return 'Pathfinder 2e'
      case 'CALL_OF_CTHULHU':
        return 'Call of Cthulhu'
      case 'VAMPIRE':
        return 'Vampire'
      default:
        return system
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-500'
      case 'PREPARING':
        return 'bg-yellow-500'
      case 'PAUSED':
        return 'bg-orange-500'
      default:
        return 'bg-gray-400'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'Active'
      case 'PREPARING':
        return 'Preparing'
      case 'PAUSED':
        return 'Paused'
      default:
        return status
    }
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
    // TODO: Implement actual mute functionality
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left Side - Back and Game Info */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/games')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-3">
            {game.coverImage ? (
              <div 
                className="w-8 h-8 rounded bg-cover bg-center"
                style={{ backgroundImage: `url(${game.coverImage})` }}
              />
            ) : (
              <div 
                className="w-8 h-8 rounded flex items-center justify-center text-white text-sm font-bold"
                style={{ backgroundColor: game.themeColor || '#6366f1' }}
              >
                {game.name.charAt(0).toUpperCase()}
              </div>
            )}

            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-semibold text-lg">{game.name}</h1>
                <div className={`w-2 h-2 rounded-full ${getStatusColor(game.status)}`} />
                <span className="text-sm text-muted-foreground">
                  {getStatusText(game.status)}
                </span>
              </div>
              
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Badge variant="outline" className="text-xs">
                  {formatGameSystem(game.system)}
                </Badge>
                
                {game.campaignName && (
                  <span className="truncate max-w-40">
                    {game.campaignName}
                  </span>
                )}

                <div className="flex items-center gap-1">
                  <Crown className="h-3 w-3" />
                  <span>{game.master?.username}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Center - Players Online */}
        <div className="hidden md:flex items-center gap-2">
          <div className="flex -space-x-2">
            {activePlayers.slice(0, 4).map((player) => (
              <Avatar key={player.id} className="h-8 w-8 border-2 border-background">
                <AvatarImage src={player.user?.avatarUrl} />
                <AvatarFallback className="text-xs">
                  {player.user?.username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            ))}
            {activePlayers.length > 4 && (
              <div className="h-8 w-8 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                <span className="text-xs font-medium">
                  +{activePlayers.length - 4}
                </span>
              </div>
            )}
          </div>
          <span className="text-sm text-muted-foreground">
            {onlineCount} online
          </span>
        </div>

        {/* Right Side - Controls */}
        <div className="flex items-center gap-2">
          {/* Chat Toggle */}
          <Button
            variant={isChatOpen ? "default" : "outline"}
            size="sm"
            onClick={toggleChat}
            className="hidden sm:flex"
          >
            <MessageCircle className="h-4 w-4" />
          </Button>

          {/* Players List Toggle */}
          <Button
            variant={isPlayerListOpen ? "default" : "outline"}
            size="sm"
            onClick={togglePlayerList}
          >
            <Users className="h-4 w-4" />
            <span className="ml-1 hidden sm:inline">
              {activePlayers.length}
            </span>
          </Button>

          {/* Audio Control */}
          <Button
            variant="outline"
            size="sm"
            onClick={toggleMute}
            className="hidden md:flex"
          >
            {isMuted ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </Button>

          {/* More Options */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={toggleFullscreen}>
                {isFullscreen ? (
                  <>
                    <Minimize2 className="h-4 w-4 mr-2" />
                    Exit Fullscreen
                  </>
                ) : (
                  <>
                    <Maximize2 className="h-4 w-4 mr-2" />
                    Fullscreen
                  </>
                )}
              </DropdownMenuItem>

              <DropdownMenuItem 
                onClick={toggleMute}
                className="md:hidden"
              >
                {isMuted ? (
                  <>
                    <Volume2 className="h-4 w-4 mr-2" />
                    Unmute
                  </>
                ) : (
                  <>
                    <VolumeX className="h-4 w-4 mr-2" />
                    Mute
                  </>
                )}
              </DropdownMenuItem>

              <DropdownMenuItem 
                onClick={toggleChat}
                className="sm:hidden"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                {isChatOpen ? 'Hide Chat' : 'Show Chat'}
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              {isGameMaster && (
                <DropdownMenuItem 
                  onClick={() => router.push(`/games/${game.id}/settings`)}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Game Settings
                </DropdownMenuItem>
              )}

              <DropdownMenuItem onClick={() => router.push('/games')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Games
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}