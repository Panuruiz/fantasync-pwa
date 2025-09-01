'use client'

import { useEffect, useCallback } from 'react'
import { useNotesStore } from '@/stores/notes-store'
import {
  getNotesForGame,
  getSharedNotesForGame,
  getPublicNotesForGame,
  getNoteById,
  createNote,
  updateNote,
  deleteNote,
  searchNotes,
  shareNote,
  unshareNote,
  makeNotePublic,
  makeNotePrivate,
  duplicateNote,
  getAvailableTags,
} from '@/lib/api/notes'
import type { Note, NoteSummary, NoteSearchFilter, NoteSearchResult } from '@/types/notes'
import { toast } from '@/lib/utils/toast'

interface UseNotesReturn {
  // State
  notes: NoteSummary[]
  sharedNotes: NoteSummary[]
  publicNotes: NoteSummary[]
  currentNote: Note | null
  notesLoading: boolean
  notesError: string | null
  isCreating: boolean
  isEditing: boolean
  availableTags: string[]
  searchResults: NoteSearchResult[]
  isSearching: boolean
  
  // Note operations
  loadNotes: (gameId: string, userId: string) => Promise<void>
  loadNote: (noteId: string) => Promise<void>
  createNewNote: (gameId: string, userId: string, note: Omit<Note, 'id' | 'gameId' | 'userId' | 'version' | 'createdAt' | 'updatedAt'>) => Promise<Note | null>
  updateExistingNote: (noteId: string, updates: Partial<Note>) => Promise<void>
  deleteExistingNote: (noteId: string) => Promise<void>
  duplicateExistingNote: (noteId: string, userId: string) => Promise<void>
  
  // Search operations
  searchNotesByFilter: (gameId: string, userId: string, filter: NoteSearchFilter) => Promise<void>
  clearSearchResults: () => void
  
  // Sharing operations
  shareNoteWithUsers: (noteId: string, userIds: string[], allowEdit?: boolean) => Promise<void>
  unshareNoteFromUser: (noteId: string, userId?: string) => Promise<void>
  makeNotePublicHandout: (noteId: string) => Promise<void>
  makeNotePrivateOnly: (noteId: string) => Promise<void>
  
  // Tag operations
  loadAvailableTags: (gameId: string) => Promise<void>
  
  // Form operations
  startCreatingNote: (category?: string) => void
  startEditingNote: (note: Note) => void
  cancelNoteForm: () => void
  saveCurrentNote: (gameId: string, userId: string) => Promise<void>
  
  // Utility
  refresh: (gameId?: string, userId?: string) => Promise<void>
}

