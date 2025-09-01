'use client'

import { useState, useEffect } from 'react'
import type { Combat } from '@/types/combat'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Activity, 
  Clock, 
  Swords, 
  UserPlus, 
  UserX, 
  Play, 
  Square,
  SkipForward,
  Heart,
  Shield,
  Zap
} from 'lucide-react'

interface CombatLogProps {
  combat: Combat
}

interface LogEntry {
  id: string
  timestamp: Date
  type: 'combat_start' | 'combat_end' | 'turn_change' | 'round_change' | 'participant_added' | 'participant_removed' | 'damage' | 'healing' | 'condition' | 'initiative'
  message: string
  participant?: string
  details?: any
}

export default function CombatLog({ combat }: CombatLogProps) {
  const [logEntries, setLogEntries] = useState<LogEntry[]>([])

  // In a real implementation, this would come from the database or real-time updates
  // For now, we'll generate some mock log entries based on combat state
  useEffect(() => {
    generateMockLogEntries()
  }, [combat])

  const generateMockLogEntries = () => {
    const entries: LogEntry[] = []
    
    // Combat start
    if (combat.isActive || !combat.isActive) {
      entries.push({
        id: 'combat-start',
        timestamp: new Date(combat.createdAt),
        type: 'combat_start',
        message: `Combat "${combat.name}" started`,
      })
    }

    // Participant additions
    combat.participants.forEach((participant, index) => {
      entries.push({
        id: `participant-${participant.id}`,
        timestamp: new Date(participant.createdAt),
        type: 'participant_added',
        message: `${participant.npcName || 'Character'} joined the combat`,
        participant: participant.npcName || 'Character',
        details: {
          initiative: participant.initiative,
          hp: participant.currentHP ? `${participant.currentHP}/${participant.maxHP} HP` : null,
          ac: participant.armorClass ? `AC ${participant.armorClass}` : null
        }
      })
    })

    // Round changes
    for (let round = 1; round <= combat.round; round++) {
      entries.push({
        id: `round-${round}`,
        timestamp: new Date(Date.now() - (combat.round - round) * 60000), // Mock timestamps
        type: 'round_change',
        message: `Round ${round} begins`,
      })
    }

    // Sort by timestamp
    entries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    
    setLogEntries(entries)
  }

  const getLogIcon = (type: LogEntry['type']) => {
    switch (type) {
      case 'combat_start':
        return <Play className="h-4 w-4 text-green-500" />
      case 'combat_end':
        return <Square className="h-4 w-4 text-red-500" />
      case 'turn_change':
        return <SkipForward className="h-4 w-4 text-blue-500" />
      case 'round_change':
        return <Activity className="h-4 w-4 text-purple-500" />
      case 'participant_added':
        return <UserPlus className="h-4 w-4 text-green-500" />
      case 'participant_removed':
        return <UserX className="h-4 w-4 text-red-500" />
      case 'damage':
        return <Swords className="h-4 w-4 text-red-500" />
      case 'healing':
        return <Heart className="h-4 w-4 text-green-500" />
      case 'condition':
        return <Zap className="h-4 w-4 text-yellow-500" />
      case 'initiative':
        return <Shield className="h-4 w-4 text-blue-500" />
      default:
        return <Activity className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getLogBadgeVariant = (type: LogEntry['type']) => {
    switch (type) {
      case 'combat_start':
      case 'participant_added':
      case 'healing':
        return 'default'
      case 'combat_end':
      case 'participant_removed':
      case 'damage':
        return 'destructive'
      case 'condition':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }

  const formatRelativeTime = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return date.toLocaleDateString()
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Combat Log
          </CardTitle>
          <Badge variant="outline">
            {logEntries.length} entries
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {logEntries.length > 0 ? (
          <ScrollArea className="h-96 pr-4">
            <div className="space-y-4">
              {logEntries.map(entry => (
                <div key={entry.id} className="flex gap-3 pb-4 border-b border-border/50 last:border-b-0">
                  <div className="flex-shrink-0 mt-1">
                    {getLogIcon(entry.type)}
                  </div>
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between">
                      <p className="text-sm font-medium">
                        {entry.message}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span title={formatTime(entry.timestamp)}>
                          {formatRelativeTime(entry.timestamp)}
                        </span>
                      </div>
                    </div>
                    
                    {entry.participant && (
                      <Badge variant={getLogBadgeVariant(entry.type)} className="text-xs">
                        {entry.participant}
                      </Badge>
                    )}
                    
                    {entry.details && (
                      <div className="flex gap-2 text-xs text-muted-foreground">
                        {entry.details.initiative && (
                          <span>Initiative: {entry.details.initiative}</span>
                        )}
                        {entry.details.hp && (
                          <span>• {entry.details.hp}</span>
                        )}
                        {entry.details.ac && (
                          <span>• {entry.details.ac}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Activity className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Combat Activity</h3>
            <p className="text-muted-foreground text-sm">
              Combat events will appear here as they happen.
            </p>
          </div>
        )}
        
        {/* Combat Statistics */}
        <div className="mt-6 pt-6 border-t grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold">{combat.round}</div>
            <div className="text-sm text-muted-foreground">Rounds</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{combat.participants.length}</div>
            <div className="text-sm text-muted-foreground">Participants</div>
          </div>
          <div>
            <div className="text-2xl font-bold">
              {combat.participants.filter(p => !p.isNPC).length}
            </div>
            <div className="text-sm text-muted-foreground">Players</div>
          </div>
          <div>
            <div className="text-2xl font-bold">
              {combat.participants.filter(p => p.isNPC).length}
            </div>
            <div className="text-sm text-muted-foreground">NPCs</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}