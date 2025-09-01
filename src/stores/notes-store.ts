import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { 
  Note, 
  NoteSummary, 
  NoteCategory,
  NoteShareSettings,
  NoteSearchFilter,
  NoteSearchResult
} from '@/types/notes'
import { NOTE_CATEGORIES } from '@/types/notes'

interface NotesState {
  // Notes list for current game
  notes: NoteSummary[]
  notesLoading: boolean
  notesError: string | null

  // Current active note (being viewed/edited)
  currentNote: Note | null
  currentNoteLoading: boolean
  currentNoteError: string | null

  // Note creation/editing
  isCreating: boolean
  isEditing: boolean
  draftNote: Partial<Note> | null
  formErrors: Record<string, string>

  // Search and filtering
  searchQuery: string
  searchFilter: NoteSearchFilter
  searchResults: NoteSearchResult[]
  isSearching: boolean

  // Categories and organization
  categories: NoteCategory[]
  selectedCategory: string | null
  availableTags: string[]

  // Sharing
  shareSettings: NoteShareSettings | null
  sharedNotes: NoteSummary[] // Notes shared with user
  publicNotes: NoteSummary[] // Master handouts

  // UI State
  isNotePanelOpen: boolean
  activeView: 'list' | 'grid' | 'detail'
  sortBy: 'updated' | 'created' | 'title' | 'category'
  sortOrder: 'asc' | 'desc'
  selectedNoteId: string | null

  // Rich text editor state
  editorContent: string
  editorSelection: any | null
  isAutoSaving: boolean
  lastSaved: Date | null

  // Actions - Notes list
  setNotes: (notes: NoteSummary[]) => void
  addNote: (note: NoteSummary) => void
  updateNoteSummary: (noteId: string, updates: Partial<NoteSummary>) => void
  removeNote: (noteId: string) => void
  setNotesLoading: (loading: boolean) => void
  setNotesError: (error: string | null) => void

  // Actions - Current note
  setCurrentNote: (note: Note | null) => void
  setCurrentNoteLoading: (loading: boolean) => void
  setCurrentNoteError: (error: string | null) => void
  updateCurrentNote: (updates: Partial<Note>) => void

  // Actions - Note creation/editing
  startCreating: (category?: string) => void
  startEditing: (note: Note) => void
  cancelForm: () => void
  setDraftNote: (data: Partial<Note>) => void
  setFormErrors: (errors: Record<string, string>) => void
  clearFormErrors: () => void
  saveDraft: () => void
  loadDraft: (noteId: string) => void

  // Actions - Search and filtering
  setSearchQuery: (query: string) => void
  setSearchFilter: (filter: Partial<NoteSearchFilter>) => void
  clearSearchFilter: () => void
  setSearchResults: (results: NoteSearchResult[]) => void
  setIsSearching: (searching: boolean) => void
  performSearch: () => Promise<void>

  // Actions - Categories and tags
  setCategories: (categories: NoteCategory[]) => void
  setSelectedCategory: (category: string | null) => void
  setAvailableTags: (tags: string[]) => void
  addTag: (noteId: string, tag: string) => void
  removeTag: (noteId: string, tag: string) => void

  // Actions - Sharing
  setShareSettings: (settings: NoteShareSettings | null) => void
  shareNote: (noteId: string, settings: NoteShareSettings) => void
  unshareNote: (noteId: string, userId?: string) => void
  setSharedNotes: (notes: NoteSummary[]) => void
  setPublicNotes: (notes: NoteSummary[]) => void
  makePublic: (noteId: string) => void
  makePrivate: (noteId: string) => void

  // Actions - UI
  toggleNotePanel: () => void
  setActiveView: (view: NotesState['activeView']) => void
  setSortBy: (sort: NotesState['sortBy'], order?: NotesState['sortOrder']) => void
  setSelectedNote: (noteId: string | null) => void

  // Actions - Rich text editor
  setEditorContent: (content: string) => void
  setEditorSelection: (selection: any) => void
  setIsAutoSaving: (saving: boolean) => void
  setLastSaved: (date: Date) => void
  insertAtCursor: (content: string) => void
  formatText: (format: string) => void