export function useNotes(gameId?: string, userId?: string): UseNotesReturn {
  const {
    notes,
    notesLoading,
    notesError,
    sharedNotes,
    publicNotes,
    currentNote,
    isCreating,
    isEditing,
    availableTags,
    searchResults,
    isSearching,
    draftNote,
    editorContent,
    
    setNotes,
    setNotesLoading,
    setNotesError,
    setSharedNotes,
    setPublicNotes,
    setCurrentNote,
    addNote,
    updateNoteSummary,
    removeNote,
    setIsSearching,
    setSearchResults,
    setAvailableTags,
    
    startCreating,
    startEditing,
    cancelForm,
    
    clearFormErrors,
    setFormErrors,
  } = useNotesStore()

  // Load notes for a game
  const loadNotes = useCallback(async (gameId: string, userId: string) => {
    try {
      setNotesLoading(true)
      setNotesError(null)
      
      const [userNotes, shared, publicHandouts] = await Promise.all([
        getNotesForGame(gameId, userId),
        getSharedNotesForGame(gameId, userId),
        getPublicNotesForGame(gameId),
      ])
      
      setNotes(userNotes)
      setSharedNotes(shared)
      setPublicNotes(publicHandouts)
      
      toast.success(`Loaded ${userNotes.length} notes, ${shared.length} shared, ${publicHandouts.length} handouts`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load notes'
      setNotesError(message)
      toast.error(message)
    } finally {
      setNotesLoading(false)
    }
  }, [setNotes, setNotesLoading, setNotesError, setSharedNotes, setPublicNotes])

  // Load specific note
  const loadNote = useCallback(async (noteId: string) => {
    try {
      const note = await getNoteById(noteId)
      setCurrentNote(note)
      
      if (note) {
        toast.success(`Loaded note: ${note.title}`)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load note'
      toast.error(message)
    }
  }, [setCurrentNote])

  // Create new note
  const createNewNote = useCallback(async (
    gameId: string, 
    userId: string, 
    noteData: Omit<Note, 'id' | 'gameId' | 'userId' | 'version' | 'createdAt' | 'updatedAt'>
  ): Promise<Note | null> => {
    try {
      const newNote = await createNote(gameId, userId, noteData)
      
      // Add to notes list
      const summary: NoteSummary = {
        id: newNote.id,
        title: newNote.title,
        category: newNote.category,
        tags: newNote.tags,
        isPublic: newNote.isPublic,
        isOwn: true,
        authorName: 'You', // TODO: Get from user store
        updatedAt: newNote.updatedAt,
      }
      addNote(summary)
      
      // Set as current note
      setCurrentNote(newNote)
      
      toast.success(`Created note: ${newNote.title}`)
      return newNote
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create note'
      toast.error(message)
      return null
    }
  }, [addNote, setCurrentNote])

  // Update note
  const updateExistingNote = useCallback(async (noteId: string, updates: Partial<Note>) => {
    try {
      const updatedNote = await updateNote(noteId, updates)
      
      // Update current note if it's the same
      if (currentNote?.id === noteId) {
        setCurrentNote(updatedNote)
      }
      
      // Update note summary in list
      updateNoteSummary(noteId, {
        title: updatedNote.title,
        category: updatedNote.category,
        tags: updatedNote.tags,
        isPublic: updatedNote.isPublic,
        updatedAt: updatedNote.updatedAt,
      })
      
      toast.success('Note updated')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update note'
      toast.error(message)
    }
  }, [currentNote, setCurrentNote, updateNoteSummary])

  // Delete note
  const deleteExistingNote = useCallback(async (noteId: string) => {
    try {
      await deleteNote(noteId)
      
      // Remove from store
      removeNote(noteId)
      
      toast.success('Note deleted')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete note'
      toast.error(message)
    }
  }, [removeNote])

  // Duplicate note
  const duplicateExistingNote = useCallback(async (noteId: string, userId: string) => {
    try {
      const duplicatedNote = await duplicateNote(noteId, userId)
      
      // Add to notes list
      const summary: NoteSummary = {
        id: duplicatedNote.id,
        title: duplicatedNote.title,
        category: duplicatedNote.category,
        tags: duplicatedNote.tags,
        isPublic: duplicatedNote.isPublic,
        isOwn: true,
        authorName: 'You',
        updatedAt: duplicatedNote.updatedAt,
      }
      addNote(summary)
      
      toast.success(`Duplicated note: ${duplicatedNote.title}`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to duplicate note'
      toast.error(message)
    }
  }, [addNote])

  // Search notes
  const searchNotesByFilter = useCallback(async (gameId: string, userId: string, filter: NoteSearchFilter) => {
    try {
      setIsSearching(true)
      
      const results = await searchNotes(gameId, userId, filter)
      setSearchResults(results)
      
      toast.success(`Found ${results.length} matching notes`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to search notes'
      toast.error(message)
    } finally {
      setIsSearching(false)
    }
  }, [setIsSearching, setSearchResults])

  // Clear search results
  const clearSearchResults = useCallback(() => {
    setSearchResults([])
  }, [setSearchResults])

  // Share note
  const shareNoteWithUsers = useCallback(async (noteId: string, userIds: string[], allowEdit: boolean = false) => {
    try {
      await shareNote(noteId, userIds, allowEdit)
      
      // Update current note if it's the same
      if (currentNote?.id === noteId) {
        setCurrentNote({
          ...currentNote,
          sharedWith: userIds,
        })
      }
      
      toast.success(`Note shared with ${userIds.length} user${userIds.length !== 1 ? 's' : ''}`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to share note'
      toast.error(message)
    }
  }, [currentNote, setCurrentNote])

  // Unshare note
  const unshareNoteFromUser = useCallback(async (noteId: string, userId?: string) => {
    try {
      await unshareNote(noteId, userId)
      
      // Update current note if it's the same
      if (currentNote?.id === noteId) {
        const updatedSharedWith = userId
          ? currentNote.sharedWith.filter(id => id !== userId)
          : []
        
        setCurrentNote({
          ...currentNote,
          sharedWith: updatedSharedWith,
        })
      }
      
      toast.success(userId ? 'Removed user from note sharing' : 'Note unshared from all users')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to unshare note'
      toast.error(message)
    }
  }, [currentNote, setCurrentNote])

  // Make note public
  const makeNotePublicHandout = useCallback(async (noteId: string) => {
    try {
      await makeNotePublic(noteId)
      
      // Update stores
      if (currentNote?.id === noteId) {
        setCurrentNote({ ...currentNote, isPublic: true })
      }
      updateNoteSummary(noteId, { isPublic: true })
      
      toast.success('Note made public as handout')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to make note public'
      toast.error(message)
    }
  }, [currentNote, setCurrentNote, updateNoteSummary])

  // Make note private
  const makeNotePrivateOnly = useCallback(async (noteId: string) => {
    try {
      await makeNotePrivate(noteId)
      
      // Update stores
      if (currentNote?.id === noteId) {
        setCurrentNote({ ...currentNote, isPublic: false })
      }
      updateNoteSummary(noteId, { isPublic: false })
      
      toast.success('Note made private')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to make note private'
      toast.error(message)
    }
  }, [currentNote, setCurrentNote, updateNoteSummary])

  // Load available tags
  const loadAvailableTags = useCallback(async (gameId: string) => {
    try {
      const tags = await getAvailableTags(gameId)
      setAvailableTags(tags)
    } catch (error) {
      console.error('Failed to load tags:', error)
    }
  }, [setAvailableTags])

  // Form operations
  const startCreatingNote = useCallback((category?: string) => {
    startCreating(category)
  }, [startCreating])

  const startEditingNote = useCallback((note: Note) => {
    startEditing(note)
  }, [startEditing])

  const cancelNoteForm = useCallback(() => {
    cancelForm()
  }, [cancelForm])

  const saveCurrentNote = useCallback(async (gameId: string, userId: string) => {
    if (!draftNote || !editorContent.trim()) {
      setFormErrors({ content: 'Content is required' })
      return
    }

    if (!draftNote.title?.trim()) {
      setFormErrors({ title: 'Title is required' })
      return
    }

    clearFormErrors()

    const noteData = {
      ...draftNote,
      content: editorContent,
    }

    try {
      if (isCreating) {
        await createNewNote(gameId, userId, noteData as any)
      } else if (isEditing && currentNote) {
        await updateExistingNote(currentNote.id, noteData)
      }
      
      cancelForm()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save note'
      setFormErrors({ save: message })
    }
  }, [
    draftNote, 
    editorContent, 
    isCreating, 
    isEditing, 
    currentNote,
    createNewNote,
    updateExistingNote,
    cancelForm,
    setFormErrors,
    clearFormErrors,
  ])

  // Refresh data
  const refresh = useCallback(async (gameId?: string, userId?: string) => {
    if (gameId && userId) {
      await Promise.all([
        loadNotes(gameId, userId),
        loadAvailableTags(gameId),
      ])
    }
  }, [loadNotes, loadAvailableTags])

  // Auto-load notes when gameId and userId change
  useEffect(() => {
    if (gameId && userId) {
      refresh(gameId, userId)
    }
  }, [gameId, userId, refresh])

  return {
    // State
    notes,
    sharedNotes,
    publicNotes,
    currentNote,
    notesLoading,
    notesError,
    isCreating,
    isEditing,
    availableTags,
    searchResults,
    isSearching,
    
    // Note operations
    loadNotes,
    loadNote,
    createNewNote,
    updateExistingNote,
    deleteExistingNote,
    duplicateExistingNote,
    
    // Search operations
    searchNotesByFilter,
    clearSearchResults,
    
    // Sharing operations
    shareNoteWithUsers,
    unshareNoteFromUser,
    makeNotePublicHandout,
    makeNotePrivateOnly,
    
    // Tag operations
    loadAvailableTags,
    
    // Form operations
    startCreatingNote,
    startEditingNote,
    cancelNoteForm,
    saveCurrentNote,
    
    // Utility
    refresh,
  }
}

export default useNotes