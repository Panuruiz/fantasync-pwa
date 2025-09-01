import { createClient } from '@/lib/supabase/client'
import type { 
  Combat, 
  CombatParticipant, 
  CombatSummary,
  InitiativeResult,
  DamageResult,
  Condition
} from '@/types/combat'

const supabase = createClient()

// Combat CRUD operations
export async function createCombat(gameId: string, name: string, turnTimer?: number): Promise<Combat> {
  const { data, error } = await supabase
    .from('combats')
    .insert({
      game_id: gameId,
      name,
      turn_timer: turnTimer,
      round: 1,
      current_turn: 0,
      is_active: false,
      is_paused: false,
    })
    .select(`
      *,
      participants:combat_participants(*)
    `)
    .single()

  if (error) {
    console.error('Error creating combat:', error)
    throw new Error(`Failed to create combat: ${error.message}`)
  }

  return transformCombatData(data)
}

export async function getCombatById(combatId: string): Promise<Combat | null> {
  const { data, error } = await supabase
    .from('combats')
    .select(`
      *,
      participants:combat_participants(*)
    `)
    .eq('id', combatId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // Not found
    console.error('Error fetching combat:', error)
    throw new Error(`Failed to fetch combat: ${error.message}`)
  }

  return transformCombatData(data)
}

export async function getCombatsForGame(gameId: string): Promise<CombatSummary[]> {
  const { data, error } = await supabase
    .from('combats')
    .select(`
      id,
      name,
      is_active,
      round,
      current_turn,
      participants:combat_participants(id)
    `)
    .eq('game_id', gameId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching combats:', error)
    throw new Error(`Failed to fetch combats: ${error.message}`)
  }

  return data.map(combat => ({
    id: combat.id,
    name: combat.name,
    isActive: combat.is_active,
    participantCount: combat.participants?.length || 0,
    round: combat.round,
    currentParticipant: combat.current_turn.toString(),
  }))
}

export async function updateCombat(
  combatId: string, 
  updates: Partial<Pick<Combat, 'name' | 'round' | 'currentTurn' | 'isActive' | 'isPaused' | 'turnTimer'>>
): Promise<Combat> {
  const updateData: any = {}
  
  if (updates.name !== undefined) updateData.name = updates.name
  if (updates.round !== undefined) updateData.round = updates.round
  if (updates.currentTurn !== undefined) updateData.current_turn = updates.currentTurn
  if (updates.isActive !== undefined) updateData.is_active = updates.isActive
  if (updates.isPaused !== undefined) updateData.is_paused = updates.isPaused
  if (updates.turnTimer !== undefined) updateData.turn_timer = updates.turnTimer

  const { data, error } = await supabase
    .from('combats')
    .update(updateData)
    .eq('id', combatId)
    .select(`
      *,
      participants:combat_participants(*)
    `)
    .single()

  if (error) {
    console.error('Error updating combat:', error)
    throw new Error(`Failed to update combat: ${error.message}`)
  }

  return transformCombatData(data)
}

export async function deleteCombat(combatId: string): Promise<void> {
  const { error } = await supabase
    .from('combats')
    .delete()
    .eq('id', combatId)

  if (error) {
    console.error('Error deleting combat:', error)
    throw new Error(`Failed to delete combat: ${error.message}`)
  }
}

// Participant operations
export async function addCombatParticipant(
  combatId: string,
  participant: Omit<CombatParticipant, 'id' | 'combatId' | 'createdAt'>
): Promise<CombatParticipant> {
  const { data, error } = await supabase
    .from('combat_participants')
    .insert({
      combat_id: combatId,
      character_id: participant.characterId,
      npc_name: participant.npcName,
      initiative: participant.initiative,
      initiative_roll: participant.initiativeRoll,
      current_hp: participant.currentHP,
      max_hp: participant.maxHP,
      armor_class: participant.armorClass,
      conditions: participant.conditions,
      is_npc: participant.isNPC,
      is_visible: participant.isVisible,
      turn_order: participant.turnOrder,
    })
    .select()
    .single()

  if (error) {
    console.error('Error adding combat participant:', error)
    throw new Error(`Failed to add participant: ${error.message}`)
  }

  return transformParticipantData(data)
}

export async function updateCombatParticipant(
  participantId: string,
  updates: Partial<Omit<CombatParticipant, 'id' | 'combatId' | 'createdAt'>>
): Promise<CombatParticipant> {
  const updateData: any = {}
  
  if (updates.characterId !== undefined) updateData.character_id = updates.characterId
  if (updates.npcName !== undefined) updateData.npc_name = updates.npcName
  if (updates.initiative !== undefined) updateData.initiative = updates.initiative
  if (updates.initiativeRoll !== undefined) updateData.initiative_roll = updates.initiativeRoll
  if (updates.currentHP !== undefined) updateData.current_hp = updates.currentHP
  if (updates.maxHP !== undefined) updateData.max_hp = updates.maxHP
  if (updates.armorClass !== undefined) updateData.armor_class = updates.armorClass
  if (updates.conditions !== undefined) updateData.conditions = updates.conditions
  if (updates.isNPC !== undefined) updateData.is_npc = updates.isNPC
  if (updates.isVisible !== undefined) updateData.is_visible = updates.isVisible
  if (updates.turnOrder !== undefined) updateData.turn_order = updates.turnOrder

  const { data, error } = await supabase
    .from('combat_participants')
    .update(updateData)
    .eq('id', participantId)
    .select()
    .single()

  if (error) {
    console.error('Error updating combat participant:', error)
    throw new Error(`Failed to update participant: ${error.message}`)
  }

  return transformParticipantData(data)
}

