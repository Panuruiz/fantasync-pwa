import { createClient } from '@/lib/supabase/client'
import type { 
  Message, 
  ChatMessage, 
  MessageType,
  DiceRollMetadata,
  MessageAttachment
} from '@/types/game'

export async function getGameMessages(
  gameId: string, 
  limit: number = 50, 
  before?: Date
): Promise<ChatMessage[]> {
  const supabase = createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('Not authenticated')

  // Check if user has access to this game
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

  let query = supabase
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
    .eq('game_id', gameId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (before) {
    query = query.lt('created_at', before.toISOString())
  }

  const { data, error } = await query

  if (error) throw error

  return (data || []).map(message => ({
    id: message.id,
    gameId: message.game_id,
    authorId: message.author_id,
    content: message.content,
    type: message.type as MessageType,
    metadata: message.metadata,
    isEdited: message.is_edited,
    editedAt: message.edited_at ? new Date(message.edited_at) : undefined,
    createdAt: new Date(message.created_at),
    author: message.author,
    attachments: message.attachments || [],
  })).reverse() // Reverse to get chronological order
}

export async function sendMessage(
  gameId: string,
  content: string,
  type: MessageType = 'CHAT',
  metadata?: Record<string, any>
): Promise<ChatMessage> {
  const supabase = createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('Not authenticated')

  // Check if user has access to this game
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

  const { data: message, error } = await supabase
    .from('messages')
    .insert({
      game_id: gameId,
      author_id: user.id,
      content: content.trim(),
      type,
      metadata,
    })
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
    .single()

  if (error) throw error

  return {
    id: message.id,
    gameId: message.game_id,
    authorId: message.author_id,
    content: message.content,
    type: message.type as MessageType,
    metadata: message.metadata,
    isEdited: message.is_edited,
    editedAt: message.edited_at ? new Date(message.edited_at) : undefined,
    createdAt: new Date(message.created_at),
    author: message.author,
    attachments: message.attachments || [],
  }
}

export async function editMessage(
  messageId: string,
  newContent: string
): Promise<ChatMessage> {
  const supabase = createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('Not authenticated')

  // Check if user owns this message
  const { data: message, error: checkError } = await supabase
    .from('messages')
    .select('author_id, game_id, created_at')
    .eq('id', messageId)
    .single()

  if (checkError) throw checkError
  if (message.author_id !== user.id) {
    throw new Error('Can only edit your own messages')
  }

  // Check if message is too old to edit (e.g., 5 minutes)
  const messageAge = Date.now() - new Date(message.created_at).getTime()
  const fiveMinutes = 5 * 60 * 1000
  if (messageAge > fiveMinutes) {
    throw new Error('Message is too old to edit')
  }

  const { data: updatedMessage, error: updateError } = await supabase
    .from('messages')
    .update({
      content: newContent.trim(),
      is_edited: true,
      edited_at: new Date().toISOString(),
    })
    .eq('id', messageId)
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
    .single()

  if (updateError) throw updateError

  return {
    id: updatedMessage.id,
    gameId: updatedMessage.game_id,
    authorId: updatedMessage.author_id,
    content: updatedMessage.content,
    type: updatedMessage.type as MessageType,
    metadata: updatedMessage.metadata,
    isEdited: updatedMessage.is_edited,
    editedAt: updatedMessage.edited_at ? new Date(updatedMessage.edited_at) : undefined,
    createdAt: new Date(updatedMessage.created_at),
    author: updatedMessage.author,
    attachments: updatedMessage.attachments || [],
  }
}

export async function deleteMessage(messageId: string): Promise<void> {
  const supabase = createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('Not authenticated')

  // Check if user owns this message or is the game master
  const { data: message, error: checkError } = await supabase
    .from('messages')
    .select(`
      author_id,
      game_id,
      created_at,
      game:games (
        master_id
      )
    `)
    .eq('id', messageId)
    .single()

  if (checkError) throw checkError

  const canDelete = message.author_id === user.id || message.game.master_id === user.id

  if (!canDelete) {
    throw new Error('Cannot delete this message')
  }

  // Check if message is too old to delete (e.g., 5 minutes for own messages)
  if (message.author_id === user.id && message.game.master_id !== user.id) {
    const messageAge = Date.now() - new Date(message.created_at).getTime()
    const fiveMinutes = 5 * 60 * 1000
    if (messageAge > fiveMinutes) {
      throw new Error('Message is too old to delete')
    }
  }

  const { error } = await supabase
    .from('messages')
    .delete()
    .eq('id', messageId)

  if (error) throw error
}

// Dice rolling utilities
export function rollDice(formula: string): DiceRollMetadata {
  // Parse dice formula like "1d20+5", "2d6", "1d8-2", "3d4+1d6+3"
  const diceRegex = /(\d+)d(\d+)([+-]\d+)?/gi
  const results: number[] = []
  let total = 0
  let modifier = 0

  // Extract standalone modifiers
  const modifierRegex = /(?:^|[+-])(\d+)(?!d)/g
  let match
  while ((match = modifierRegex.exec(formula)) !== null) {
    const value = parseInt(match[1])
    const sign = formula[match.index] === '-' ? -1 : 1
    modifier += value * sign
  }

  // Roll dice
  let diceMatch
  while ((diceMatch = diceRegex.exec(formula)) !== null) {
    const numDice = parseInt(diceMatch[1])
    const numSides = parseInt(diceMatch[2])
    const diceModifier = diceMatch[3] ? parseInt(diceMatch[3]) : 0

    for (let i = 0; i < numDice; i++) {
      const roll = Math.floor(Math.random() * numSides) + 1
      results.push(roll)
      total += roll
    }

    total += diceModifier
    modifier += diceModifier
  }

  return {
    formula,
    results,
    total,
    modifier,
  }
}

export async function sendDiceRoll(
  gameId: string,
  formula: string,
  reason?: string
): Promise<ChatMessage> {
  const rollResult = rollDice(formula)
  
  const metadata: DiceRollMetadata = {
    ...rollResult,
    reason,
  }

  const content = reason 
    ? `Rolling ${formula} for ${reason}: **${rollResult.total}**`
    : `Rolling ${formula}: **${rollResult.total}**`

  return sendMessage(gameId, content, 'DICE_ROLL', metadata)
}

export async function sendSystemMessage(
  gameId: string,
  action: string,
  details?: Record<string, any>
): Promise<ChatMessage> {
  const supabase = createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('Not authenticated')

  let content = ''
  switch (action) {
    case 'user_joined':
      content = `${details?.username || 'A player'} joined the game`
      break
    case 'user_left':
      content = `${details?.username || 'A player'} left the game`
      break
    case 'game_started':
      content = 'Game session started!'
      break
    case 'game_paused':
      content = 'Game session paused'
      break
    case 'session_ended':
      content = 'Game session ended'
      break
    default:
      content = `System: ${action}`
  }

  return sendMessage(gameId, content, 'SYSTEM', {
    action,
    actor: user.id,
    details,
  })
}

// Message attachment handling
export async function addMessageAttachment(
  messageId: string,
  attachment: Omit<MessageAttachment, 'id' | 'messageId'>
): Promise<MessageAttachment> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('message_attachments')
    .insert({
      message_id: messageId,
      type: attachment.type,
      url: attachment.url,
      name: attachment.name,
      size: attachment.size,
      mime_type: attachment.mimeType,
    })
    .select()
    .single()

  if (error) throw error

  return {
    id: data.id,
    type: data.type,
    url: data.url,
    name: data.name,
    size: data.size,
    mimeType: data.mime_type,
    messageId: data.message_id,
  }
}