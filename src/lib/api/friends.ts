import { createClient } from '@/lib/supabase/client'
import type { Friend, FriendRequest } from '@/types/dashboard'

export async function getFriends(): Promise<Friend[]> {
  const supabase = createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('friend_relationships')
    .select(`
      id,
      user_id,
      friend_id,
      status,
      user:users!friend_relationships_user_id_fkey (
        id, username, avatar_url, 
        presence:user_presence (status, status_message, current_game_id, last_seen)
      ),
      friend:users!friend_relationships_friend_id_fkey (
        id, username, avatar_url,
        presence:user_presence (status, status_message, current_game_id, last_seen)
      )
    `)
    .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
    .eq('status', 'ACCEPTED')

  if (error) throw error

  return (data || []).map(relationship => {
    const isUserTheRequester = relationship.user_id === user.id
    const friendData = isUserTheRequester ? relationship.friend : relationship.user
    const presence = friendData.presence

    return {
      id: friendData.id,
      username: friendData.username,
      avatarUrl: friendData.avatar_url,
      status: presence?.status?.toLowerCase() || 'offline',
      statusMessage: presence?.status_message,
      currentGameId: presence?.current_game_id,
    } as Friend
  })
}

export async function getFriendRequests(): Promise<FriendRequest[]> {
  const supabase = createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('Not authenticated')

  // Get received requests
  const { data: receivedRequests, error: receivedError } = await supabase
    .from('friend_relationships')
    .select(`
      id,
      user_id,
      created_at,
      user:users!friend_relationships_user_id_fkey (username, avatar_url)
    `)
    .eq('friend_id', user.id)
    .eq('status', 'PENDING')

  if (receivedError) throw receivedError

  // Get sent requests
  const { data: sentRequests, error: sentError } = await supabase
    .from('friend_relationships')
    .select(`
      id,
      friend_id,
      created_at,
      friend:users!friend_relationships_friend_id_fkey (username, avatar_url)
    `)
    .eq('user_id', user.id)
    .eq('status', 'PENDING')

  if (sentError) throw sentError

  const requests: FriendRequest[] = []

  // Add received requests
  receivedRequests?.forEach(request => {
    requests.push({
      id: request.id,
      userId: request.user_id,
      username: request.user.username,
      avatarUrl: request.user.avatar_url,
      createdAt: new Date(request.created_at),
      type: 'received',
    })
  })

  // Add sent requests
  sentRequests?.forEach(request => {
    requests.push({
      id: request.id,
      userId: request.friend_id,
      username: request.friend.username,
      avatarUrl: request.friend.avatar_url,
      createdAt: new Date(request.created_at),
      type: 'sent',
    })
  })

  return requests.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
}

export async function sendFriendRequest(username: string): Promise<void> {
  const supabase = createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('Not authenticated')

  // First, find the user by username
  const { data: targetUser, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('username', username)
    .single()

  if (userError) throw new Error('User not found')
  if (targetUser.id === user.id) throw new Error('Cannot send friend request to yourself')

  // Check if relationship already exists
  const { data: existingRelationship, error: checkError } = await supabase
    .from('friend_relationships')
    .select('*')
    .or(`and(user_id.eq.${user.id},friend_id.eq.${targetUser.id}),and(user_id.eq.${targetUser.id},friend_id.eq.${user.id})`)
    .single()

  if (checkError && checkError.code !== 'PGRST116') throw checkError
  if (existingRelationship) throw new Error('Friend relationship already exists')

  // Create friend request
  const { error: insertError } = await supabase
    .from('friend_relationships')
    .insert({
      user_id: user.id,
      friend_id: targetUser.id,
      status: 'PENDING',
    })

  if (insertError) throw insertError
}

export async function acceptFriendRequest(requestId: string): Promise<void> {
  const supabase = createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('friend_relationships')
    .update({ 
      status: 'ACCEPTED',
      accepted_at: new Date().toISOString(),
    })
    .eq('id', requestId)
    .eq('friend_id', user.id) // Only the recipient can accept

  if (error) throw error
}

export async function rejectFriendRequest(requestId: string): Promise<void> {
  const supabase = createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('friend_relationships')
    .delete()
    .eq('id', requestId)
    .eq('friend_id', user.id) // Only the recipient can reject

  if (error) throw error
}

export async function removeFriend(friendId: string): Promise<void> {
  const supabase = createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('friend_relationships')
    .delete()
    .or(`and(user_id.eq.${user.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${user.id})`)

  if (error) throw error
}

export async function blockUser(userId: string): Promise<void> {
  const supabase = createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('Not authenticated')

  // First, remove any existing friendship
  await removeFriend(userId)

  // Then create a blocked relationship
  const { error } = await supabase
    .from('friend_relationships')
    .insert({
      user_id: user.id,
      friend_id: userId,
      status: 'BLOCKED',
    })

  if (error) throw error
}