// D&D 5e Constants and Static Data

export const RACES = [
  { name: 'Human', size: 'Medium', speed: 30 },
  { name: 'Elf', size: 'Medium', speed: 30 },
  { name: 'Dwarf', size: 'Medium', speed: 25 },
  { name: 'Halfling', size: 'Small', speed: 25 },
  { name: 'Dragonborn', size: 'Medium', speed: 30 },
  { name: 'Gnome', size: 'Small', speed: 25 },
  { name: 'Half-Elf', size: 'Medium', speed: 30 },
  { name: 'Half-Orc', size: 'Medium', speed: 30 },
  { name: 'Tiefling', size: 'Medium', speed: 30 },
] as const

export const CLASSES = [
  { name: 'Artificer', hitDie: 'd8', primaryAbility: 'Intelligence', saves: ['Constitution', 'Intelligence'] },
  { name: 'Barbarian', hitDie: 'd12', primaryAbility: 'Strength', saves: ['Strength', 'Constitution'] },
  { name: 'Bard', hitDie: 'd8', primaryAbility: 'Charisma', saves: ['Dexterity', 'Charisma'] },
  { name: 'Cleric', hitDie: 'd8', primaryAbility: 'Wisdom', saves: ['Wisdom', 'Charisma'] },
  { name: 'Druid', hitDie: 'd8', primaryAbility: 'Wisdom', saves: ['Intelligence', 'Wisdom'] },
  { name: 'Fighter', hitDie: 'd10', primaryAbility: 'Strength or Dexterity', saves: ['Strength', 'Constitution'] },
  { name: 'Monk', hitDie: 'd8', primaryAbility: 'Dexterity & Wisdom', saves: ['Strength', 'Dexterity'] },
  { name: 'Paladin', hitDie: 'd10', primaryAbility: 'Strength & Charisma', saves: ['Wisdom', 'Charisma'] },
  { name: 'Ranger', hitDie: 'd10', primaryAbility: 'Dexterity & Wisdom', saves: ['Strength', 'Dexterity'] },
  { name: 'Rogue', hitDie: 'd8', primaryAbility: 'Dexterity', saves: ['Dexterity', 'Intelligence'] },
  { name: 'Sorcerer', hitDie: 'd6', primaryAbility: 'Charisma', saves: ['Constitution', 'Charisma'] },
  { name: 'Warlock', hitDie: 'd8', primaryAbility: 'Charisma', saves: ['Wisdom', 'Charisma'] },
  { name: 'Wizard', hitDie: 'd6', primaryAbility: 'Intelligence', saves: ['Intelligence', 'Wisdom'] },
] as const

export const BACKGROUNDS = [
  'Acolyte', 'Criminal', 'Folk Hero', 'Noble', 'Sage', 'Soldier', 'Charlatan', 'Entertainer',
  'Guild Artisan', 'Hermit', 'Outlander', 'Sailor', 'Urchin', 'Custom Background'
] as const

export const ALIGNMENTS = [
  'Lawful Good', 'Neutral Good', 'Chaotic Good',
  'Lawful Neutral', 'True Neutral', 'Chaotic Neutral', 
  'Lawful Evil', 'Neutral Evil', 'Chaotic Evil'
] as const

export const SKILLS = [
  { name: 'Acrobatics', ability: 'Dexterity' },
  { name: 'Animal Handling', ability: 'Wisdom' },
  { name: 'Arcana', ability: 'Intelligence' },
  { name: 'Athletics', ability: 'Strength' },
  { name: 'Deception', ability: 'Charisma' },
  { name: 'History', ability: 'Intelligence' },
  { name: 'Insight', ability: 'Wisdom' },
  { name: 'Intimidation', ability: 'Charisma' },
  { name: 'Investigation', ability: 'Intelligence' },
  { name: 'Medicine', ability: 'Wisdom' },
  { name: 'Nature', ability: 'Intelligence' },
  { name: 'Perception', ability: 'Wisdom' },
  { name: 'Performance', ability: 'Charisma' },
  { name: 'Persuasion', ability: 'Charisma' },
  { name: 'Religion', ability: 'Intelligence' },
  { name: 'Sleight of Hand', ability: 'Dexterity' },
  { name: 'Stealth', ability: 'Dexterity' },
  { name: 'Survival', ability: 'Wisdom' },
] as const

