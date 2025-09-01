// D&D 5e Dice Rolling Utilities

export interface DiceRoll {
  dice: string // e.g., "1d20", "2d6+3", "1d8+4"
  result: number
  rolls: number[]
  modifiers: number
  description?: string
}

export interface DiceRollOptions {
  advantage?: boolean
  disadvantage?: boolean
  criticalThreshold?: number // Natural 20 by default
  exploding?: boolean // Roll again on max
  rerollOnes?: boolean // Reroll 1s once (Great Weapon Fighting, etc.)
  rerollOnce?: number[] // Reroll specific numbers once
}

/**
 * Parse dice notation (e.g., "2d6+3", "1d20", "4d6kh3")
 */
export function parseDiceNotation(notation: string): {
  count: number
  sides: number
  modifier: number
  keepHighest?: number
  keepLowest?: number
} {
  // Remove spaces
  const clean = notation.replace(/\s/g, '')
  
  // Handle keep highest (kh) or keep lowest (kl)
  let keepHighest: number | undefined
  let keepLowest: number | undefined
  let diceNotation = clean
  
  if (clean.includes('kh')) {
    const [dice, keep] = clean.split('kh')
    diceNotation = dice
    keepHighest = parseInt(keep)
  } else if (clean.includes('kl')) {
    const [dice, keep] = clean.split('kl')
    diceNotation = dice
    keepLowest = parseInt(keep)
  }
  
  // Parse basic notation (XdY+Z or XdY-Z)
  const match = diceNotation.match(/^(\d+)?d(\d+)([+-]\d+)?$/)
  
  if (!match) {
    throw new Error(`Invalid dice notation: ${notation}`)
  }
  
  const count = parseInt(match[1] || '1')
  const sides = parseInt(match[2])
  const modifier = parseInt(match[3] || '0')
  
  return { count, sides, modifier, keepHighest, keepLowest }
}

/**
 * Roll a single die
 */
export function rollDie(sides: number): number {
  return Math.floor(Math.random() * sides) + 1
}

/**
 * Roll multiple dice
 */
export function rollDice(count: number, sides: number): number[] {
  return Array.from({ length: count }, () => rollDie(sides))
}

/**
 * Roll dice with options (advantage, disadvantage, etc.)
 */
export function rollWithOptions(
  dice: string, 
  options: DiceRollOptions = {}
): DiceRoll {
  const { count, sides, modifier, keepHighest, keepLowest } = parseDiceNotation(dice)
  let rolls = rollDice(count, sides)
  
  // Handle rerolls
  if (options.rerollOnes) {
    rolls = rolls.map(roll => roll === 1 ? rollDie(sides) : roll)
  }
  
  if (options.rerollOnce) {
    rolls = rolls.map(roll => 
      options.rerollOnce!.includes(roll) ? rollDie(sides) : roll
    )
  }
  
  // Handle exploding dice
  if (options.exploding) {
    const newRolls = [...rolls]
    for (let i = 0; i < newRolls.length; i++) {
      let currentRoll = newRolls[i]
      while (currentRoll === sides) {
        currentRoll = rollDie(sides)
        newRolls[i] += currentRoll
      }
    }
    rolls = newRolls
  }
  
  // Handle keep highest/lowest
  if (keepHighest && keepHighest < rolls.length) {
    rolls.sort((a, b) => b - a)
    rolls = rolls.slice(0, keepHighest)
  } else if (keepLowest && keepLowest < rolls.length) {
    rolls.sort((a, b) => a - b)
    rolls = rolls.slice(0, keepLowest)
  }
  
  // Handle advantage/disadvantage for d20 rolls
  if (sides === 20) {
    if (options.advantage && !options.disadvantage) {
      const secondRoll = rollDie(20)
      rolls = [Math.max(rolls[0], secondRoll)]
    } else if (options.disadvantage && !options.advantage) {
      const secondRoll = rollDie(20)
      rolls = [Math.min(rolls[0], secondRoll)]
    }
  }
  
  const result = rolls.reduce((sum, roll) => sum + roll, 0) + modifier
  
  return {
    dice,
    result,
    rolls,
    modifiers: modifier,
  }
}

/**
 * Roll initiative
 */
export function rollInitiative(dexterityModifier: number, bonuses: number = 0): DiceRoll {
  const roll = rollWithOptions('1d20')
  
  return {
    ...roll,
    result: roll.result + dexterityModifier + bonuses,
    modifiers: dexterityModifier + bonuses,
    description: 'Initiative'
  }
}

/**
 * Roll ability check
 */
export function rollAbilityCheck(
  abilityModifier: number, 
  proficiencyBonus: number = 0, 
  options: DiceRollOptions = {}
): DiceRoll {
  const roll = rollWithOptions('1d20', options)
  
  return {
    ...roll,
    result: roll.result + abilityModifier + proficiencyBonus,
    modifiers: abilityModifier + proficiencyBonus,
  }
}

