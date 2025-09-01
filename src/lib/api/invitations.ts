import { createClient } from '@/lib/supabase/client'
import type { 
  GameInvitation, 
  InvitationType, 
  InvitationStatus 
} from '@/types/game'

export async function createInvitation(
  gameId: string,
  type: InvitationType,
  invitedUserId?: string,
  message?: string,
  expiresIn?: number // hours
): Promise<GameInvitation> {
  const supabase = createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('Not authenticated')

  // Check if user can invite (must be master or existing player)
  const { data: game, error: gameError } = await supabase
    .from('games')
    .select(`
      id,
      master_id,
      max_players,
      status,
      privacy,
      _count:game_players(count)
    `)
    .eq('id', gameId)
    .single()

  if (gameError) throw gameError

  // Check if user is master
  const isMaster = game.master_id === user.id

  // Check if user is player (if not master)
  let isPlayer = false
  if (!isMaster) {
    const { data: playerCheck } = await supabase
      .from('game_players')
      .select('id')
      .eq('game_id', gameId)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    isPlayer = !!playerCheck
  }

  if (!isMaster && !isPlayer) {
    throw new Error('Only game participants can create invitations')
  }

  // Check game status
  if (game.status === 'COMPLETED' || game.status === 'ARCHIVED') {
    throw new Error('Cannot invite to completed or archived games')
  }

  // Check if game has space
  if (game._count.count >= game.max_players) {
    throw new Error('Game is full')
  }

  // For DIRECT invitations, check if user exists and isn't already in game
  if (type === 'DIRECT' && invitedUserId) {
    const { data: invitedUser, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('id', invitedUserId)
      .single()

    if (userError) throw new Error('Invited user not found')

    // Check if user is already in game
    const { data: existingPlayer } = await supabase
      .from('game_players')
      .select('id')
      .eq('game_id', gameId)
      .eq('user_id', invitedUserId)
      .single()

    if (existingPlayer) {
      throw new Error('User is already in this game')
    }

    // Check for existing pending invitation
    const { data: existingInvitation } = await supabase
      .from('game_invitations')
      .select('id')
      .eq('game_id', gameId)
      .eq('invited_user_id', invitedUserId)
      .eq('status', 'PENDING')
      .single()

    if (existingInvitation) {
      throw new Error('User already has a pending invitation')
    }
  }

  // Calculate expiration
  let expiresAt: Date | undefined
  if (expiresIn && expiresIn > 0) {
    expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + expiresIn)
  } else if (type === 'LINK') {
    // Default expiration for link invitations (7 days)
    expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)
  }

  const { data: invitation, error } = await supabase
    .from('game_invitations')
    .insert({
      game_id: gameId,
      type,
      invited_by_id: user.id,
      invited_user_id: invitedUserId,
      message,
      expires_at: expiresAt?.toISOString(),
    })
    .select(`
      *,
      game:games (
        id,
        name,
        system,
        master:users!games_master_id_fkey (
          id,
          username,
          avatar_url
        )
      ),
      invited_by:users!game_invitations_invited_by_id_fkey (
        id,
        username,
        avatar_url
      ),
      invited_user:users!game_invitations_invited_user_id_fkey (
        id,
        username,
        avatar_url
      )
    `)
    .single()

  if (error) throw error

  return {
    id: invitation.id,
    code: invitation.code,
    type: invitation.type as InvitationType,
    status: invitation.status as InvitationStatus,
    expiresAt: invitation.expires_at ? new Date(invitation.expires_at) : undefined,
    message: invitation.message,
    createdAt: new Date(invitation.created_at),
    usedAt: invitation.used_at ? new Date(invitation.used_at) : undefined,
    gameId: invitation.game_id,
    game: invitation.game,
    invitedById: invitation.invited_by_id,
    invitedBy: invitation.invited_by,
    invitedUserId: invitation.invited_user_id,
    invitedUser: invitation.invited_user,
  }
}

