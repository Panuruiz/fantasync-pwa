import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

interface UserState {
  id: string | null
  username: string | null
  email: string | null
  avatarUrl: string | null
  theme: 'system' | 'light' | 'dark'
  fontSize: 'small' | 'medium' | 'large'
  isAuthenticated: boolean
  lastSeen: Date | null
  
  // Actions
  setUser: (user: {
    id: string
    username: string
    email: string
    avatarUrl?: string
    theme: string
    fontSize: string
  }) => void
  clearUser: () => void
  updateTheme: (theme: 'system' | 'light' | 'dark') => void
  updateFontSize: (fontSize: 'small' | 'medium' | 'large') => void
  updateAvatar: (avatarUrl: string) => void
}

export const useUserStore = create<UserState>()(
  devtools(
    persist(
      (set) => ({
        id: null,
        username: null,
        email: null,
        avatarUrl: null,
        theme: 'system',
        fontSize: 'medium',
        isAuthenticated: false,
        lastSeen: null,

        setUser: (user) =>
          set({
            id: user.id,
            username: user.username,
            email: user.email,
            avatarUrl: user.avatarUrl || null,
            theme: user.theme as any,
            fontSize: user.fontSize as any,
            isAuthenticated: true,
            lastSeen: new Date(),
          }),

        clearUser: () =>
          set({
            id: null,
            username: null,
            email: null,
            avatarUrl: null,
            theme: 'system',
            fontSize: 'medium',
            isAuthenticated: false,
            lastSeen: null,
          }),

        updateTheme: (theme) =>
          set((state) => ({
            ...state,
            theme,
          })),

        updateFontSize: (fontSize) =>
          set((state) => ({
            ...state,
            fontSize,
          })),

        updateAvatar: (avatarUrl) =>
          set((state) => ({
            ...state,
            avatarUrl,
          })),
      }),
      {
        name: 'user-store',
        partialize: (state) => ({
          theme: state.theme,
          fontSize: state.fontSize,
        }),
      }
    ),
    {
      name: 'user-store',
    }
  )
)