'use client'

import { NoteSummary } from '@/types/notes'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  MoreHorizontal, 
  Edit, 
  Eye, 
  EyeOff, 
  Share, 
  Users, 
  Calendar, 
  User, 
  FileText,
  Crown
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface SharedNotesProps {
  notes: NoteSummary[]
  gameId: string
  view: 'list' | 'grid' | 'detail'
  canEdit: boolean
  isPublic?: boolean
}

export default function SharedNotes({ notes, gameId, view, canEdit, isPublic = false }: SharedNotesProps) {
  const handleNoteClick = (note: NoteSummary) => {
    // TODO: Load and display note content
    console.log('Opening note:', note.id)
  }

  const handleEditNote = (note: NoteSummary) => {
    // TODO: Load note for editing
    console.log('Editing note:', note.id)
  }

  if (notes.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <div className="mb-2">
          {isPublic ? <Crown className="h-12 w-12 mx-auto opacity-50" /> : <Share className="h-12 w-12 mx-auto opacity-50" />}
        </div>
        <p>No {isPublic ? 'handouts' : 'shared notes'} available</p>
        <p className="text-xs">
          {isPublic 
            ? 'Game Master handouts will appear here'
            : 'Notes shared with you will appear here'
          }
        </p>
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
                  <FileText className="h-4 w-4" />
                  <h4 className="font-semibold text-sm truncate">{note.title}</h4>
                  {isPublic && <Crown className="h-3 w-3 text-yellow-500" />}
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
                      {isPublic && (
                        <DropdownMenuItem>
                          <EyeOff className="h-4 w-4 mr-2" />
                          Make Private
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>

              {/* Category and status */}
              <div className="flex items-center gap-2 mb-2">
                {note.category && (
                  <Badge variant="secondary" className="text-xs">
                    {note.category}
                  </Badge>
                )}
                {isPublic ? (
                  <Badge variant="outline" className="text-xs">
                    <Crown className="h-3 w-3 mr-1 text-yellow-500" />
                    GM Handout
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs">
                    <Share className="h-3 w-3 mr-1" />
                    Shared
                  </Badge>
                )}
              </div>

              {/* Tags */}
              {note.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {note.tags.slice(0, 3).map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      #{tag}
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
                  {isPublic && <span className="text-yellow-600">(GM)</span>}
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
                  <FileText className="h-4 w-4" />
                  {isPublic && <Crown className="h-3 w-3 text-yellow-500" />}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm truncate">{note.title}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    {note.category && (
                      <Badge variant="secondary" className="text-xs">
                        {note.category}
                      </Badge>
                    )}
                    {isPublic ? (
                      <Badge variant="outline" className="text-xs">
                        <Crown className="h-3 w-3 mr-1 text-yellow-500" />
                        GM Handout
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">
                        <Share className="h-3 w-3 mr-1" />
                        Shared
                      </Badge>
                    )}
                    {note.tags.slice(0, 2).map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        #{tag}
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
                  <div className="flex items-center gap-1">
                    {note.authorName}
                    {isPublic && <span className="text-yellow-600">(GM)</span>}
                  </div>
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
                      {isPublic && (
                        <DropdownMenuItem>
                          <EyeOff className="h-4 w-4 mr-2" />
                          Make Private
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}