  // Actions - Auto-save
  startAutoSave: () => void
  stopAutoSave: () => void
  triggerAutoSave: () => void

  // Utility actions
  duplicateNote: (noteId: string) => void
  archiveNote: (noteId: string) => void
  restoreNote: (noteId: string) => void
  exportNote: (noteId: string, format: 'markdown' | 'pdf') => void
  importNotes: (data: any) => void

  // Reset
  reset: () => void
}

const initialSearchFilter: NoteSearchFilter = {
  query: '',
  category: undefined,
  tags: [],
  author: undefined,
  isPublic: undefined,
}

const initialState = {
  notes: [],
  notesLoading: false,
  notesError: null,
  currentNote: null,
  currentNoteLoading: false,
  currentNoteError: null,
  isCreating: false,
  isEditing: false,
  draftNote: null,
  formErrors: {},
  searchQuery: '',
  searchFilter: initialSearchFilter,
  searchResults: [],
  isSearching: false,
  categories: Object.values(NOTE_CATEGORIES).map((cat, index) => ({
    ...cat,
    count: 0,
  })),
  selectedCategory: null,
  availableTags: [],
  shareSettings: null,
  sharedNotes: [],
  publicNotes: [],
  isNotePanelOpen: false,
  activeView: 'list' as const,
  sortBy: 'updated' as const,
  sortOrder: 'desc' as const,
  selectedNoteId: null,
  editorContent: '',
  editorSelection: null,
  isAutoSaving: false,
  lastSaved: null,
}

