'use client'

import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Users, Clock, MessageCircle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'
import type { GameSummary } from '@/types/dashboard'

interface GameCardProps {
  game: GameSummary
}

export function GameCard({ game }: GameCardProps) {
  return (
    <Card className="transition-all hover:shadow-md">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="space-y-1">
            <h3 className="font-semibold text-lg">{game.name}</h3>
            <p className="text-sm text-muted-foreground">
              DM: {game.masterName}
            </p>
          </div>
          <Badge variant="secondary">
            {game.system}
          </Badge>
        </div>

        <div className="flex items-center space-x-4 mb-4 text-sm text-muted-foreground">
          <div className="flex items-center space-x-1">
            <Users className="h-4 w-4" />
            <span>{game.playerCount}/{game.maxPlayers} players</span>
          </div>
          <div className="flex items-center space-x-1">
            <Clock className="h-4 w-4" />
            <span>{formatDistanceToNow(game.lastActivity, { addSuffix: true })}</span>
          </div>
          {game.unreadMessages > 0 && (
            <div className="flex items-center space-x-1">
              <MessageCircle className="h-4 w-4" />
              <Badge variant="destructive" className="px-2 py-0 text-xs">
                {game.unreadMessages}
              </Badge>
            </div>
          )}
        </div>

        {game.myCharacters.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Your Characters:</p>
            <div className="flex items-center space-x-2">
              {game.myCharacters.slice(0, 3).map((character) => (
                <div key={character.id} className="flex items-center space-x-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={character.avatarUrl} alt={character.name} />
                    <AvatarFallback className="text-xs">
                      {character.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{character.name}</span>
                </div>
              ))}
              {game.myCharacters.length > 3 && (
                <span className="text-xs text-muted-foreground">
                  +{game.myCharacters.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="p-6 pt-0">
        <div className="flex space-x-2 w-full">
          <Button asChild className="flex-1">
            <Link href={`/games/${game.id}`}>
              Continue Playing
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/games/${game.id}/info`}>
              View Details
            </Link>
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}