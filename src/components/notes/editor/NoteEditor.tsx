'use client'

import { useState, useEffect, useCallback } from 'react'
import { getNote, updateNote, deleteNote, shareNote } from '@/lib/api/notes'
import type { Note } from '@/types/notes'
import { NOTE_CATEGORIES } from '@/types/notes'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  ArrowLeft, 
  Save, 
  Share, 
  Trash2, 
  MoreVertical,
  Eye,
  EyeOff,
  Users,
  Lock,
  Tag,
  Clock,
  User
} from 'lucide-react'

interface NoteEditorProps {
  noteId: string
  gameId: string
  isGameMaster: boolean
  onBack: () => void
  onDeleted: () => void
}

export default function NoteEditor({ noteId, gameId, isGameMaster, onBack, onDeleted }: NoteEditorProps) {
  const [note, setNote] = useState<Note | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  // Form state
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [isPublic, setIsPublic] = useState(false)
  const [newTag, setNewTag] = useState('')

  useEffect(() => {
    loadNote()
  }, [noteId])

  const loadNote = async () => {
    try {
      setLoading(true)
      const noteData = await getNote(noteId)
      if (!noteData) {
        console.error('Note not found')
        onBack()
        return
      }

      setNote(noteData)
      setTitle(noteData.title)
      setContent(noteData.content)
      setCategory(noteData.category || '')
      setTags(noteData.tags)
      setIsPublic(noteData.isPublic)
      setHasChanges(false)
    } catch (error) {
      console.error('Error loading note:', error)
      onBack()
    } finally {
      setLoading(false)
    }
  }

  const handleSave = useCallback(async () => {
    if (!note || saving) return

    try {
      setSaving(true)
      const updatedNote = await updateNote({
        id: noteId,
        title: title.trim(),
        content: content.trim(),
        category: category || undefined,
        tags,
        isPublic,
      })

      setNote(updatedNote)
      setHasChanges(false)
    } catch (error) {
      console.error('Error saving note:', error)
    } finally {
      setSaving(false)
    }
  }, [note, noteId, title, content, category, tags, isPublic, saving])

  const handleDelete = async () => {
    if (!note) return

    try {
      await deleteNote(noteId)
      onDeleted()
    } catch (error) {
      console.error('Error deleting note:', error)
    }
  }

  const handleAddTag = () => {
    const trimmedTag = newTag.trim()
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags(prev => [...prev, trimmedTag])
      setNewTag('')
      setHasChanges(true)
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(prev => prev.filter(tag => tag !== tagToRemove))
    setHasChanges(true)
  }

  const handleContentChange = (newContent: string) => {
    setContent(newContent)
    setHasChanges(true)
  }

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle)
    setHasChanges(true)
  }

  const handleCategoryChange = (newCategory: string) => {
    setCategory(newCategory)
    setHasChanges(true)
  }

  const handlePublicToggle = (checked: boolean) => {
    setIsPublic(checked)
    setHasChanges(true)
  }

  // Auto-save functionality
  useEffect(() => {
    if (hasChanges && !saving) {
      const timeoutId = setTimeout(() => {
        handleSave()
      }, 2000) // Auto-save after 2 seconds of no changes

      return () => clearTimeout(timeoutId)
    }
  }, [hasChanges, saving, handleSave])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    )
  }

  if (!note) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center">
            <p className="text-muted-foreground">Note not found</p>
            <Button onClick={onBack} className="mt-4">
              Go Back
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const canEdit = note.userId === 'current-user-id' || isGameMaster // This would be properly checked
  const canDelete = note.userId === 'current-user-id' || isGameMaster

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <Card className="mb-4">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={onBack} className="p-2">
              <ArrowLeft className="h-4 w-4" />
            </Button>

            <div className="flex items-center gap-2">
              {hasChanges && (
                <Badge variant="secondary" className="text-xs">
                  Unsaved changes
                </Badge>
              )}
              
              {saving && (
                <Badge variant="outline" className="text-xs">
                  Saving...
                </Badge>
              )}

              <Button
                onClick={handleSave}
                disabled={!hasChanges || saving}
                size="sm"
              >
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem disabled={!canEdit}>
                    <Share className="h-4 w-4 mr-2" />
                    Share Note
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem 
                        className="text-destructive"
                        disabled={!canDelete}
                        onSelect={(e) => e.preventDefault()}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Note
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Note?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete
                          the note "{note.title}".
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDelete}
                          className="bg-destructive text-destructive-foreground"
                        >
                          Delete Note
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Editor */}
      <Card className="flex-1 flex flex-col">
        <CardContent className="p-6 flex-1 flex flex-col space-y-6">
          {/* Title */}
          <div>
            <Label htmlFor="note-title">Title</Label>
            <Input
              id="note-title"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="text-lg font-semibold"
              disabled={!canEdit}
            />
          </div>

          {/* Metadata row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="note-category">Category</Label>
              <Select value={category} onValueChange={handleCategoryChange} disabled={!canEdit}>
                <SelectTrigger>
                  <SelectValue placeholder="No category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No category</SelectItem>
                  {Object.entries(NOTE_CATEGORIES).map(([key, cat]) => (
                    <SelectItem key={key} value={cat.name}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="public-toggle"
                checked={isPublic}
                onCheckedChange={handlePublicToggle}
                disabled={!canEdit || !isGameMaster}
              />
              <div className="flex items-center gap-2">
                {isPublic ? (
                  <>
                    <Users className="h-4 w-4 text-green-600" />
                    <Label htmlFor="public-toggle">Public Handout</Label>
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4 text-muted-foreground" />
                    <Label htmlFor="public-toggle">Private Note</Label>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Tags */}
          <div>
            <Label>Tags</Label>
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    <Tag className="h-3 w-3 mr-1" />
                    {tag}
                    {canEdit && (
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 hover:text-destructive"
                      >
                        ×
                      </button>
                    )}
                  </Badge>
                ))}
              </div>
              {canEdit && (
                <div className="flex gap-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Add a tag..."
                    className="text-sm"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddTag()
                      }
                    }}
                  />
                  <Button size="sm" onClick={handleAddTag} disabled={!newTag.trim()}>
                    Add
                  </Button>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Content */}
          <div className="flex-1 flex flex-col">
            <Label htmlFor="note-content" className="mb-2">Content</Label>
            <Textarea
              id="note-content"
              value={content}
              onChange={(e) => handleContentChange(e.target.value)}
              placeholder="Write your note content here..."
              className="flex-1 min-h-96 resize-none font-mono"
              disabled={!canEdit}
            />
          </div>

          {/* Footer info */}
          <div className="flex items-center justify-between text-sm text-muted-foreground pt-4 border-t">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <User className="h-4 w-4" />
                <span>Version {note.version}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>Updated {formatDate(note.updatedAt)}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {note.isPublic && (
                <Badge variant="outline" className="text-xs">
                  <Users className="h-3 w-3 mr-1" />
                  Public
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}