'use client'

import { useState, useEffect, useCallback } from 'react'
import { useNotesStore } from '@/stores/notes-store'
import { sanitizeHtml, sanitizeText } from '@/lib/utils/sanitize'
import { debounce } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Save, 
  X, 
  Tag, 
  Share, 
  Eye, 
  EyeOff,
  FileText,
  Clock,
  AlertCircle,
  Check
} from 'lucide-react'
import { NOTE_CATEGORIES } from '@/types/notes'

interface NoteEditorProps {
  gameId: string
}

export default function NoteEditor({ gameId }: NoteEditorProps) {
  const {
    currentNote,
    draftNote,
    setDraftNote,
    isCreating,
    isEditing,
    cancelForm,
    formErrors,
    setFormErrors,
    clearFormErrors,
    editorContent,
    setEditorContent,
    isAutoSaving,
    lastSaved,
    setLastSaved,
    saveDraft,
    availableTags,
  } = useNotesStore()

  const [newTag, setNewTag] = useState('')
  const [showTagInput, setShowTagInput] = useState(false)

  // Debounced auto-save function
  const debouncedSaveDraft = useCallback(
    debounce(() => {
      if (draftNote && (draftNote.title || editorContent)) {
        // Sanitize before auto-saving
        const sanitizedContent = sanitizeHtml(editorContent)
        saveDraft(sanitizedContent)
        setLastSaved(new Date())
      }
    }, 2000), // Save after 2 seconds of inactivity
    [draftNote, editorContent, saveDraft, setLastSaved]
  )

  // Trigger auto-save on content changes
  useEffect(() => {
    if (draftNote && editorContent) {
      debouncedSaveDraft()
    }
  }, [draftNote, editorContent, debouncedSaveDraft])

  const handleSave = async () => {
    if (!draftNote) return

    // Validate
    const errors: Record<string, string> = {}
    if (!draftNote.title?.trim()) {
      errors.title = 'Title is required'
    }
    if (!editorContent.trim()) {
      errors.content = 'Content is required'
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    // Clear errors and save
    clearFormErrors()

    // Sanitize content before saving
    const sanitizedTitle = sanitizeText(draftNote.title || '', 200)
    const sanitizedContent = sanitizeHtml(editorContent)
    const sanitizedTags = draftNote.tags?.map(tag => sanitizeText(tag, 50)) || []

    try {
      // TODO: Implement actual save to API
      console.log('Saving note:', {
        ...draftNote,
        title: sanitizedTitle,
        content: sanitizedContent,
        tags: sanitizedTags,
        gameId,
      })

      // Simulate save success
      setTimeout(() => {
        cancelForm()
      }, 500)
    } catch (error) {
      console.error('Failed to save note:', error)
      setFormErrors({ save: 'Failed to save note. Please try again.' })
    }
  }

  const handleAddTag = () => {
    if (!newTag.trim() || !draftNote) return

    const tag = newTag.trim().toLowerCase()
    if (draftNote.tags?.includes(tag)) return

    setDraftNote({
      tags: [...(draftNote.tags || []), tag]
    })
    setNewTag('')
    setShowTagInput(false)
  }

  const handleRemoveTag = (tagToRemove: string) => {
    if (!draftNote) return

    setDraftNote({
      tags: draftNote.tags?.filter(tag => tag !== tagToRemove) || []
    })
  }

  const handleContentChange = (content: string) => {
    setEditorContent(content)
  }

  if (!draftNote) return null

  const title = isCreating ? 'Create Note' : 'Edit Note'

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="font-semibold">{title}</span>
            {isAutoSaving && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3 animate-spin" />
                Saving...
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {lastSaved && (
              <span className="text-xs text-muted-foreground">
                Saved {lastSaved.toLocaleTimeString()}
              </span>
            )}
            <Button variant="outline" size="sm" onClick={cancelForm}>
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isAutoSaving}>
              <Save className="h-4 w-4 mr-1" />
              Save
            </Button>
          </div>
        </div>
      </CardHeader>

      {/* Form */}
      <CardContent className="flex-1 overflow-hidden p-4">
        <ScrollArea className="h-full">
          <div className="space-y-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={draftNote.title || ''}
                onChange={(e) => setDraftNote({ title: e.target.value })}
                placeholder="Enter note title..."
                className={formErrors.title ? 'border-destructive' : ''}
              />
              {formErrors.title && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {formErrors.title}
                </p>
              )}
            </div>

            {/* Category and Visibility */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={draftNote.category || ''}
                  onValueChange={(value) => setDraftNote({ category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category..." />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(NOTE_CATEGORIES).map(([key, category]) => (
                      <SelectItem key={key} value={key}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Visibility</Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="public"
                    checked={draftNote.isPublic || false}
                    onCheckedChange={(checked) => setDraftNote({ isPublic: checked })}
                  />
                  <Label htmlFor="public" className="text-sm flex items-center gap-1">
                    {draftNote.isPublic ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                    {draftNote.isPublic ? 'Public Handout' : 'Private Note'}
                  </Label>
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {draftNote.tags?.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 hover:text-destructive"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
                
                {showTagInput ? (
                  <div className="flex items-center gap-1">
                    <Input
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleAddTag()
                        } else if (e.key === 'Escape') {
                          setShowTagInput(false)
                          setNewTag('')
                        }
                      }}
                      placeholder="Tag name..."
                      className="h-6 text-xs w-20"
                      autoFocus
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAddTag}
                      className="h-6 px-2"
                    >
                      <Check className="h-3 w-3" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowTagInput(false)
                        setNewTag('')
                      }}
                      className="h-6 px-2"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowTagInput(true)}
                    className="h-6 px-2 text-xs"
                  >
                    <Tag className="h-3 w-3 mr-1" />
                    Add Tag
                  </Button>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                value={editorContent}
                onChange={(e) => handleContentChange(e.target.value)}
                placeholder="Write your note content here..."
                rows={12}
                className={`resize-none font-mono ${formErrors.content ? 'border-destructive' : ''}`}
              />
              {formErrors.content && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {formErrors.content}
                </p>
              )}
              <div className="text-xs text-muted-foreground">
                {editorContent.length} characters
              </div>
            </div>

            {/* Error Messages */}
            {formErrors.save && (
              <div className="p-3 rounded-lg border border-destructive bg-destructive/10">
                <p className="text-sm text-destructive flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  {formErrors.save}
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </div>
  )
}