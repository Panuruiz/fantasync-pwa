// D&D 5e Calculations and Formulas

import { memoize } from '@/lib/utils'
import type { 
  Character, 
  AbilityScores, 
  CharacterCalculations,
  Skills,
  SKILL_ABILITIES
} from '@/types/character'

/**
 * Calculate ability modifier from ability score
 * Formula: (score - 10) / 2, rounded down
 */
export function calculateAbilityModifier(score: number): number {
  return Math.floor((score - 10) / 2)
}

/**
 * Calculate all ability modifiers from ability scores
 */
export function calculateAbilityModifiers(abilityScores: AbilityScores): AbilityScores {
  return {
    strength: calculateAbilityModifier(abilityScores.strength),
    dexterity: calculateAbilityModifier(abilityScores.dexterity),
    constitution: calculateAbilityModifier(abilityScores.constitution),
    intelligence: calculateAbilityModifier(abilityScores.intelligence),
    wisdom: calculateAbilityModifier(abilityScores.wisdom),
    charisma: calculateAbilityModifier(abilityScores.charisma),
  }
}

/**
 * Calculate proficiency bonus based on character level
 */
export function calculateProficiencyBonus(level: number): number {
  if (level >= 17) return 6
  if (level >= 13) return 5
  if (level >= 9) return 4
  if (level >= 5) return 3
  return 2
}

/**
 * Calculate skill bonus for a specific skill
 */
export function calculateSkillBonus(
  skill: keyof typeof SKILL_ABILITIES,
  abilityModifiers: AbilityScores,
  skillProficiency: { proficient: boolean; expertise: boolean },
  proficiencyBonus: number
): number {
  const abilityName = SKILL_ABILITIES[skill] as keyof AbilityScores
  const abilityModifier = abilityModifiers[abilityName]
  
  let bonus = abilityModifier
  
  if (skillProficiency.proficient) {
    bonus += proficiencyBonus
  }
  
  if (skillProficiency.expertise) {
    bonus += proficiencyBonus // Double proficiency for expertise
  }
  
  return bonus
}

/**
 * Calculate all skill bonuses
 */
export function calculateSkillBonuses(
  skills: Skills,
  abilityModifiers: AbilityScores,
  proficiencyBonus: number
): Record<string, number> {
  const bonuses: Record<string, number> = {}
  
  for (const [skillName, proficiency] of Object.entries(skills)) {
    bonuses[skillName] = calculateSkillBonus(
      skillName as keyof typeof SKILL_ABILITIES,
      abilityModifiers,
      proficiency,
      proficiencyBonus
    )
  }
  
  return bonuses
}

/**
 * Calculate saving throw bonus
 */
export function calculateSavingThrowBonus(
  ability: keyof AbilityScores,
  abilityModifiers: AbilityScores,
  isProficient: boolean,
  proficiencyBonus: number
): number {
  let bonus = abilityModifiers[ability]
  
  if (isProficient) {
    bonus += proficiencyBonus
  }
  
  return bonus
}

/**
 * Calculate all saving throw bonuses
 */
export function calculateSavingThrowBonuses(
  savingThrows: Character['savingThrows'],
  abilityModifiers: AbilityScores,
  proficiencyBonus: number
): Record<string, number> {
  return {
    str: calculateSavingThrowBonus('strength', abilityModifiers, savingThrows.str, proficiencyBonus),
    dex: calculateSavingThrowBonus('dexterity', abilityModifiers, savingThrows.dex, proficiencyBonus),
    con: calculateSavingThrowBonus('constitution', abilityModifiers, savingThrows.con, proficiencyBonus),
    int: calculateSavingThrowBonus('intelligence', abilityModifiers, savingThrows.int, proficiencyBonus),
    wis: calculateSavingThrowBonus('wisdom', abilityModifiers, savingThrows.wis, proficiencyBonus),
    cha: calculateSavingThrowBonus('charisma', abilityModifiers, savingThrows.cha, proficiencyBonus),
  }
}

/**
 * Calculate initiative bonus (Dex modifier + other modifiers)
 */
export function calculateInitiative(
  dexterityModifier: number,
  bonuses: number = 0
): number {
  return dexterityModifier + bonuses
}

