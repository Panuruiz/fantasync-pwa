import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { Friend, FriendRequest } from '@/types/dashboard'

interface FriendsState {
  friends: Friend[]
  friendRequests: FriendRequest[]
  onlineFriends: Friend[]
  isLoading: boolean
  
  // Actions
  setFriends: (friends: Friend[]) => void
  setFriendRequests: (requests: FriendRequest[]) => void
  addFriend: (friend: Friend) => void
  removeFriend: (friendId: string) => void
  updateFriendStatus: (friendId: string, status: Friend['status'], statusMessage?: string) => void
  addFriendRequest: (request: FriendRequest) => void
  removeFriendRequest: (requestId: string) => void
  setLoading: (loading: boolean) => void
  
  // Computed getters
  getFriendById: (id: string) => Friend | undefined
  getOnlineFriendsCount: () => number
  getPendingRequestsCount: () => number
}

export const useFriendsStore = create<FriendsState>()(
  devtools(
    (set, get) => ({
      friends: [],
      friendRequests: [],
      onlineFriends: [],
      isLoading: false,

      setFriends: (friends) =>
        set({
          friends,
          onlineFriends: friends.filter(f => f.status === 'online'),
        }),

      setFriendRequests: (requests) =>
        set({ friendRequests: requests }),

      addFriend: (friend) =>
        set((state) => {
          const exists = state.friends.some(f => f.id === friend.id)
          if (exists) return state
          
          const newFriends = [...state.friends, friend]
          return {
            friends: newFriends,
            onlineFriends: newFriends.filter(f => f.status === 'online'),
          }
        }),

      removeFriend: (friendId) =>
        set((state) => {
          const newFriends = state.friends.filter(f => f.id !== friendId)
          return {
            friends: newFriends,
            onlineFriends: newFriends.filter(f => f.status === 'online'),
          }
        }),

      updateFriendStatus: (friendId, status, statusMessage) =>
        set((state) => {
          const newFriends = state.friends.map(friend =>
            friend.id === friendId
              ? { ...friend, status, statusMessage }
              : friend
          )
          return {
            friends: newFriends,
            onlineFriends: newFriends.filter(f => f.status === 'online'),
          }
        }),

      addFriendRequest: (request) =>
        set((state) => {
          const exists = state.friendRequests.some(r => r.id === request.id)
          if (exists) return state
          
          return {
            friendRequests: [...state.friendRequests, request],
          }
        }),

      removeFriendRequest: (requestId) =>
        set((state) => ({
          friendRequests: state.friendRequests.filter(r => r.id !== requestId),
        })),

      setLoading: (loading) =>
        set({ isLoading: loading }),

      // Computed getters
      getFriendById: (id) => 
        get().friends.find(f => f.id === id),

      getOnlineFriendsCount: () => 
        get().onlineFriends.length,

      getPendingRequestsCount: () => 
        get().friendRequests.filter(r => r.type === 'received').length,
    }),
    {
      name: 'friends-store',
    }
  )
)