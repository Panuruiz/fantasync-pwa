'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { usePresenceStore } from '@/stores/presence-store'
import { useFriendsStore } from '@/stores/friends-store'

export function usePresence() {
  const { setUserPresence, setFriendPresence, setConnectionStatus } = usePresenceStore()
  const { friends } = useFriendsStore()

  useEffect(() => {
    const supabase = createClient()
    let presenceChannel: any = null

    async function initializePresence() {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) return

      // Initialize user presence
      const { data: userPresence } = await supabase
        .from('user_presence')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (userPresence) {
        setUserPresence({
          userId: userPresence.user_id,
          status: userPresence.status.toLowerCase() as any,
          lastSeen: new Date(userPresence.last_seen),
          currentGameId: userPresence.current_game_id,
          statusMessage: userPresence.status_message,
        })
      }

      // Create presence channel for real-time updates
      presenceChannel = supabase.channel('presence-channel', {
        config: {
          presence: {
            key: user.id,
          },
        },
      })

      // Track user's own presence
      presenceChannel.on('presence', { event: 'sync' }, () => {
        const newState = presenceChannel.presenceState()
        console.log('Presence sync:', newState)
      })

      presenceChannel.on('presence', { event: 'join' }, ({ key, newPresences }: any) => {
        console.log('User joined:', key, newPresences)
      })

      presenceChannel.on('presence', { event: 'leave' }, ({ key, leftPresences }: any) => {
        console.log('User left:', key, leftPresences)
      })

      // Subscribe to database changes for friend presence
      presenceChannel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_presence',
          filter: `user_id=in.(${friends.map(f => f.id).join(',')})`,
        },
        (payload: any) => {
          const presence = payload.new || payload.old
          if (presence) {
            setFriendPresence(presence.user_id, {
              userId: presence.user_id,
              status: presence.status.toLowerCase(),
              lastSeen: new Date(presence.last_seen),
              currentGameId: presence.current_game_id,
              statusMessage: presence.status_message,
            })
          }
        }
      )

      presenceChannel.subscribe(async (status: string) => {
        if (status === 'SUBSCRIBED') {
          setConnectionStatus(true)
          // Set user as online
          await supabase
            .from('user_presence')
            .upsert({
              user_id: user.id,
              status: 'ONLINE',
              last_seen: new Date().toISOString(),
            })
        } else {
          setConnectionStatus(false)
        }
      })
    }

    initializePresence()

    // Cleanup function
    return () => {
      if (presenceChannel) {
        supabase.removeChannel(presenceChannel)
      }
    }
  }, [friends, setUserPresence, setFriendPresence, setConnectionStatus])

  // Update user status when going offline
  useEffect(() => {
    const supabase = createClient()

    const handleBeforeUnload = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase
          .from('user_presence')
          .upsert({
            user_id: user.id,
            status: 'OFFLINE',
            last_seen: new Date().toISOString(),
          })
      }
    }

    const handleVisibilityChange = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const status = document.hidden ? 'AWAY' : 'ONLINE'
        await supabase
          .from('user_presence')
          .upsert({
            user_id: user.id,
            status: status,
            last_seen: new Date().toISOString(),
          })
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])
}