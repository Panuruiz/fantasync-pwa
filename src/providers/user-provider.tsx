'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUserStore } from '@/stores/user-store'

export function UserProvider({ children }: { children: React.ReactNode }) {
  const setUser = useUserStore((state) => state.setUser)
  const clearUser = useUserStore((state) => state.clearUser)
  const supabase = createClient()

  useEffect(() => {
    async function initializeUser() {
      try {
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
        
        if (authError || !authUser) {
          clearUser()
          return
        }

        // Fetch user profile data from our database
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single()

        if (userError) {
          console.error('Failed to fetch user profile:', userError)
          // Even if profile fetch fails, set basic auth data
          setUser({
            id: authUser.id,
            username: authUser.email?.split('@')[0] || 'User',
            email: authUser.email || '',
            avatarUrl: undefined,
            theme: 'system',
            fontSize: 'medium',
          })
          return
        }

        setUser({
          id: userData.id,
          username: userData.username,
          email: userData.email,
          avatarUrl: userData.avatar_url,
          theme: userData.theme || 'system',
          fontSize: userData.font_size || 'medium',
        })
      } catch (err) {
        console.error('Failed to initialize user:', err)
        clearUser()
      }
    }

    initializeUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT') {
          clearUser()
        } else if (event === 'SIGNED_IN' && session?.user) {
          // Refetch user data
          initializeUser()
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase, setUser, clearUser])

  return <>{children}</>
}