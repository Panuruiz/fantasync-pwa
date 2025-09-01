// Combat and Turn Control Types

export interface Combat {
  id: string
  gameId: string
  name: string
  round: number
  currentTurn: number
  isActive: boolean
  isPaused: boolean
  turnTimer?: number // seconds per turn
  createdAt: string
  updatedAt: string
  participants: CombatParticipant[]
}

export interface CombatParticipant {
  id: string
  combatId: string
  characterId?: string
  npcName?: string
  initiative: number
  initiativeRoll: number // Original roll for tiebreakers
  currentHP?: number
  maxHP?: number
  armorClass?: number
  conditions: Condition[]
  isNPC: boolean
  isVisible: boolean
  turnOrder: number
  createdAt: string
}

export interface CombatSummary {
  id: string
  name: string
  isActive: boolean
  participantCount: number
  round: number
  currentParticipant?: string
}

export interface Condition {
  name: string
  description: string
  duration?: number // rounds remaining, null for indefinite
  source?: string // spell, ability, etc that caused it
  level?: number // for stacking conditions
}

export interface InitiativeResult {
  participantId: string
  roll: number
  modifier: number
  total: number
}

export interface CombatEvent {
  type: 'COMBAT_STARTED' | 'ROUND_STARTED' | 'TURN_CHANGED' | 'PARTICIPANT_ADDED' | 'PARTICIPANT_REMOVED' | 'COMBAT_ENDED' | 'DAMAGE_DEALT' | 'CONDITION_APPLIED' | 'CONDITION_REMOVED'
  combatId: string
  data: any
  timestamp: string
}

export interface DamageResult {
  participantId: string
  damage: number
  damageType: string
  newHP: number
  isDead: boolean
  isUnconscious: boolean
}

// Pre-defined D&D 5e conditions
export const DND_CONDITIONS = {
  BLINDED: {
    name: 'Blinded',
    description: 'A blinded creature can\'t see and automatically fails any ability check that requires sight. Attack rolls against the creature have advantage, and the creature\'s attack rolls have disadvantage.',
  },
  CHARMED: {
    name: 'Charmed', 
    description: 'A charmed creature can\'t attack the charmer or target the charmer with harmful abilities or magical effects. The charmer has advantage on any ability check to interact socially with the creature.',
  },
  DEAFENED: {
    name: 'Deafened',
    description: 'A deafened creature can\'t hear and automatically fails any ability check that requires hearing.',
  },
  FRIGHTENED: {
    name: 'Frightened',
    description: 'A frightened creature has disadvantage on ability checks and attack rolls while the source of its fear is within line of sight. The creature can\'t willingly move closer to the source of its fear.',
  },
  GRAPPLED: {
    name: 'Grappled',
    description: 'A grappled creature\'s speed becomes 0, and it can\'t benefit from any bonus to its speed. The condition ends if the grappler is incapacitated.',
  },
  INCAPACITATED: {
    name: 'Incapacitated',
    description: 'An incapacitated creature can\'t take actions or reactions.',
  },
  INVISIBLE: {
    name: 'Invisible',
    description: 'An invisible creature is impossible to see without the aid of magic or a special sense. For the purpose of hiding, the creature is heavily obscured. The creature\'s location can be detected by any noise it makes or any tracks it leaves.',
  },
  PARALYZED: {
    name: 'Paralyzed',
    description: 'A paralyzed creature is incapacitated and can\'t move or speak. The creature automatically fails Strength and Dexterity saving throws. Attack rolls against the creature have advantage.',
  },
  PETRIFIED: {
    name: 'Petrified',
    description: 'A petrified creature is transformed, along with any nonmagical object it is wearing or carrying, into a solid inanimate substance (usually stone). Its weight increases by a factor of ten, and it ceases aging.',
  },
  POISONED: {
    name: 'Poisoned',
    description: 'A poisoned creature has disadvantage on attack rolls and ability checks.',
  },
  PRONE: {
    name: 'Prone',
    description: 'A prone creature\'s only movement option is to crawl, unless it stands up and thereby ends the condition. The creature has disadvantage on attack rolls.',
  },
  RESTRAINED: {
    name: 'Restrained',
    description: 'A restrained creature\'s speed becomes 0, and it can\'t benefit from any bonus to its speed. Attack rolls against the creature have advantage, and the creature\'s attack rolls have disadvantage.',
  },
  STUNNED: {
    name: 'Stunned',
    description: 'A stunned creature is incapacitated, can\'t move, and can speak only falteringly. The creature automatically fails Strength and Dexterity saving throws.',
  },
  UNCONSCIOUS: {
    name: 'Unconscious',
    description: 'An unconscious creature is incapacitated, can\'t move or speak, and is unaware of its surroundings. The creature drops whatever it\'s holding and falls prone.',
  },
} as const

export type ConditionName = keyof typeof DND_CONDITIONS