/**
 * Calculate passive perception
 */
export function calculatePassivePerception(
  wisdomModifier: number,
  perceptionProficiency: { proficient: boolean; expertise: boolean },
  proficiencyBonus: number
): number {
  const baseScore = 10 + wisdomModifier
  
  let bonus = 0
  if (perceptionProficiency.proficient) {
    bonus += proficiencyBonus
  }
  if (perceptionProficiency.expertise) {
    bonus += proficiencyBonus
  }
  
  return baseScore + bonus
}

/**
 * Calculate armor class based on armor type and modifiers
 */
export function calculateArmorClass(
  baseAC: number,
  dexterityModifier: number,
  maxDexBonus?: number,
  acBonuses: number = 0
): number {
  let dexBonus = dexterityModifier
  
  // Apply max dex bonus for medium/heavy armor
  if (maxDexBonus !== undefined) {
    dexBonus = Math.min(dexBonus, maxDexBonus)
  }
  
  return baseAC + dexBonus + acBonuses
}

/**
 * Calculate spell save DC
 */
export function calculateSpellSaveDC(
  spellcastingAbilityModifier: number,
  proficiencyBonus: number
): number {
  return 8 + spellcastingAbilityModifier + proficiencyBonus
}

/**
 * Calculate spell attack bonus
 */
export function calculateSpellAttackBonus(
  spellcastingAbilityModifier: number,
  proficiencyBonus: number
): number {
  return spellcastingAbilityModifier + proficiencyBonus
}

/**
 * Calculate hit points at first level
 */
export function calculateFirstLevelHitPoints(
  hitDie: string,
  constitutionModifier: number
): number {
  const hitDieValue = parseInt(hitDie.replace('d', ''))
  return hitDieValue + constitutionModifier
}

/**
 * Calculate hit points when leveling up (using average)
 */
export function calculateLevelUpHitPoints(
  hitDie: string,
  constitutionModifier: number
): number {
  const hitDieValue = parseInt(hitDie.replace('d', ''))
  const averageRoll = Math.ceil(hitDieValue / 2) + 1 // Average of die + 1
  return averageRoll + constitutionModifier
}

/**
 * Calculate total character level from multiclass
 */
export function calculateTotalLevel(classes: Character['class']): number {
  return classes.reduce((total, charClass) => total + charClass.level, 0)
}

/**
 * Calculate spellcaster level for spell slots (handles multiclassing)
 */
export function calculateSpellcasterLevel(classes: Character['class']): number {
  let fullCasterLevels = 0
  let halfCasterLevels = 0
  let thirdCasterLevels = 0
  
  // Full casters: Bard, Cleric, Druid, Sorcerer, Wizard
  const fullCasters = ['bard', 'cleric', 'druid', 'sorcerer', 'wizard']
  
  // Half casters: Artificer, Paladin, Ranger  
  const halfCasters = ['artificer', 'paladin', 'ranger']
  
  // Third casters: Eldritch Knight, Arcane Trickster
  const thirdCasters = ['eldritch knight', 'arcane trickster']
  
  classes.forEach(charClass => {
    const className = charClass.name.toLowerCase()
    
    if (fullCasters.includes(className)) {
      fullCasterLevels += charClass.level
    } else if (halfCasters.includes(className)) {
      halfCasterLevels += charClass.level
    } else if (thirdCasters.includes(className)) {
      thirdCasterLevels += charClass.level
    }
  })
  
  // Multiclass spellcasting formula
  return fullCasterLevels + Math.floor(halfCasterLevels / 2) + Math.floor(thirdCasterLevels / 3)
}

/**
 * Get spell slots by level for a given caster level
 */