export const CONDITION_DEFINITIONS = {
  blinded: {
    name: 'Blinded',
    description: 'A blinded creature can\'t see and automatically fails any ability check that requires sight.',
    effects: ['Attack rolls against the creature have advantage', 'The creature\'s attack rolls have disadvantage']
  },
  charmed: {
    name: 'Charmed', 
    description: 'A charmed creature can\'t attack the charmer or target the charmer with harmful abilities or magical effects.',
    effects: ['The charmer has advantage on any ability check to interact socially with the creature']
  },
  deafened: {
    name: 'Deafened',
    description: 'A deafened creature can\'t hear and automatically fails any ability check that requires hearing.'
  },
  frightened: {
    name: 'Frightened',
    description: 'A frightened creature has disadvantage on ability checks and attack rolls while the source of its fear is within line of sight.',
    effects: ['The creature can\'t willingly move closer to the source of its fear']
  },
  grappled: {
    name: 'Grappled',
    description: 'A grappled creature\'s speed becomes 0, and it can\'t benefit from any bonus to its speed.',
    effects: ['The condition ends if the grappler is incapacitated']
  },
  incapacitated: {
    name: 'Incapacitated',
    description: 'An incapacitated creature can\'t take actions or reactions.'
  },
  invisible: {
    name: 'Invisible',
    description: 'An invisible creature is impossible to see without the aid of magic or a special sense.',
    effects: [
      'The creature is heavily obscured for the purpose of hiding',
      'The creature\'s location can be detected by any noise it makes or tracks it leaves',
      'Attack rolls against the creature have disadvantage',
      'The creature\'s attack rolls have advantage'
    ]
  },
  paralyzed: {
    name: 'Paralyzed',
    description: 'A paralyzed creature is incapacitated and can\'t move or speak.',
    effects: [
      'The creature automatically fails Strength and Dexterity saving throws',
      'Attack rolls against the creature have advantage',
      'Any attack that hits the creature is a critical hit if the attacker is within 5 feet'
    ]
  },
  petrified: {
    name: 'Petrified',
    description: 'A petrified creature is transformed, along with any nonmagical object it is wearing or carrying, into a solid inanimate substance.',
    effects: [
      'The creature\'s weight increases by a factor of ten, and it ceases aging',
      'The creature is incapacitated, can\'t move or speak, and is unaware of its surroundings',
      'Attack rolls against the creature have advantage',
      'The creature automatically fails Strength and Dexterity saving throws',
      'The creature has resistance to all damage',
      'The creature is immune to poison and disease'
    ]
  },
  poisoned: {
    name: 'Poisoned',
    description: 'A poisoned creature has disadvantage on attack rolls and ability checks.'
  },
  prone: {
    name: 'Prone',
    description: 'A prone creature\'s only movement option is to crawl, unless it stands up and thereby ends the condition.',
    effects: [
      'The creature has disadvantage on attack rolls',
      'An attack roll against the creature has advantage if the attacker is within 5 feet, otherwise disadvantage'
    ]
  },
  restrained: {
    name: 'Restrained',
    description: 'A restrained creature\'s speed becomes 0, and it can\'t benefit from any bonus to its speed.',
    effects: [
      'Attack rolls against the creature have advantage',
      'The creature\'s attack rolls have disadvantage',
      'The creature has disadvantage on Dexterity saving throws'
    ]
  },
  stunned: {
    name: 'Stunned',
    description: 'A stunned creature is incapacitated, can\'t move, and can speak only falteringly.',
    effects: [
      'The creature automatically fails Strength and Dexterity saving throws',
      'Attack rolls against the creature have advantage'
    ]
  },
  unconscious: {
    name: 'Unconscious',
    description: 'An unconscious creature is incapacitated, can\'t move or speak, and is unaware of its surroundings.',
    effects: [
      'The creature drops whatever it\'s holding and falls prone',
      'The creature automatically fails Strength and Dexterity saving throws',
      'Attack rolls against the creature have advantage',
      'Any attack that hits the creature is a critical hit if the attacker is within 5 feet'
    ]
  }
} as const

