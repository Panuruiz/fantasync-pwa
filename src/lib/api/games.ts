import { createClient } from '@/lib/supabase/client'
import type { 
  Game, 
  GameSummary, 
  GameCreationData, 
  GamePlayer,
  GameSystem,
  GamePrivacy,
  GameStatus
} from '@/types/game'

export async function getUserGames(): Promise<GameSummary[]> {
  const supabase = createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('game_players')
    .select(`
      game:games (
        id,
        name,
        description,
        system,
        privacy,
        status,
        max_players,
        cover_image,
        theme_color,
        master_id,
        created_at,
        updated_at,
        master:users!games_master_id_fkey (
          id,
          username,
          avatar_url
        ),
        players:game_players (
          user:users (
            id,
            username,
            avatar_url
          )
        ),
        characters (
          id,
          name,
          avatar_url,
          player_id
        ),
        _count:game_players (count),
        messages (
          id,
          created_at,
          author:users!messages_author_id_fkey (
            username
          )
        )
      )
    `)
    .eq('user_id', user.id)
    .eq('is_active', true)
    .order('game.updated_at', { ascending: false })

  if (error) throw error

  return (data || []).map(gamePlayer => {
    const game = gamePlayer.game
    const lastMessage = game.messages?.[0]
    
    return {
      id: game.id,
      name: game.name,
      system: game.system as GameSystem,
      masterId: game.master_id,
      masterName: game.master.username,
      playerCount: game._count?.count || 0,
      maxPlayers: game.max_players,
      status: game.status as GameStatus,
      privacy: game.privacy as GamePrivacy,
      coverImage: game.cover_image,
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

export async function getGameById(gameId: string): Promise<Game | null> {
  const supabase = createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('Not authenticated')

  // First check if user has access to this game
  const { data: playerCheck, error: playerError } = await supabase
    .from('game_players')
    .select('id')
    .eq('game_id', gameId)
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single()

  if (playerError && playerError.code !== 'PGRST116') {
    throw playerError
  }

  // Check if user is the master
  const { data: masterCheck, error: masterError } = await supabase
    .from('games')
    .select('id')
    .eq('id', gameId)
    .eq('master_id', user.id)
    .single()

  if (masterError && masterError.code !== 'PGRST116') {
    throw masterError
  }

  // If user is not a player or master, deny access
  if (!playerCheck && !masterCheck) {
    throw new Error('Access denied')
  }

  const { data, error } = await supabase
    .from('games')
    .select(`
      *,
      master:users!games_master_id_fkey (
        id,
        username,
        email,
        avatar_url
      ),
      players:game_players (
        id,
        role,
        joined_at,
        last_seen_at,
        is_active,
        user:users (
          id,
          username,
          email,
          avatar_url
        )
      ),
      characters (
        id,
        name,
        avatar_url,
        data,
        player_id,
        is_active,
        created_at,
        updated_at,
        player:users (
          id,
          username,
          avatar_url
        )
      )
    `)
    .eq('id', gameId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }

  return {
    id: data.id,
    name: data.name,
    description: data.description,
    campaignName: data.campaign_name,
    system: data.system as GameSystem,
    coverImage: data.cover_image,
    themeColor: data.theme_color,
    privacy: data.privacy as GamePrivacy,
    maxPlayers: data.max_players,
    status: data.status as GameStatus,
    currentSession: data.current_session,
    nextSession: data.next_session ? new Date(data.next_session) : undefined,
    settings: data.settings,
    masterId: data.master_id,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
    master: data.master,
    players: data.players?.map((player: any) => ({
      id: player.id,
      gameId: gameId,
      userId: player.user.id,
      role: player.role,
      joinedAt: new Date(player.joined_at),
      lastSeenAt: new Date(player.last_seen_at),
      isActive: player.is_active,
      user: player.user,
    })),
    characters: data.characters,
  }
}

export async function createGame(gameData: GameCreationData): Promise<Game> {
  const supabase = createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('Not authenticated')

  // Create the game
  const { data: game, error: gameError } = await supabase
    .from('games')
    .insert({
      name: gameData.name,
      description: gameData.description,
      campaign_name: gameData.campaignName,
      system: gameData.system,
      cover_image: gameData.coverImage,
      theme_color: gameData.themeColor,
      privacy: gameData.privacy,
      max_players: gameData.maxPlayers,
      master_id: user.id,
      settings: {},
      status: 'PREPARING'
    })
    .select()
    .single()

  if (gameError) throw gameError

  // Add master as a player with MASTER role
  const { error: playerError } = await supabase
    .from('game_players')
    .insert({
      game_id: game.id,
      user_id: user.id,
      role: 'MASTER',
    })

  if (playerError) throw playerError

  // Return full game data
  const fullGame = await getGameById(game.id)
  if (!fullGame) throw new Error('Failed to retrieve created game')

  return fullGame
}

export async function updateGame(
  gameId: string, 
  updates: Partial<Pick<Game, 'name' | 'description' | 'campaignName' | 'coverImage' | 'themeColor' | 'maxPlayers' | 'nextSession' | 'status' | 'settings'>>
): Promise<Game> {
  const supabase = createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('Not authenticated')

  // Check if user is the master
  const { data: game, error: checkError } = await supabase
    .from('games')
    .select('master_id')
    .eq('id', gameId)
    .single()

  if (checkError) throw checkError
  if (game.master_id !== user.id) throw new Error('Only game master can update game')

  const updateData: any = {}
  if (updates.name) updateData.name = updates.name
  if (updates.description !== undefined) updateData.description = updates.description
  if (updates.campaignName !== undefined) updateData.campaign_name = updates.campaignName
  if (updates.coverImage !== undefined) updateData.cover_image = updates.coverImage
  if (updates.themeColor !== undefined) updateData.theme_color = updates.themeColor
  if (updates.maxPlayers) updateData.max_players = updates.maxPlayers
  if (updates.nextSession !== undefined) updateData.next_session = updates.nextSession?.toISOString()
  if (updates.status) updateData.status = updates.status
  if (updates.settings) updateData.settings = updates.settings

  const { error: updateError } = await supabase
    .from('games')
    .update(updateData)
    .eq('id', gameId)

  if (updateError) throw updateError

  // Return updated game
  const updatedGame = await getGameById(gameId)
  if (!updatedGame) throw new Error('Failed to retrieve updated game')

  return updatedGame
}

export async function deleteGame(gameId: string): Promise<void> {
  const supabase = createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('Not authenticated')

  // Check if user is the master
  const { data: game, error: checkError } = await supabase
    .from('games')
    .select('master_id')
    .eq('id', gameId)
    .single()

  if (checkError) throw checkError
  if (game.master_id !== user.id) throw new Error('Only game master can delete game')

  const { error } = await supabase
    .from('games')
    .delete()
    .eq('id', gameId)

  if (error) throw error
}

export async function joinGame(gameId: string): Promise<GamePlayer> {
  const supabase = createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('Not authenticated')

  // Check if game exists and has space
  const { data: game, error: gameError } = await supabase
    .from('games')
    .select('id, max_players, privacy, status, _count:game_players(count)')
    .eq('id', gameId)
    .single()

  if (gameError) throw gameError
  if (game.status !== 'PREPARING' && game.status !== 'ACTIVE') {
    throw new Error('Cannot join this game')
  }
  if (game._count.count >= game.max_players) {
    throw new Error('Game is full')
  }

  // Check if user is already in the game
  const { data: existingPlayer } = await supabase
    .from('game_players')
    .select('id')
    .eq('game_id', gameId)
    .eq('user_id', user.id)
    .single()

  if (existingPlayer) {
    throw new Error('Already in this game')
  }

  // Add player to game
  const { data: player, error: playerError } = await supabase
    .from('game_players')
    .insert({
      game_id: gameId,
      user_id: user.id,
      role: 'PLAYER',
    })
    .select(`
      *,
      user:users (
        id,
        username,
        email,
        avatar_url
      )
    `)
    .single()

  if (playerError) throw playerError

  return {
    id: player.id,
    gameId: player.game_id,
    userId: player.user_id,
    role: player.role,
    joinedAt: new Date(player.joined_at),
    lastSeenAt: new Date(player.last_seen_at),
    isActive: player.is_active,
    user: player.user,
  }
}

export async function leaveGame(gameId: string): Promise<void> {
  const supabase = createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('Not authenticated')

  // Check if user is the master (masters cannot leave, only delete the game)
  const { data: game, error: gameError } = await supabase
    .from('games')
    .select('master_id')
    .eq('id', gameId)
    .single()

  if (gameError) throw gameError
  if (game.master_id === user.id) {
    throw new Error('Game master cannot leave game. Delete the game instead.')
  }

  const { error } = await supabase
    .from('game_players')
    .delete()
    .eq('game_id', gameId)
    .eq('user_id', user.id)

  if (error) throw error
}

export async function kickPlayer(gameId: string, playerId: string): Promise<void> {
  const supabase = createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('Not authenticated')

  // Check if user is the master
  const { data: game, error: gameError } = await supabase
    .from('games')
    .select('master_id')
    .eq('id', gameId)
    .single()

  if (gameError) throw gameError
  if (game.master_id !== user.id) {
    throw new Error('Only game master can kick players')
  }

  // Cannot kick the master
  if (playerId === user.id) {
    throw new Error('Cannot kick yourself')
  }

  const { error } = await supabase
    .from('game_players')
    .delete()
    .eq('game_id', gameId)
    .eq('user_id', playerId)

  if (error) throw error
}