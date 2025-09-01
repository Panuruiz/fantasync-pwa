import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUserStore } from '@/stores/user-store'

export function useGamePresence(gameId: string | null) {
  const supabase = createClient()
  const { id: userId } = useUserStore()
  const [isUpdating, setIsUpdating] = useState(false)

  // Update user presence when entering/leaving game
  useEffect(() => {
    if (!gameId || !userId) return

    let isActive = true

    const updatePresence = async (currentGameId?: string) => {
      if (!isActive) return

      try {
        setIsUpdating(true)
        
        const { error } = await supabase
          .from('user_presence')
          .upsert({
            user_id: userId,
            status: 'online',
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
      // Use sendBeacon for reliable cleanup
      const presenceData = JSON.stringify({
        user_id: userId,
        status: 'offline',
        last_seen: new Date().toISOString(),
        current_game_id: null,
        updated_at: new Date().toISOString(),
      })

      navigator.sendBeacon('/api/presence/update', presenceData)
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
  const [onlineUsers, setOnlineUsers] = useState<Record<string, any>>({})

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
          .eq('status', 'online')

        if (!error && presenceData) {
          const presenceMap = presenceData.reduce((acc, presence) => {
            acc[presence.user_id] = {
              userId: presence.user_id,
              username: presence.user.username,
              avatarUrl: presence.user.avatar_url,
              status: presence.status,
              lastSeen: new Date(presence.last_seen),
              statusMessage: presence.status_message,
            }
            return acc
          }, {} as Record<string, any>)

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
        .eq('status', 'online')

      if (!error && presenceData) {
        const presenceMap = presenceData.reduce((acc, presence) => {
          acc[presence.user_id] = {
            userId: presence.user_id,
            username: presence.user.username,
            avatarUrl: presence.user.avatar_url,
            status: presence.status,
            lastSeen: new Date(presence.last_seen),
            statusMessage: presence.status_message,
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