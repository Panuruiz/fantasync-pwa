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
    .eq('user_id', user.id)
    .eq('is_active', true)

  const activeGames = gameData?.filter(gp => gp.game && (gp.game.status === 'ACTIVE' || gp.game.status === 'PREPARING')).length || 0
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
      joined_at,
      game:games!inner (
        id,
        name,
        system,
        master_id,
        status,
        max_players,
        created_at,
        updated_at
      )
    `)
    .eq('user_id', user.id)
    .eq('is_active', true)

  if (error) {
    console.error('Error fetching active games:', error)
    throw error
  }

  // Get additional game data for each game
  const gameIds = (data || [])
    .filter(gp => gp.game && (gp.game.status === 'ACTIVE' || gp.game.status === 'PREPARING'))
    .map(gp => gp.game.id)

  if (gameIds.length === 0) {
    return []
  }

  // Fetch additional game details
  const { data: gamesWithDetails, error: detailsError } = await supabase
    .from('games')
    .select(`
      id,
      name,
      system,
      master_id,
      status,
      max_players,
      created_at,
      updated_at,
      master:users!games_master_id_fkey (username),
      players:game_players (user_id),
      characters (id, name, avatar_url, player_id),
      messages (id, created_at)
    `)
    .in('id', gameIds)
    .order('updated_at', { ascending: false })

  if (detailsError) {
    console.error('Error fetching game details:', detailsError)
    throw detailsError
  }

  return (gamesWithDetails || []).map((game: any) => {
    const lastMessage = game.messages?.[0]
    // Handle the case where relations might be arrays (Supabase PostgREST quirk)
    const masterName = Array.isArray(game.master) ? game.master[0]?.username : game.master?.username
    
    return {
      id: game.id,
      name: game.name,
      system: game.system,
      masterId: game.master_id,
      masterName: masterName || 'Unknown',
      playerCount: game.players?.length || 0,
      maxPlayers: game.max_players,
      lastActivity: lastMessage ? new Date(lastMessage.created_at) : new Date(game.updated_at),
      unreadMessages: 0, // TODO: Implement read tracking
      myCharacters: (game.characters || [])
        .filter((char: any) => char.player_id === user.id)
        .map((char: any) => ({
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

  // First get user's active game IDs
  const { data: gamePlayersData } = await supabase
    .from('game_players')
    .select('game_id')
    .eq('user_id', user.id)
    .eq('is_active', true)

  const gameIds = gamePlayersData?.map(gp => gp.game_id) || []

  const activities: ActivityItem[] = []

  if (gameIds.length > 0) {
    // Get recent messages from user's games
    const { data: messages } = await supabase
      .from('messages')
      .select(`
        id,
        content,
        created_at,
        game_id,
        author:users!messages_author_id_fkey (username),
        game:games (name)
      `)
      .in('game_id', gameIds)
      .neq('author_id', user.id) // Don't show own messages
      .order('created_at', { ascending: false })
      .limit(10)

    // Add message activities
    messages?.forEach((message: any) => {
      // Handle the case where relations might be arrays (Supabase PostgREST quirk)
      const gameName = Array.isArray(message.game) ? message.game[0]?.name : message.game?.name
      const authorName = Array.isArray(message.author) ? message.author[0]?.username : message.author?.username
      
      activities.push({
        id: `message-${message.id}`,
        type: 'message',
        title: `New message in "${gameName || 'Unknown Game'}"`,
        description: `${authorName || 'Unknown'}: ${message.content.substring(0, 50)}...`,
        gameId: message.game_id,
        timestamp: new Date(message.created_at),
        read: false,
      })
    })
  }

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

  // Add friend request activities
  friendRequests?.forEach((request: any) => {
    // Handle the case where relations might be arrays (Supabase PostgREST quirk)
    const userName = Array.isArray(request.user) ? request.user[0]?.username : request.user?.username
    
    activities.push({
      id: `friend-request-${request.id}`,
      type: 'friend_request',
      title: 'New friend request',
      description: `${userName || 'Unknown'} wants to be your friend`,
      timestamp: new Date(request.created_at),
      read: false,
    })
  })

  // Sort all activities by timestamp
  return activities
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, 15)
}