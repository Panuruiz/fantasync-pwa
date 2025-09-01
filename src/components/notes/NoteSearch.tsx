'use client'

import { useState } from 'react'
import { useNotesStore } from '@/stores/notes-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Search, 
  Filter, 
  X, 
  Calendar, 
  User, 
  Tag, 
  FileText,
  Loader2
} from 'lucide-react'
import { NOTE_CATEGORIES } from '@/types/notes'
import type { NoteSearchResult } from '@/types/notes'
import { formatDistanceToNow } from 'date-fns'

interface NoteSearchProps {
  gameId: string
}

export default function NoteSearch({ gameId }: NoteSearchProps) {
  const {
    searchQuery,
    setSearchQuery,
    searchFilter,
    setSearchFilter,
    searchResults,
    isSearching,
    performSearch,
    clearSearchFilter,
  } = useNotesStore()

  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [tempQuery, setTempQuery] = useState(searchQuery)

  const handleSearch = async () => {
    setSearchQuery(tempQuery)
    await performSearch()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const clearSearch = () => {
    setTempQuery('')
    setSearchQuery('')
    clearSearchFilter()
  }

  const highlightMatch = (text: string, query: string) => {
    if (!query) return text
    
    const regex = new RegExp(`(${query})`, 'gi')
    const parts = text.split(regex)
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 dark:bg-yellow-800">
          {part}
        </mark>
      ) : part
    )
  }

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={tempQuery}
            onChange={(e) => setTempQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search notes by title or content..."
            className="pl-10"
          />
        </div>
        <Button onClick={handleSearch} disabled={isSearching}>
          {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
        </Button>
        <Button 
          variant="outline"
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
        >
          <Filter className="h-4 w-4" />
        </Button>
        {(searchQuery || Object.values(searchFilter).some(v => v !== undefined && v !== '')) && (
          <Button variant="ghost" onClick={clearSearch}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Advanced Filters */}
      {showAdvancedFilters && (
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Category</label>
                <Select
                  value={searchFilter.category || ''}
                  onValueChange={(value) => setSearchFilter({ category: value || undefined })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Any category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any category</SelectItem>
                    {Object.entries(NOTE_CATEGORIES).map(([key, category]) => (
                      <SelectItem key={key} value={key}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Visibility</label>
                <Select
                  value={searchFilter.isPublic?.toString() || ''}
                  onValueChange={(value) => 
                    setSearchFilter({ 
                      isPublic: value === '' ? undefined : value === 'true' 
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Any visibility" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any visibility</SelectItem>
                    <SelectItem value="false">Private notes</SelectItem>
                    <SelectItem value="true">Public handouts</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-4">
              <label className="text-sm font-medium mb-2 block">Tags</label>
              <Input
                placeholder="Enter tags separated by commas"
                value={searchFilter.tags?.join(', ') || ''}
                onChange={(e) => {
                  const tags = e.target.value
                    .split(',')
                    .map(tag => tag.trim())
                    .filter(tag => tag.length > 0)
                  setSearchFilter({ tags: tags.length > 0 ? tags : undefined })
                }}
              />
            </div>

            <div className="mt-4 flex gap-2">
              <Button size="sm" onClick={handleSearch}>
                Apply Filters
              </Button>
              <Button size="sm" variant="outline" onClick={clearSearch}>
                Clear All
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search Results */}
      {searchQuery && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold">Search Results</h4>
            <Badge variant="outline">
              {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
            </Badge>
          </div>

          {isSearching ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
              <p className="text-muted-foreground">Searching notes...</p>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No notes found matching your search</p>
              <p className="text-sm">Try different keywords or filters</p>
            </div>
          ) : (
            <ScrollArea className="h-64">
              <div className="space-y-2">
                {searchResults.map((result) => (
                  <Card 
                    key={result.note.id} 
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h5 className="font-semibold text-sm mb-1">
                            {highlightMatch(result.note.title, searchQuery)}
                          </h5>
                          
                          <div className="flex items-center gap-2 mb-2">
                            {result.note.category && (
                              <Badge variant="secondary" className="text-xs">
                                {result.note.category}
                              </Badge>
                            )}
                            {result.note.isPublic && (
                              <Badge variant="outline" className="text-xs">
                                Public
                              </Badge>
                            )}
                            {result.note.tags.slice(0, 2).map((tag, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                <Tag className="h-2 w-2 mr-1" />
                                {tag}
                              </Badge>
                            ))}
                          </div>

                          <div className="text-xs text-muted-foreground">
                            <div className="flex items-center gap-1 mb-1">
                              <User className="h-3 w-3" />
                              {result.note.authorName}
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDistanceToNow(new Date(result.note.updatedAt), { addSuffix: true })}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-xs text-muted-foreground mb-1">
                            Score: {Math.round(result.score * 100)}%
                          </div>
                          <div className="flex gap-1">
                            {result.matches.title && (
                              <Badge variant="outline" className="text-xs">
                                Title
                              </Badge>
                            )}
                            {result.matches.content && (
                              <Badge variant="outline" className="text-xs">
                                Content
                              </Badge>
                            )}
                            {result.matches.tags && (
                              <Badge variant="outline" className="text-xs">
                                Tags
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      )}
    </div>
  )
}