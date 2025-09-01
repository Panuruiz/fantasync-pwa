import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useGameStore } from '@/stores/game-store'
import { useUserStore } from '@/stores/user-store'
import type { RealtimeChannel } from '@supabase/supabase-js'
import type { ChatMessage } from '@/types/game'

export function useGameChannel(gameId: string | null) {
  const supabase = createClient()
  const channelRef = useRef<RealtimeChannel | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  
  const { 
    addMessage, 
    setGameChannel,
    addUserToGame,
    removeUserFromGame,
    handleGameEvent
  } = useGameStore()
  
  const { id: userId, username } = useUserStore()

  useEffect(() => {
    if (!gameId || !userId) return

    // Create unique channel for this game
    const channel = supabase.channel(`game:${gameId}`, {
      config: {
        broadcast: { self: true }, // Receive our own messages
        presence: { key: userId }, // Use userId as presence key
      }
    })

    channelRef.current = channel

    // Subscribe to database changes (new messages)
    channel
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `game_id=eq.${gameId}`
      }, async (payload) => {
        console.log('New message received:', payload.new)
        
        // Fetch the complete message with author info
        const { data: messageData, error } = await supabase
          .from('messages')
          .select(`
            *,
            author:users!messages_author_id_fkey (
              id,
              username,
              avatar_url
            ),
            attachments:message_attachments (
              id,
              type,
              url,
              name,
              size,
              mime_type
            )
          `)
          .eq('id', payload.new.id)
          .single()

        if (!error && messageData) {
          const message: ChatMessage = {
            id: messageData.id,
            gameId: messageData.game_id,
            authorId: messageData.author_id,
            content: messageData.content,
            type: messageData.type,
            metadata: messageData.metadata,
            isEdited: messageData.is_edited,
            editedAt: messageData.edited_at ? new Date(messageData.edited_at) : undefined,
            createdAt: new Date(messageData.created_at),
            author: messageData.author,
            attachments: messageData.attachments || [],
          }

          addMessage(message)
        }
      })

    // Subscribe to message updates (edits)
    channel
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter: `game_id=eq.${gameId}`
      }, async (payload) => {
        console.log('Message updated:', payload.new)
        
        // Fetch updated message
        const { data: messageData, error } = await supabase
          .from('messages')
          .select(`
            *,
            author:users!messages_author_id_fkey (
              id,
              username,
              avatar_url
            ),
            attachments:message_attachments (
              id,
              type,
              url,
              name,
              size,
              mime_type
            )
          `)
          .eq('id', payload.new.id)
          .single()

        if (!error && messageData) {
          const message: ChatMessage = {
            id: messageData.id,
            gameId: messageData.game_id,
            authorId: messageData.author_id,
            content: messageData.content,
            type: messageData.type,
            metadata: messageData.metadata,
            isEdited: messageData.is_edited,
            editedAt: messageData.edited_at ? new Date(messageData.edited_at) : undefined,
            createdAt: new Date(messageData.created_at),
            author: messageData.author,
            attachments: messageData.attachments || [],
          }

          // Update existing message
          handleGameEvent({
            type: 'MESSAGE',
            payload: message,
            timestamp: new Date(),
          })
        }
      })

    // Subscribe to message deletes
    channel
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'messages',
        filter: `game_id=eq.${gameId}`
      }, (payload) => {
        console.log('Message deleted:', payload.old)
        // Remove message from store
        useGameStore.getState().deleteMessage(payload.old.id)
      })

    // Subscribe to game player changes (joins/leaves)
    channel
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'game_players',
        filter: `game_id=eq.${gameId}`
      }, async (payload) => {
        console.log('Player joined:', payload.new)
        
        // Fetch player info
        const { data: playerData, error } = await supabase
          .from('game_players')
          .select(`
            *,
            user:users (
              id,
              username,
              avatar_url
            )
          `)
          .eq('id', payload.new.id)
          .single()

        if (!error && playerData) {
          // Add system message
          await supabase
            .from('messages')
            .insert({
              game_id: gameId,
              author_id: playerData.user_id,
              content: `${playerData.user.username} joined the game`,
              type: 'SYSTEM',
              metadata: {
                action: 'user_joined',
                actor: playerData.user_id,
                details: { username: playerData.user.username }
              }
            })

          // Update presence
          addUserToGame(gameId, {
            userId: playerData.user.id,
            username: playerData.user.username,
            avatarUrl: playerData.user.avatar_url,
            status: 'online',
            lastSeen: new Date(),
          })
        }
      })

    channel
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'game_players',
        filter: `game_id=eq.${gameId}`
      }, async (payload) => {
        console.log('Player left:', payload.old)
        
        // Get user info for system message
        const { data: userData, error } = await supabase
          .from('users')
          .select('id, username')
          .eq('id', payload.old.user_id)
          .single()

        if (!error && userData) {
          // Add system message
          await supabase
            .from('messages')
            .insert({
              game_id: gameId,
              author_id: payload.old.user_id,
              content: `${userData.username} left the game`,
              type: 'SYSTEM',
              metadata: {
                action: 'user_left',
                actor: payload.old.user_id,
                details: { username: userData.username }
              }
            })

          // Update presence
          removeUserFromGame(gameId, payload.old.user_id)
        }
      })

    // Handle presence (users joining/leaving the channel)
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        console.log('Presence sync:', state)
        
        // Update online users list
        const onlineUsers = Object.keys(state).map(userId => ({
          userId,
          username: state[userId][0]?.username || 'Unknown',
          avatarUrl: state[userId][0]?.avatar_url,
          status: 'online' as const,
          lastSeen: new Date(),
        }))

        // Update game store with online users
        useGameStore.getState().setGamePresence(gameId, onlineUsers)
      })

    channel
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined channel:', key, newPresences)
        
        newPresences.forEach((presence: any) => {
          addUserToGame(gameId, {
            userId: key,
            username: presence.username || 'Unknown',
            avatarUrl: presence.avatar_url,
            status: 'online',
            lastSeen: new Date(),
          })
        })
      })

    channel
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left channel:', key, leftPresences)
        removeUserFromGame(gameId, key)
      })

    // Subscribe to broadcast events (typing indicators, etc.)
    channel
      .on('broadcast', { event: 'typing_start' }, (payload) => {
        console.log('User started typing:', payload)
        handleGameEvent({
          type: 'TYPING_START',
          payload,
          timestamp: new Date(),
        })
      })

    channel
      .on('broadcast', { event: 'typing_stop' }, (payload) => {
        console.log('User stopped typing:', payload)
        handleGameEvent({
          type: 'TYPING_STOP',
          payload,
          timestamp: new Date(),
        })
      })

    // Subscribe to the channel
    channel.subscribe(async (status) => {
      console.log(`Game channel status: ${status}`)
      
      if (status === 'SUBSCRIBED') {
        setIsConnected(true)
        
        // Track presence with user info
        const presencePayload = {
          username,
          avatar_url: useUserStore.getState().avatarUrl,
          joined_at: new Date().toISOString(),
        }

        await channel.track(presencePayload)
        
        // Update game channel in store
        setGameChannel({
          gameId,
          messages: [],
          onlineUsers: [],
          typingUsers: [],
          isConnected: true,
        })
      } else {
        setIsConnected(false)
        setGameChannel(null)
      }
    })

    // Cleanup function
    return () => {
      console.log('Cleaning up game channel')
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
      setIsConnected(false)
      setGameChannel(null)
    }
  }, [gameId, userId, username, supabase, addMessage, setGameChannel, addUserToGame, removeUserFromGame, handleGameEvent])

  // Broadcast typing events
  const broadcastTypingStart = () => {
    if (channelRef.current && userId) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'typing_start',
        payload: {
          userId,
          username,
          gameId,
        }
      })
    }
  }

  const broadcastTypingStop = () => {
    if (channelRef.current && userId) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'typing_stop',
        payload: {
          userId,
          username,
          gameId,
        }
      })
    }
  }

  return {
    isConnected,
    broadcastTypingStart,
    broadcastTypingStop,
    channel: channelRef.current,
  }
}