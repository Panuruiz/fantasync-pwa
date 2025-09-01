'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Dice6, Star, Circle } from 'lucide-react'

import { useCharacterStore } from '@/stores/character-store'
import { SKILLS, SKILL_ABILITIES } from '@/types/character'
import { rollSkillCheck } from '@/lib/utils/dnd/dice'

import type { Character, CharacterCalculations } from '@/types/character'

interface SkillsSectionProps {
  character: Character
  calculations: CharacterCalculations
  isEditable?: boolean
}

export function SkillsSection({ 
  character, 
  calculations, 
  isEditable = false 
}: SkillsSectionProps) {
  const { updateSkillProficiency } = useCharacterStore()

  const handleSkillChange = (skillKey: string, proficient: boolean, expertise?: boolean) => {
    updateSkillProficiency(skillKey, proficient, expertise || false)
  }

  const rollSkill = (skillKey: string, skillName: string) => {
    const bonus = calculations.skillBonuses[skillKey] || 0
    const abilityName = SKILL_ABILITIES[skillKey as keyof typeof SKILL_ABILITIES]
    const abilityModifier = calculations.abilityModifiers[abilityName as keyof typeof calculations.abilityModifiers]
    
    const roll = rollSkillCheck(abilityModifier, bonus)
    
    // TODO: Send roll to chat
    console.log(`${skillName} check:`, roll)
  }

  const formatModifier = (modifier: number) => {
    return modifier >= 0 ? `+${modifier}` : `${modifier}`
  }

  // Convert SKILLS constant to match our needs
  const skillsArray = [
    { key: 'acrobatics', name: 'Acrobatics', ability: 'Dexterity' },
    { key: 'animalHandling', name: 'Animal Handling', ability: 'Wisdom' },
    { key: 'arcana', name: 'Arcana', ability: 'Intelligence' },
    { key: 'athletics', name: 'Athletics', ability: 'Strength' },
    { key: 'deception', name: 'Deception', ability: 'Charisma' },
    { key: 'history', name: 'History', ability: 'Intelligence' },
    { key: 'insight', name: 'Insight', ability: 'Wisdom' },
    { key: 'intimidation', name: 'Intimidation', ability: 'Charisma' },
    { key: 'investigation', name: 'Investigation', ability: 'Intelligence' },
    { key: 'medicine', name: 'Medicine', ability: 'Wisdom' },
    { key: 'nature', name: 'Nature', ability: 'Intelligence' },
    { key: 'perception', name: 'Perception', ability: 'Wisdom' },
    { key: 'performance', name: 'Performance', ability: 'Charisma' },
    { key: 'persuasion', name: 'Persuasion', ability: 'Charisma' },
    { key: 'religion', name: 'Religion', ability: 'Intelligence' },
    { key: 'sleightOfHand', name: 'Sleight of Hand', ability: 'Dexterity' },
    { key: 'stealth', name: 'Stealth', ability: 'Dexterity' },
    { key: 'survival', name: 'Survival', ability: 'Wisdom' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Skills</h3>
        
        <div className="space-y-2">
          {skillsArray.map((skill) => {
            const skillData = character.skills[skill.key as keyof typeof character.skills]
            const isProficient = skillData?.proficient || false
            const hasExpertise = skillData?.expertise || false
            const bonus = calculations.skillBonuses[skill.key] || 0
            
            return (
              <div 
                key={skill.key}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
              >
                <div className="flex items-center space-x-3">
                  {/* Proficiency Indicators */}
                  <div className="flex items-center space-x-1">
                    {hasExpertise ? (
                      <Star className="h-4 w-4 text-amber-500 fill-current" />
                    ) : isProficient ? (
                      <Circle className="h-4 w-4 text-primary fill-current" />
                    ) : (
                      <Circle className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  
                  {/* Skill Info */}
                  <div>
                    <div className="font-medium">{skill.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {skill.ability.slice(0, 3)}
                    </div>
                  </div>
                  
                  {/* Proficiency Checkboxes (if editable) */}
                  {isEditable && (
                    <div className="flex items-center space-x-2 ml-4">
                      <Checkbox
                        checked={isProficient}
                        onCheckedChange={(checked) => 
                          handleSkillChange(skill.key, checked as boolean, hasExpertise)
                        }
                      />
                      <span className="text-xs">Prof</span>
                      
                      {isProficient && (
                        <>
                          <Checkbox
                            checked={hasExpertise}
                            onCheckedChange={(checked) => 
                              handleSkillChange(skill.key, true, checked as boolean)
                            }
                          />
                          <span className="text-xs">Exp</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  {/* Skill Bonus */}
                  <div className="text-sm font-semibold min-w-[2rem] text-right">
                    {formatModifier(bonus)}
                  </div>
                  
                  {/* Roll Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => rollSkill(skill.key, skill.name)}
                  >
                    <Dice6 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
      
      {/* Passive Perception */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-md">Passive Perception</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary">
            {calculations.passivePerception}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            10 + Perception modifier
          </p>
        </CardContent>
      </Card>
    </div>
  )
}