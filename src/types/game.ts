// Game Core System Types
// Matches Prisma schema for Game models

export type GameSystem = 'DND5E' | 'PATHFINDER2E' | 'CALL_OF_CTHULHU' | 'VAMPIRE' | 'CUSTOM'
export type GamePrivacy = 'PRIVATE' | 'FRIENDS' | 'PUBLIC'
export type GameStatus = 'PREPARING' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'ARCHIVED'
export type PlayerRole = 'MASTER' | 'PLAYER' | 'SPECTATOR'
export type MessageType = 'CHAT' | 'DICE_ROLL' | 'SYSTEM' | 'ACTION' | 'NARRATION'
export type InvitationType = 'DIRECT' | 'LINK' | 'REQUEST'
export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED' | 'CANCELLED'
export type AttachmentType = 'IMAGE' | 'MAP' | 'CHARACTER_SHEET' | 'HANDOUT' | 'AUDIO'

export interface Game {
  id: string
  name: string
  description?: string
  campaignName?: string
  system: GameSystem
  coverImage?: string
  themeColor?: string
  privacy: GamePrivacy
  maxPlayers: number
  status: GameStatus
  currentSession: number
  nextSession?: Date
  settings: Record<string, any>
  masterId: string
  createdAt: Date
  updatedAt: Date

  // Relations
  master?: User
  players?: GamePlayer[]
  invitations?: GameInvitation[]
  messages?: Message[]
  characters?: Character[]
}

export interface GamePlayer {
  id: string
  gameId: string
  userId: string
  role: PlayerRole
  joinedAt: Date
  lastSeenAt: Date
  isActive: boolean

  // Relations
  game?: Game
  user?: User
}

export interface Message {
  id: string
  gameId: string
  authorId: string
  content: string
  type: MessageType
  metadata?: Record<string, any> // For dice rolls, system messages, etc.
  isEdited: boolean
  editedAt?: Date
  createdAt: Date

  // Relations
  game?: Game
  author?: User
  attachments?: MessageAttachment[]
}

export interface GameInvitation {
  id: string
  code: string
  type: InvitationType
  status: InvitationStatus
  expiresAt?: Date
  message?: string
  createdAt: Date
  usedAt?: Date

  // Relations
  gameId: string
  game?: Game
  invitedById: string
  invitedBy?: User
  invitedUserId?: string
  invitedUser?: User
}

export interface MessageAttachment {
  id: string
  type: AttachmentType
  url: string
  name: string
  size: number
  mimeType?: string
  messageId: string
  message?: Message
}

export interface Character {
  id: string
  gameId: string
  playerId: string
  name: string
  avatarUrl?: string
  data: Record<string, any> // Character sheet data
  isActive: boolean
  createdAt: Date
  updatedAt: Date

  // Relations
  game?: Game
  player?: User
}

// Basic User type (we'll import from existing types when needed)
export interface User {
  id: string
  email: string
  username: string
  avatarUrl?: string
}

// Frontend-specific types
export interface GameSummary {
  id: string
  name: string
  system: GameSystem
  masterId: string
  masterName: string
  playerCount: number
  maxPlayers: number
  lastActivity: Date
  unreadMessages: number
  status: GameStatus
  privacy: GamePrivacy
  coverImage?: string
  myCharacters: {
    id: string
    name: string
    avatarUrl?: string
  }[]
}

export interface ChatMessage extends Message {
  author: User
  attachments: MessageAttachment[]
  isOptimistic?: boolean // For optimistic updates
}

export interface GameChannel {
  gameId: string
  messages: ChatMessage[]
  onlineUsers: string[]
  typingUsers: string[]
  isConnected: boolean
}

// Game creation wizard types
export interface GameCreationData {
  // Step 1: Basic Info
  name: string
  description?: string
  campaignName?: string
  system: GameSystem
  
  // Step 2: Visuals
  coverImage?: string
  themeColor?: string
  
  // Step 3: Settings
  privacy: GamePrivacy
  maxPlayers: number
  
  // Step 4: Players (optional)
  inviteEmails?: string[]
  inviteMessage?: string
}

// Real-time events
export interface GameEvent {
  type: 'MESSAGE' | 'USER_JOINED' | 'USER_LEFT' | 'TYPING_START' | 'TYPING_STOP' | 'GAME_UPDATED'
  payload: any
  timestamp: Date
}

export interface TypingEvent {
  userId: string
  username: string
  gameId: string
}

// Game presence
export interface GamePresence {
  userId: string
  username: string
  avatarUrl?: string
  status: 'online' | 'away' | 'busy'
  lastSeen: Date
}

// Dice roll metadata
export interface DiceRollMetadata {
  formula: string // e.g., "1d20+5"
  results: number[] // Individual die results
  total: number
  modifier: number
  reason?: string // e.g., "Attack roll"
  isAdvantage?: boolean
  isDisadvantage?: boolean
}

// System message metadata
export interface SystemMessageMetadata {
  action: string // e.g., "user_joined", "game_started", "session_ended"
  actor?: string // User who triggered the action
  details?: Record<string, any>
}