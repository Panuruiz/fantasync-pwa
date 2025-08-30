import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

type PresenceStatus = 'online' | 'away' | 'busy' | 'offline'

interface UserPresence {
  userId: string
  status: PresenceStatus
  lastSeen: Date
  currentGameId?: string
  statusMessage?: string
}

interface PresenceState {
  userPresence: UserPresence | null
  friendsPresence: Map<string, UserPresence>
  isConnected: boolean
  
  // Actions
  setUserPresence: (presence: UserPresence) => void
  updateUserStatus: (status: PresenceStatus, statusMessage?: string) => void
  setCurrentGame: (gameId: string | null) => void
  setFriendPresence: (userId: string, presence: UserPresence) => void
  removeFriendPresence: (userId: string) => void
  setConnectionStatus: (connected: boolean) => void
  
  // Computed getters
  getFriendPresence: (userId: string) => UserPresence | undefined
  getOnlineFriendsCount: () => number
  isUserOnline: () => boolean
}

export const usePresenceStore = create<PresenceState>()(
  devtools(
    (set, get) => ({
      userPresence: null,
      friendsPresence: new Map(),
      isConnected: false,

      setUserPresence: (presence) =>
        set({ userPresence: presence }),

      updateUserStatus: (status, statusMessage) =>
        set((state) => 
          state.userPresence
            ? {
                userPresence: {
                  ...state.userPresence,
                  status,
                  statusMessage,
                  lastSeen: new Date(),
                },
              }
            : state
        ),

      setCurrentGame: (gameId) =>
        set((state) => 
          state.userPresence
            ? {
                userPresence: {
                  ...state.userPresence,
                  currentGameId: gameId || undefined,
                },
              }
            : state
        ),

      setFriendPresence: (userId, presence) =>
        set((state) => {
          const newFriendsPresence = new Map(state.friendsPresence)
          newFriendsPresence.set(userId, presence)
          return { friendsPresence: newFriendsPresence }
        }),

      removeFriendPresence: (userId) =>
        set((state) => {
          const newFriendsPresence = new Map(state.friendsPresence)
          newFriendsPresence.delete(userId)
          return { friendsPresence: newFriendsPresence }
        }),

      setConnectionStatus: (connected) =>
        set({ isConnected: connected }),

      // Computed getters
      getFriendPresence: (userId) =>
        get().friendsPresence.get(userId),

      getOnlineFriendsCount: () => {
        const friends = Array.from(get().friendsPresence.values())
        return friends.filter(p => p.status === 'online').length
      },

      isUserOnline: () =>
        get().userPresence?.status === 'online' ?? false,
    }),
    {
      name: 'presence-store',
    }
  )
)