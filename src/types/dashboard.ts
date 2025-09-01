export interface UserStats {
  totalGames: number
  activeGames: number
  totalCharacters: number
  hoursPlayed: number
  friendsCount: number
  achievementsUnlocked: number
}

export interface GameSummary {
  id: string
  name: string
  system: string
  masterId: string
  masterName: string
  playerCount: number
  maxPlayers: number
  lastActivity: Date
  unreadMessages: number
  thumbnailUrl?: string
  nextSession?: Date
  myCharacters: CharacterPreview[]
}

export interface CharacterPreview {
  id: string
  name: string
  avatarUrl?: string
}

export interface ActivityItem {
  id: string
  type: 'message' | 'game_update' | 'friend_request' | 'level_up'
  title: string
  description: string
  gameId?: string
  timestamp: Date
  read: boolean
}

export interface Friend {
  id: string
  username: string
  avatarUrl?: string
  status: 'online' | 'away' | 'busy' | 'offline'
  statusMessage?: string
  currentGameId?: string
  currentGameName?: string
}

export interface FriendRequest {
  id: string
  userId: string
  username: string
  avatarUrl?: string
  createdAt: Date
  type: 'sent' | 'received'
}

export interface DashboardData {
  user: {
    id: string
    username: string
    avatarUrl?: string
    lastSeen: Date
    stats: UserStats
  }
  games: {
    active: GameSummary[]
    archived: GameSummary[]
    invitations: GameInvitation[]
  }
  friends: {
    online: Friend[]
    offline: Friend[]
    pending: FriendRequest[]
  }
  activity: ActivityItem[]
}

export interface GameInvitation {
  id: string
  gameId: string
  gameName: string
  masterName: string
  invitedAt: Date
}