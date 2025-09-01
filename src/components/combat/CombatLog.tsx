'use client'

import { useCombatStore } from '@/stores/combat-store'
import { zClass } from '@/lib/utils/z-index'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  FileText, 
  Sword, 
  Heart, 
  Shield,
  Clock,
  User,
  Target,
  AlertTriangle,
  Play,
  Pause,
  Square,
  RotateCcw
} from 'lucide-react'
import { CombatEvent } from '@/types/combat'
import { formatDistanceToNow } from 'date-fns'

interface CombatLogProps {
  gameId: string
}

export default function CombatLog({ gameId }: CombatLogProps) {
  const {
    combatEvents,
    isCombatLogOpen,
    toggleCombatLog,
    clearCombatEvents,
  } = useCombatStore()

  if (!isCombatLogOpen) return null

  const getEventIcon = (eventType: CombatEvent['type']) => {
    switch (eventType) {
      case 'COMBAT_STARTED': return <Play className="h-4 w-4 text-green-500" />
      case 'COMBAT_ENDED': return <Square className="h-4 w-4 text-red-500" />
      case 'ROUND_STARTED': return <RotateCcw className="h-4 w-4 text-blue-500" />
      case 'TURN_CHANGED': return <Clock className="h-4 w-4 text-purple-500" />
      case 'PARTICIPANT_ADDED': return <User className="h-4 w-4 text-green-500" />
      case 'PARTICIPANT_REMOVED': return <User className="h-4 w-4 text-red-500" />
      case 'DAMAGE_DEALT': return <Sword className="h-4 w-4 text-red-500" />
      case 'CONDITION_APPLIED': return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'CONDITION_REMOVED': return <Shield className="h-4 w-4 text-blue-500" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  const getEventDescription = (event: CombatEvent) => {
    switch (event.type) {
      case 'COMBAT_STARTED':
        return `Combat started with ${event.data.participants?.length || 0} participants`
      
      case 'COMBAT_ENDED':
        return `Combat ended after ${event.data.finalRound} rounds`
      
      case 'ROUND_STARTED':
        return `Round ${event.data.round} started`
      
      case 'TURN_CHANGED':
        return `Turn ${event.data.turn + 1} - ${event.data.participant || 'Unknown'}'s turn`
      
      case 'PARTICIPANT_ADDED':
        const addedName = event.data.participant?.npcName || event.data.participant?.characterId
        return `${addedName} joined the combat`
      
      case 'PARTICIPANT_REMOVED':
        return `Participant removed from combat`
      
      case 'DAMAGE_DEALT':
        const { damage, damageType, participantId, newHP, isDead, isUnconscious } = event.data
        let description = `${damage} ${damageType} damage dealt`
        if (isDead) description += ' (DEAD)'
        else if (isUnconscious) description += ' (UNCONSCIOUS)'
        else description += ` (${newHP} HP remaining)`
        return description
      
      case 'CONDITION_APPLIED':
        const { condition } = event.data
        return `${condition.name} condition applied${condition.duration ? ` (${condition.duration} rounds)` : ''}`
      
      case 'CONDITION_REMOVED':
        return `${event.data.conditionName} condition removed`
      
      default:
        return 'Unknown combat event'
    }
  }

  const getEventColor = (eventType: CombatEvent['type']) => {
    switch (eventType) {
      case 'COMBAT_STARTED': return 'bg-green-500/10 text-green-700 dark:text-green-300'
      case 'COMBAT_ENDED': return 'bg-red-500/10 text-red-700 dark:text-red-300'
      case 'ROUND_STARTED': return 'bg-blue-500/10 text-blue-700 dark:text-blue-300'
      case 'TURN_CHANGED': return 'bg-purple-500/10 text-purple-700 dark:text-purple-300'
      case 'PARTICIPANT_ADDED': return 'bg-green-500/10 text-green-700 dark:text-green-300'
      case 'PARTICIPANT_REMOVED': return 'bg-red-500/10 text-red-700 dark:text-red-300'
      case 'DAMAGE_DEALT': return 'bg-red-500/10 text-red-700 dark:text-red-300'
      case 'CONDITION_APPLIED': return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-300'
      case 'CONDITION_REMOVED': return 'bg-blue-500/10 text-blue-700 dark:text-blue-300'
      default: return 'bg-muted'
    }
  }

  return (
    <Card className={`fixed bottom-4 left-4 w-96 max-h-96 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85 ${zClass('combatLog')} border`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Combat Log
          </CardTitle>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={clearCombatEvents}
              className="h-8 px-2 text-xs"
            >
              Clear
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleCombatLog}
              className="h-8 w-8 p-0"
            >
              ×
            </Button>
          </div>
        </div>
        
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{combatEvents.length} events</span>
          <Badge variant="outline">
            Live
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        <ScrollArea className="h-72">
          <div className="space-y-2">
            {combatEvents.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No combat events yet</p>
                <p className="text-xs">Events will appear here as combat progresses</p>
              </div>
            ) : (
              combatEvents
                .slice()
                .reverse() // Show most recent first
                .map((event, index) => (
                  <div
                    key={`${event.timestamp}-${index}`}
                    className={`p-3 rounded-lg border ${getEventColor(event.type)}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        {getEventIcon(event.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">
                          {getEventDescription(event)}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}