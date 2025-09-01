'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Heart, Shield, Zap, Plus, Minus } from 'lucide-react'

import { useCharacterStore } from '@/stores/character-store'
import type { Character, CharacterCalculations } from '@/types/character'

interface CombatStatsProps {
  character: Character
  calculations: CharacterCalculations
  isEditable?: boolean
}

export function CombatStats({ 
  character, 
  calculations, 
  isEditable = false 
}: CombatStatsProps) {
  const { updateHitPoints } = useCharacterStore()

  const handleHPChange = (type: 'current' | 'max' | 'temp', value: number) => {
    if (type === 'current') {
      updateHitPoints(value, character.maxHitPoints, character.tempHitPoints)
    } else if (type === 'max') {
      updateHitPoints(character.currentHitPoints, value, character.tempHitPoints)
    } else {
      updateHitPoints(character.currentHitPoints, character.maxHitPoints, value)
    }
  }

  const hpPercentage = (character.currentHitPoints / character.maxHitPoints) * 100

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Combat Statistics</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Hit Points */}
        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <CardTitle className="text-md flex items-center">
              <Heart className="h-4 w-4 mr-2" />
              Hit Points
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Progress value={hpPercentage} className="h-3" />
              
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Current</div>
                  {isEditable ? (
                    <Input
                      type="number"
                      value={character.currentHitPoints}
                      onChange={(e) => handleHPChange('current', parseInt(e.target.value) || 0)}
                      className="text-center font-bold text-red-600"
                    />
                  ) : (
                    <div className="text-2xl font-bold text-red-600">
                      {character.currentHitPoints}
                    </div>
                  )}
                </div>
                
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Max</div>
                  {isEditable ? (
                    <Input
                      type="number"
                      value={character.maxHitPoints}
                      onChange={(e) => handleHPChange('max', parseInt(e.target.value) || 1)}
                      className="text-center font-bold"
                    />
                  ) : (
                    <div className="text-2xl font-bold">
                      {character.maxHitPoints}
                    </div>
                  )}
                </div>
                
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Temp</div>
                  {isEditable ? (
                    <Input
                      type="number"
                      value={character.tempHitPoints}
                      onChange={(e) => handleHPChange('temp', parseInt(e.target.value) || 0)}
                      className="text-center font-bold text-blue-600"
                    />
                  ) : (
                    <div className="text-2xl font-bold text-blue-600">
                      {character.tempHitPoints}
                    </div>
                  )}
                </div>
              </div>
              
              {isEditable && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleHPChange('current', character.currentHitPoints + 1)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleHPChange('current', Math.max(0, character.currentHitPoints - 1))}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Armor Class & Initiative */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <CardTitle className="text-md flex items-center">
                <Shield className="h-4 w-4 mr-2" />
                Armor Class
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-center text-blue-600">
                {character.armorClass}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <CardTitle className="text-md flex items-center">
                <Zap className="h-4 w-4 mr-2" />
                Initiative
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-center text-purple-600">
                {calculations.initiative >= 0 ? '+' : ''}{calculations.initiative}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Hit Dice */}
      <Card>
        <CardHeader>
          <CardTitle className="text-md">Hit Dice</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Object.entries(character.hitDice).map(([die, data]) => (
              <div key={die} className="flex items-center justify-between">
                <span className="font-medium">{die}</span>
                <span className="text-muted-foreground">
                  {data.current} / {data.total}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Speed */}
      <Card>
        <CardHeader>
          <CardTitle className="text-md">Speed</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-center">
            {character.speed} ft
          </div>
        </CardContent>
      </Card>
    </div>
  )
}