'use client'

import { useNotesStore } from '@/stores/notes-store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Share, 
  Copy, 
  Eye, 
  EyeOff,
  Calendar,
  User,
  Tag,
  FileText
} from 'lucide-react'
import { NoteSummary } from '@/types/notes'
import { NOTE_CATEGORIES } from '@/types/notes'
import { formatDistanceToNow } from 'date-fns'
import { useState } from 'react'

interface NotesListProps {
  notes: NoteSummary[]
  view: 'list' | 'grid' | 'detail'
  gameId: string
  canEdit: boolean
}

export default function NotesList({ notes, view, gameId, canEdit }: NotesListProps) {
  const {
    setCurrentNote,
    startEditing,
    removeNote,
    duplicateNote,
    makePublic,
    makePrivate,
  } = useNotesStore()

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null)

  const handleNoteClick = async (note: NoteSummary) => {
    try {
      // TODO: Load full note data from API
      const fullNote = {
        id: note.id,
        gameId,
        userId: 'current-user-id', // TODO: Get from user store
        title: note.title,
        content: 'Loading...', // TODO: Load actual content
        category: note.category,
        tags: note.tags,
        isPublic: note.isPublic,
        sharedWith: [],
        attachments: [],
        linkedMessages: [],
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: note.updatedAt,
      }
      
      setCurrentNote(fullNote)
    } catch (error) {
      console.error('Failed to load note:', error)
    }
  }

  const handleEditNote = async (note: NoteSummary) => {
    try {
      // TODO: Load full note data from API
      const fullNote = {
        id: note.id,
        gameId,
        userId: 'current-user-id', // TODO: Get from user store
        title: note.title,
        content: 'Loading...', // TODO: Load actual content
        category: note.category,
        tags: note.tags,
        isPublic: note.isPublic,
        sharedWith: [],
        attachments: [],
        linkedMessages: [],
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: note.updatedAt,
      }
      
      startEditing(fullNote)
    } catch (error) {
      console.error('Failed to load note for editing:', error)
    }
  }

  const handleDeleteNote = (noteId: string) => {
    setNoteToDelete(noteId)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = () => {
    if (noteToDelete) {
      removeNote(noteToDelete)
    }
    setDeleteDialogOpen(false)
    setNoteToDelete(null)
  }

  const getCategoryIcon = (category?: string) => {
    if (!category) return <FileText className="h-4 w-4" />
    
    const categoryData = Object.values(NOTE_CATEGORIES).find(cat => cat.name === category)
    return <FileText className="h-4 w-4" /> // TODO: Use dynamic icons
  }

  const getCategoryColor = (category?: string) => {
    if (!category) return 'bg-gray-500/10 text-gray-700'
    
    const categoryData = Object.values(NOTE_CATEGORIES).find(cat => cat.name === category)
    return categoryData ? `bg-${categoryData.color}-500/10 text-${categoryData.color}-700` : 'bg-gray-500/10 text-gray-700'
  }

  if (notes.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p>No notes in this category</p>
      </div>
    )
  }

  if (view === 'grid') {
    return (
      <div className="grid grid-cols-1 gap-3">
        {notes.map((note) => (
          <Card 
            key={note.id} 
            className="cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => handleNoteClick(note)}
          >
            <CardContent className="p-3">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {getCategoryIcon(note.category)}
                  <h4 className="font-semibold text-sm truncate">{note.title}</h4>
                </div>
                
                {canEdit && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <MoreHorizontal className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEditNote(note)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => duplicateNote(note.id)}>
                        <Copy className="h-4 w-4 mr-2" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => note.isPublic ? makePrivate(note.id) : makePublic(note.id)}
                      >
                        {note.isPublic ? (
                          <><EyeOff className="h-4 w-4 mr-2" />Make Private</>
                        ) : (
                          <><Eye className="h-4 w-4 mr-2" />Make Public</>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => handleDeleteNote(note.id)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>

              {/* Category and visibility badges */}
              <div className="flex items-center gap-2 mb-2">
                {note.category && (
                  <Badge variant="secondary" className="text-xs">
                    {note.category}
                  </Badge>
                )}
                {note.isPublic && (
                  <Badge variant="outline" className="text-xs">
                    <Eye className="h-3 w-3 mr-1" />
                    Public
                  </Badge>
                )}
              </div>

              {/* Tags */}
              {note.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {note.tags.slice(0, 3).map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      <Tag className="h-2 w-2 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                  {note.tags.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{note.tags.length - 3}
                    </Badge>
                  )}
                </div>
              )}

              {/* Author and date */}
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {note.authorName}
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  // List view (default)
  return (
    <div className="space-y-2">
      {notes.map((note) => (
        <Card 
          key={note.id} 
          className="cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => handleNoteClick(note)}
        >
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {getCategoryIcon(note.category)}
                  {note.isPublic && <Eye className="h-3 w-3 text-primary" />}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm truncate">{note.title}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    {note.category && (
                      <Badge variant="secondary" className="text-xs">
                        {note.category}
                      </Badge>
                    )}
                    {note.tags.slice(0, 2).map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {note.tags.length > 2 && (
                      <span className="text-xs text-muted-foreground">+{note.tags.length - 2}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="text-xs text-muted-foreground text-right">
                  <div>{note.authorName}</div>
                  <div>{formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })}</div>
                </div>
                
                {canEdit && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEditNote(note)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => duplicateNote(note.id)}>
                        <Copy className="h-4 w-4 mr-2" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => note.isPublic ? makePrivate(note.id) : makePublic(note.id)}
                      >
                        {note.isPublic ? (
                          <><EyeOff className="h-4 w-4 mr-2" />Make Private</>
                        ) : (
                          <><Eye className="h-4 w-4 mr-2" />Make Public</>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => handleDeleteNote(note.id)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Note</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this note? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}