export async function getGameInvitations(gameId: string): Promise<GameInvitation[]> {
  const supabase = createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('Not authenticated')

  // Check if user is master
  const { data: game, error: gameError } = await supabase
    .from('games')
    .select('master_id')
    .eq('id', gameId)
    .single()

  if (gameError) throw gameError
  if (game.master_id !== user.id) {
    throw new Error('Only game master can view invitations')
  }

  const { data, error } = await supabase
    .from('game_invitations')
    .select(`
      *,
      invited_by:users!game_invitations_invited_by_id_fkey (
        id,
        username,
        avatar_url
      ),
      invited_user:users!game_invitations_invited_user_id_fkey (
        id,
        username,
        avatar_url
      )
    `)
    .eq('game_id', gameId)
    .order('created_at', { ascending: false })

  if (error) throw error

  return (data || []).map(invitation => ({
    id: invitation.id,
    code: invitation.code,
    type: invitation.type as InvitationType,
    status: invitation.status as InvitationStatus,
    expiresAt: invitation.expires_at ? new Date(invitation.expires_at) : undefined,
    message: invitation.message,
    createdAt: new Date(invitation.created_at),
    usedAt: invitation.used_at ? new Date(invitation.used_at) : undefined,
    gameId: invitation.game_id,
    invitedById: invitation.invited_by_id,
    invitedBy: invitation.invited_by,
    invitedUserId: invitation.invited_user_id,
    invitedUser: invitation.invited_user,
  }))
}

export async function getUserInvitations(): Promise<GameInvitation[]> {
  const supabase = createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('game_invitations')
    .select(`
      *,
      game:games (
        id,
        name,
        system,
        privacy,
        status,
        master:users!games_master_id_fkey (
          id,
          username,
          avatar_url
        ),
        _count:game_players(count)
      ),
      invited_by:users!game_invitations_invited_by_id_fkey (
        id,
        username,
        avatar_url
      )
    `)
    .eq('invited_user_id', user.id)
    .eq('status', 'PENDING')
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })

  if (error) throw error

  return (data || []).map(invitation => ({
    id: invitation.id,
    code: invitation.code,
    type: invitation.type as InvitationType,
    status: invitation.status as InvitationStatus,
    expiresAt: invitation.expires_at ? new Date(invitation.expires_at) : undefined,
    message: invitation.message,
    createdAt: new Date(invitation.created_at),
    usedAt: invitation.used_at ? new Date(invitation.used_at) : undefined,
    gameId: invitation.game_id,
    game: invitation.game,
    invitedById: invitation.invited_by_id,
    invitedBy: invitation.invited_by,
    invitedUserId: invitation.invited_user_id,
  }))
}

export async function getInvitationByCode(code: string): Promise<GameInvitation | null> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('game_invitations')
    .select(`
      *,
      game:games (
        id,
        name,
        system,
        privacy,
        status,
        max_players,
        master:users!games_master_id_fkey (
          id,
          username,
          avatar_url
        ),
        _count:game_players(count)
      ),
      invited_by:users!game_invitations_invited_by_id_fkey (
        id,
        username,
        avatar_url
      )
    `)
    .eq('code', code)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }

  // Check if invitation is expired
  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    // Mark as expired
    await supabase
      .from('game_invitations')
      .update({ status: 'EXPIRED' })
      .eq('id', data.id)
    
    return null
  }

  return {
    id: data.id,
    code: data.code,
    type: data.type as InvitationType,
    status: data.status as InvitationStatus,
    expiresAt: data.expires_at ? new Date(data.expires_at) : undefined,
    message: data.message,
    createdAt: new Date(data.created_at),
    usedAt: data.used_at ? new Date(data.used_at) : undefined,
    gameId: data.game_id,
    game: data.game,
    invitedById: data.invited_by_id,
    invitedBy: data.invited_by,
    invitedUserId: data.invited_user_id,
  }
}

