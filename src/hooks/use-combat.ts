'use client'

import { useEffect, useCallback } from 'react'
import { useCombatStore } from '@/stores/combat-store'
import { 
  getCombatsForGame,
  getCombatById,
  createCombat,
  updateCombat,
  deleteCombat,
  addCombatParticipant,
  updateCombatParticipant,
  removeCombatParticipant,
  rollInitiative,
  dealDamage,
  healParticipant,
} from '@/lib/api/combat'
import type { 
  Combat, 
  CombatParticipant, 
  CombatSummary,
  DamageResult,
  InitiativeResult
} from '@/types/combat'
import { toast } from '@/lib/utils/toast'

interface UseCombatReturn {
  // State
  combats: CombatSummary[]
  activeCombat: Combat | null
  combatsLoading: boolean
  activeCombatLoading: boolean
  combatsError: string | null
  activeCombatError: string | null
  
  // Combat operations
  loadCombats: (gameId: string) => Promise<void>
  loadCombat: (combatId: string) => Promise<void>
  createNewCombat: (gameId: string, name: string, turnTimer?: number) => Promise<Combat | null>
  updateCombatDetails: (combatId: string, updates: Partial<Combat>) => Promise<void>
  deleteCombatById: (combatId: string) => Promise<void>
  
  // Participant operations
  addParticipant: (combatId: string, participant: Omit<CombatParticipant, 'id' | 'combatId' | 'createdAt'>) => Promise<void>
  updateParticipant: (participantId: string, updates: Partial<CombatParticipant>) => Promise<void>
  removeParticipant: (participantId: string) => Promise<void>
  
  // Initiative operations
  rollInitiativeForCombat: (combatId: string) => Promise<InitiativeResult[]>
  
  // Health operations
  dealDamageToParticipant: (participantId: string, damage: number, damageType: string) => Promise<DamageResult | null>
  healParticipantById: (participantId: string, healing: number) => Promise<void>
  
  // Combat control
  startCombat: (combatId: string) => Promise<void>
  pauseCombat: (combatId: string) => Promise<void>
  resumeCombat: (combatId: string) => Promise<void>
  endCombat: (combatId: string) => Promise<void>
  nextTurn: (combatId: string) => Promise<void>
  previousTurn: (combatId: string) => Promise<void>
  
  // Utility
  refresh: (gameId?: string, combatId?: string) => Promise<void>
}

