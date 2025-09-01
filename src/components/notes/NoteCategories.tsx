'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Users, 
  Map, 
  Target, 
  UserCheck, 
  Book, 
  Package, 
  FileText, 
  Calendar, 
  Folder,
  Hash
} from 'lucide-react'
import { NOTE_CATEGORIES, type NoteCategoryKey } from '@/types/notes'

interface NoteCategoriesProps {
  selectedCategory: string | null
  onSelectCategory: (category: string | null) => void
}

const categoryIcons = {
  CHARACTERS: Users,
  LOCATIONS: Map,
  QUESTS: Target,
  NPCS: UserCheck,
  LORE: Book,
  ITEMS: Package,
  RULES: FileText,
  SESSION: Calendar,
  OTHER: Folder,
}

export default function NoteCategories({ selectedCategory, onSelectCategory }: NoteCategoriesProps) {
  const categories = Object.entries(NOTE_CATEGORIES)

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">Categories</h4>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onSelectCategory(null)}
          className={`h-6 px-2 text-xs ${selectedCategory === null ? 'bg-primary/10' : ''}`}
        >
          <Hash className="h-3 w-3 mr-1" />
          All
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-1">
        {categories.map(([key, category]) => {
          const Icon = categoryIcons[key as NoteCategoryKey]
          const isSelected = selectedCategory === key
          
          return (
            <Button
              key={key}
              variant={isSelected ? 'default' : 'outline'}
              size="sm"
              onClick={() => onSelectCategory(key)}
              className={`h-8 justify-start px-2 text-xs ${
                isSelected ? '' : 'hover:bg-muted/50'
              }`}
            >
              <Icon className="h-3 w-3 mr-1" />
              <span className="truncate">{category.name}</span>
              <Badge 
                variant="secondary" 
                className="ml-auto text-xs h-4 px-1"
              >
                {category.count || 0}
              </Badge>
            </Button>
          )
        })}
      </div>

      {selectedCategory && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onSelectCategory(null)}
          className="w-full h-6 text-xs text-muted-foreground"
        >
          Clear filter
        </Button>
      )}
    </div>
  )
}