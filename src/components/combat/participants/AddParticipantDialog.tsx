'use client'

import { useState } from 'react'
import { addParticipant } from '@/lib/api/combat'
import type { Combat, CombatParticipant } from '@/types/combat'
import type { CharacterSummary } from '@/types/character'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Users, Bot, Dice1 } from 'lucide-react'

interface AddParticipantDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  combat: Combat
  characters: CharacterSummary[]
  onParticipantAdded: (combat: Combat) => void
}

interface NPCForm {
  name: string
  initiative: string
  currentHP: string
  maxHP: string
  armorClass: string
  isVisible: boolean
}

export default function AddParticipantDialog({
  open,
  onOpenChange,
  combat,
  characters,
  onParticipantAdded
}: AddParticipantDialogProps) {
  const [selectedCharacters, setSelectedCharacters] = useState<string[]>([])
  const [npcForm, setNPCForm] = useState<NPCForm>({
    name: '',
    initiative: '',
    currentHP: '',
    maxHP: '',
    armorClass: '',
    isVisible: true
  })
  const [loading, setLoading] = useState(false)

  // Filter out characters already in combat
  const existingCharacterIds = combat.participants
    .filter(p => p.characterId)
    .map(p => p.characterId)
  
  const availableCharacters = characters.filter(
    char => !existingCharacterIds.includes(char.id)
  )

  const handleCharacterToggle = (characterId: string, checked: boolean) => {
    if (checked) {
      setSelectedCharacters(prev => [...prev, characterId])
    } else {
      setSelectedCharacters(prev => prev.filter(id => id !== characterId))
    }
  }

  const handleAddCharacters = async () => {
    if (selectedCharacters.length === 0) return

    setLoading(true)
    try {
      // Add each selected character
      for (const characterId of selectedCharacters) {
        const character = characters.find(c => c.id === characterId)
        if (!character) continue

        // Calculate dexterity modifier for initiative (this would come from character data)
        const dexModifier = 2 // Placeholder - would be calculated from character's dexterity
        const initiativeRoll = Math.floor(Math.random() * 20) + 1
        const initiative = initiativeRoll + dexModifier

        await addParticipant({
          combatId: combat.id,
          characterId,
          initiative,
          initiativeRoll,
          currentHP: character.currentHitPoints,
          maxHP: character.maxHitPoints,
          armorClass: 15, // Placeholder - would come from character data
          isNPC: false,
          isVisible: true
        })
      }

      // Reload combat data
      // This should ideally be handled by real-time updates or returning updated combat
      setSelectedCharacters([])
      onOpenChange(false)
      
      // For now, trigger a reload - in production this would be handled better
      window.location.reload()
    } catch (error) {
      console.error('Error adding characters to combat:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddNPC = async () => {
    if (!npcForm.name.trim()) return

    setLoading(true)
    try {
      const initiativeRoll = Math.floor(Math.random() * 20) + 1
      const initiative = parseInt(npcForm.initiative) || initiativeRoll

      await addParticipant({
        combatId: combat.id,
        npcName: npcForm.name,
        initiative,
        initiativeRoll: initiative,
        currentHP: npcForm.currentHP ? parseInt(npcForm.currentHP) : undefined,
        maxHP: npcForm.maxHP ? parseInt(npcForm.maxHP) : undefined,
        armorClass: npcForm.armorClass ? parseInt(npcForm.armorClass) : undefined,
        isNPC: true,
        isVisible: npcForm.isVisible
      })

      // Reset form
      setNPCForm({
        name: '',
        initiative: '',
        currentHP: '',
        maxHP: '',
        armorClass: '',
        isVisible: true
      })

      onOpenChange(false)
      
      // For now, trigger a reload
      window.location.reload()
    } catch (error) {
      console.error('Error adding NPC to combat:', error)
    } finally {
      setLoading(false)
    }
  }

  const rollInitiative = () => {
    const roll = Math.floor(Math.random() * 20) + 1
    setNPCForm(prev => ({ ...prev, initiative: roll.toString() }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Add Participants to Combat</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="characters" className="flex-1">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="characters" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Characters
            </TabsTrigger>
            <TabsTrigger value="npc" className="flex items-center gap-2">
              <Bot className="h-4 w-4" />
              NPCs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="characters" className="mt-4 space-y-4">
            {availableCharacters.length > 0 ? (
              <>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {availableCharacters.map(character => (
                    <Card key={character.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={selectedCharacters.includes(character.id)}
                            onCheckedChange={(checked) => 
                              handleCharacterToggle(character.id, checked as boolean)
                            }
                          />
                          
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={character.avatarUrl || ''} />
                            <AvatarFallback>
                              {character.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1">
                            <div className="font-medium">{character.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {character.race} {character.class} • Level {character.level}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 text-sm">
                            <Badge variant="outline">
                              {character.currentHitPoints}/{character.maxHitPoints} HP
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <Separator />

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => onOpenChange(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleAddCharacters}
                    disabled={selectedCharacters.length === 0 || loading}
                  >
                    {loading ? 'Adding...' : `Add ${selectedCharacters.length} Character${selectedCharacters.length !== 1 ? 's' : ''}`}
                  </Button>
                </div>
              </>
            ) : (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-2" />
                  <p>No available characters to add.</p>
                  <p className="text-sm">All characters are already in this combat.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="npc" className="mt-4 space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="npc-name">NPC Name</Label>
                <Input
                  id="npc-name"
                  value={npcForm.name}
                  onChange={(e) => setNPCForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Goblin Warrior"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="npc-initiative">Initiative</Label>
                  <div className="flex gap-2">
                    <Input
                      id="npc-initiative"
                      type="number"
                      value={npcForm.initiative}
                      onChange={(e) => setNPCForm(prev => ({ ...prev, initiative: e.target.value }))}
                      placeholder="Auto-roll"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={rollInitiative}
                    >
                      <Dice1 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="npc-ac">Armor Class</Label>
                  <Input
                    id="npc-ac"
                    type="number"
                    value={npcForm.armorClass}
                    onChange={(e) => setNPCForm(prev => ({ ...prev, armorClass: e.target.value }))}
                    placeholder="e.g., 15"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="npc-max-hp">Max HP</Label>
                  <Input
                    id="npc-max-hp"
                    type="number"
                    value={npcForm.maxHP}
                    onChange={(e) => setNPCForm(prev => ({ ...prev, maxHP: e.target.value }))}
                    placeholder="e.g., 25"
                  />
                </div>

                <div>
                  <Label htmlFor="npc-current-hp">Current HP</Label>
                  <Input
                    id="npc-current-hp"
                    type="number"
                    value={npcForm.currentHP}
                    onChange={(e) => setNPCForm(prev => ({ ...prev, currentHP: e.target.value }))}
                    placeholder="Same as Max HP"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="npc-visible"
                  checked={npcForm.isVisible}
                  onCheckedChange={(checked) => 
                    setNPCForm(prev => ({ ...prev, isVisible: checked as boolean }))
                  }
                />
                <Label htmlFor="npc-visible">
                  Visible to players
                </Label>
              </div>
            </div>

            <Separator />

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleAddNPC}
                disabled={!npcForm.name.trim() || loading}
              >
                {loading ? 'Adding...' : 'Add NPC'}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}