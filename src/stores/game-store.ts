import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { 
  Game, 
  GameSummary, 
  ChatMessage, 
  GamePresence, 
  GameEvent,
  GameChannel
} from '@/types/game'

interface GameState {
  // Current games list
  games: GameSummary[]
  gamesLoading: boolean
  gamesError: string | null

  // Current active game
  currentGame: Game | null
  currentGameLoading: boolean
  currentGameError: string | null

  // Chat for current game
  currentGameChannel: GameChannel | null
  messageHistory: Record<string, ChatMessage[]> // gameId -> messages
  
  // Presence tracking
  gamePresences: Record<string, GamePresence[]> // gameId -> users
  
  // UI state
  isChatOpen: boolean
  isPlayerListOpen: boolean
  selectedCharacterId: string | null

  // Message composition
  messageQueue: ChatMessage[] // Optimistic updates
  isTyping: boolean
  typingTimeout: NodeJS.Timeout | null

  // Actions - Game management
  setGames: (games: GameSummary[]) => void
  addGame: (game: GameSummary) => void
  updateGame: (gameId: string, updates: Partial<GameSummary>) => void
  removeGame: (gameId: string) => void
  setGamesLoading: (loading: boolean) => void
  setGamesError: (error: string | null) => void

  // Actions - Current game
  setCurrentGame: (game: Game | null) => void
  setCurrentGameLoading: (loading: boolean) => void
  setCurrentGameError: (error: string | null) => void
  
  // Actions - Chat
  setGameChannel: (channel: GameChannel | null) => void
  addMessage: (message: ChatMessage) => void
  updateMessage: (messageId: string, updates: Partial<ChatMessage>) => void
  deleteMessage: (messageId: string) => void
  addOptimisticMessage: (message: ChatMessage) => void
  removeOptimisticMessage: (tempId: string) => void
  clearMessages: (gameId: string) => void
  setMessagesForGame: (gameId: string, messages: ChatMessage[]) => void
  
  // Actions - Presence
  setGamePresence: (gameId: string, presence: GamePresence[]) => void
  addUserToGame: (gameId: string, user: GamePresence) => void
  removeUserFromGame: (gameId: string, userId: string) => void
  updateUserPresence: (gameId: string, userId: string, updates: Partial<GamePresence>) => void

  // Actions - UI
  toggleChat: () => void
  togglePlayerList: () => void
  setSelectedCharacter: (characterId: string | null) => void
  
  // Actions - Typing
  setIsTyping: (typing: boolean) => void
  clearTypingTimeout: () => void

  // Actions - Events
  handleGameEvent: (event: GameEvent) => void
  
  // Reset
  reset: () => void
}

const initialState = {
  games: [],
  gamesLoading: false,
  gamesError: null,
  currentGame: null,
  currentGameLoading: false,
  currentGameError: null,
  currentGameChannel: null,
  messageHistory: {},
  gamePresences: {},
  isChatOpen: true,
  isPlayerListOpen: false,
  selectedCharacterId: null,
  messageQueue: [],
  isTyping: false,
  typingTimeout: null,
}