export function getSpellSlotsByLevel(casterLevel: number): Record<number, number> {
  const spellSlotTable: Record<number, number[]> = {
    0: [0, 0, 0, 0, 0, 0, 0, 0, 0],
    1: [2, 0, 0, 0, 0, 0, 0, 0, 0],
    2: [3, 0, 0, 0, 0, 0, 0, 0, 0],
    3: [4, 2, 0, 0, 0, 0, 0, 0, 0],
    4: [4, 3, 0, 0, 0, 0, 0, 0, 0],
    5: [4, 3, 2, 0, 0, 0, 0, 0, 0],
    6: [4, 3, 3, 0, 0, 0, 0, 0, 0],
    7: [4, 3, 3, 1, 0, 0, 0, 0, 0],
    8: [4, 3, 3, 2, 0, 0, 0, 0, 0],
    9: [4, 3, 3, 3, 1, 0, 0, 0, 0],
    10: [4, 3, 3, 3, 2, 0, 0, 0, 0],
    11: [4, 3, 3, 3, 2, 1, 0, 0, 0],
    12: [4, 3, 3, 3, 2, 1, 0, 0, 0],
    13: [4, 3, 3, 3, 2, 1, 1, 0, 0],
    14: [4, 3, 3, 3, 2, 1, 1, 0, 0],
    15: [4, 3, 3, 3, 2, 1, 1, 1, 0],
    16: [4, 3, 3, 3, 2, 1, 1, 1, 0],
    17: [4, 3, 3, 3, 2, 1, 1, 1, 1],
    18: [4, 3, 3, 3, 3, 1, 1, 1, 1],
    19: [4, 3, 3, 3, 3, 2, 1, 1, 1],
    20: [4, 3, 3, 3, 3, 2, 2, 1, 1],
  }
  
  const slots = spellSlotTable[Math.min(casterLevel, 20)] || spellSlotTable[0]
  const result: Record<number, number> = {}
  
  slots.forEach((count, index) => {
    if (count > 0) {
      result[index + 1] = count
    }
  })
  
  return result
}

/**
 * Calculate all character statistics
 */
// Memoized version of character stats calculation for performance
const _calculateCharacterStats = (character: Character): CharacterCalculations => {
  const abilityModifiers = calculateAbilityModifiers({
    strength: character.strength,
    dexterity: character.dexterity,
    constitution: character.constitution,
    intelligence: character.intelligence,
    wisdom: character.wisdom,
    charisma: character.charisma,
  })
  
  const totalLevel = calculateTotalLevel(character.class)
  const proficiencyBonus = calculateProficiencyBonus(totalLevel)
  
  const skillBonuses = calculateSkillBonuses(
    character.skills,
    abilityModifiers,
    proficiencyBonus
  )
  
  const savingThrowBonuses = calculateSavingThrowBonuses(
    character.savingThrows,
    abilityModifiers,
    proficiencyBonus
  )
  
  const initiative = calculateInitiative(abilityModifiers.dexterity, character.initiative)
  
  const passivePerception = calculatePassivePerception(
    abilityModifiers.wisdom,
    character.skills.perception,
    proficiencyBonus
  )
  
  // Use provided AC or calculate basic AC (10 + Dex)
  const armorClass = character.armorClass || calculateArmorClass(10, abilityModifiers.dexterity)
  
  return {
    abilityModifiers,
    skillBonuses,
    savingThrowBonuses,
    initiative,
    passivePerception,
    armorClass,
    proficiencyBonus,
  }
}

// Export memoized version - caches results based on character ID and key stats
export const calculateCharacterStats = memoize(_calculateCharacterStats, {
  maxSize: 20, // Cache up to 20 character calculations
  ttl: 60000, // Cache for 1 minute
  keyFn: (character) => {
    // Create a unique key based on character ID and relevant stats
    return `${character.id}-${character.level}-${character.strength}-${character.dexterity}-${character.constitution}-${character.intelligence}-${character.wisdom}-${character.charisma}-${character.armorClass}`
  }
})

/**
 * Validate ability score (1-30 range for D&D 5e)
 */
export function validateAbilityScore(score: number): boolean {
  return score >= 1 && score <= 30
}

/**
 * Calculate point buy cost for an ability score
 */
export function getPointBuyCost(score: number): number {
  const costs: Record<number, number> = {
    8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9
  }
  return costs[score] || 0
}

/**
 * Validate point buy allocation (27 points total)
 */
export function validatePointBuy(abilityScores: AbilityScores): boolean {
  const totalCost = Object.values(abilityScores).reduce((sum, score) => {
    return sum + getPointBuyCost(score)
  }, 0)
  
  return totalCost === 27 && Object.values(abilityScores).every(score => score >= 8 && score <= 15)
}