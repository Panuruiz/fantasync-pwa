'use client'

import { useState } from 'react'
import { nextTurn, toggleCombatPause, rollInitiative } from '@/lib/api/combat'
import type { Combat } from '@/types/combat'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { 
  Play, 
  Square, 
  Pause, 
  SkipForward, 
  Dice1, 
  UserPlus, 
  RotateCcw 
} from 'lucide-react'

interface CombatControlsProps {
  combat: Combat
  onCombatUpdate: (combat: Combat) => void
  onStartCombat: () => void
  onEndCombat: () => void
  onAddParticipant: () => void
}

export default function CombatControls({
  combat,
  onCombatUpdate,
  onStartCombat,
  onEndCombat,
  onAddParticipant
}: CombatControlsProps) {
  const [loading, setLoading] = useState<string | null>(null)

  const currentParticipant = combat.participants
    .sort((a, b) => a.turnOrder - b.turnOrder)[combat.currentTurn]

  const handleNextTurn = async () => {
    setLoading('next-turn')
    try {
      const updatedCombat = await nextTurn(combat.id)
      onCombatUpdate(updatedCombat)
    } catch (error) {
      console.error('Error advancing turn:', error)
    } finally {
      setLoading(null)
    }
  }

  const handleTogglePause = async () => {
    setLoading('pause')
    try {
      const updatedCombat = await toggleCombatPause(combat.id)
      onCombatUpdate(updatedCombat)
    } catch (error) {
      console.error('Error toggling pause:', error)
    } finally {
      setLoading(null)
    }
  }

  const handleRollInitiative = async () => {
    setLoading('initiative')
    try {
      const participantIds = combat.participants.map(p => p.id)
      await rollInitiative(combat.id, participantIds)
      
      // Reload combat to get updated initiative order
      // This would typically be handled by real-time updates
      window.location.reload() // Temporary solution
    } catch (error) {
      console.error('Error rolling initiative:', error)
    } finally {
      setLoading(null)
    }
  }

  if (!combat.isActive) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Inactive</Badge>
              <span className="text-sm text-muted-foreground">
                Combat is not active
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                onClick={onAddParticipant}
                variant="outline"
                size="sm"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Add Participant
              </Button>
              
              <Button
                onClick={handleRollInitiative}
                variant="outline"
                size="sm"
                disabled={loading === 'initiative' || combat.participants.length === 0}
              >
                <Dice1 className="h-4 w-4 mr-2" />
                Roll Initiative
              </Button>
              
              <Button
                onClick={onStartCombat}
                disabled={combat.participants.length === 0}
              >
                <Play className="h-4 w-4 mr-2" />
                Start Combat
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          {/* Status */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Badge variant={combat.isPaused ? 'destructive' : 'default'}>
                {combat.isPaused ? 'Paused' : 'Active'}
              </Badge>
              <span className="text-sm text-muted-foreground">
                Round {combat.round}
              </span>
              {currentParticipant && (
                <>
                  <Separator orientation="vertical" className="h-4" />
                  <span className="text-sm font-medium">
                    {currentParticipant.npcName || 'Character'}'s turn
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            <Button
              onClick={onAddParticipant}
              variant="outline"
              size="sm"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Add Participant
            </Button>

            <Button
              onClick={handleRollInitiative}
              variant="outline"
              size="sm"
              disabled={loading === 'initiative'}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Re-roll Initiative
            </Button>

            <Separator orientation="vertical" className="h-6" />

            <Button
              onClick={handleTogglePause}
              variant="outline"
              size="sm"
              disabled={loading === 'pause'}
            >
              {combat.isPaused ? (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Resume
                </>
              ) : (
                <>
                  <Pause className="h-4 w-4 mr-2" />
                  Pause
                </>
              )}
            </Button>

            <Button
              onClick={handleNextTurn}
              disabled={loading === 'next-turn' || combat.isPaused}
              size="sm"
            >
              <SkipForward className="h-4 w-4 mr-2" />
              Next Turn
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Square className="h-4 w-4 mr-2" />
                  End Combat
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>End Combat?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will end the current combat encounter. Participants will remain
                    but combat will become inactive. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={onEndCombat} className="bg-destructive text-destructive-foreground">
                    End Combat
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Additional Info Bar */}
        {combat.isActive && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                {combat.participants.length} participant(s) in initiative order
              </span>
              {combat.turnTimer && (
                <span>
                  Turn timer: {combat.turnTimer}s per turn
                </span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}