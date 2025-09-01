// Character API Layer

import { createClient } from '@/lib/supabase/client'
import type { Character, CharacterSummary, CharacterFormData } from '@/types/character'

const supabase = createClient()

export interface CreateCharacterData {
  gameId: string
  name: string
  race: string
  class: Array<{ name: string; level: number; hitDie: string }>
  background?: string
  alignment?: string
  abilityScores: {
    strength: number
    dexterity: number
    constitution: number
    intelligence: number
    wisdom: number
    charisma: number
  }
  personalityTraits?: string
  ideals?: string
  bonds?: string
  flaws?: string
  backstory?: string
  isPublic?: boolean
}

export interface UpdateCharacterData extends Partial<CreateCharacterData> {
  id: string
}

/**
 * Get all characters for a specific game
 */
export async function getCharacters(gameId: string): Promise<CharacterSummary[]> {
  const { data, error } = await supabase
    .from('characters')
    .select(`
      id,
      name,
      race,
      class,
      level,
      avatar_url,
      current_hit_points,
      max_hit_points,
      is_public,
      user_id,
      users!inner(username)
    `)
    .eq('game_id', gameId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching characters:', error)
    throw new Error('Failed to fetch characters')
  }

  return data?.map(char => ({
    id: char.id,
    name: char.name,
    race: char.race,
    class: formatClassString(char.class),
    level: char.level,
    avatarUrl: char.avatar_url,
    currentHitPoints: char.current_hit_points,
    maxHitPoints: char.max_hit_points,
    isPublic: char.is_public,
  })) || []
}

/**
 * Get a specific character by ID
 */
export async function getCharacter(characterId: string): Promise<Character | null> {
  const { data, error } = await supabase
    .from('characters')
    .select('*')
    .eq('id', characterId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null // Character not found
    }
    console.error('Error fetching character:', error)
    throw new Error('Failed to fetch character')
  }

  return mapDatabaseCharacterToCharacter(data)
}

/**
 * Create a new character
 */
export async function createCharacter(characterData: CreateCharacterData): Promise<Character> {
  const { data: user } = await supabase.auth.getUser()
  if (!user.user) throw new Error('Not authenticated')

  // Calculate initial stats
  const totalLevel = characterData.class.reduce((sum, c) => sum + c.level, 0)
  const proficiencyBonus = calculateProficiencyBonus(totalLevel)
  const constitutionModifier = Math.floor((characterData.abilityScores.constitution - 10) / 2)
  
  // Calculate initial HP (first level + con modifier per level)
  const baseHP = parseInt(characterData.class[0].hitDie.replace('d', ''))
  const initialHP = baseHP + constitutionModifier + (totalLevel - 1) * (Math.ceil(baseHP / 2) + 1 + constitutionModifier)

  const newCharacter = {
    game_id: characterData.gameId,
    user_id: user.user.id,
    name: characterData.name,
    race: characterData.race,
    class: characterData.class,
    level: totalLevel,
    background: characterData.background,
    alignment: characterData.alignment,
    
    // Ability Scores
    strength: characterData.abilityScores.strength,
    dexterity: characterData.abilityScores.dexterity,
    constitution: characterData.abilityScores.constitution,
    intelligence: characterData.abilityScores.intelligence,
    wisdom: characterData.abilityScores.wisdom,
    charisma: characterData.abilityScores.charisma,
    
    // Combat Stats
    armor_class: 10 + Math.floor((characterData.abilityScores.dexterity - 10) / 2), // Base AC
    initiative: 0, // Will be calculated
    speed: 30, // Default speed
    max_hit_points: Math.max(1, initialHP),
    current_hit_points: Math.max(1, initialHP),
    temp_hit_points: 0,
    hit_dice: createInitialHitDice(characterData.class),
    
    // Proficiencies  
    proficiency_bonus: proficiencyBonus,
    saving_throws: createInitialSavingThrows(),
    skills: createInitialSkills(),
    
    // Features & Traits
    features: [],
    traits: [],
    languages: ['Common'],
    proficiencies: {
      armor: [],
      weapons: [],
      tools: []
    },
    
    // Equipment
    equipment: [],
    currency: { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 },
    
    // Backstory
    personality_traits: characterData.personalityTraits,
    ideals: characterData.ideals,
    bonds: characterData.bonds,
    flaws: characterData.flaws,
    backstory: characterData.backstory,
    
    // Metadata
    is_public: characterData.isPublic || false,
  }

  const { data, error } = await supabase
    .from('characters')
    .insert(newCharacter)
    .select()
    .single()

  if (error) {
    console.error('Error creating character:', error)
    throw new Error('Failed to create character')
  }

  return mapDatabaseCharacterToCharacter(data)
}

/**
 * Update an existing character
 */
export async function updateCharacter(characterData: UpdateCharacterData): Promise<Character> {
  const updates: any = {
    updated_at: new Date().toISOString(),
  }

  // Map fields to database columns
  if (characterData.name !== undefined) updates.name = characterData.name
  if (characterData.race !== undefined) updates.race = characterData.race
  if (characterData.class !== undefined) {
    updates.class = characterData.class
    updates.level = characterData.class.reduce((sum, c) => sum + c.level, 0)
  }
  if (characterData.background !== undefined) updates.background = characterData.background
  if (characterData.alignment !== undefined) updates.alignment = characterData.alignment
  if (characterData.isPublic !== undefined) updates.is_public = characterData.isPublic

  if (characterData.abilityScores) {
    updates.strength = characterData.abilityScores.strength
    updates.dexterity = characterData.abilityScores.dexterity
    updates.constitution = characterData.abilityScores.constitution
    updates.intelligence = characterData.abilityScores.intelligence
    updates.wisdom = characterData.abilityScores.wisdom
    updates.charisma = characterData.abilityScores.charisma
  }

  if (characterData.personalityTraits !== undefined) updates.personality_traits = characterData.personalityTraits
  if (characterData.ideals !== undefined) updates.ideals = characterData.ideals
  if (characterData.bonds !== undefined) updates.bonds = characterData.bonds
  if (characterData.flaws !== undefined) updates.flaws = characterData.flaws
  if (characterData.backstory !== undefined) updates.backstory = characterData.backstory

  const { data, error } = await supabase
    .from('characters')
    .update(updates)
    .eq('id', characterData.id)
    .select()
    .single()

  if (error) {
    console.error('Error updating character:', error)
    throw new Error('Failed to update character')
  }

  return mapDatabaseCharacterToCharacter(data)
}