export const useNotesStore = create<NotesState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // Notes list actions
      setNotes: (notes) => set({ notes }),
      
      addNote: (note) => set((state) => ({
        notes: [note, ...state.notes]
      })),
      
      updateNoteSummary: (noteId, updates) => set((state) => ({
        notes: state.notes.map(note => 
          note.id === noteId ? { ...note, ...updates } : note
        )
      })),
      
      removeNote: (noteId) => set((state) => ({
        notes: state.notes.filter(note => note.id !== noteId),
        selectedNoteId: state.selectedNoteId === noteId ? null : state.selectedNoteId,
        currentNote: state.currentNote?.id === noteId ? null : state.currentNote,
      })),
      
      setNotesLoading: (loading) => set({ notesLoading: loading }),
      setNotesError: (error) => set({ notesError: error }),

      // Current note actions
      setCurrentNote: (note) => set({ 
        currentNote: note,
        selectedNoteId: note?.id || null,
        editorContent: note?.content || '',
      }),
      
      setCurrentNoteLoading: (loading) => set({ currentNoteLoading: loading }),
      setCurrentNoteError: (error) => set({ currentNoteError: error }),
      
      updateCurrentNote: (updates) => set((state) => ({
        currentNote: state.currentNote 
          ? { ...state.currentNote, ...updates }
          : null
      })),

      // Note creation/editing actions
      startCreating: (category) => set({ 
        isCreating: true, 
        isEditing: false,
        draftNote: {
          title: '',
          content: '',
          category: category || '',
          tags: [],
          isPublic: false,
          sharedWith: [],
          attachments: [],
          linkedMessages: [],
        },
        formErrors: {},
        editorContent: '',
      }),
      
      startEditing: (note) => set({ 
        isCreating: false, 
        isEditing: true,
        draftNote: { ...note },
        formErrors: {},
        editorContent: note.content,
        currentNote: note,
      }),
      
      cancelForm: () => set({ 
        isCreating: false, 
        isEditing: false, 
        draftNote: null,
        formErrors: {},
        editorContent: '',
      }),
      
      setDraftNote: (data) => set((state) => ({
        draftNote: state.draftNote ? { ...state.draftNote, ...data } : data as Partial<Note>
      })),
      
      setFormErrors: (errors) => set({ formErrors: errors }),
      clearFormErrors: () => set({ formErrors: {} }),
      
      saveDraft: () => {
        const state = get()
        if (state.draftNote && state.editorContent) {
          const updatedDraft = {
            ...state.draftNote,
            content: state.editorContent,
            updatedAt: new Date().toISOString(),
          }
          
          // Save to localStorage for crash recovery
          localStorage.setItem(
            `note-draft-${state.draftNote.id || 'new'}`, 
            JSON.stringify(updatedDraft)
          )
          
          set({ 
            draftNote: updatedDraft,
            lastSaved: new Date(),
          })
        }
      },
      
      loadDraft: (noteId) => {
        try {
          const saved = localStorage.getItem(`note-draft-${noteId}`)
          if (saved) {
            const draft = JSON.parse(saved)
            set({ 
              draftNote: draft,
              editorContent: draft.content || '',
            })
          }
        } catch (error) {
          console.error('Failed to load draft:', error)
        }
      },

      // Search actions
      setSearchQuery: (query) => set({ searchQuery: query }),
      
      setSearchFilter: (filter) => set((state) => ({
        searchFilter: { ...state.searchFilter, ...filter }
      })),
      
      clearSearchFilter: () => set({ 
        searchFilter: initialSearchFilter,
        searchQuery: '',
        searchResults: [],
      }),
      
      setSearchResults: (results) => set({ searchResults: results }),
      setIsSearching: (searching) => set({ isSearching: searching }),
      
      performSearch: async () => {
        const state = get()
        set({ isSearching: true })
        
        try {
          // Simulate search - in real app this would be an API call
          const filteredNotes = state.notes.filter(note => {
            const matchesQuery = !state.searchQuery || 
              note.title.toLowerCase().includes(state.searchQuery.toLowerCase())
            
            const matchesCategory = !state.searchFilter.category || 
              note.category === state.searchFilter.category
            
            const matchesTags = !state.searchFilter.tags?.length || 
              state.searchFilter.tags.some(tag => note.tags.includes(tag))
            
            const matchesPublic = state.searchFilter.isPublic === undefined || 
              note.isPublic === state.searchFilter.isPublic
            
            return matchesQuery && matchesCategory && matchesTags && matchesPublic
          })
          
          const results: NoteSearchResult[] = filteredNotes.map(note => ({
            note,
            matches: {
              title: note.title.toLowerCase().includes(state.searchQuery.toLowerCase()),
              content: false, // Would need full note content
              tags: state.searchFilter.tags?.some(tag => note.tags.includes(tag)),
            },
            score: 1, // Would calculate relevance score
          }))
          
          set({ searchResults: results })
        } finally {
          set({ isSearching: false })
        }
      },

      // Categories and tags actions
      setCategories: (categories) => set({ categories }),
      setSelectedCategory: (category) => set({ selectedCategory: category }),
      setAvailableTags: (tags) => set({ availableTags: tags }),
      
      addTag: (noteId, tag) => set((state) => {
        const newTags = Array.from(new Set([...state.availableTags, tag]))
        
        return {
          availableTags: newTags,
          notes: state.notes.map(note => 
            note.id === noteId 
              ? { ...note, tags: Array.from(new Set([...note.tags, tag])) }
              : note
          ),
          currentNote: state.currentNote?.id === noteId 
            ? { ...state.currentNote, tags: Array.from(new Set([...state.currentNote.tags, tag])) }
            : state.currentNote
        }
      }),
      
      removeTag: (noteId, tag) => set((state) => ({
        notes: state.notes.map(note => 
          note.id === noteId 
            ? { ...note, tags: note.tags.filter(t => t !== tag) }
            : note
        ),
        currentNote: state.currentNote?.id === noteId 
          ? { ...state.currentNote, tags: state.currentNote.tags.filter(t => t !== tag) }
          : state.currentNote
      })),

      // Sharing actions
      setShareSettings: (settings) => set({ shareSettings: settings }),
      
      shareNote: (noteId, settings) => set((state) => ({
        notes: state.notes.map(note => 
          note.id === noteId 
            ? { ...note, isOwn: true } // Mark as shared by owner
            : note
        )
      })),
      
      unshareNote: (noteId, userId) => set((state) => {
        if (!state.currentNote) return state
        
        const updatedSharedWith = userId
          ? state.currentNote.sharedWith.filter(id => id !== userId)
          : []
        
        return {
          currentNote: {
            ...state.currentNote,
            sharedWith: updatedSharedWith
          }
        }
      }),
      
      setSharedNotes: (notes) => set({ sharedNotes: notes }),
      setPublicNotes: (notes) => set({ publicNotes: notes }),
      
      makePublic: (noteId) => set((state) => ({
        notes: state.notes.map(note => 
          note.id === noteId ? { ...note, isPublic: true } : note
        ),
        currentNote: state.currentNote?.id === noteId 
          ? { ...state.currentNote, isPublic: true }
          : state.currentNote
      })),
      
      makePrivate: (noteId) => set((state) => ({
        notes: state.notes.map(note => 
          note.id === noteId ? { ...note, isPublic: false } : note
        ),
        currentNote: state.currentNote?.id === noteId 
          ? { ...state.currentNote, isPublic: false }
          : state.currentNote
      })),

      // UI actions
      toggleNotePanel: () => set((state) => ({ 
        isNotePanelOpen: !state.isNotePanelOpen 
      })),
      
      setActiveView: (view) => set({ activeView: view }),
      
      setSortBy: (sort, order = 'desc') => set({ 
        sortBy: sort,
        sortOrder: order,
        // Re-sort notes
        notes: get().notes.sort((a, b) => {
          const aVal = a[sort] as string
          const bVal = b[sort] as string
          
          if (order === 'asc') {
            return aVal.localeCompare(bVal)
          } else {
            return bVal.localeCompare(aVal)
          }
        })
      }),
      
      setSelectedNote: (noteId) => set({ selectedNoteId: noteId }),

      // Rich text editor actions
      setEditorContent: (content) => set({ editorContent: content }),
      setEditorSelection: (selection) => set({ editorSelection: selection }),
      setIsAutoSaving: (saving) => set({ isAutoSaving: saving }),
      setLastSaved: (date) => set({ lastSaved: date }),
      
      insertAtCursor: (content) => {
        const state = get()
        // Insert content at cursor position - implementation depends on editor
        set({ editorContent: state.editorContent + content })
      },
      
      formatText: (format) => {
        // Apply text formatting - implementation depends on editor
        console.log('Formatting text with:', format)
      },

      // Auto-save actions
      startAutoSave: () => {
        // Start auto-save interval
        const interval = setInterval(() => {
          get().triggerAutoSave()
        }, 5000) // Auto-save every 5 seconds
        
        // Store interval reference (would need to add to state)
      },
      
      stopAutoSave: () => {
        // Clear auto-save interval
      },
      
      triggerAutoSave: () => {
        const state = get()
        if (state.draftNote && state.editorContent && !state.isAutoSaving) {
          set({ isAutoSaving: true })
          
          // Simulate auto-save delay
          setTimeout(() => {
            get().saveDraft()
            set({ isAutoSaving: false })
          }, 500)
        }
      },

      // Utility actions
      duplicateNote: (noteId) => set((state) => {
        const originalNote = state.notes.find(n => n.id === noteId)
        if (!originalNote) return state
        
        const duplicatedNote: NoteSummary = {
          ...originalNote,
          id: `${noteId}-copy-${Date.now()}`,
          title: `${originalNote.title} (Copy)`,
          updatedAt: new Date().toISOString(),
        }
        
        return {
          notes: [duplicatedNote, ...state.notes]
        }
      }),
      
      archiveNote: (noteId) => set((state) => ({
        notes: state.notes.filter(note => note.id !== noteId)
        // In real app, would move to archived collection
      })),
      
      restoreNote: (noteId) => {
        // Restore from archive - implementation depends on backend
      },
      
      exportNote: (noteId, format) => {
        // Export note to file - implementation depends on requirements
        console.log(`Exporting note ${noteId} as ${format}`)
      },
      
      importNotes: (data) => {
        // Import notes from file - implementation depends on format
        console.log('Importing notes:', data)
      },

      // Reset
      reset: () => set(initialState),
    }),
    {
      name: 'notes-store',
    }
  )
)