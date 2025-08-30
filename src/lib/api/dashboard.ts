import { createClient } from '@/lib/supabase/client'
import type { UserStats, GameSummary, ActivityItem } from '@/types/dashboard'

export async function getUserStats(): Promise<UserStats> {
  const supabase = createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('Not authenticated')

  // Get basic game stats
  const { data: gameData } = await supabase
    .from('game_players')
    .select('game:games(*)')
    .eq('player_id', user.id)
    .eq('is_active', true)

  const activeGames = gameData?.filter(gp => gp.game.is_active).length || 0
  const totalGames = gameData?.length || 0

  // Get character count
  const { count: characterCount } = await supabase
    .from('characters')
    .select('*', { count: 'exact', head: true })
    .eq('player_id', user.id)
    .eq('is_active', true)

  // Get friends count
  const { count: friendsCount } = await supabase
    .from('friend_relationships')
    .select('*', { count: 'exact', head: true })
    .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
    .eq('status', 'ACCEPTED')

  // For now, return mock data for hours played and achievements
  // These would need to be calculated from game sessions or stored separately
  return {
    totalGames,
    activeGames,
    totalCharacters: characterCount || 0,
    hoursPlayed: 127, // TODO: Calculate from session data
    friendsCount: Math.floor((friendsCount || 0) / 2), // Divide by 2 because each friendship creates 2 rows
    achievementsUnlocked: 0, // TODO: Implement achievements system
  }
}

export async function getActiveGames(): Promise<GameSummary[]> {
  const supabase = createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('game_players')
    .select(`
      game:games (
        id,
        title,
        system,
        master_id,
        is_active,
        max_players,
        created_at,
        updated_at,
        master:users!games_master_id_fkey (username),
        players:game_players (count),
        characters (id, name, avatar_url),
        messages (id, created_at)
      )
    `)
    .eq('player_id', user.id)
    .eq('is_active', true)
    .eq('game.is_active', true)
    .order('game.updated_at', { ascending: false })

  if (error) throw error

  return (data || []).map(gamePlayer => {
    const game = gamePlayer.game
    const lastMessage = game.messages?.[0]
    
    return {
      id: game.id,
      title: game.title,
      system: game.system,
      masterId: game.master_id,
      masterName: game.master.username,
      playerCount: game.players?.length || 0,
      maxPlayers: game.max_players,
      lastActivity: lastMessage ? new Date(lastMessage.created_at) : new Date(game.updated_at),
      unreadMessages: 0, // TODO: Implement read tracking
      myCharacters: (game.characters || [])
        .filter(char => char.player_id === user.id)
        .map(char => ({
          id: char.id,
          name: char.name,
          avatarUrl: char.avatar_url,
        })),
    }
  })
}

export async function getActivityFeed(): Promise<ActivityItem[]> {
  const supabase = createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('Not authenticated')

  // Get recent messages from user's games
  const { data: messages } = await supabase
    .from('messages')
    .select(`
      id,
      content,
      created_at,
      game_id,
      sender:users!messages_sender_id_fkey (username),
      game:games (title)
    `)
    .in('game_id', 
      supabase
        .from('game_players')
        .select('game_id')
        .eq('player_id', user.id)
        .eq('is_active', true)
    )
    .neq('sender_id', user.id) // Don't show own messages
    .order('created_at', { ascending: false })
    .limit(10)

  // Get recent friend requests
  const { data: friendRequests } = await supabase
    .from('friend_relationships')
    .select(`
      id,
      created_at,
      user:users!friend_relationships_user_id_fkey (username)
    `)
    .eq('friend_id', user.id)
    .eq('status', 'PENDING')
    .order('created_at', { ascending: false })
    .limit(5)

  const activities: ActivityItem[] = []

  // Add message activities
  messages?.forEach(message => {
    activities.push({
      id: `message-${message.id}`,
      type: 'message',
      title: `New message in "${message.game.title}"`,
      description: `${message.sender.username}: ${message.content.substring(0, 50)}...`,
      gameId: message.game_id,
      timestamp: new Date(message.created_at),
      read: false,
    })
  })

  // Add friend request activities
  friendRequests?.forEach(request => {
    activities.push({
      id: `friend-request-${request.id}`,
      type: 'friend_request',
      title: 'New friend request',
      description: `${request.user.username} wants to be your friend`,
      timestamp: new Date(request.created_at),
      read: false,
    })
  })

  // Sort all activities by timestamp
  return activities
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, 15)
}