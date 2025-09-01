import { createClient } from '@/lib/supabase/client'
import type { 
  Note, 
  NoteSummary, 
  NoteSearchResult, 
  NoteSearchFilter,
  NoteAttachment
} from '@/types/notes'

const supabase = createClient()

// Notes CRUD operations
export async function createNote(
  gameId: string, 
  userId: string,
  note: Omit<Note, 'id' | 'gameId' | 'userId' | 'version' | 'createdAt' | 'updatedAt'>
): Promise<Note> {
  const { data, error } = await supabase
    .from('notes')
    .insert({
      game_id: gameId,
      user_id: userId,
      title: note.title,
      content: note.content,
      category: note.category,
      tags: note.tags,
      is_public: note.isPublic,
      shared_with: note.sharedWith,
      attachments: note.attachments,
      linked_messages: note.linkedMessages,
      version: 1,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating note:', error)
    throw new Error(`Failed to create note: ${error.message}`)
  }

  return transformNoteData(data)
}

export async function getNoteById(noteId: string): Promise<Note | null> {
  const { data, error } = await supabase
    .from('notes')
    .select()
    .eq('id', noteId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // Not found
    console.error('Error fetching note:', error)
    throw new Error(`Failed to fetch note: ${error.message}`)
  }

  return transformNoteData(data)
}

export async function getNotesForGame(gameId: string, userId: string): Promise<NoteSummary[]> {
  // Get user's own notes
  const { data: userNotes, error: userNotesError } = await supabase
    .from('notes')
    .select(`
      id,
      title,
      category,
      tags,
      is_public,
      updated_at,
      user:users!user_id(username)
    `)
    .eq('game_id', gameId)
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })

  if (userNotesError) {
    console.error('Error fetching user notes:', userNotesError)
    throw new Error(`Failed to fetch notes: ${userNotesError.message}`)
  }

  return userNotes.map(note => ({
    id: note.id,
    title: note.title,
    category: note.category,
    tags: note.tags || [],
    isPublic: note.is_public,
    isOwn: true,
    authorName: note.user?.username || 'Unknown',
    updatedAt: note.updated_at,
  }))
}

export async function getSharedNotesForGame(gameId: string, userId: string): Promise<NoteSummary[]> {
  // Get notes shared with this user
  const { data, error } = await supabase
    .from('notes')
    .select(`
      id,
      title,
      category,
      tags,
      is_public,
      shared_with,
      updated_at,
      user:users!user_id(username)
    `)
    .eq('game_id', gameId)
    .neq('user_id', userId)
    .contains('shared_with', [userId])
    .order('updated_at', { ascending: false })

  if (error) {
    console.error('Error fetching shared notes:', error)
    throw new Error(`Failed to fetch shared notes: ${error.message}`)
  }

  return data.map(note => ({
    id: note.id,
    title: note.title,
    category: note.category,
    tags: note.tags || [],
    isPublic: note.is_public,
    isOwn: false,
    authorName: note.user?.username || 'Unknown',
    updatedAt: note.updated_at,
  }))
}

export async function getPublicNotesForGame(gameId: string): Promise<NoteSummary[]> {
  // Get public notes (handouts) for the game
  const { data, error } = await supabase
    .from('notes')
    .select(`
      id,
      title,
      category,
      tags,
      is_public,
      updated_at,
      user:users!user_id(username)
    `)
    .eq('game_id', gameId)
    .eq('is_public', true)
    .order('updated_at', { ascending: false })

  if (error) {
    console.error('Error fetching public notes:', error)
    throw new Error(`Failed to fetch public notes: ${error.message}`)
  }

  return data.map(note => ({
    id: note.id,
    title: note.title,
    category: note.category,
    tags: note.tags || [],
    isPublic: note.is_public,
    isOwn: false,
    authorName: note.user?.username || 'Unknown',
    updatedAt: note.updated_at,
  }))
}

export async function updateNote(
  noteId: string, 
  updates: Partial<Omit<Note, 'id' | 'gameId' | 'userId' | 'createdAt'>>
): Promise<Note> {
  const updateData: any = {}
  
  if (updates.title !== undefined) updateData.title = updates.title
  if (updates.content !== undefined) updateData.content = updates.content
  if (updates.category !== undefined) updateData.category = updates.category
  if (updates.tags !== undefined) updateData.tags = updates.tags
  if (updates.isPublic !== undefined) updateData.is_public = updates.isPublic
  if (updates.sharedWith !== undefined) updateData.shared_with = updates.sharedWith
  if (updates.attachments !== undefined) updateData.attachments = updates.attachments
  if (updates.linkedMessages !== undefined) updateData.linked_messages = updates.linkedMessages
  if (updates.version !== undefined) updateData.version = updates.version

  const { data, error } = await supabase
    .from('notes')
    .update(updateData)
    .eq('id', noteId)
    .select()
    .single()

  if (error) {
    console.error('Error updating note:', error)
    throw new Error(`Failed to update note: ${error.message}`)
  }

  return transformNoteData(data)
}

export async function deleteNote(noteId: string): Promise<void> {
  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('id', noteId)

  if (error) {
    console.error('Error deleting note:', error)
    throw new Error(`Failed to delete note: ${error.message}`)
  }
}