export async function acceptInvitation(invitationId: string): Promise<void> {
  const supabase = createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('Not authenticated')

  // Get invitation details
  const { data: invitation, error: inviteError } = await supabase
    .from('game_invitations')
    .select(`
      *,
      game:games (
        id,
        max_players,
        status,
        _count:game_players(count)
      )
    `)
    .eq('id', invitationId)
    .single()

  if (inviteError) throw inviteError

  // Check if user is the invited one (for DIRECT invitations)
  if (invitation.type === 'DIRECT' && invitation.invited_user_id !== user.id) {
    throw new Error('This invitation is not for you')
  }

  // Check invitation status
  if (invitation.status !== 'PENDING') {
    throw new Error('Invitation is no longer valid')
  }

  // Check expiration
  if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
    await supabase
      .from('game_invitations')
      .update({ status: 'EXPIRED' })
      .eq('id', invitationId)
    throw new Error('Invitation has expired')
  }

  // Check game status
  if (invitation.game.status === 'COMPLETED' || invitation.game.status === 'ARCHIVED') {
    throw new Error('Cannot join completed or archived games')
  }

  // Check if game has space
  if (invitation.game._count.count >= invitation.game.max_players) {
    throw new Error('Game is full')
  }

  // Check if user is already in game
  const { data: existingPlayer } = await supabase
    .from('game_players')
    .select('id')
    .eq('game_id', invitation.game_id)
    .eq('user_id', user.id)
    .single()

  if (existingPlayer) {
    throw new Error('You are already in this game')
  }

  // Accept the invitation and join the game
  const { error: acceptError } = await supabase
    .from('game_invitations')
    .update({
      status: 'ACCEPTED',
      used_at: new Date().toISOString(),
      invited_user_id: invitation.type === 'LINK' ? user.id : invitation.invited_user_id,
    })
    .eq('id', invitationId)

  if (acceptError) throw acceptError

  // Add user to game
  const { error: joinError } = await supabase
    .from('game_players')
    .insert({
      game_id: invitation.game_id,
      user_id: user.id,
      role: 'PLAYER',
    })

  if (joinError) throw joinError
}

export async function declineInvitation(invitationId: string): Promise<void> {
  const supabase = createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('Not authenticated')

  // Check if user can decline this invitation
  const { data: invitation, error: inviteError } = await supabase
    .from('game_invitations')
    .select('type, invited_user_id, status')
    .eq('id', invitationId)
    .single()

  if (inviteError) throw inviteError

  // For DIRECT invitations, only the invited user can decline
  if (invitation.type === 'DIRECT' && invitation.invited_user_id !== user.id) {
    throw new Error('You cannot decline this invitation')
  }

  if (invitation.status !== 'PENDING') {
    throw new Error('Invitation is no longer valid')
  }

  const { error } = await supabase
    .from('game_invitations')
    .update({ status: 'DECLINED' })
    .eq('id', invitationId)

  if (error) throw error
}

export async function cancelInvitation(invitationId: string): Promise<void> {
  const supabase = createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('Not authenticated')

  // Check if user can cancel this invitation (must be creator or game master)
  const { data: invitation, error: inviteError } = await supabase
    .from('game_invitations')
    .select(`
      invited_by_id,
      status,
      game:games (
        master_id
      )
    `)
    .eq('id', invitationId)
    .single()

  if (inviteError) throw inviteError

  const canCancel = invitation.invited_by_id === user.id || invitation.game.master_id === user.id

  if (!canCancel) {
    throw new Error('You cannot cancel this invitation')
  }

  if (invitation.status !== 'PENDING') {
    throw new Error('Invitation is no longer valid')
  }

  const { error } = await supabase
    .from('game_invitations')
    .update({ status: 'CANCELLED' })
    .eq('id', invitationId)

  if (error) throw error
}

// Helper function to generate shareable invitation links
export function generateInvitationLink(code: string, baseUrl?: string): string {
  const base = baseUrl || (typeof window !== 'undefined' ? window.location.origin : '')
  return `${base}/games/join/${code}`
}