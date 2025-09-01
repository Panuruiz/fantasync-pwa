'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getGameById } from '@/lib/api/games'
import { getGameMessages } from '@/lib/api/messages'
import { useGameStore } from '@/stores/game-store'
import { useUserStore } from '@/stores/user-store'
import { useGameChannel } from '@/hooks/use-game-channel'
import { useGamePresence } from '@/hooks/use-game-presence'
import type { Game, ChatMessage } from '@/types/game'

// Import components
import GameLayout from '@/components/game/game-layout'
import GameHeader from '@/components/game/game-header'
import ChatTimeline from '@/components/game/chat-timeline'
import MessageComposer from '@/components/game/message-composer'
import PlayerList from '@/components/game/player-list'
import MobileGameNav from '@/components/game/mobile-game-nav'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, Loader2 } from 'lucide-react'

export default function GamePage() {
  const params = useParams()
  const router = useRouter()
  const gameId = params.id as string
  
  const { 
    currentGame, 
    setCurrentGame, 
    setCurrentGameLoading, 
    setCurrentGameError,
    messageHistory,
    setMessagesForGame,
    isChatOpen,
    isPlayerListOpen 
  } = useGameStore()
  
  const { id: userId } = useUserStore()
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Check if user is part of the game
  const isGameMaster = currentGame?.masterId === userId
  const isPlayer = currentGame?.players?.some(p => p.userId === userId && p.isActive)
  const hasAccess = isGameMaster || isPlayer

  // Real-time hooks (only activate after we have access)
  const { isConnected } = useGameChannel(hasAccess ? gameId : null)
  useGamePresence(hasAccess ? gameId : null)

  useEffect(() => {
    loadGame()
  }, [gameId])

  const loadGame = async () => {
    try {
      setLoading(true)
      setCurrentGameLoading(true)
      setCurrentGameError(null)
      setError(null)

      // Load game data
      const game = await getGameById(gameId)
      if (!game) {
        setError('Game not found')
        return
      }

      setCurrentGame(game)

      // Load recent messages
      const messages = await getGameMessages(gameId, 50)
      setMessagesForGame(gameId, messages)

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load game'
      setError(errorMessage)
      setCurrentGameError(errorMessage)
    } finally {
      setLoading(false)
      setCurrentGameLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-8">
          <CardContent className="flex items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading game...</span>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !currentGame || !hasAccess) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-8 text-center max-w-md">
          <CardContent className="space-y-4">
            <div className="text-6xl">🎲</div>
            <h2 className="text-2xl font-semibold">
              {error || 'Access Denied'}
            </h2>
            <p className="text-muted-foreground">
              {error || 'You don\'t have permission to view this game.'}
            </p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
              <Button onClick={() => router.push('/games')}>
                View My Games
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const currentMessages = messageHistory[gameId] || []

  return (
    <GameLayout>
      <div className="flex flex-col h-screen">
        {/* Header */}
        <GameHeader game={currentGame} />

        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden pb-16 sm:pb-0">
          {/* Chat Area */}
          <div className={`flex-1 flex flex-col transition-all duration-300 ${
            isPlayerListOpen ? 'sm:mr-80' : ''
          }`}>
            {/* Messages */}
            <div className="flex-1 overflow-hidden">
              <ChatTimeline 
                messages={currentMessages}
                gameId={gameId}
                userId={userId || ''}
              />
            </div>

            {/* Message Input - Always visible on desktop, toggle on mobile */}
            <div className={`border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 ${
              isChatOpen ? 'block' : 'hidden sm:block'
            }`}>
              <MessageComposer gameId={gameId} />
            </div>
          </div>

          {/* Player List Sidebar - Hidden on mobile when using bottom nav */}
          {isPlayerListOpen && (
            <div className="hidden sm:block w-80 border-l bg-muted/30">
              <PlayerList 
                game={currentGame}
                currentUserId={userId || ''}
              />
            </div>
          )}

          {/* Mobile Player List Overlay */}
          {isPlayerListOpen && (
            <div 
              className="fixed inset-0 z-40 bg-black/50 sm:hidden"
              onClick={togglePlayerList}
            >
              <div 
                className="absolute right-0 top-0 bottom-0 w-80 bg-background border-l"
                onClick={(e) => e.stopPropagation()}
              >
                <PlayerList 
                  game={currentGame}
                  currentUserId={userId || ''}
                />
              </div>
            </div>
          )}
        </div>

        {/* Mobile Navigation */}
        <MobileGameNav game={currentGame} />
      </div>
    </GameLayout>
  )
}