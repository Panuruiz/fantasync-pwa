'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dice6 } from 'lucide-react'

import { useCharacterStore } from '@/stores/character-store'
import { ABILITY_NAMES } from '@/types/character'
import { rollAbilityCheck } from '@/lib/utils/dnd/dice'

import type { Character, CharacterCalculations, AbilityScores } from '@/types/character'

interface AbilityScoresProps {
  character: Character
  calculations: CharacterCalculations
  isEditable?: boolean
}

export function AbilityScores({ 
  character, 
  calculations, 
  isEditable = false 
}: AbilityScoresProps) {
  const { updateAbilityScore } = useCharacterStore()

  const handleAbilityChange = (ability: keyof AbilityScores, value: string) => {
    const numValue = parseInt(value) || 10
    if (numValue >= 1 && numValue <= 30) {
      updateAbilityScore(ability, numValue)
    }
  }

  const rollAbilityRoll = (ability: keyof AbilityScores) => {
    const modifier = calculations.abilityModifiers[ability]
    const roll = rollAbilityCheck(modifier)
    
    // TODO: Send roll to chat
    console.log(`${ABILITY_NAMES[ability]} check:`, roll)
  }

  const formatModifier = (modifier: number) => {
    return modifier >= 0 ? `+${modifier}` : `${modifier}`
  }

  const abilityEntries = Object.entries(ABILITY_NAMES) as Array<[keyof AbilityScores, string]>

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Ability Scores</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {abilityEntries.map(([ability, displayName]) => {
            const score = character[ability]
            const modifier = calculations.abilityModifiers[ability]
            const isProficient = character.savingThrows[ability === 'strength' ? 'str' : 
              ability === 'dexterity' ? 'dex' :
              ability === 'constitution' ? 'con' :
              ability === 'intelligence' ? 'int' :
              ability === 'wisdom' ? 'wis' : 'cha']
            
            return (
              <Card key={ability} className="text-center">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    {displayName}
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="pt-0">
                  {isEditable ? (
                    <Input
                      type="number"
                      min={1}
                      max={30}
                      value={score}
                      onChange={(e) => handleAbilityChange(ability, e.target.value)}
                      className="w-full text-center text-2xl font-bold h-12 mb-2"
                    />
                  ) : (
                    <div className="text-2xl font-bold mb-2 h-12 flex items-center justify-center">
                      {score}
                    </div>
                  )}
                  
                  <div className="text-lg font-semibold text-muted-foreground mb-2">
                    {formatModifier(modifier)}
                  </div>
                  
                  {isProficient && (
                    <Badge variant="secondary" className="text-xs mb-2">
                      Save
                    </Badge>
                  )}
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => rollAbilityRoll(ability)}
                    className="w-full"
                  >
                    <Dice6 className="h-3 w-3 mr-1" />
                    Roll
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
      
      {/* Saving Throws */}
      <div>
        <h4 className="text-md font-medium mb-3">Saving Throws</h4>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {abilityEntries.map(([ability, displayName]) => {
            const abilityKey = ability === 'strength' ? 'str' : 
              ability === 'dexterity' ? 'dex' :
              ability === 'constitution' ? 'con' :
              ability === 'intelligence' ? 'int' :
              ability === 'wisdom' ? 'wis' : 'cha'
            
            const isProficient = character.savingThrows[abilityKey]
            const bonus = calculations.savingThrowBonuses[abilityKey]
            
            return (
              <div 
                key={ability}
                className="flex items-center justify-between p-3 bg-muted rounded-lg"
              >
                <div className="flex items-center space-x-2">
                  {isProficient && (
                    <div className="w-2 h-2 rounded-full bg-primary" />
                  )}
                  <span className="text-sm font-medium">
                    {displayName.slice(0, 3)}
                  </span>
                </div>
                
                <div className="text-sm font-semibold">
                  {formatModifier(bonus)}
                </div>
              </div>
            )
          })}
        </div>
      </div>
      
      {/* Other Proficiencies */}
      <div>
        <h4 className="text-md font-medium mb-3">Proficiencies</h4>
        
        <div className="space-y-3">
          <div>
            <span className="text-sm font-medium text-muted-foreground">Proficiency Bonus: </span>
            <span className="font-semibold">+{calculations.proficiencyBonus}</span>
          </div>
          
          {character.languages.length > 0 && (
            <div>
              <span className="text-sm font-medium text-muted-foreground">Languages: </span>
              <span className="text-sm">{character.languages.join(', ')}</span>
            </div>
          )}
          
          {character.proficiencies.armor.length > 0 && (
            <div>
              <span className="text-sm font-medium text-muted-foreground">Armor: </span>
              <span className="text-sm">{character.proficiencies.armor.join(', ')}</span>
            </div>
          )}
          
          {character.proficiencies.weapons.length > 0 && (
            <div>
              <span className="text-sm font-medium text-muted-foreground">Weapons: </span>
              <span className="text-sm">{character.proficiencies.weapons.join(', ')}</span>
            </div>
          )}
          
          {character.proficiencies.tools.length > 0 && (
            <div>
              <span className="text-sm font-medium text-muted-foreground">Tools: </span>
              <span className="text-sm">{character.proficiencies.tools.join(', ')}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}