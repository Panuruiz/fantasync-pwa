import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUserStore } from '@/stores/user-store'

interface PresenceUser {
  userId: string
  username: string
  avatarUrl: string | null
  status: string
  lastSeen: Date
  statusMessage: string | null
}

export function useGamePresence(gameId: string | null) {
  const supabase = createClient()
  const { id: userId } = useUserStore()
  const [isUpdating, setIsUpdating] = useState(false)

  // Update user presence when entering/leaving game
  useEffect(() => {
    if (!userId) return // Only check userId, gameId can be null

    let isActive = true

    // Check for pending cleanup from previous session
    try {
      const cleanupData = localStorage.getItem('presence_cleanup_needed')
      if (cleanupData) {
        const { userId: cleanupUserId, timestamp } = JSON.parse(cleanupData)
        // Only cleanup if it's the same user and within last 5 minutes
        if (cleanupUserId === userId && Date.now() - timestamp < 5 * 60 * 1000) {
          // Clear the flag
          localStorage.removeItem('presence_cleanup_needed')
        }
      }
    } catch (err) {
      console.error('Failed to check cleanup flag:', err)
    }

    const updatePresence = async (currentGameId?: string) => {
      if (!isActive) return

      try {
        setIsUpdating(true)
        
        const { error } = await supabase
          .from('user_presence')
          .upsert({
            user_id: userId,
            status: 'ONLINE', // Use uppercase to match enum values
            last_seen: new Date().toISOString(),
            current_game_id: currentGameId || null,
            updated_at: new Date().toISOString(),
          })

        if (error) {
          console.error('Failed to update presence:', error)
        }
      } catch (err) {
        console.error('Error updating presence:', err)
      } finally {
        setIsUpdating(false)
      }
    }

    // Set presence when joining game
    updatePresence(gameId)

    // Update presence periodically while in game
    const presenceInterval = setInterval(() => {
      updatePresence(gameId)
    }, 30000) // Update every 30 seconds

    // Handle page visibility changes
    const handleVisibilityChange = () => {
      if (document.hidden) {
        updatePresence() // Clear current game
      } else {
        updatePresence(gameId) // Set current game
      }
    }

    // Handle beforeunload (user closing tab/navigating away)
    const handleBeforeUnload = () => {
      // Try to update presence directly (best effort, may not complete)
      // Note: We can't use async operations reliably in beforeunload
      // The presence will eventually be marked as stale based on last_seen
      try {
        // Use synchronous localStorage to mark for cleanup
        localStorage.setItem('presence_cleanup_needed', JSON.stringify({
          userId,
          gameId,
          timestamp: Date.now()
        }))
      } catch (err) {
        console.error('Failed to set cleanup flag:', err)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('beforeunload', handleBeforeUnload)

    // Cleanup function
    return () => {
      isActive = false
      clearInterval(presenceInterval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('beforeunload', handleBeforeUnload)
      
      // Clear presence when leaving game
      updatePresence()
    }
  }, [gameId, userId, supabase])

  return { isUpdating }
}

// Hook to listen to presence updates for other users
export function usePresenceListener(gameId: string | null) {
  const supabase = createClient()
  const [onlineUsers, setOnlineUsers] = useState<Record<string, PresenceUser>>({})

  useEffect(() => {
    if (!gameId) return

    // Subscribe to presence changes for this game
    const channel = supabase
      .channel(`presence:${gameId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_presence',
        filter: `current_game_id=eq.${gameId}`
      }, async (payload) => {
        console.log('Presence change:', payload)
        
        // Fetch updated presence data
        const { data: presenceData, error } = await supabase
          .from('user_presence')
          .select(`
            *,
            user:users (
              id,
              username,
              avatar_url
            )
          `)
          .eq('current_game_id', gameId)
          .eq('status', 'ONLINE')

        if (!error && presenceData) {
          const presenceMap = presenceData.reduce((acc, presence) => {
            // Handle case where user might be an array (Supabase quirk)
            const user = Array.isArray(presence.user) ? presence.user[0] : presence.user
            
            if (user) {
              acc[presence.user_id] = {
                userId: presence.user_id,
                username: user.username,
                avatarUrl: user.avatar_url,
                status: presence.status,
                lastSeen: new Date(presence.last_seen),
                statusMessage: presence.status_message,
              }
            }
            return acc
          }, {} as Record<string, PresenceUser>)

          setOnlineUsers(presenceMap)
        }
      })
      .subscribe()

    // Initial fetch
    const fetchInitialPresence = async () => {
      const { data: presenceData, error } = await supabase
        .from('user_presence')
        .select(`
          *,
          user:users (
            id,
            username,
            avatar_url
          )
        `)
        .eq('current_game_id', gameId)
        .eq('status', 'ONLINE')

      if (!error && presenceData) {
        const presenceMap = presenceData.reduce((acc, presence) => {
          // Handle case where user might be an array (Supabase quirk)
          const user = Array.isArray(presence.user) ? presence.user[0] : presence.user
          
          if (user) {
            acc[presence.user_id] = {
              userId: presence.user_id,
              username: user.username,
              avatarUrl: user.avatar_url,
              status: presence.status,
              lastSeen: new Date(presence.last_seen),
              statusMessage: presence.status_message,
            }
          }
          return acc
        }, {} as Record<string, any>)

        setOnlineUsers(presenceMap)
      }
    }

    fetchInitialPresence()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [gameId, supabase])

  return onlineUsers
}