/**
 * Roll skill check
 */
export function rollSkillCheck(
  abilityModifier: number,
  skillBonus: number,
  options: DiceRollOptions = {}
): DiceRoll {
  const roll = rollWithOptions('1d20', options)
  
  return {
    ...roll,
    result: roll.result + skillBonus,
    modifiers: skillBonus,
  }
}

/**
 * Roll saving throw
 */
export function rollSavingThrow(
  saveBonus: number,
  options: DiceRollOptions = {}
): DiceRoll {
  const roll = rollWithOptions('1d20', options)
  
  return {
    ...roll,
    result: roll.result + saveBonus,
    modifiers: saveBonus,
  }
}

/**
 * Roll attack roll
 */
export function rollAttack(
  attackBonus: number,
  options: DiceRollOptions = {}
): DiceRoll & { isCritical: boolean } {
  const roll = rollWithOptions('1d20', options)
  const critThreshold = options.criticalThreshold || 20
  const isCritical = roll.rolls.some(r => r >= critThreshold)
  
  return {
    ...roll,
    result: roll.result + attackBonus,
    modifiers: attackBonus,
    isCritical,
    description: 'Attack'
  }
}

/**
 * Roll damage
 */
export function rollDamage(
  dice: string,
  damageType: string,
  isCritical: boolean = false
): DiceRoll & { damageType: string } {
  let roll: DiceRoll
  
  if (isCritical) {
    // For critical hits, double the dice (not the modifiers)
    const parsed = parseDiceNotation(dice)
    const critDice = `${parsed.count * 2}d${parsed.sides}${parsed.modifier >= 0 ? '+' : ''}${parsed.modifier}`
    roll = rollWithOptions(critDice)
  } else {
    roll = rollWithOptions(dice)
  }
  
  return {
    ...roll,
    damageType,
    description: `${damageType} damage${isCritical ? ' (Critical)' : ''}`,
  }
}

/**
 * Roll healing
 */
export function rollHealing(dice: string, spellLevel?: number): DiceRoll {
  const roll = rollWithOptions(dice)
  
  return {
    ...roll,
    description: `Healing${spellLevel ? ` (${spellLevel}th level)` : ''}`,
  }
}

/**
 * Roll hit dice for short rest recovery
 */
export function rollHitDie(hitDie: string, constitutionModifier: number): DiceRoll {
  const roll = rollWithOptions(hitDie)
  
  return {
    ...roll,
    result: Math.max(1, roll.result + constitutionModifier), // Minimum 1 HP
    modifiers: constitutionModifier,
    description: 'Hit Die recovery'
  }
}

/**
 * Roll ability scores (4d6, drop lowest)
 */
export function rollAbilityScore(): DiceRoll {
  const roll = rollWithOptions('4d6kh3')
  
  return {
    ...roll,
    description: 'Ability Score (4d6, drop lowest)'
  }
}

/**
 * Roll all six ability scores
 */
export function rollAllAbilityScores(): Record<string, DiceRoll> {
  const abilities = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma']
  const results: Record<string, DiceRoll> = {}
  
  abilities.forEach(ability => {
    results[ability] = rollAbilityScore()
  })
  
  return results
}

/**
 * Roll percentile dice (d100)
 */
export function rollPercentile(): DiceRoll {
  const tensRoll = rollDie(10) - 1 // 0-9
  const onesRoll = rollDie(10) - 1 // 0-9
  const result = tensRoll * 10 + onesRoll
  
  return {
    dice: '1d100',
    result: result === 0 ? 100 : result, // 00 = 100
    rolls: [tensRoll + 1, onesRoll + 1],
    modifiers: 0,
    description: 'Percentile'
  }
}

/**
 * Format dice roll for display
 */
export function formatDiceRoll(roll: DiceRoll): string {
  const rollsText = roll.rolls.join(', ')
  const modifierText = roll.modifiers !== 0 
    ? ` ${roll.modifiers >= 0 ? '+' : ''}${roll.modifiers}`
    : ''
  
  return `${roll.dice}: [${rollsText}]${modifierText} = **${roll.result}**`
}

/**
 * Generate dice roll message for chat
 */
export function createDiceRollMessage(
  roll: DiceRoll,
  characterName: string,
  rollType?: string
): any {
  const description = rollType || roll.description || 'Roll'
  
  return {
    type: 'DICE_ROLL',
    characterName,
    rollType: description,
    dice: roll.dice,
    result: roll.result,
    rolls: roll.rolls,
    modifiers: roll.modifiers,
    formatted: formatDiceRoll(roll),
  }
}