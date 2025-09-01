'use client'

import { useState } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { updateTurnOrder, updateParticipant, removeParticipant } from '@/lib/api/combat'
import type { Combat, CombatParticipant, Condition } from '@/types/combat'

import TurnTimer from './TurnTimer'
import ConditionsManager from '../participants/ConditionsManager'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  Heart, 
  Shield, 
  MoreVertical, 
  Edit3, 
  Trash2, 
  Eye, 
  EyeOff,
  GripVertical,
  Zap
} from 'lucide-react'

interface TurnOrderProps {
  combat: Combat
  onCombatUpdate: (combat: Combat) => void
  isGameMaster: boolean
}

interface ParticipantEditState {
  id: string
  currentHP: string
  maxHP: string
  armorClass: string
  initiative: string
}

export default function TurnOrder({ combat, onCombatUpdate, isGameMaster }: TurnOrderProps) {
  const [editingParticipant, setEditingParticipant] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<ParticipantEditState | null>(null)
  const [conditionsDialogOpen, setConditionsDialogOpen] = useState(false)
  const [selectedParticipant, setSelectedParticipant] = useState<CombatParticipant | null>(null)

  const sortedParticipants = combat.participants.sort((a, b) => a.turnOrder - b.turnOrder)
  const currentParticipant = sortedParticipants[combat.currentTurn]

  const handleDragEnd = async (result: DropResult) => {
    if (!isGameMaster || !result.destination) return

    const items = Array.from(sortedParticipants)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    // Update turn order
    const participantOrders = items.map((participant, index) => ({
      id: participant.id,
      turnOrder: index
    }))

    try {
      await updateTurnOrder(combat.id, participantOrders)
      
      // Update local state
      const updatedParticipants = items.map((participant, index) => ({
        ...participant,
        turnOrder: index
      }))

      const updatedCombat = {
        ...combat,
        participants: updatedParticipants,
        // Adjust current turn if needed
        currentTurn: combat.currentTurn >= items.length ? 0 : combat.currentTurn
      }

      onCombatUpdate(updatedCombat)
    } catch (error) {
      console.error('Error updating turn order:', error)
    }
  }

  const handleEditParticipant = (participant: CombatParticipant) => {
    setEditingParticipant(participant.id)
    setEditForm({
      id: participant.id,
      currentHP: participant.currentHP?.toString() || '',
      maxHP: participant.maxHP?.toString() || '',
      armorClass: participant.armorClass?.toString() || '',
      initiative: participant.initiative.toString()
    })
  }

  const handleSaveEdit = async () => {
    if (!editForm || !editingParticipant) return

    try {
      const updatedParticipant = await updateParticipant({
        id: editingParticipant,
        currentHP: editForm.currentHP ? parseInt(editForm.currentHP) : undefined,
        maxHP: editForm.maxHP ? parseInt(editForm.maxHP) : undefined,
        armorClass: editForm.armorClass ? parseInt(editForm.armorClass) : undefined,
        initiative: parseInt(editForm.initiative)
      })

      // Update local state
      const updatedParticipants = combat.participants.map(p => 
        p.id === editingParticipant ? updatedParticipant : p
      )

      onCombatUpdate({
        ...combat,
        participants: updatedParticipants
      })

      setEditingParticipant(null)
      setEditForm(null)
    } catch (error) {
      console.error('Error updating participant:', error)
    }
  }

  const handleRemoveParticipant = async (participantId: string) => {
    if (!isGameMaster) return

    try {
      await removeParticipant(participantId)
      
      const updatedParticipants = combat.participants.filter(p => p.id !== participantId)
      
      // Adjust current turn if needed
      let newCurrentTurn = combat.currentTurn
      if (newCurrentTurn >= updatedParticipants.length) {
        newCurrentTurn = 0
      }

      onCombatUpdate({
        ...combat,
        participants: updatedParticipants,
        currentTurn: newCurrentTurn
      })
    } catch (error) {
      console.error('Error removing participant:', error)
    }
  }

  const handleToggleVisibility = async (participant: CombatParticipant) => {
    if (!isGameMaster) return

    try {
      const updatedParticipant = await updateParticipant({
        id: participant.id,
        isVisible: !participant.isVisible
      })

      const updatedParticipants = combat.participants.map(p => 
        p.id === participant.id ? updatedParticipant : p
      )

      onCombatUpdate({
        ...combat,
        participants: updatedParticipants
      })
    } catch (error) {
      console.error('Error toggling participant visibility:', error)
    }
  }

  const handleManageConditions = (participant: CombatParticipant) => {
    setSelectedParticipant(participant)
    setConditionsDialogOpen(true)
  }

  const handleConditionsUpdated = (conditions: Condition[]) => {
    if (!selectedParticipant) return

    const updatedParticipants = combat.participants.map(p => 
      p.id === selectedParticipant.id ? { ...p, conditions } : p
    )

    onCombatUpdate({
      ...combat,
      participants: updatedParticipants
    })
  }

  const getHealthPercentage = (participant: CombatParticipant) => {
    if (!participant.currentHP || !participant.maxHP) return 100
    return (participant.currentHP / participant.maxHP) * 100
  }

  const getHealthColor = (percentage: number) => {
    if (percentage > 75) return 'bg-green-500'
    if (percentage > 50) return 'bg-yellow-500'
    if (percentage > 25) return 'bg-orange-500'
    return 'bg-red-500'
  }

  return (
    <div className="space-y-4">
      {/* Current Turn Indicator */}
      {combat.isActive && currentParticipant && (
        <Card className="border-primary">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="font-semibold">
                  Current Turn: {currentParticipant.npcName || 'Character'}
                </span>
                <Badge>{currentParticipant.initiative} initiative</Badge>
              </div>
              {combat.turnTimer && (
                <TurnTimer 
                  duration={combat.turnTimer} 
                  isActive={combat.isActive && !combat.isPaused}
                />
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Turn Order List */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="turn-order">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef}>
              {sortedParticipants.map((participant, index) => {
                const isCurrentTurn = combat.isActive && index === combat.currentTurn
                const healthPercentage = getHealthPercentage(participant)
                const isVisible = participant.isVisible || !isGameMaster

                if (!isVisible && !isGameMaster) return null

                return (
                  <Draggable 
                    key={participant.id} 
                    draggableId={participant.id} 
                    index={index}
                    isDragDisabled={!isGameMaster}
                  >
                    {(provided, snapshot) => (
                      <Card
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`mb-3 transition-all ${
                          isCurrentTurn ? 'ring-2 ring-primary shadow-lg' : ''
                        } ${!participant.isVisible ? 'opacity-50' : ''} ${
                          snapshot.isDragging ? 'rotate-1 shadow-xl' : ''
                        }`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            {/* Drag Handle */}
                            {isGameMaster && (
                              <div {...provided.dragHandleProps}>
                                <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                              </div>
                            )}

                            {/* Initiative Badge */}
                            <Badge 
                              variant={isCurrentTurn ? 'default' : 'secondary'}
                              className="min-w-[3rem] justify-center"
                            >
                              {participant.initiative}
                            </Badge>

                            {/* Character/NPC Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={''} />
                                  <AvatarFallback>
                                    {(participant.npcName || 'C').charAt(0).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-medium truncate">
                                    {participant.npcName || 'Character'}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {participant.isNPC ? 'NPC' : 'Player Character'}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Stats */}
                            <div className="flex items-center gap-4 text-sm">
                              {/* Health */}
                              {participant.currentHP !== undefined && participant.maxHP !== undefined && (
                                <div className="flex items-center gap-2">
                                  <Heart className="h-4 w-4 text-red-500" />
                                  <span className="min-w-[3rem]">
                                    {editingParticipant === participant.id ? (
                                      <Input
                                        value={editForm?.currentHP || ''}
                                        onChange={(e) => setEditForm(prev => 
                                          prev ? { ...prev, currentHP: e.target.value } : null
                                        )}
                                        className="h-6 w-16 text-xs"
                                      />
                                    ) : (
                                      `${participant.currentHP}/${participant.maxHP}`
                                    )}
                                  </span>
                                  <Progress 
                                    value={healthPercentage} 
                                    className="w-20 h-2"
                                  />
                                </div>
                              )}

                              {/* Armor Class */}
                              {participant.armorClass && (
                                <div className="flex items-center gap-1">
                                  <Shield className="h-4 w-4 text-blue-500" />
                                  <span className="min-w-[1.5rem]">
                                    {editingParticipant === participant.id ? (
                                      <Input
                                        value={editForm?.armorClass || ''}
                                        onChange={(e) => setEditForm(prev => 
                                          prev ? { ...prev, armorClass: e.target.value } : null
                                        )}
                                        className="h-6 w-12 text-xs"
                                      />
                                    ) : (
                                      participant.armorClass
                                    )}
                                  </span>
                                </div>
                              )}

                              {/* Conditions */}
                              {participant.conditions.length > 0 && (
                                <div className="flex gap-1">
                                  {participant.conditions.slice(0, 3).map((condition, idx) => (
                                    <Badge key={idx} variant="destructive" className="text-xs">
                                      {condition.name}
                                    </Badge>
                                  ))}
                                  {participant.conditions.length > 3 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{participant.conditions.length - 3}
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Actions */}
                            {isGameMaster && (
                              <div className="flex items-center gap-1">
                                {editingParticipant === participant.id ? (
                                  <div className="flex gap-1">
                                    <Button size="sm" onClick={handleSaveEdit}>
                                      Save
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      onClick={() => {
                                        setEditingParticipant(null)
                                        setEditForm(null)
                                      }}
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                ) : (
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="sm">
                                        <MoreVertical className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem onClick={() => handleEditParticipant(participant)}>
                                        <Edit3 className="h-4 w-4 mr-2" />
                                        Edit Stats
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleManageConditions(participant)}>
                                        <Zap className="h-4 w-4 mr-2" />
                                        Conditions
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleToggleVisibility(participant)}>
                                        {participant.isVisible ? (
                                          <>
                                            <EyeOff className="h-4 w-4 mr-2" />
                                            Hide from Players
                                          </>
                                        ) : (
                                          <>
                                            <Eye className="h-4 w-4 mr-2" />
                                            Show to Players
                                          </>
                                        )}
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem 
                                        onClick={() => handleRemoveParticipant(participant.id)}
                                        className="text-destructive"
                                      >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Remove
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                )}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </Draggable>
                )
              })}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {/* Conditions Dialog */}
      <Dialog open={conditionsDialogOpen} onOpenChange={setConditionsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Manage Conditions - {selectedParticipant?.npcName || 'Character'}
            </DialogTitle>
          </DialogHeader>
          {selectedParticipant && (
            <ConditionsManager
              participant={selectedParticipant}
              onConditionsUpdate={handleConditionsUpdated}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Empty State */}
      {sortedParticipants.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-muted-foreground">
              No participants in this combat yet.
              {isGameMaster && ' Add characters or NPCs to begin.'}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}