'use client'

import { useState } from 'react'
import { useNotesStore } from '@/stores/notes-store'
import { zClass } from '@/lib/utils/z-index'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  BookOpen,
  Plus,
  Search,
  Filter,
  Grid,
  List,
  Users,
  Eye,
  Edit,
  Share,
  X
} from 'lucide-react'
import NotesList from './NotesList'
import NoteEditor from './NoteEditor'
import NoteCategories from './NoteCategories'
import SharedNotes from './SharedNotes'
import NoteSearch from './NoteSearch'

interface NotesPanelProps {
  gameId: string
  isGameMaster: boolean
}

export default function NotesPanel({ gameId, isGameMaster }: NotesPanelProps) {
  const {
    isNotePanelOpen,
    toggleNotePanel,
    activeView,
    setActiveView,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    searchFilter,
    setSearchFilter,
    currentNote,
    startCreating,
    cancelForm,
    isCreating,
    isEditing,
    notes,
    sharedNotes,
    publicNotes,
  } = useNotesStore()

  const [selectedTab, setSelectedTab] = useState<'my-notes' | 'shared' | 'handouts'>('my-notes')
  const [showSearch, setShowSearch] = useState(false)

  if (!isNotePanelOpen) return null

  const handleCreateNote = () => {
    startCreating(selectedCategory || undefined)
  }

  const filteredNotes = notes.filter(note => {
    if (selectedCategory && note.category !== selectedCategory) return false
    if (searchQuery && !note.title.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  return (
    <Card className={`fixed top-20 left-4 w-96 max-h-[80vh] bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85 ${zClass('notesPanel')} border-2`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Notes
          </CardTitle>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSearch(!showSearch)}
              className={showSearch ? "bg-primary/10" : ""}
            >
              <Search className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveView(activeView === 'list' ? 'grid' : 'list')}
            >
              {activeView === 'list' ? <Grid className="h-4 w-4" /> : <List className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleNotePanel}
              className="h-8 w-8 p-0"
            >
              ×
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        {showSearch && (
          <div className="space-y-2">
            <Input
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8"
            />
            <div className="flex gap-2">
              <Select
                value={selectedCategory || ''}
                onValueChange={(value) => setSelectedCategory(value || null)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Category..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Categories</SelectItem>
                  <SelectItem value="CHARACTERS">Characters</SelectItem>
                  <SelectItem value="LOCATIONS">Locations</SelectItem>
                  <SelectItem value="QUESTS">Quests</SelectItem>
                  <SelectItem value="NPCS">NPCs</SelectItem>
                  <SelectItem value="LORE">Lore</SelectItem>
                  <SelectItem value="ITEMS">Items</SelectItem>
                  <SelectItem value="RULES">Rules</SelectItem>
                  <SelectItem value="SESSION">Session Notes</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
              {(selectedCategory || searchQuery) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedCategory(null)
                    setSearchQuery('')
                  }}
                  className="h-8 px-2"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{filteredNotes.length} notes</span>
          <Button variant="outline" size="sm" onClick={handleCreateNote}>
            <Plus className="h-4 w-4 mr-1" />
            New Note
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Show Editor if creating/editing */}
        {(isCreating || isEditing || currentNote) && (
          <div className="h-96 border-t">
            <NoteEditor gameId={gameId} />
          </div>
        )}

        {/* Show Notes List if not editing */}
        {!isCreating && !isEditing && !currentNote && (
          <Tabs value={selectedTab} onValueChange={(value) => setSelectedTab(value as any)}>
            <TabsList className="grid w-full grid-cols-3 mx-4 mb-2">
              <TabsTrigger value="my-notes" className="text-xs">
                My Notes ({notes.length})
              </TabsTrigger>
              <TabsTrigger value="shared" className="text-xs">
                <Users className="h-3 w-3 mr-1" />
                Shared ({sharedNotes.length})
              </TabsTrigger>
              <TabsTrigger value="handouts" className="text-xs">
                <Eye className="h-3 w-3 mr-1" />
                Handouts ({publicNotes.length})
              </TabsTrigger>
            </TabsList>

            <ScrollArea className="h-72">
              <TabsContent value="my-notes" className="mt-0">
                <div className="px-4 pb-4">
                  {/* Categories */}
                  <div className="mb-4">
                    <NoteCategories 
                      selectedCategory={selectedCategory}
                      onSelectCategory={setSelectedCategory}
                    />
                  </div>

                  {/* Notes List */}
                  <NotesList 
                    notes={filteredNotes}
                    view={activeView}
                    gameId={gameId}
                    canEdit={true}
                  />
                </div>
              </TabsContent>

              <TabsContent value="shared" className="mt-0">
                <div className="px-4 pb-4">
                  <SharedNotes 
                    notes={sharedNotes}
                    gameId={gameId}
                    view={activeView}
                    canEdit={false}
                  />
                </div>
              </TabsContent>

              <TabsContent value="handouts" className="mt-0">
                <div className="px-4 pb-4">
                  <SharedNotes 
                    notes={publicNotes}
                    gameId={gameId}
                    view={activeView}
                    canEdit={isGameMaster}
                    isPublic={true}
                  />
                </div>
              </TabsContent>
            </ScrollArea>
          </Tabs>
        )}

        {/* Empty state for notes list */}
        {!isCreating && !isEditing && !currentNote && filteredNotes.length === 0 && selectedTab === 'my-notes' && (
          <div className="text-center text-muted-foreground py-12">
            <BookOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No notes found</p>
            <p className="text-xs mb-4">Create your first note to get started</p>
            <Button onClick={handleCreateNote} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Create Note
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}