// Notes System Types

export interface Note {
  id: string
  gameId: string
  userId: string
  title: string
  content: string
  category?: string
  tags: string[]
  isPublic: boolean // Master handouts visible to all
  sharedWith: string[] // User IDs with access
  attachments: NoteAttachment[]
  linkedMessages: string[] // Message IDs
  version: number
  createdAt: string
  updatedAt: string
}

export interface NoteAttachment {
  id: string
  url: string
  name: string
  type: 'image' | 'file'
  size: number
}

export interface NoteSummary {
  id: string
  title: string
  category?: string
  tags: string[]
  isPublic: boolean
  isOwn: boolean
  authorName: string
  updatedAt: string
}

export interface NoteCategory {
  name: string
  icon: string
  color: string
  count: number
}

export interface NoteShareSettings {
  userIds: string[]
  allowEdit: boolean
  notifyUsers: boolean
}

export interface NoteSearchFilter {
  query?: string
  category?: string
  tags?: string[]
  author?: string
  isPublic?: boolean
  dateRange?: {
    start: Date
    end: Date
  }
}

export interface NoteSearchResult {
  note: NoteSummary
  matches: {
    title?: boolean
    content?: boolean
    tags?: boolean
  }
  score: number
}

// Default categories for organization
export const NOTE_CATEGORIES = {
  CHARACTERS: {
    name: 'Characters',
    icon: 'Users',
    color: 'blue',
  },
  LOCATIONS: {
    name: 'Locations', 
    icon: 'Map',
    color: 'green',
  },
  QUESTS: {
    name: 'Quests',
    icon: 'Target',
    color: 'purple',
  },
  NPCS: {
    name: 'NPCs',
    icon: 'UserCheck',
    color: 'orange',
  },
  LORE: {
    name: 'Lore',
    icon: 'Book',
    color: 'indigo',
  },
  ITEMS: {
    name: 'Items',
    icon: 'Package',
    color: 'yellow',
  },
  RULES: {
    name: 'Rules',
    icon: 'FileText',
    color: 'gray',
  },
  SESSION: {
    name: 'Session Notes',
    icon: 'Calendar',
    color: 'red',
  },
  OTHER: {
    name: 'Other',
    icon: 'Folder',
    color: 'slate',
  },
} as const

export type NoteCategoryKey = keyof typeof NOTE_CATEGORIES