'use client'

import { useState } from 'react'
import { useCombatStore } from '@/stores/combat-store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  Heart, 
  Shield,
  Swords,
  Crown
} from 'lucide-react'
import { CombatParticipant } from '@/types/combat'
import { cn } from '@/lib/utils'

interface TurnOrderProps {
  participants: CombatParticipant[]
  currentTurn: number
  selectedParticipant?: string | null
  onSelectParticipant: (id: string | null) => void
  isGameMaster: boolean
}

export default function TurnOrder({ 
  participants, 
  currentTurn, 
  selectedParticipant,
  onSelectParticipant,
  isGameMaster 
}: TurnOrderProps) {
  const {
    updateParticipant,
    removeParticipant,
    moveParticipant,
    startEditingParticipant,
  } = useCombatStore()

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [participantToDelete, setParticipantToDelete] = useState<string | null>(null)

  const handleDeleteParticipant = (participantId: string) => {
    setParticipantToDelete(participantId)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = () => {
    if (participantToDelete) {
      removeParticipant(participantToDelete)
      if (selectedParticipant === participantToDelete) {
        onSelectParticipant(null)
      }
    }
    setDeleteDialogOpen(false)
    setParticipantToDelete(null)
  }

  const toggleVisibility = (participant: CombatParticipant) => {
    updateParticipant(participant.id, { isVisible: !participant.isVisible })
  }

  const getHealthColor = (current: number, max: number) => {
    const percentage = (current / max) * 100
    if (percentage > 75) return 'bg-green-500'
    if (percentage > 50) return 'bg-yellow-500'
    if (percentage > 25) return 'bg-orange-500'
    return 'bg-red-500'
  }

  return (
    <div className="space-y-2">
      {participants.map((participant, index) => {
        const isCurrentTurn = index === currentTurn
        const isSelected = selectedParticipant === participant.id
        const healthPercentage = participant.currentHP && participant.maxHP 
          ? (participant.currentHP / participant.maxHP) * 100 
          : 0

        return (
          <div
            key={participant.id}
            className={cn(
              'p-3 rounded-lg border transition-all cursor-pointer',
              isCurrentTurn && 'ring-2 ring-primary bg-primary/5',
              isSelected && 'border-primary bg-primary/10',
              !participant.isVisible && 'opacity-50',
              'hover:bg-muted/50'
            )}
            onClick={() => onSelectParticipant(isSelected ? null : participant.id)}
          >
            <div className="flex items-start justify-between">
              {/* Left side: Name, initiative, conditions */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex items-center gap-1">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-xs font-bold">
                      {index + 1}
                    </div>
                    {participant.isNPC ? (
                      <Swords className="h-3 w-3 text-red-500" />
                    ) : (
                      <Crown className="h-3 w-3 text-blue-500" />
                    )}
                  </div>
                  
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold truncate">
                      {participant.npcName || `Character ${participant.characterId}`}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Initiative: {participant.initiative}
                    </div>
                  </div>

                  <Badge variant="outline" className="ml-1">
                    {participant.initiative}
                  </Badge>
                </div>

                {/* Health bar */}
                {participant.currentHP !== undefined && participant.maxHP !== undefined && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs">
                      <Heart className="h-3 w-3 text-red-500" />
                      <span>{participant.currentHP}/{participant.maxHP}</span>
                      {participant.armorClass && (
                        <>
                          <Shield className="h-3 w-3 text-blue-500" />
                          <span>AC {participant.armorClass}</span>
                        </>
                      )}
                    </div>
                    <Progress 
                      value={healthPercentage} 
                      className="h-2"
                    />
                  </div>
                )}

                {/* Conditions */}
                {participant.conditions.length > 0 && (
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {participant.conditions.map((condition, i) => (
                      <Badge key={i} variant="destructive" className="text-xs">
                        {condition.name}
                        {condition.duration && ` (${condition.duration})`}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Right side: Actions menu (GM only) */}
              {isGameMaster && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => startEditingParticipant(participant)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => toggleVisibility(participant)}>
                      {participant.isVisible ? (
                        <><EyeOff className="h-4 w-4 mr-2" />Hide</>
                      ) : (
                        <><Eye className="h-4 w-4 mr-2" />Show</>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => handleDeleteParticipant(participant.id)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remove
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            {/* Turn indicator */}
            {isCurrentTurn && (
              <div className="flex items-center justify-center mt-2 text-xs text-primary font-semibold">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                  Current Turn
                </div>
              </div>
            )}
          </div>
        )
      })}

      {participants.length === 0 && (
        <div className="text-center text-muted-foreground py-8">
          <Swords className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No participants in combat</p>
          <p className="text-xs">Add characters or NPCs to start combat</p>
        </div>
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Participant</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this participant from combat? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}