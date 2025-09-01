'use client'

import { useState } from 'react'
import type { NoteSummary } from '@/types/notes'
import { NOTE_CATEGORIES } from '@/types/notes'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
  FileText, 
  MoreVertical, 
  Trash2, 
  Share, 
  Users, 
  Lock, 
  Tag, 
  User,
  Calendar,
  BookOpen
} from 'lucide-react'

interface NotesListProps {
  notes: NoteSummary[]
  loading: boolean
  onSelectNote: (noteId: string) => void
  onDeleteNote: (noteId: string) => void
  isGameMaster: boolean
}

export default function NotesList({ 
  notes, 
  loading, 
  onSelectNote, 
  onDeleteNote, 
  isGameMaster 
}: NotesListProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<string | null>(null)

  const handleDelete = (noteId: string) => {
    onDeleteNote(noteId)
    setDeleteDialogOpen(null)
  }

  const getCategoryIcon = (categoryName?: string) => {
    if (!categoryName) return <FileText className="h-4 w-4" />
    
    const categoryKey = Object.keys(NOTE_CATEGORIES).find(
      key => NOTE_CATEGORIES[key as keyof typeof NOTE_CATEGORIES].name === categoryName
    )
    
    if (!categoryKey) return <FileText className="h-4 w-4" />
    
    // This would ideally use dynamic icons based on the category
    // For now, using FileText as fallback
    return <FileText className="h-4 w-4" />
  }

  const getCategoryColor = (categoryName?: string) => {
    if (!categoryName) return 'text-muted-foreground'
    
    const categoryKey = Object.keys(NOTE_CATEGORIES).find(
      key => NOTE_CATEGORIES[key as keyof typeof NOTE_CATEGORIES].name === categoryName
    )
    
    if (!categoryKey) return 'text-muted-foreground'
    
    const category = NOTE_CATEGORIES[categoryKey as keyof typeof NOTE_CATEGORIES]
    return `text-${category.color}-600`
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else if (diffDays === 1) {
      return 'Yesterday'
    } else if (diffDays < 7) {
      return `${diffDays}d ago`
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (notes.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Notes Found</h3>
          <p className="text-muted-foreground text-center">
            No notes match your current filters. Try adjusting your search or create a new note.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <ScrollArea className="h-full">
        <div className="space-y-3">
          {notes.map(note => (
            <Card 
              key={note.id} 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => onSelectNote(note.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0 space-y-2">
                    {/* Title and badges */}
                    <div className="flex items-start gap-2">
                      <div className="flex-shrink-0 mt-1">
                        <div className={getCategoryColor(note.category)}>
                          {getCategoryIcon(note.category)}
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">{note.title}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          {note.category && (
                            <Badge variant="outline" className="text-xs">
                              {note.category}
                            </Badge>
                          )}
                          
                          {note.isPublic ? (
                            <Badge variant="default" className="text-xs">
                              <Users className="h-3 w-3 mr-1" />
                              Public
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">
                              <Lock className="h-3 w-3 mr-1" />
                              Private
                            </Badge>
                          )}
                          
                          {note.isOwn && (
                            <Badge variant="outline" className="text-xs">
                              Mine
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Tags */}
                    {note.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {note.tags.slice(0, 3).map(tag => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            <Tag className="h-3 w-3 mr-1" />
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

                    {/* Footer */}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span>{note.authorName}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(note.updatedAt)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex-shrink-0 ml-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          onClick={(e) => {
                            e.stopPropagation()
                            onSelectNote(note.id)
                          }}
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        
                        <DropdownMenuItem 
                          disabled={!note.isOwn && !isGameMaster}
                          onClick={(e) => {
                            e.stopPropagation()
                            // Handle sharing
                          }}
                        >
                          <Share className="h-4 w-4 mr-2" />
                          Share
                        </DropdownMenuItem>
                        
                        <DropdownMenuItem 
                          className="text-destructive"
                          disabled={!note.isOwn && !isGameMaster}
                          onClick={(e) => {
                            e.stopPropagation()
                            setDeleteDialogOpen(note.id)
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>

      {/* Delete Confirmation Dialog */}
      <AlertDialog 
        open={deleteDialogOpen !== null} 
        onOpenChange={() => setDeleteDialogOpen(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Note?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the note
              and remove it from all shared users.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteDialogOpen && handleDelete(deleteDialogOpen)}
              className="bg-destructive text-destructive-foreground"
            >
              Delete Note
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}