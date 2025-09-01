'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getGameById } from '@/lib/api/games'
import { getGameMessages } from '@/lib/api/messages'
import { getCharacters } from '@/lib/api/characters'
import { useGameStore } from '@/stores/game-store'
import { useUserStore } from '@/stores/user-store'
import { useCombatStore } from '@/stores/combat-store'
import { useNotesStore } from '@/stores/notes-store'
import { useGameChannel } from '@/hooks/use-game-channel'
import { useGamePresence } from '@/hooks/use-game-presence'

// Import components
import GameLayout from '@/components/game/game-layout'
import GameHeader from '@/components/game/game-header'
import ChatTimeline from '@/components/game/chat-timeline'
import MessageComposer from '@/components/game/message-composer'
import PlayerList from '@/components/game/player-list'
import MobileGameNav from '@/components/game/mobile-game-nav'
import InitiativeTracker from '@/components/combat/InitiativeTracker'
import CombatLog from '@/components/combat/CombatLog'
import NotesPanel from '@/components/notes/NotesPanel'
import { CharacterSheet } from '@/components/character/sheet/CharacterSheet'
import { Skeleton } from '@/components/ui/skeleton'
import { zClass } from '@/lib/utils/z-index'
import { CharacterErrorBoundary, CombatErrorBoundary, NotesErrorBoundary } from '@/components/shared/error-boundary'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, Loader2, Users, Swords, BookOpen, MessageSquare, Plus, UserPlus } from 'lucide-react'

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
    isPlayerListOpen,
    togglePlayerList
  } = useGameStore()
  
  const { id: userId, isAuthenticated } = useUserStore()
  const { toggleInitiativeTracker, toggleCombatLog } = useCombatStore()
  const { toggleNotePanel } = useNotesStore()
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userLoaded, setUserLoaded] = useState(false)
  const [activeTab, setActiveTab] = useState('chat')
  const [characters, setCharacters] = useState<any[]>([])
  const [charactersLoading, setCharactersLoading] = useState(false)
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null)

  // Wait for user store to be populated
  useEffect(() => {
    if (isAuthenticated && userId) {
      setUserLoaded(true)
    }
  }, [isAuthenticated, userId])

  // Check if user is part of the game
  const isGameMaster = currentGame?.masterId === userId
  const isPlayer = currentGame?.players?.some(p => p.userId === userId && p.isActive) || false
  const hasAccess = isGameMaster || isPlayer

  // Debug logging
  useEffect(() => {
    if (currentGame && userId) {
      console.log('Access check:', {
        userId,
        masterId: currentGame.masterId,
        isGameMaster,
        players: currentGame.players?.map(p => ({ userId: p.userId, isActive: p.isActive })),
        isPlayer,
        hasAccess
      })
    }
  }, [currentGame, userId, isGameMaster, isPlayer, hasAccess])

  // Real-time hooks (only activate after we have access)
  useGameChannel(hasAccess ? gameId : null)
  useGamePresence(hasAccess ? gameId : null)

  const loadGame = useCallback(async () => {
    try {
      setLoading(true)
      setCurrentGameLoading(true)
      setCurrentGameError(null)
      setError(null)

      console.log('Loading game:', gameId, 'for user:', userId)

      // Load game data
      const game = await getGameById(gameId)
      if (!game) {
        setError('Game not found')
        return
      }

      console.log('Game loaded:', game)
      console.log('Game master ID:', game.masterId)
      console.log('Current user ID:', userId)
      console.log('Game players:', game.players)

      setCurrentGame(game)

      // Load recent messages
      const messages = await getGameMessages(gameId, 50)
      setMessagesForGame(gameId, messages)

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load game'
      console.error('Error loading game:', err)
      setError(errorMessage)
      setCurrentGameError(errorMessage)
    } finally {
      setLoading(false)
      setCurrentGameLoading(false)
    }
  }, [gameId, userId, setCurrentGame, setCurrentGameLoading, setCurrentGameError, setError, setMessagesForGame])

  const loadCharacters = useCallback(async () => {
    if (!gameId) return
    
    try {
      setCharactersLoading(true)
      const gameCharacters = await getCharacters(gameId)
      setCharacters(gameCharacters)
      
      // Auto-select user's character if they have one
      const userCharacter = gameCharacters.find((char: any) => char.userId === userId)
      if (userCharacter) {
        setSelectedCharacterId(userCharacter.id)
      }
    } catch (err) {
      console.error('Error loading characters:', err)
    } finally {
      setCharactersLoading(false)
    }
  }, [gameId, userId])

  useEffect(() => {
    // Only load game after user is loaded
    if (userLoaded) {
      loadGame()
    }
  }, [loadGame, userLoaded])

  // Load characters when characters tab is selected
  useEffect(() => {
    if (activeTab === 'characters' && hasAccess && characters.length === 0 && !charactersLoading) {
      loadCharacters()
    }
  }, [activeTab, hasAccess, characters.length, charactersLoading, loadCharacters])

  if (!userLoaded || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-8">
          <CardContent className="flex items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>{!userLoaded ? 'Authenticating...' : 'Loading game...'}</span>
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
          {/* Main Game Content */}
          <div className={`flex-1 flex flex-col transition-all duration-300 ${
            isPlayerListOpen ? 'sm:mr-80' : ''
          }`}>
            <Tabs 
              value={activeTab} 
              onValueChange={setActiveTab} 
              className="flex-1 flex flex-col"
              aria-label="Game features"
            >
              {/* Tab Navigation */}
              <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <TabsList 
                  className="h-12 w-full justify-start rounded-none bg-transparent p-0" 
                  aria-label="Game feature navigation"
                >
                  <TabsTrigger 
                    value="chat" 
                    className="flex items-center gap-2 h-12 rounded-none border-b-2 border-transparent data-[state=active]:border-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                    aria-label="Chat tab"
                  >
                    <MessageSquare className="h-4 w-4" aria-hidden="true" />
                    <span>Chat</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="characters" 
                    className="flex items-center gap-2 h-12 rounded-none border-b-2 border-transparent data-[state=active]:border-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                    aria-label="Characters tab"
                  >
                    <Users className="h-4 w-4" aria-hidden="true" />
                    <span>Characters</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="combat" 
                    className="flex items-center gap-2 h-12 rounded-none border-b-2 border-transparent data-[state=active]:border-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                    aria-label="Combat tracker tab"
                  >
                    <Swords className="h-4 w-4" aria-hidden="true" />
                    <span>Combat</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="notes" 
                    className="flex items-center gap-2 h-12 rounded-none border-b-2 border-transparent data-[state=active]:border-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                    aria-label="Notes tab"
                  >
                    <BookOpen className="h-4 w-4" aria-hidden="true" />
                    <span>Notes</span>
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Tab Content */}
              <TabsContent value="chat" className="flex-1 flex flex-col m-0">
                {/* Messages */}
                <div className="flex-1 overflow-hidden">
                  <ChatTimeline 
                    messages={currentMessages}
                    gameId={gameId}
                    userId={userId || ''}
                  />
                </div>

                {/* Message Input */}
                <div className={`border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 ${
                  isChatOpen ? 'block' : 'hidden sm:block'
                }`}>
                  <MessageComposer gameId={gameId} />
                </div>
              </TabsContent>

              <TabsContent value="characters" className="flex-1 m-0 p-4 overflow-auto">
                {charactersLoading ? (
                  // Loading state with skeleton loaders
                  <div className="space-y-4">
                    <div className="flex justify-between items-center mb-4">
                      <Skeleton className="h-8 w-32" />
                      <Skeleton className="h-10 w-36" />
                    </div>
                    <div className="grid gap-4">
                      <Skeleton className="h-24 w-full" />
                      <Skeleton className="h-96 w-full" />
                    </div>
                  </div>
                ) : characters.length === 0 ? (
                  // Empty state with onboarding
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="text-center max-w-md mx-auto">
                      <Users className="h-16 w-16 mx-auto mb-6 text-muted-foreground/50" />
                      <h3 className="text-xl font-semibold mb-3">No Characters Yet</h3>
                      <p className="text-muted-foreground mb-6">
                        Create your first D&D 5e character to start your adventure in this campaign.
                      </p>
                      <div className="space-y-2">
                        <Button 
                          size="lg" 
                          className="w-full sm:w-auto"
                          onClick={() => {/* TODO: Open character creation dialog */}}
                        >
                          <Plus className="h-5 w-5 mr-2" />
                          Create Your Character
                        </Button>
                        {isGameMaster && (
                          <p className="text-sm text-muted-foreground mt-4">
                            As the Game Master, you can also create NPCs and manage all characters.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  // Character management interface
                  <div className="space-y-4">
                    {/* Character selector and actions */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-lg font-semibold">Characters</h3>
                        <Badge variant="secondary">{characters.length} Total</Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline"
                          onClick={() => loadCharacters()}
                          disabled={charactersLoading}
                        >
                          {charactersLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            'Refresh'
                          )}
                        </Button>
                        <Button onClick={() => {/* TODO: Open character creation dialog */}}>
                          <UserPlus className="h-4 w-4 mr-2" />
                          New Character
                        </Button>
                      </div>
                    </div>

                    {/* Character list for selection (if multiple characters) */}
                    {characters.length > 1 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {characters.map((character) => (
                          <Card 
                            key={character.id}
                            className={`cursor-pointer transition-all hover:shadow-md ${
                              selectedCharacterId === character.id 
                                ? 'ring-2 ring-primary' 
                                : ''
                            }`}
                            onClick={() => setSelectedCharacterId(character.id)}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                                  <Users className="h-5 w-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium truncate">{character.name}</p>
                                  <p className="text-sm text-muted-foreground truncate">
                                    {character.race} {character.class}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-medium">Lvl {character.level}</p>
                                  <p className="text-xs text-muted-foreground">
                                    HP: {character.currentHitPoints}/{character.maxHitPoints}
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}

                    {/* Character Sheet Display */}
                    {selectedCharacterId && (
                      <CharacterErrorBoundary>
                        <CharacterSheet 
                          character={characters.find(c => c.id === selectedCharacterId)}
                          isEditable={
                            isGameMaster || 
                            characters.find(c => c.id === selectedCharacterId)?.userId === userId
                          }
                        />
                      </CharacterErrorBoundary>
                    )}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="combat" className="flex-1 m-0 p-4">
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h3 className="text-lg font-semibold">Combat Tracker</h3>
                      <p className="text-sm text-muted-foreground">Manage encounters and track initiative</p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        onClick={toggleInitiativeTracker}
                        aria-label="Open initiative tracker"
                      >
                        <Swords className="h-4 w-4 mr-2" />
                        Initiative
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={toggleCombatLog}
                        aria-label="Open combat log"
                      >
                        <BookOpen className="h-4 w-4 mr-2" />
                        Combat Log
                      </Button>
                    </div>
                  </div>
                  
                  {/* Empty state with clear CTAs */}
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="text-center max-w-md mx-auto">
                      <Swords className="h-16 w-16 mx-auto mb-6 text-muted-foreground/50" />
                      <h4 className="text-xl font-semibold mb-3">No Active Combat</h4>
                      <p className="text-muted-foreground mb-6">
                        Start a combat encounter to track initiative order, manage turns, and log important events.
                      </p>
                      <div className="space-y-4">
                        <Button 
                          size="lg"
                          onClick={toggleInitiativeTracker}
                          className="w-full sm:w-auto"
                        >
                          <Plus className="h-5 w-5 mr-2" />
                          Start Combat Encounter
                        </Button>
                        {isGameMaster && (
                          <p className="text-sm text-muted-foreground">
                            As the Game Master, you can add NPCs, control turn order, and manage all combat participants.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="notes" className="flex-1 m-0 p-4">
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h3 className="text-lg font-semibold">Game Notes</h3>
                      <p className="text-sm text-muted-foreground">Keep track of important information and handouts</p>
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={toggleNotePanel}
                      aria-label="Open notes panel"
                    >
                      <BookOpen className="h-4 w-4 mr-2" />
                      Open Notes
                    </Button>
                  </div>
                  
                  {/* Empty state with clear guidance */}
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="text-center max-w-md mx-auto">
                      <BookOpen className="h-16 w-16 mx-auto mb-6 text-muted-foreground/50" />
                      <h4 className="text-xl font-semibold mb-3">Start Taking Notes</h4>
                      <p className="text-muted-foreground mb-6">
                        Keep track of NPCs, locations, quests, and important story details. 
                        {isGameMaster ? ' Share handouts with your players.' : ' Collaborate with other players.'}
                      </p>
                      <div className="space-y-4">
                        <Button 
                          size="lg"
                          onClick={toggleNotePanel}
                          className="w-full sm:w-auto"
                        >
                          <Plus className="h-5 w-5 mr-2" />
                          Create Your First Note
                        </Button>
                        <div className="text-sm text-muted-foreground">
                          <p className="font-medium mb-2">Organize notes by category:</p>
                          <div className="flex flex-wrap gap-2 justify-center">
                            <Badge variant="secondary">NPCs</Badge>
                            <Badge variant="secondary">Locations</Badge>
                            <Badge variant="secondary">Quests</Badge>
                            <Badge variant="secondary">Items</Badge>
                            <Badge variant="secondary">Lore</Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
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
              className={`fixed inset-0 ${zClass('playerListOverlay')} bg-black/50 sm:hidden`}
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

        {/* Overlay Components */}
        <CombatErrorBoundary>
          <InitiativeTracker gameId={gameId} isGameMaster={isGameMaster} />
          <CombatLog gameId={gameId} />
        </CombatErrorBoundary>
        <NotesErrorBoundary>
          <NotesPanel gameId={gameId} isGameMaster={isGameMaster} />
        </NotesErrorBoundary>
      </div>
    </GameLayout>
  )
}