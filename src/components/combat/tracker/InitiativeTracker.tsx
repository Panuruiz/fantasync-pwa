'use client'

import { useState, useEffect } from 'react'
import { createCombat, getCombats, getCombat, startCombat, endCombat } from '@/lib/api/combat'
import { getCharacters } from '@/lib/api/characters'
import type { Combat, CombatSummary } from '@/types/combat'
import type { CharacterSummary } from '@/types/character'

import TurnOrder from './TurnOrder'
import CombatControls from '../controls/CombatControls'
import CombatLog from '../log/CombatLog'
import AddParticipantDialog from '../participants/AddParticipantDialog'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sword, Plus, Play, Square, Pause, Users, Clock } from 'lucide-react'

interface InitiativeTrackerProps {
  gameId: string
  isGameMaster: boolean
}

export default function InitiativeTracker({ gameId, isGameMaster }: InitiativeTrackerProps) {
  const [combats, setCombats] = useState<CombatSummary[]>([])
  const [activeCombat, setActiveCombat] = useState<Combat | null>(null)
  const [characters, setCharacters] = useState<CharacterSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [addParticipantOpen, setAddParticipantOpen] = useState(false)
  
  // Create combat form state
  const [newCombatName, setNewCombatName] = useState('')
  const [newCombatTimer, setNewCombatTimer] = useState<string>('')

  useEffect(() => {
    loadData()
  }, [gameId])

  const loadData = async () => {
    try {
      setLoading(true)
      const [combatsData, charactersData] = await Promise.all([
        getCombats(gameId),
        getCharacters(gameId)
      ])
      
      setCombats(combatsData)
      setCharacters(charactersData)

      // Load active combat if exists
      const activeCombatData = combatsData.find(c => c.isActive)
      if (activeCombatData) {
        const fullCombat = await getCombat(activeCombatData.id)
        setActiveCombat(fullCombat)
      }
    } catch (error) {
      console.error('Error loading combat data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCombat = async () => {
    if (!newCombatName.trim()) return

    try {
      const newCombat = await createCombat({
        gameId,
        name: newCombatName,
        turnTimer: newCombatTimer ? parseInt(newCombatTimer) : undefined
      })

      setCombats(prev => [
        { 
          id: newCombat.id, 
          name: newCombat.name, 
          isActive: newCombat.isActive,
          participantCount: newCombat.participants.length,
          round: newCombat.round
        }, 
        ...prev
      ])

      setNewCombatName('')
      setNewCombatTimer('')
      setCreateDialogOpen(false)
    } catch (error) {
      console.error('Error creating combat:', error)
    }
  }

  const handleSelectCombat = async (combatId: string) => {
    try {
      const combat = await getCombat(combatId)
      setActiveCombat(combat)
    } catch (error) {
      console.error('Error loading combat:', error)
    }
  }

  const handleStartCombat = async () => {
    if (!activeCombat) return

    try {
      const updatedCombat = await startCombat(activeCombat.id)
      setActiveCombat(updatedCombat)
      
      // Update combats list
      setCombats(prev => 
        prev.map(c => 
          c.id === activeCombat.id 
            ? { ...c, isActive: true }
            : { ...c, isActive: false }
        )
      )
    } catch (error) {
      console.error('Error starting combat:', error)
    }
  }

  const handleEndCombat = async () => {
    if (!activeCombat) return

    try {
      await endCombat(activeCombat.id)
      setActiveCombat(prev => prev ? { ...prev, isActive: false } : null)
      
      // Update combats list
      setCombats(prev => 
        prev.map(c => 
          c.id === activeCombat.id 
            ? { ...c, isActive: false }
            : c
        )
      )
    } catch (error) {
      console.error('Error ending combat:', error)
    }
  }

  const handleCombatUpdated = (updatedCombat: Combat) => {
    setActiveCombat(updatedCombat)
    setCombats(prev => 
      prev.map(c => 
        c.id === updatedCombat.id 
          ? { 
              ...c, 
              isActive: updatedCombat.isActive, 
              participantCount: updatedCombat.participants.length,
              round: updatedCombat.round
            }
          : c
      )
    )
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sword className="h-5 w-5" />
              <CardTitle>Combat Tracker</CardTitle>
            </div>
            {isGameMaster && (
              <div className="flex items-center gap-2">
                <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      New Combat
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Combat</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="combat-name">Combat Name</Label>
                        <Input
                          id="combat-name"
                          value={newCombatName}
                          onChange={(e) => setNewCombatName(e.target.value)}
                          placeholder="e.g., Goblin Ambush"
                        />
                      </div>
                      <div>
                        <Label htmlFor="turn-timer">Turn Timer (seconds, optional)</Label>
                        <Input
                          id="turn-timer"
                          type="number"
                          value={newCombatTimer}
                          onChange={(e) => setNewCombatTimer(e.target.value)}
                          placeholder="e.g., 60"
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleCreateCombat}>
                          Create Combat
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Combat Selection */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="combat-select">Select Combat</Label>
              <Select 
                value={activeCombat?.id || ''} 
                onValueChange={handleSelectCombat}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a combat encounter" />
                </SelectTrigger>
                <SelectContent>
                  {combats.map(combat => (
                    <SelectItem key={combat.id} value={combat.id}>
                      <div className="flex items-center gap-2">
                        <span>{combat.name}</span>
                        {combat.isActive && (
                          <Badge variant="default" className="text-xs">
                            Active
                          </Badge>
                        )}
                        <Badge variant="secondary" className="text-xs">
                          {combat.participantCount} participants
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {activeCombat && (
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>{activeCombat.participants.length} participants</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>Round {activeCombat.round}</span>
                </div>
                {activeCombat.turnTimer && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{activeCombat.turnTimer}s per turn</span>
                  </div>
                )}
                <Badge variant={activeCombat.isActive ? 'default' : 'secondary'}>
                  {activeCombat.isActive ? (activeCombat.isPaused ? 'Paused' : 'Active') : 'Inactive'}
                </Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main Combat Interface */}
      {activeCombat ? (
        <Tabs defaultValue="tracker" className="space-y-4">
          <TabsList>
            <TabsTrigger value="tracker">Turn Order</TabsTrigger>
            <TabsTrigger value="log">Combat Log</TabsTrigger>
          </TabsList>

          <TabsContent value="tracker" className="space-y-4">
            {/* Combat Controls */}
            {isGameMaster && (
              <CombatControls
                combat={activeCombat}
                onCombatUpdate={handleCombatUpdated}
                onStartCombat={handleStartCombat}
                onEndCombat={handleEndCombat}
                onAddParticipant={() => setAddParticipantOpen(true)}
              />
            )}

            {/* Turn Order */}
            <TurnOrder
              combat={activeCombat}
              onCombatUpdate={handleCombatUpdated}
              isGameMaster={isGameMaster}
            />

            {/* Add Participant Dialog */}
            {isGameMaster && (
              <AddParticipantDialog
                open={addParticipantOpen}
                onOpenChange={setAddParticipantOpen}
                combat={activeCombat}
                characters={characters}
                onParticipantAdded={handleCombatUpdated}
              />
            )}
          </TabsContent>

          <TabsContent value="log">
            <CombatLog combat={activeCombat} />
          </TabsContent>
        </Tabs>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <Sword className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Combat Selected</h3>
            <p className="text-muted-foreground mb-4">
              {combats.length > 0 
                ? 'Select a combat encounter from the dropdown above to begin.'
                : 'Create your first combat encounter to get started.'
              }
            </p>
            {isGameMaster && combats.length === 0 && (
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Combat
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}