export function useCombat(gameId?: string): UseCombatReturn {
  const {
    combats,
    combatsLoading,
    combatsError,
    activeCombat,
    activeCombatLoading,
    activeCombatError,
    setCombats,
    setCombatsLoading,
    setCombatsError,
    setActiveCombat,
    setActiveCombatLoading,
    setActiveCombatError,
    addCombat,
    updateCombatSummary,
    removeCombat,
    updateActiveCombat,
  } = useCombatStore()

  // Load combats for a game
  const loadCombats = useCallback(async (gameId: string) => {
    try {
      setCombatsLoading(true)
      setCombatsError(null)
      
      const combatsList = await getCombatsForGame(gameId)
      setCombats(combatsList)
      
      toast.success(`Loaded ${combatsList.length} combats`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load combats'
      setCombatsError(message)
      toast.error(message)
    } finally {
      setCombatsLoading(false)
    }
  }, [setCombats, setCombatsLoading, setCombatsError])

  // Load specific combat
  const loadCombat = useCallback(async (combatId: string) => {
    try {
      setActiveCombatLoading(true)
      setActiveCombatError(null)
      
      const combat = await getCombatById(combatId)
      setActiveCombat(combat)
      
      if (combat) {
        toast.success(`Loaded combat: ${combat.name}`)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load combat'
      setActiveCombatError(message)
      toast.error(message)
    } finally {
      setActiveCombatLoading(false)
    }
  }, [setActiveCombat, setActiveCombatLoading, setActiveCombatError])

  // Create new combat
  const createNewCombat = useCallback(async (gameId: string, name: string, turnTimer?: number): Promise<Combat | null> => {
    try {
      const combat = await createCombat(gameId, name, turnTimer)
      
      // Add to combats list
      const summary: CombatSummary = {
        id: combat.id,
        name: combat.name,
        isActive: combat.isActive,
        participantCount: combat.participants.length,
        round: combat.round,
        currentParticipant: combat.currentTurn.toString(),
      }
      addCombat(summary)
      
      // Set as active combat
      setActiveCombat(combat)
      
      toast.success(`Created combat: ${combat.name}`)
      return combat
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create combat'
      toast.error(message)
      return null
    }
  }, [addCombat, setActiveCombat])

  // Update combat details
  const updateCombatDetails = useCallback(async (combatId: string, updates: Partial<Combat>) => {
    try {
      const updatedCombat = await updateCombat(combatId, updates)
      
      // Update active combat if it's the same
      if (activeCombat?.id === combatId) {
        setActiveCombat(updatedCombat)
      }
      
      // Update combat summary in list
      updateCombatSummary(combatId, {
        name: updatedCombat.name,
        isActive: updatedCombat.isActive,
        round: updatedCombat.round,
        currentParticipant: updatedCombat.currentTurn.toString(),
      })
      
      toast.success('Combat updated')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update combat'
      toast.error(message)
    }
  }, [activeCombat, setActiveCombat, updateCombatSummary])

  // Delete combat
  const deleteCombatById = useCallback(async (combatId: string) => {
    try {
      await deleteCombat(combatId)
      
      // Remove from store
      removeCombat(combatId)
      
      toast.success('Combat deleted')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete combat'
      toast.error(message)
    }
  }, [removeCombat])

  // Add participant
  const addParticipant = useCallback(async (
    combatId: string, 
    participant: Omit<CombatParticipant, 'id' | 'combatId' | 'createdAt'>
  ) => {
    try {
      const newParticipant = await addCombatParticipant(combatId, participant)
      
      // Update active combat if it matches
      if (activeCombat?.id === combatId) {
        updateActiveCombat({
          participants: [...activeCombat.participants, newParticipant]
        })
      }
      
      toast.success(`Added ${newParticipant.npcName || 'participant'} to combat`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add participant'
      toast.error(message)
    }
  }, [activeCombat, updateActiveCombat])

  // Update participant
  const updateParticipant = useCallback(async (
    participantId: string,
    updates: Partial<CombatParticipant>
  ) => {
    try {
      const updatedParticipant = await updateCombatParticipant(participantId, updates)
      
      // Update active combat if it contains this participant
      if (activeCombat) {
        const updatedParticipants = activeCombat.participants.map(p =>
          p.id === participantId ? updatedParticipant : p
        )
        updateActiveCombat({ participants: updatedParticipants })
      }
      
      toast.success('Participant updated')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update participant'
      toast.error(message)
    }
  }, [activeCombat, updateActiveCombat])

  // Remove participant
  const removeParticipant = useCallback(async (participantId: string) => {
    try {
      await removeCombatParticipant(participantId)
      
      // Update active combat if it contains this participant
      if (activeCombat) {
        const updatedParticipants = activeCombat.participants.filter(p => p.id !== participantId)
        updateActiveCombat({ participants: updatedParticipants })
      }
      
      toast.success('Participant removed')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to remove participant'
      toast.error(message)
    }
  }, [activeCombat, updateActiveCombat])

  // Roll initiative
  const rollInitiativeForCombat = useCallback(async (combatId: string): Promise<InitiativeResult[]> => {
    try {
      const results = await rollInitiative(combatId)
      
      // Refresh the combat to get updated initiative order
      await loadCombat(combatId)
      
      toast.success('Initiative rolled for all participants')
      return results
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to roll initiative'
      toast.error(message)
      return []
    }
  }, [loadCombat])

  // Deal damage
  const dealDamageToParticipant = useCallback(async (
    participantId: string,
    damage: number,
    damageType: string
  ): Promise<DamageResult | null> => {
    try {
      const result = await dealDamage(participantId, damage, damageType)
      
      // Update participant in active combat
      if (activeCombat) {
        const updatedParticipants = activeCombat.participants.map(p =>
          p.id === participantId ? { ...p, currentHP: result.newHP } : p
        )
        updateActiveCombat({ participants: updatedParticipants })
      }
      
      const statusText = result.isDead ? 'DEAD' : result.isUnconscious ? 'UNCONSCIOUS' : `${result.newHP} HP`
      toast.success(`${damage} ${damageType} damage dealt (${statusText})`)
      
      return result
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to deal damage'
      toast.error(message)
      return null
    }
  }, [activeCombat, updateActiveCombat])

  // Heal participant
  const healParticipantById = useCallback(async (participantId: string, healing: number) => {
    try {
      await healParticipant(participantId, healing)
      
      // Update participant in active combat
      if (activeCombat) {
        const participant = activeCombat.participants.find(p => p.id === participantId)
        if (participant && participant.currentHP !== undefined && participant.maxHP !== undefined) {
          const newHP = Math.min(participant.maxHP, participant.currentHP + healing)
          const updatedParticipants = activeCombat.participants.map(p =>
            p.id === participantId ? { ...p, currentHP: newHP } : p
          )
          updateActiveCombat({ participants: updatedParticipants })
        }
      }
      
      toast.success(`Healed for ${healing} HP`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to heal participant'
      toast.error(message)
    }
  }, [activeCombat, updateActiveCombat])

  // Combat control functions
  const startCombat = useCallback(async (combatId: string) => {
    await updateCombatDetails(combatId, { isActive: true, isPaused: false })
  }, [updateCombatDetails])

  const pauseCombat = useCallback(async (combatId: string) => {
    await updateCombatDetails(combatId, { isPaused: true })
  }, [updateCombatDetails])

  const resumeCombat = useCallback(async (combatId: string) => {
    await updateCombatDetails(combatId, { isPaused: false })
  }, [updateCombatDetails])

  const endCombat = useCallback(async (combatId: string) => {
    await updateCombatDetails(combatId, { isActive: false, isPaused: false })
  }, [updateCombatDetails])

  const nextTurn = useCallback(async (combatId: string) => {
    if (!activeCombat) return
    
    const nextTurnIndex = (activeCombat.currentTurn + 1) % activeCombat.participants.length
    const isNewRound = nextTurnIndex === 0
    const newRound = isNewRound ? activeCombat.round + 1 : activeCombat.round
    
    await updateCombatDetails(combatId, { 
      currentTurn: nextTurnIndex,
      round: newRound
    })
  }, [activeCombat, updateCombatDetails])

  const previousTurn = useCallback(async (combatId: string) => {
    if (!activeCombat) return
    
    const prevTurnIndex = activeCombat.currentTurn === 0 
      ? activeCombat.participants.length - 1 
      : activeCombat.currentTurn - 1
    const isNewRound = activeCombat.currentTurn === 0
    const newRound = isNewRound ? Math.max(1, activeCombat.round - 1) : activeCombat.round
    
    await updateCombatDetails(combatId, { 
      currentTurn: prevTurnIndex,
      round: newRound
    })
  }, [activeCombat, updateCombatDetails])

  // Refresh data
  const refresh = useCallback(async (gameId?: string, combatId?: string) => {
    const promises = []
    
    if (gameId) {
      promises.push(loadCombats(gameId))
    }
    
    if (combatId) {
      promises.push(loadCombat(combatId))
    }
    
    await Promise.all(promises)
  }, [loadCombats, loadCombat])

  // Auto-load combats when gameId changes
  useEffect(() => {
    if (gameId) {
      loadCombats(gameId)
    }
  }, [gameId, loadCombats])

  return {
    // State
    combats,
    activeCombat,
    combatsLoading,
    activeCombatLoading,
    combatsError,
    activeCombatError,
    
    // Combat operations
    loadCombats,
    loadCombat,
    createNewCombat,
    updateCombatDetails,
    deleteCombatById,
    
    // Participant operations
    addParticipant,
    updateParticipant,
    removeParticipant,
    
    // Initiative operations
    rollInitiativeForCombat,
    
    // Health operations
    dealDamageToParticipant,
    healParticipantById,
    
    // Combat control
    startCombat,
    pauseCombat,
    resumeCombat,
    endCombat,
    nextTurn,
    previousTurn,
    
    // Utility
    refresh,
  }
}

export default useCombat