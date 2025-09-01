// D&D 5e Character Types

export interface Character {
  id: string
  gameId: string
  userId: string
  name: string
  race: string
  class: CharacterClass[]
  level: number
  background?: string
  alignment?: string
  
  // Ability Scores
  strength: number
  dexterity: number
  constitution: number
  intelligence: number
  wisdom: number
  charisma: number
  
  // Combat Stats
  armorClass: number
  initiative: number
  speed: number
  maxHitPoints: number
  currentHitPoints: number
  tempHitPoints: number
  hitDice: HitDicePool
  
  // Saves & Skills
  proficiencyBonus: number
  savingThrows: SavingThrows
  skills: Skills
  
  // Features & Traits
  features: Feature[]
  traits: Trait[]
  languages: string[]
  proficiencies: Proficiencies
  
  // Spellcasting
  spellcastingAbility?: string
  spellSaveDC?: number
  spellAttackBonus?: number
  spellSlots?: SpellSlots
  spellsKnown?: Spell[]
  
  // Equipment
  equipment: Item[]
  currency: Currency
  
  // Backstory
  personalityTraits?: string
  ideals?: string
  bonds?: string
  flaws?: string
  backstory?: string
  
  // Metadata
  avatarUrl?: string
  isPublic: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CharacterClass {
  name: string
  level: number
  hitDie: string
  features?: string[]
}

export interface AbilityScores {
  strength: number
  dexterity: number
  constitution: number
  intelligence: number
  wisdom: number
  charisma: number
}

export interface SavingThrows {
  str: boolean
  dex: boolean
  con: boolean
  int: boolean
  wis: boolean
  cha: boolean
}

export interface Skills {
  acrobatics: SkillProficiency
  animalHandling: SkillProficiency
  arcana: SkillProficiency
  athletics: SkillProficiency
  deception: SkillProficiency
  history: SkillProficiency
  insight: SkillProficiency
  intimidation: SkillProficiency
  investigation: SkillProficiency
  medicine: SkillProficiency
  nature: SkillProficiency
  perception: SkillProficiency
  performance: SkillProficiency
  persuasion: SkillProficiency
  religion: SkillProficiency
  sleightOfHand: SkillProficiency
  stealth: SkillProficiency
  survival: SkillProficiency
}

export interface SkillProficiency {
  proficient: boolean
  expertise: boolean
}

export interface HitDicePool {
  [dieType: string]: {
    total: number
    current: number
  }
}

export interface Feature {
  name: string
  description: string
  source: string // class, race, feat, etc.
  level?: number
  usesPerRest?: {
    short?: number
    long?: number
    used: number
  }
}

export interface Trait {
  name: string
  description: string
  source: string
}

export interface Proficiencies {
  armor: string[]
  weapons: string[]
  tools: string[]
}

export interface SpellSlots {
  [level: string]: {
    total: number
    used: number
  }
}

export interface Spell {
  name: string
  level: number
  school: string
  castingTime: string
  range: string
  components: string
  duration: string
  description: string
  prepared?: boolean
  ritual?: boolean
}

export interface Item {
  id: string
  name: string
  type: string
  quantity: number
  weight?: number
  cost?: number
  description?: string
  properties?: string[]
  equipped?: boolean
  attuned?: boolean
}

export interface Currency {
  cp: number // Copper pieces
  sp: number // Silver pieces  
  ep: number // Electrum pieces
  gp: number // Gold pieces
  pp: number // Platinum pieces
}

export interface CharacterCalculations {
  abilityModifiers: AbilityScores
  skillBonuses: Record<string, number>
  savingThrowBonuses: Record<string, number>
  initiative: number
  passivePerception: number
  armorClass: number
  proficiencyBonus: number
}

// Character creation/edit forms
export interface CharacterFormData {
  name: string
  race: string
  class: CharacterClass[]
  background?: string
  alignment?: string
  abilityScores: AbilityScores
  personalityTraits?: string
  ideals?: string
  bonds?: string
  flaws?: string
  backstory?: string
}

export interface CharacterSummary {
  id: string
  name: string
  race: string
  class: string // Formatted class/level string
  level: number
  avatarUrl?: string
  currentHitPoints: number
  maxHitPoints: number
  isPublic: boolean
}

// D&D 5e Constants
export const ABILITY_NAMES = {
  strength: 'Strength',
  dexterity: 'Dexterity', 
  constitution: 'Constitution',
  intelligence: 'Intelligence',
  wisdom: 'Wisdom',
  charisma: 'Charisma'
} as const

export const SKILL_ABILITIES = {
  acrobatics: 'dexterity',
  animalHandling: 'wisdom',
  arcana: 'intelligence',
  athletics: 'strength',
  deception: 'charisma',
  history: 'intelligence',
  insight: 'wisdom',
  intimidation: 'charisma',
  investigation: 'intelligence',
  medicine: 'wisdom',
  nature: 'intelligence',
  perception: 'wisdom',
  performance: 'charisma',
  persuasion: 'charisma',
  religion: 'intelligence',
  sleightOfHand: 'dexterity',
  stealth: 'dexterity',
  survival: 'wisdom'
} as const