'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BookOpen, Circle, Dot } from 'lucide-react'

import { useCharacterStore } from '@/stores/character-store'
import type { Character } from '@/types/character'

interface SpellSlotsProps {
  character: Character
  isEditable?: boolean
}

export function SpellSlots({ character, isEditable = false }: SpellSlotsProps) {
  const { updateSpellSlots } = useCharacterStore()

  if (!character.spellSlots || Object.keys(character.spellSlots).length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <BookOpen className="h-12 w-12 mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">No Spellcasting</h3>
        <p>This character doesn't have spellcasting abilities</p>
      </div>
    )
  }

  const handleSlotToggle = (level: number, slotIndex: number) => {
    const currentSlots = character.spellSlots?.[level]
    if (!currentSlots) return
    
    const newUsed = slotIndex < currentSlots.used ? currentSlots.used - 1 : slotIndex + 1
    updateSpellSlots(level, Math.min(newUsed, currentSlots.total))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Spellcasting</h3>
        {character.spellcastingAbility && (
          <Badge variant="secondary">
            {character.spellcastingAbility}
          </Badge>
        )}
      </div>
      
      {/* Spell Save DC and Attack Bonus */}
      {(character.spellSaveDC || character.spellAttackBonus) && (
        <div className="grid grid-cols-2 gap-4">
          {character.spellSaveDC && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Spell Save DC</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-center">
                  {character.spellSaveDC}
                </div>
              </CardContent>
            </Card>
          )}
          
          {character.spellAttackBonus && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Spell Attack Bonus</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-center">
                  +{character.spellAttackBonus}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
      
      {/* Spell Slots */}
      <div className="space-y-4">
        <h4 className="text-md font-medium">Spell Slots</h4>
        
        {Object.entries(character.spellSlots)
          .sort(([a], [b]) => parseInt(a) - parseInt(b))
          .map(([level, slots]) => (
            <div key={level} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">
                  Level {level}
                </span>
                <span className="text-sm text-muted-foreground">
                  {slots.total - slots.used} / {slots.total}
                </span>
              </div>
              
              <div className="flex items-center space-x-1">
                {Array.from({ length: slots.total }, (_, i) => (
                  <Button
                    key={i}
                    variant="ghost"
                    size="sm"
                    className="w-8 h-8 p-0"
                    onClick={() => isEditable && handleSlotToggle(parseInt(level), i)}
                    disabled={!isEditable}
                  >
                    {i < slots.used ? (
                      <Dot className="h-6 w-6 text-muted-foreground" />
                    ) : (
                      <Circle className="h-4 w-4 text-primary fill-current" />
                    )}
                  </Button>
                ))}
              </div>
            </div>
          ))}
      </div>
      
      {/* Spells Known/Prepared */}
      {character.spellsKnown && character.spellsKnown.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-md font-medium">Spells</h4>
          
          <div className="space-y-2">
            {character.spellsKnown.map((spell, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                <div>
                  <div className="font-medium">{spell.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {spell.level === 0 ? 'Cantrip' : `Level ${spell.level}`} • {spell.school}
                  </div>
                </div>
                {spell.prepared && (
                  <Badge variant="outline" className="text-xs">
                    Prepared
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}