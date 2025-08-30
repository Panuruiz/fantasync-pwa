'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

interface UserProfile {
  id: string
  username: string
  email: string
  avatarUrl?: string
  bio?: string
  theme: string
  fontSize: string
  createdAt: Date
  updatedAt: Date
}

export function useUser() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const supabase = createClient()

  useEffect(() => {
    async function getUser() {
      try {
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
        
        if (authError) {
          throw authError
        }

        if (!authUser) {
          setUser(null)
          setLoading(false)
          return
        }

        // Fetch user profile data from our database
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single()

        if (userError) {
          throw userError
        }

        setUser({
          id: userData.id,
          username: userData.username,
          email: userData.email,
          avatarUrl: userData.avatar_url,
          theme: userData.theme,
          fontSize: userData.font_size,
          createdAt: new Date(userData.created_at),
          updatedAt: new Date(userData.updated_at),
        })
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch user'))
      } finally {
        setLoading(false)
      }
    }

    getUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT') {
          setUser(null)
        } else if (event === 'SIGNED_IN' && session?.user) {
          // Refetch user data
          getUser()
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase])

  return { user, loading, error }
}