'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getUserGames } from '@/lib/api/games'
import { useGameStore } from '@/stores/game-store'
import type { GameSummary } from '@/types/game'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Plus, Users, Calendar, MessageCircle, Crown } from 'lucide-react'

export default function GamesPage() {
  const router = useRouter()
  const { games, setGames, setGamesLoading, setGamesError } = useGameStore()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadGames()
  }, [])

  const loadGames = async () => {
    try {
      setLoading(true)
      setGamesLoading(true)
      setGamesError(null)
      
      const gamesList = await getUserGames()
      setGames(gamesList)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load games'
      setError(errorMessage)
      setGamesError(errorMessage)
    } finally {
      setLoading(false)
      setGamesLoading(false)
    }
  }

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
      case 'COMPLETED':
        return 'bg-gray-500'
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
      case 'COMPLETED':
        return 'Completed'
      default:
        return status
    }
  }

  const formatLastActivity = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)

    if (diffHours < 1) {
      return 'Just now'
    } else if (diffHours < 24) {
      return `${diffHours}h ago`
    } else if (diffDays < 7) {
      return `${diffDays}d ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">My Games</h1>
            <p className="text-muted-foreground mt-2">Manage and play your RPG games</p>
          </div>
          <Button disabled>
            <Plus className="h-4 w-4 mr-2" />
            Create Game
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-4">
                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="h-3 bg-gray-200 rounded"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">My Games</h1>
            <p className="text-muted-foreground mt-2">Manage and play your RPG games</p>
          </div>
          <Button onClick={() => router.push('/games/create')}>
            <Plus className="h-4 w-4 mr-2" />
            Create Game
          </Button>
        </div>

        <Card className="p-8 text-center">
          <div className="text-red-500 text-lg font-medium mb-2">Error Loading Games</div>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={loadGames}>Try Again</Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">My Games</h1>
          <p className="text-muted-foreground mt-2">
            {games.length > 0 ? `${games.length} game${games.length !== 1 ? 's' : ''}` : 'No games yet'}
          </p>
        </div>
        <Button onClick={() => router.push('/games/create')}>
          <Plus className="h-4 w-4 mr-2" />
          Create Game
        </Button>
      </div>

      {games.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="text-6xl mb-4">🎲</div>
          <h2 className="text-2xl font-semibold mb-2">No Games Yet</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Create your first game to start playing with friends. Choose from popular systems like D&D 5e, Pathfinder, and more.
          </p>
          <Button size="lg" onClick={() => router.push('/games/create')}>
            <Plus className="h-4 w-4 mr-2" />
            Create Your First Game
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {games.map((game) => (
            <Card 
              key={game.id} 
              className="group cursor-pointer transition-all hover:shadow-lg hover:scale-105 active:scale-100"
              onClick={() => router.push(`/games/${game.id}`)}
            >
              {game.coverImage && (
                <div 
                  className="h-32 bg-cover bg-center rounded-t-lg"
                  style={{ backgroundImage: `url(${game.coverImage})` }}
                />
              )}
              
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate group-hover:text-primary transition-colors">
                      {game.name}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {formatGameSystem(game.system)}
                      </Badge>
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(game.status)}`} />
                      <span className="text-xs">{getStatusText(game.status)}</span>
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Crown className="h-4 w-4" />
                    <span className="truncate">{game.masterName}</span>
                  </div>

                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span>{game.playerCount}/{game.maxPlayers}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MessageCircle className="h-4 w-4" />
                      <span>{game.unreadMessages}</span>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Last activity: {formatLastActivity(game.lastActivity)}</span>
                  </div>

                  {game.myCharacters.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Playing as:</span>
                      <div className="flex items-center gap-1">
                        {game.myCharacters.slice(0, 2).map((character) => (
                          <div key={character.id} className="flex items-center gap-1">
                            <Avatar className="h-5 w-5">
                              <AvatarImage src={character.avatarUrl} />
                              <AvatarFallback className="text-xs">
                                {character.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs font-medium truncate max-w-20">
                              {character.name}
                            </span>
                          </div>
                        ))}
                        {game.myCharacters.length > 2 && (
                          <span className="text-xs text-muted-foreground">
                            +{game.myCharacters.length - 2} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}