export async function removeCombatParticipant(participantId: string): Promise<void> {
  const { error } = await supabase
    .from('combat_participants')
    .delete()
    .eq('id', participantId)

  if (error) {
    console.error('Error removing combat participant:', error)
    throw new Error(`Failed to remove participant: ${error.message}`)
  }
}

// Initiative operations
export async function rollInitiative(combatId: string): Promise<InitiativeResult[]> {
  // Get combat participants
  const { data: participants, error } = await supabase
    .from('combat_participants')
    .select(`
      id,
      character_id,
      npc_name,
      initiative,
      character:characters(dexterity)
    `)
    .eq('combat_id', combatId)

  if (error) {
    console.error('Error fetching participants for initiative:', error)
    throw new Error(`Failed to roll initiative: ${error.message}`)
  }

  // Roll initiative for each participant
  const results: InitiativeResult[] = []
  const updates = []

  for (const participant of participants) {
    const roll = Math.floor(Math.random() * 20) + 1
    const dexModifier = participant.character?.dexterity 
      ? Math.floor((participant.character.dexterity - 10) / 2)
      : 0
    const total = roll + dexModifier

    results.push({
      participantId: participant.id,
      roll,
      modifier: dexModifier,
      total,
    })

    updates.push({
      id: participant.id,
      initiative: total,
      initiative_roll: roll,
    })
  }

  // Update participants with new initiative values
  for (const update of updates) {
    await supabase
      .from('combat_participants')
      .update({
        initiative: update.initiative,
        initiative_roll: update.initiative_roll,
      })
      .eq('id', update.id)
  }

  // Sort participants by initiative and update turn order
  const sortedResults = results.sort((a, b) => b.total - a.total)
  
  for (let i = 0; i < sortedResults.length; i++) {
    await supabase
      .from('combat_participants')
      .update({ turn_order: i })
      .eq('id', sortedResults[i].participantId)
  }

  return sortedResults
}

// Health and condition operations
export async function dealDamage(
  participantId: string,
  damage: number,
  damageType: string
): Promise<DamageResult> {
  // Get current participant data
  const { data: participant, error: fetchError } = await supabase
    .from('combat_participants')
    .select('current_hp, max_hp')
    .eq('id', participantId)
    .single()

  if (fetchError) {
    console.error('Error fetching participant for damage:', fetchError)
    throw new Error(`Failed to deal damage: ${fetchError.message}`)
  }

  const currentHP = participant.current_hp || 0
  const newHP = Math.max(0, currentHP - damage)
  const isDead = newHP === 0 && damage > 0
  const isUnconscious = newHP === 0

  // Update participant HP
  const { error: updateError } = await supabase
    .from('combat_participants')
    .update({ current_hp: newHP })
    .eq('id', participantId)

  if (updateError) {
    console.error('Error updating participant HP:', updateError)
    throw new Error(`Failed to update HP: ${updateError.message}`)
  }

  return {
    participantId,
    damage,
    damageType,
    newHP,
    isDead,
    isUnconscious,
  }
}

export async function healParticipant(
  participantId: string,
  healing: number
): Promise<void> {
  // Get current participant data
  const { data: participant, error: fetchError } = await supabase
    .from('combat_participants')
    .select('current_hp, max_hp')
    .eq('id', participantId)
    .single()

  if (fetchError) {
    console.error('Error fetching participant for healing:', fetchError)
    throw new Error(`Failed to heal participant: ${fetchError.message}`)
  }

  const currentHP = participant.current_hp || 0
  const maxHP = participant.max_hp || currentHP
  const newHP = Math.min(maxHP, currentHP + healing)

  // Update participant HP
  const { error: updateError } = await supabase
    .from('combat_participants')
    .update({ current_hp: newHP })
    .eq('id', participantId)

  if (updateError) {
    console.error('Error updating participant HP:', updateError)
    throw new Error(`Failed to update HP: ${updateError.message}`)
  }
}

// Data transformation helpers
function transformCombatData(data: any): Combat {
  return {
    id: data.id,
    gameId: data.game_id,
    name: data.name,
    round: data.round,
    currentTurn: data.current_turn,
    isActive: data.is_active,
    isPaused: data.is_paused,
    turnTimer: data.turn_timer,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    participants: data.participants ? data.participants.map(transformParticipantData) : [],
  }
}

function transformParticipantData(data: any): CombatParticipant {
  return {
    id: data.id,
    combatId: data.combat_id,
    characterId: data.character_id,
    npcName: data.npc_name,
    initiative: data.initiative,
    initiativeRoll: data.initiative_roll,
    currentHP: data.current_hp,
    maxHP: data.max_hp,
    armorClass: data.armor_class,
    conditions: data.conditions || [],
    isNPC: data.is_npc,
    isVisible: data.is_visible,
    turnOrder: data.turn_order,
    createdAt: data.created_at,
  }
}