// Search operations
export async function searchNotes(
  gameId: string, 
  userId: string,
  filter: NoteSearchFilter
): Promise<NoteSearchResult[]> {
  let query = supabase
    .from('notes')
    .select(`
      id,
      title,
      content,
      category,
      tags,
      is_public,
      shared_with,
      updated_at,
      user:users!user_id(username)
    `)
    .eq('game_id', gameId)

  // Apply filters
  if (filter.query) {
    // Search in title and content
    query = query.or(`title.ilike.%${filter.query}%,content.ilike.%${filter.query}%`)
  }

  if (filter.category) {
    query = query.eq('category', filter.category)
  }

  if (filter.tags && filter.tags.length > 0) {
    query = query.overlaps('tags', filter.tags)
  }

  if (filter.isPublic !== undefined) {
    query = query.eq('is_public', filter.isPublic)
  }

  if (filter.author) {
    // Join with users table to filter by author username
    query = query.eq('users.username', filter.author)
  }

  // Filter by visibility (user's own notes + shared with user + public)
  query = query.or(`user_id.eq.${userId},shared_with.cs.{${userId}},is_public.eq.true`)

  const { data, error } = await query.order('updated_at', { ascending: false })

  if (error) {
    console.error('Error searching notes:', error)
    throw new Error(`Failed to search notes: ${error.message}`)
  }

  // Transform to search results with scoring
  return data.map(note => {
    const matches = {
      title: filter.query ? note.title.toLowerCase().includes(filter.query.toLowerCase()) : false,
      content: filter.query ? note.content.toLowerCase().includes(filter.query.toLowerCase()) : false,
      tags: filter.tags ? filter.tags.some(tag => note.tags?.includes(tag)) : false,
    }

    // Simple scoring algorithm
    let score = 0
    if (matches.title) score += 0.5
    if (matches.content) score += 0.3
    if (matches.tags) score += 0.2

    return {
      note: {
        id: note.id,
        title: note.title,
        category: note.category,
        tags: note.tags || [],
        isPublic: note.is_public,
        isOwn: note.user_id === userId,
        authorName: note.user?.username || 'Unknown',
        updatedAt: note.updated_at,
      },
      matches,
      score: Math.max(score, 0.1), // Minimum score for any result
    }
  }).sort((a, b) => b.score - a.score) // Sort by relevance
}

// Sharing operations
export async function shareNote(
  noteId: string, 
  userIds: string[], 
  allowEdit: boolean = false
): Promise<void> {
  const { error } = await supabase
    .from('notes')
    .update({ 
      shared_with: userIds,
      // TODO: Implement edit permissions if needed
    })
    .eq('id', noteId)

  if (error) {
    console.error('Error sharing note:', error)
    throw new Error(`Failed to share note: ${error.message}`)
  }
}

export async function unshareNote(noteId: string, userId?: string): Promise<void> {
  if (userId) {
    // Remove specific user from shared_with array
    const { data: currentNote } = await supabase
      .from('notes')
      .select('shared_with')
      .eq('id', noteId)
      .single()

    if (currentNote) {
      const updatedSharedWith = (currentNote.shared_with || []).filter((id: string) => id !== userId)
      
      const { error } = await supabase
        .from('notes')
        .update({ shared_with: updatedSharedWith })
        .eq('id', noteId)

      if (error) {
        console.error('Error unsharing note:', error)
        throw new Error(`Failed to unshare note: ${error.message}`)
      }
    }
  } else {
    // Remove all sharing
    const { error } = await supabase
      .from('notes')
      .update({ shared_with: [] })
      .eq('id', noteId)

    if (error) {
      console.error('Error unsharing note:', error)
      throw new Error(`Failed to unshare note: ${error.message}`)
    }
  }
}

export async function makeNotePublic(noteId: string): Promise<void> {
  const { error } = await supabase
    .from('notes')
    .update({ is_public: true })
    .eq('id', noteId)

  if (error) {
    console.error('Error making note public:', error)
    throw new Error(`Failed to make note public: ${error.message}`)
  }
}

export async function makeNotePrivate(noteId: string): Promise<void> {
  const { error } = await supabase
    .from('notes')
    .update({ is_public: false })
    .eq('id', noteId)

  if (error) {
    console.error('Error making note private:', error)
    throw new Error(`Failed to make note private: ${error.message}`)
  }
}

// Tag operations
export async function getAvailableTags(gameId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('notes')
    .select('tags')
    .eq('game_id', gameId)

  if (error) {
    console.error('Error fetching tags:', error)
    return []
  }

  // Extract all unique tags
  const allTags = data.reduce((tags: string[], note) => {
    if (note.tags && Array.isArray(note.tags)) {
      return [...tags, ...note.tags]
    }
    return tags
  }, [])

  return Array.from(new Set(allTags)).sort()
}

// Utility operations
export async function duplicateNote(noteId: string, userId: string): Promise<Note> {
  // Get original note
  const original = await getNoteById(noteId)
  if (!original) {
    throw new Error('Note not found')
  }

  // Create duplicate
  const duplicate = await createNote(
    original.gameId,
    userId,
    {
      title: `${original.title} (Copy)`,
      content: original.content,
      category: original.category,
      tags: original.tags,
      isPublic: false, // Always make copies private
      sharedWith: [],
      attachments: original.attachments,
      linkedMessages: [],
    }
  )

  return duplicate
}

// Data transformation helpers
function transformNoteData(data: any): Note {
  return {
    id: data.id,
    gameId: data.game_id,
    userId: data.user_id,
    title: data.title,
    content: data.content,
    category: data.category,
    tags: data.tags || [],
    isPublic: data.is_public,
    sharedWith: data.shared_with || [],
    attachments: data.attachments || [],
    linkedMessages: data.linked_messages || [],
    version: data.version,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}