export const DAMAGE_TYPES = [
  'Acid', 'Bludgeoning', 'Cold', 'Fire', 'Force', 'Lightning', 'Necrotic', 
  'Piercing', 'Poison', 'Psychic', 'Radiant', 'Slashing', 'Thunder'
] as const

export const SPELL_SCHOOLS = [
  'Abjuration', 'Conjuration', 'Divination', 'Enchantment', 
  'Evocation', 'Illusion', 'Necromancy', 'Transmutation'
] as const

export const ARMOR_TYPES = {
  light: [
    { name: 'Padded', ac: 11, maxDex: null, stealthDisadvantage: true },
    { name: 'Leather', ac: 11, maxDex: null, stealthDisadvantage: false },
    { name: 'Studded Leather', ac: 12, maxDex: null, stealthDisadvantage: false },
  ],
  medium: [
    { name: 'Hide', ac: 12, maxDex: 2, stealthDisadvantage: false },
    { name: 'Chain Shirt', ac: 13, maxDex: 2, stealthDisadvantage: false },
    { name: 'Scale Mail', ac: 14, maxDex: 2, stealthDisadvantage: true },
    { name: 'Breastplate', ac: 14, maxDex: 2, stealthDisadvantage: false },
    { name: 'Half Plate', ac: 15, maxDex: 2, stealthDisadvantage: true },
  ],
  heavy: [
    { name: 'Ring Mail', ac: 14, maxDex: 0, stealthDisadvantage: true, strRequirement: null },
    { name: 'Chain Mail', ac: 16, maxDex: 0, stealthDisadvantage: true, strRequirement: 13 },
    { name: 'Splint', ac: 17, maxDex: 0, stealthDisadvantage: true, strRequirement: 15 },
    { name: 'Plate', ac: 18, maxDex: 0, stealthDisadvantage: true, strRequirement: 15 },
  ]
} as const

export const COMMON_WEAPONS = {
  simple: {
    melee: [
      { name: 'Club', damage: '1d4', damageType: 'bludgeoning', properties: ['light'] },
      { name: 'Dagger', damage: '1d4', damageType: 'piercing', properties: ['finesse', 'light', 'thrown'] },
      { name: 'Handaxe', damage: '1d6', damageType: 'slashing', properties: ['light', 'thrown'] },
      { name: 'Javelin', damage: '1d6', damageType: 'piercing', properties: ['thrown'] },
      { name: 'Mace', damage: '1d6', damageType: 'bludgeoning', properties: [] },
      { name: 'Quarterstaff', damage: '1d6', damageType: 'bludgeoning', properties: ['versatile'] },
      { name: 'Spear', damage: '1d6', damageType: 'piercing', properties: ['thrown', 'versatile'] },
    ],
    ranged: [
      { name: 'Crossbow, light', damage: '1d8', damageType: 'piercing', properties: ['ammunition', 'loading', 'two-handed'] },
      { name: 'Shortbow', damage: '1d6', damageType: 'piercing', properties: ['ammunition', 'two-handed'] },
    ]
  },
  martial: {
    melee: [
      { name: 'Battleaxe', damage: '1d8', damageType: 'slashing', properties: ['versatile'] },
      { name: 'Greatsword', damage: '2d6', damageType: 'slashing', properties: ['heavy', 'two-handed'] },
      { name: 'Longsword', damage: '1d8', damageType: 'slashing', properties: ['versatile'] },
      { name: 'Rapier', damage: '1d8', damageType: 'piercing', properties: ['finesse'] },
      { name: 'Shortsword', damage: '1d6', damageType: 'piercing', properties: ['finesse', 'light'] },
      { name: 'Warhammer', damage: '1d8', damageType: 'bludgeoning', properties: ['versatile'] },
    ],
    ranged: [
      { name: 'Crossbow, hand', damage: '1d6', damageType: 'piercing', properties: ['ammunition', 'light', 'loading'] },
      { name: 'Crossbow, heavy', damage: '1d10', damageType: 'piercing', properties: ['ammunition', 'heavy', 'loading', 'two-handed'] },
      { name: 'Longbow', damage: '1d8', damageType: 'piercing', properties: ['ammunition', 'heavy', 'two-handed'] },
    ]
  }
} as const

