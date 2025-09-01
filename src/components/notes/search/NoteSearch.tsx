'use client'

import { useState, useEffect } from 'react'
import type { NoteSearchFilter } from '@/types/notes'
import { NOTE_CATEGORIES } from '@/types/notes'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { 
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command'
import { 
  Search, 
  Filter, 
  X, 
  Calendar, 
  Tag, 
  User, 
  Eye, 
  EyeOff 
} from 'lucide-react'

interface NoteSearchProps {
  onSearch: (filters: NoteSearchFilter) => void
  categories: Array<{ name: string; count: number }>
}

export default function NoteSearch({ onSearch, categories }: NoteSearchProps) {
  const [query, setQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [visibilityFilter, setVisibilityFilter] = useState<'all' | 'public' | 'private'>('all')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [tagInputOpen, setTagInputOpen] = useState(false)
  
  // Available tags (in a real app, this would come from the API)
  const availableTags = [
    'important', 'quest', 'npc', 'location', 'item', 'lore', 'rules', 'combat', 'session-notes'
  ]

  useEffect(() => {
    const filters: NoteSearchFilter = {}
    
    if (query.trim()) filters.query = query.trim()
    if (selectedCategory) filters.category = selectedCategory
    if (selectedTags.length > 0) filters.tags = selectedTags
    if (visibilityFilter !== 'all') filters.isPublic = visibilityFilter === 'public'
    
    onSearch(filters)
  }, [query, selectedCategory, selectedTags, visibilityFilter, onSearch])

  const handleTagSelect = (tag: string) => {
    if (!selectedTags.includes(tag)) {
      setSelectedTags(prev => [...prev, tag])
    }
    setTagInputOpen(false)
  }

  const handleTagRemove = (tagToRemove: string) => {
    setSelectedTags(prev => prev.filter(tag => tag !== tagToRemove))
  }

  const clearAllFilters = () => {
    setQuery('')
    setSelectedCategory('')
    setSelectedTags([])
    setVisibilityFilter('all')
  }

  const hasActiveFilters = query || selectedCategory || selectedTags.length > 0 || visibilityFilter !== 'all'
  const activeFilterCount = [
    query ? 1 : 0,
    selectedCategory ? 1 : 0,
    selectedTags.length,
    visibilityFilter !== 'all' ? 1 : 0
  ].reduce((sum, count) => sum + count, 0)

  return (
    <div className="space-y-3">
      {/* Main Search */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search notes..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Popover open={filtersOpen} onOpenChange={setFiltersOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="relative">
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {activeFilterCount > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">Filters</h4>
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllFilters}
                    className="text-xs"
                  >
                    Clear all
                  </Button>
                )}
              </div>

              {/* Category Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block">Category</label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All categories</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category.name} value={category.name}>
                        {category.name} ({category.count})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Visibility Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block">Visibility</label>
                <Select value={visibilityFilter} onValueChange={(value: 'all' | 'public' | 'private') => setVisibilityFilter(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        All notes
                      </div>
                    </SelectItem>
                    <SelectItem value="public">
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        Public only
                      </div>
                    </SelectItem>
                    <SelectItem value="private">
                      <div className="flex items-center gap-2">
                        <EyeOff className="h-4 w-4" />
                        Private only
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Tag Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block">Tags</label>
                <div className="space-y-2">
                  {selectedTags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {selectedTags.map(tag => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          <Tag className="h-3 w-3 mr-1" />
                          {tag}
                          <button
                            onClick={() => handleTagRemove(tag)}
                            className="ml-1 hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                  
                  <Popover open={tagInputOpen} onOpenChange={setTagInputOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="w-full justify-start">
                        <Tag className="h-4 w-4 mr-2" />
                        Add tag filter...
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56 p-0">
                      <Command>
                        <CommandInput placeholder="Search tags..." />
                        <CommandList>
                          <CommandEmpty>No tags found.</CommandEmpty>
                          <CommandGroup>
                            {availableTags
                              .filter(tag => !selectedTags.includes(tag))
                              .map(tag => (
                                <CommandItem
                                  key={tag}
                                  value={tag}
                                  onSelect={() => handleTagSelect(tag)}
                                >
                                  <Tag className="h-4 w-4 mr-2" />
                                  {tag}
                                </CommandItem>
                              ))
                            }
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 text-sm">
          {query && (
            <Badge variant="outline" className="gap-1">
              <Search className="h-3 w-3" />
              "{query}"
              <button
                onClick={() => setQuery('')}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          
          {selectedCategory && (
            <Badge variant="outline" className="gap-1">
              <Filter className="h-3 w-3" />
              {selectedCategory}
              <button
                onClick={() => setSelectedCategory('')}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          
          {selectedTags.map(tag => (
            <Badge key={tag} variant="outline" className="gap-1">
              <Tag className="h-3 w-3" />
              {tag}
              <button
                onClick={() => handleTagRemove(tag)}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          
          {visibilityFilter !== 'all' && (
            <Badge variant="outline" className="gap-1">
              {visibilityFilter === 'public' ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
              {visibilityFilter}
              <button
                onClick={() => setVisibilityFilter('all')}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}