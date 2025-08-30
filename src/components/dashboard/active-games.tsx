'use client'

import { useQuery } from '@tanstack/react-query'
import { getActiveGames } from '@/lib/api/dashboard'
import { GameCard } from './game-card'
import { Card, CardContent } from '@/components/ui/card'
import { Gamepad2 } from 'lucide-react'

export function ActiveGames() {
  const { data: games, isLoading, error } = useQuery({
    queryKey: ['active-games'],
    queryFn: getActiveGames,
  })

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-48 bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <p>Failed to load games. Please try again later.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!games || games.length === 0) {
    return (
      <Card>
        <CardContent className="p-12">
          <div className="text-center space-y-4">
            <Gamepad2 className="h-16 w-16 mx-auto text-muted-foreground/50" />
            <div>
              <h3 className="text-lg font-semibold">No active games</h3>
              <p className="text-muted-foreground">
                Join or create a game to get started!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {games.map((game) => (
        <GameCard key={game.id} game={game} />
      ))}
      
      {games.length >= 5 && (
        <div className="text-center">
          <button className="text-sm text-muted-foreground hover:text-foreground">
            View all games →
          </button>
        </div>
      )}
    </div>
  )
}