/**
 * Delete a character
 */
export async function deleteCharacter(characterId: string): Promise<void> {
  const { error } = await supabase
    .from('characters')
    .update({ is_active: false })
    .eq('id', characterId)

  if (error) {
    console.error('Error deleting character:', error)
    throw new Error('Failed to delete character')
  }
}

/**
 * Update character hit points
 */
export async function updateCharacterHitPoints(
  characterId: string, 
  current: number, 
  max?: number, 
  temp?: number
): Promise<void> {
  const updates: any = {
    current_hit_points: Math.max(0, current),
    updated_at: new Date().toISOString(),
  }
  
  if (max !== undefined) updates.max_hit_points = Math.max(1, max)
  if (temp !== undefined) updates.temp_hit_points = Math.max(0, temp)

  const { error } = await supabase
    .from('characters')
    .update(updates)
    .eq('id', characterId)

  if (error) {
    console.error('Error updating character HP:', error)
    throw new Error('Failed to update character hit points')
  }
}

// Helper Functions

function formatClassString(classes: any[]): string {
  return classes
    .map(c => `${c.name} ${c.level}`)
    .join(' / ')
}

function calculateProficiencyBonus(level: number): number {
  if (level >= 17) return 6
  if (level >= 13) return 5
  if (level >= 9) return 4
  if (level >= 5) return 3
  return 2
}

function createInitialHitDice(classes: Array<{ name: string; level: number; hitDie: string }>) {
  const hitDice: any = {}
  
  classes.forEach(charClass => {
    const die = charClass.hitDie
    if (hitDice[die]) {
      hitDice[die].total += charClass.level
      hitDice[die].current += charClass.level
    } else {
      hitDice[die] = {
        total: charClass.level,
        current: charClass.level
      }
    }
  })
  
  return hitDice
}

function createInitialSavingThrows() {
  return {
    str: false,
    dex: false,
    con: false,
    int: false,
    wis: false,
    cha: false,
  }
}

function createInitialSkills() {
  const skills: any = {}
  const skillNames = [
    'acrobatics', 'animalHandling', 'arcana', 'athletics', 'deception',
    'history', 'insight', 'intimidation', 'investigation', 'medicine',
    'nature', 'perception', 'performance', 'persuasion', 'religion',
    'sleightOfHand', 'stealth', 'survival'
  ]
  
  skillNames.forEach(skill => {
    skills[skill] = { proficient: false, expertise: false }
  })
  
  return skills
}

function mapDatabaseCharacterToCharacter(dbChar: any): Character {
  return {
    id: dbChar.id,
    gameId: dbChar.game_id,
    userId: dbChar.user_id,
    name: dbChar.name,
    race: dbChar.race,
    class: dbChar.class || [],
    level: dbChar.level,
    background: dbChar.background,
    alignment: dbChar.alignment,
    
    // Ability Scores
    strength: dbChar.strength,
    dexterity: dbChar.dexterity,
    constitution: dbChar.constitution,
    intelligence: dbChar.intelligence,
    wisdom: dbChar.wisdom,
    charisma: dbChar.charisma,
    
    // Combat Stats
    armorClass: dbChar.armor_class,
    initiative: dbChar.initiative,
    speed: dbChar.speed,
    maxHitPoints: dbChar.max_hit_points,
    currentHitPoints: dbChar.current_hit_points,
    tempHitPoints: dbChar.temp_hit_points,
    hitDice: dbChar.hit_dice || {},
    
    // Proficiencies
    proficiencyBonus: dbChar.proficiency_bonus,
    savingThrows: dbChar.saving_throws || createInitialSavingThrows(),
    skills: dbChar.skills || createInitialSkills(),
    
    // Features & Traits
    features: dbChar.features || [],
    traits: dbChar.traits || [],
    languages: dbChar.languages || ['Common'],
    proficiencies: dbChar.proficiencies || { armor: [], weapons: [], tools: [] },
    
    // Spellcasting
    spellcastingAbility: dbChar.spellcasting_ability,
    spellSaveDC: dbChar.spell_save_dc,
    spellAttackBonus: dbChar.spell_attack_bonus,
    spellSlots: dbChar.spell_slots,
    spellsKnown: dbChar.spells_known,
    
    // Equipment
    equipment: dbChar.equipment || [],
    currency: dbChar.currency || { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 },
    
    // Backstory
    personalityTraits: dbChar.personality_traits,
    ideals: dbChar.ideals,
    bonds: dbChar.bonds,
    flaws: dbChar.flaws,
    backstory: dbChar.backstory,
    
    // Metadata
    avatarUrl: dbChar.avatar_url,
    isPublic: dbChar.is_public,
    isActive: dbChar.is_active,
    createdAt: dbChar.created_at,
    updatedAt: dbChar.updated_at,
  }
}