export const useGameStore = create<GameState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // Game management actions
      setGames: (games) => set({ games }),
      
      addGame: (game) => set((state) => ({
        games: [game, ...state.games]
      })),
      
      updateGame: (gameId, updates) => set((state) => ({
        games: state.games.map(game => 
          game.id === gameId ? { ...game, ...updates } : game
        )
      })),
      
      removeGame: (gameId) => set((state) => ({
        games: state.games.filter(game => game.id !== gameId)
      })),
      
      setGamesLoading: (loading) => set({ gamesLoading: loading }),
      setGamesError: (error) => set({ gamesError: error }),

      // Current game actions
      setCurrentGame: (game) => set({ currentGame: game }),
      setCurrentGameLoading: (loading) => set({ currentGameLoading: loading }),
      setCurrentGameError: (error) => set({ currentGameError: error }),

      // Chat actions
      setGameChannel: (channel) => set({ currentGameChannel: channel }),
      
      addMessage: (message) => set((state) => {
        const gameId = message.gameId
        const currentMessages = state.messageHistory[gameId] || []
        
        // Remove any optimistic message with same temp ID
        const filteredMessages = currentMessages.filter(
          msg => !msg.isOptimistic || msg.id !== message.id
        )
        
        return {
          messageHistory: {
            ...state.messageHistory,
            [gameId]: [...filteredMessages, message].sort(
              (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            )
          }
        }
      }),
      
      updateMessage: (messageId, updates) => set((state) => {
        const newHistory: Record<string, ChatMessage[]> = {}
        
        Object.keys(state.messageHistory).forEach(gameId => {
          newHistory[gameId] = state.messageHistory[gameId].map(msg =>
            msg.id === messageId ? { ...msg, ...updates } : msg
          )
        })
        
        return { messageHistory: newHistory }
      }),
      
      deleteMessage: (messageId) => set((state) => {
        const newHistory: Record<string, ChatMessage[]> = {}
        
        Object.keys(state.messageHistory).forEach(gameId => {
          newHistory[gameId] = state.messageHistory[gameId].filter(
            msg => msg.id !== messageId
          )
        })
        
        return { messageHistory: newHistory }
      }),
      
      addOptimisticMessage: (message) => set((state) => ({
        messageQueue: [...state.messageQueue, message]
      })),
      
      removeOptimisticMessage: (tempId) => set((state) => ({
        messageQueue: state.messageQueue.filter(msg => msg.id !== tempId)
      })),
      
      clearMessages: (gameId) => set((state) => ({
        messageHistory: {
          ...state.messageHistory,
          [gameId]: []
        }
      })),
      
      setMessagesForGame: (gameId, messages) => set((state) => ({
        messageHistory: {
          ...state.messageHistory,
          [gameId]: messages.sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          )
        }
      })),

      // Presence actions
      setGamePresence: (gameId, presence) => set((state) => ({
        gamePresences: {
          ...state.gamePresences,
          [gameId]: presence
        }
      })),
      
      addUserToGame: (gameId, user) => set((state) => {
        const currentPresence = state.gamePresences[gameId] || []
        const existingIndex = currentPresence.findIndex(p => p.userId === user.userId)
        
        if (existingIndex >= 0) {
          // Update existing user
          const updatedPresence = [...currentPresence]
          updatedPresence[existingIndex] = user
          return {
            gamePresences: {
              ...state.gamePresences,
              [gameId]: updatedPresence
            }
          }
        } else {
          // Add new user
          return {
            gamePresences: {
              ...state.gamePresences,
              [gameId]: [...currentPresence, user]
            }
          }
        }
      }),
      
      removeUserFromGame: (gameId, userId) => set((state) => ({
        gamePresences: {
          ...state.gamePresences,
          [gameId]: (state.gamePresences[gameId] || []).filter(p => p.userId !== userId)
        }
      })),
      
      updateUserPresence: (gameId, userId, updates) => set((state) => {
        const currentPresence = state.gamePresences[gameId] || []
        return {
          gamePresences: {
            ...state.gamePresences,
            [gameId]: currentPresence.map(p =>
              p.userId === userId ? { ...p, ...updates } : p
            )
          }
        }
      }),

      // UI actions
      toggleChat: () => set((state) => ({ isChatOpen: !state.isChatOpen })),
      togglePlayerList: () => set((state) => ({ isPlayerListOpen: !state.isPlayerListOpen })),
      setSelectedCharacter: (characterId) => set({ selectedCharacterId: characterId }),

      // Typing actions
      setIsTyping: (typing) => {
        const state = get()
        if (state.typingTimeout) {
          clearTimeout(state.typingTimeout)
        }
        
        set({ isTyping: typing })
        
        if (typing) {
          const timeout = setTimeout(() => {
            set({ isTyping: false, typingTimeout: null })
          }, 3000)
          
          set({ typingTimeout: timeout })
        }
      },
      
      clearTypingTimeout: () => {
        const state = get()
        if (state.typingTimeout) {
          clearTimeout(state.typingTimeout)
          set({ typingTimeout: null })
        }
      },

      // Event handling
      handleGameEvent: (event) => {
        const state = get()
        
        switch (event.type) {
          case 'MESSAGE':
            get().addMessage(event.payload as ChatMessage)
            break
            
          case 'USER_JOINED':
            const { gameId: joinGameId, user: joinUser } = event.payload
            get().addUserToGame(joinGameId, joinUser)
            break
            
          case 'USER_LEFT':
            const { gameId: leftGameId, userId: leftUserId } = event.payload
            get().removeUserFromGame(leftGameId, leftUserId)
            break
            
          case 'TYPING_START':
            const { gameId: typingGameId, userId: typingUserId } = event.payload
            // Handle typing indicator in UI
            break
            
          case 'TYPING_STOP':
            const { gameId: stopTypingGameId, userId: stopTypingUserId } = event.payload
            // Handle typing indicator stop in UI
            break
            
          case 'GAME_UPDATED':
            const updatedGame = event.payload as Partial<Game>
            if (state.currentGame && updatedGame.id === state.currentGame.id) {
              get().setCurrentGame({ ...state.currentGame, ...updatedGame })
            }
            break
        }
      },

      // Reset all state
      reset: () => set(initialState),
    }),
    {
      name: 'game-store',
    }
  )
)