export const CURRENCY_CONVERSIONS = {
  cp: 1,      // Copper pieces (base unit)
  sp: 10,     // Silver pieces = 10 cp
  ep: 50,     // Electrum pieces = 50 cp  
  gp: 100,    // Gold pieces = 100 cp
  pp: 1000,   // Platinum pieces = 1000 cp
} as const

export const EXPERIENCE_THRESHOLDS = [
  { level: 1, xp: 0 },
  { level: 2, xp: 300 },
  { level: 3, xp: 900 },
  { level: 4, xp: 2700 },
  { level: 5, xp: 6500 },
  { level: 6, xp: 14000 },
  { level: 7, xp: 23000 },
  { level: 8, xp: 34000 },
  { level: 9, xp: 48000 },
  { level: 10, xp: 64000 },
  { level: 11, xp: 85000 },
  { level: 12, xp: 100000 },
  { level: 13, xp: 120000 },
  { level: 14, xp: 140000 },
  { level: 15, xp: 165000 },
  { level: 16, xp: 195000 },
  { level: 17, xp: 225000 },
  { level: 18, xp: 265000 },
  { level: 19, xp: 305000 },
  { level: 20, xp: 355000 },
] as const

export const PROFICIENCY_BONUS_BY_LEVEL = [
  { level: 1, bonus: 2 }, { level: 2, bonus: 2 }, { level: 3, bonus: 2 }, { level: 4, bonus: 2 },
  { level: 5, bonus: 3 }, { level: 6, bonus: 3 }, { level: 7, bonus: 3 }, { level: 8, bonus: 3 },
  { level: 9, bonus: 4 }, { level: 10, bonus: 4 }, { level: 11, bonus: 4 }, { level: 12, bonus: 4 },
  { level: 13, bonus: 5 }, { level: 14, bonus: 5 }, { level: 15, bonus: 5 }, { level: 16, bonus: 5 },
  { level: 17, bonus: 6 }, { level: 18, bonus: 6 }, { level: 19, bonus: 6 }, { level: 20, bonus: 6 },
] as const

export const DEFAULT_STARTING_EQUIPMENT = {
  artificer: { gp: 100, armor: 'Leather Armor', weapons: ['Light Crossbow'], tools: ['Thieves\' Tools'] },
  barbarian: { gp: 50, armor: 'None', weapons: ['Handaxe', 'Javelin'], equipment: ['Explorer\'s Pack'] },
  bard: { gp: 125, armor: 'Leather Armor', weapons: ['Rapier'], instruments: ['One instrument'] },
  cleric: { gp: 125, armor: 'Chain Mail', weapons: ['Mace'], equipment: ['Priest\'s Pack'] },
  druid: { gp: 50, armor: 'Leather Armor', weapons: ['Scimitar'], equipment: ['Dungeoneer\'s Pack'] },
  fighter: { gp: 125, armor: 'Chain Mail', weapons: ['All weapons'], equipment: ['Dungeoneer\'s Pack'] },
  monk: { gp: 20, armor: 'None', weapons: ['Simple weapons', 'Shortswords'], equipment: ['Dungeoneer\'s Pack'] },
  paladin: { gp: 125, armor: 'Chain Mail', weapons: ['All weapons'], equipment: ['Explorer\'s Pack'] },
  ranger: { gp: 100, armor: 'Leather Armor', weapons: ['All weapons'], equipment: ['Dungeoneer\'s Pack'] },
  rogue: { gp: 100, armor: 'Leather Armor', weapons: ['Finesse weapons'], equipment: ['Burglar\'s Pack'] },
  sorcerer: { gp: 75, armor: 'None', weapons: ['Simple weapons'], equipment: ['Dungeoneer\'s Pack'] },
  warlock: { gp: 100, armor: 'Leather Armor', weapons: ['Simple weapons'], equipment: ['Scholar\'s Pack'] },
  wizard: { gp: 100, armor: 'None', weapons: ['Simple weapons'], equipment: ['Scholar\'s Pack'] },
} as const