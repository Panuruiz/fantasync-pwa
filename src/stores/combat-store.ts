import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { 
  Combat, 
  CombatParticipant, 
  CombatSummary,
  Condition,
  InitiativeResult,
  CombatEvent,
  DamageResult
} from '@/types/combat'

interface CombatState {
  // Combat list for current game
  combats: CombatSummary[]
  combatsLoading: boolean
  combatsError: string | null

  // Current active combat
  activeCombat: Combat | null
  activeCombatLoading: boolean
  activeCombatError: string | null

  // Initiative tracking
  initiativeResults: InitiativeResult[]
  isRollingInitiative: boolean
  
  // Turn management
  currentTurn: number
  currentRound: number
  turnTimer: number | null
  turnTimeRemaining: number | null
  timerInterval: NodeJS.Timeout | null

  // Combat events log
  combatEvents: CombatEvent[]
  
  // UI State
  isInitiativeTrackerOpen: boolean
  isCombatLogOpen: boolean
  selectedParticipantId: string | null
  isAddingParticipant: boolean
  
  // Participant management
  participantForm: Partial<CombatParticipant> | null
  isEditingParticipant: boolean

  // Actions - Combat list
  setCombats: (combats: CombatSummary[]) => void
  addCombat: (combat: CombatSummary) => void
  updateCombatSummary: (combatId: string, updates: Partial<CombatSummary>) => void
  removeCombat: (combatId: string) => void
  setCombatsLoading: (loading: boolean) => void
  setCombatsError: (error: string | null) => void

  // Actions - Active combat
  setActiveCombat: (combat: Combat | null) => void
  setActiveCombatLoading: (loading: boolean) => void
  setActiveCombatError: (error: string | null) => void
  updateActiveCombat: (updates: Partial<Combat>) => void

  // Actions - Combat control
  startCombat: () => void
  pauseCombat: () => void
  resumeCombat: () => void
  endCombat: () => void
  nextTurn: () => void
  previousTurn: () => void
  goToTurn: (turnIndex: number) => void
  nextRound: () => void

  // Actions - Initiative
  setInitiativeResults: (results: InitiativeResult[]) => void
  addInitiativeResult: (result: InitiativeResult) => void
  updateInitiativeResult: (participantId: string, result: Partial<InitiativeResult>) => void
  clearInitiativeResults: () => void
  startRollingInitiative: () => void
  finishRollingInitiative: () => void
  rollInitiativeForAll: () => void

  // Actions - Participants
  addParticipant: (participant: Omit<CombatParticipant, 'id' | 'createdAt'>) => void
  updateParticipant: (participantId: string, updates: Partial<CombatParticipant>) => void
  removeParticipant: (participantId: string) => void
  moveParticipant: (participantId: string, newPosition: number) => void
  
  // Actions - Health and conditions
  dealDamage: (participantId: string, damage: number, damageType: string) => DamageResult
  healParticipant: (participantId: string, healing: number) => void
  addCondition: (participantId: string, condition: Condition) => void
  removeCondition: (participantId: string, conditionName: string) => void
  updateCondition: (participantId: string, conditionName: string, updates: Partial<Condition>) => void
  
  // Actions - Turn timer
  startTurnTimer: (seconds: number) => void
  pauseTurnTimer: () => void
  resumeTurnTimer: () => void
  stopTurnTimer: () => void
  resetTurnTimer: () => void
  
  // Actions - Events
  addCombatEvent: (event: Omit<CombatEvent, 'timestamp'>) => void
  clearCombatEvents: () => void
  
  // Actions - UI
  toggleInitiativeTracker: () => void
  toggleCombatLog: () => void
  setSelectedParticipant: (participantId: string | null) => void
  startAddingParticipant: () => void
  cancelAddingParticipant: () => void
  setParticipantForm: (data: Partial<CombatParticipant>) => void
  startEditingParticipant: (participant: CombatParticipant) => void
  cancelEditingParticipant: () => void

  // Reset
  reset: () => void
}

const initialState = {
  combats: [],
  combatsLoading: false,
  combatsError: null,
  activeCombat: null,
  activeCombatLoading: false,
  activeCombatError: null,
  initiativeResults: [],
  isRollingInitiative: false,
  currentTurn: 0,
  currentRound: 1,
  turnTimer: null,
  turnTimeRemaining: null,
  timerInterval: null,
  combatEvents: [],
  isInitiativeTrackerOpen: false,
  isCombatLogOpen: false,
  selectedParticipantId: null,
  isAddingParticipant: false,
  participantForm: null,
  isEditingParticipant: false,
}

export const useCombatStore = create<CombatState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // Combat list actions
      setCombats: (combats) => set({ combats }),
      
      addCombat: (combat) => set((state) => ({
        combats: [...state.combats, combat]
      })),
      
      updateCombatSummary: (combatId, updates) => set((state) => ({
        combats: state.combats.map(combat => 
          combat.id === combatId ? { ...combat, ...updates } : combat
        )
      })),
      
      removeCombat: (combatId) => set((state) => ({
        combats: state.combats.filter(combat => combat.id !== combatId),
        activeCombat: state.activeCombat?.id === combatId ? null : state.activeCombat,
      })),
      
      setCombatsLoading: (loading) => set({ combatsLoading: loading }),
      setCombatsError: (error) => set({ combatsError: error }),

      // Active combat actions
      setActiveCombat: (combat) => set({ 
        activeCombat: combat,
        currentTurn: combat?.currentTurn || 0,
        currentRound: combat?.round || 1,
      }),
      
      setActiveCombatLoading: (loading) => set({ activeCombatLoading: loading }),
      setActiveCombatError: (error) => set({ activeCombatError: error }),
      
      updateActiveCombat: (updates) => set((state) => ({
        activeCombat: state.activeCombat 
          ? { ...state.activeCombat, ...updates }
          : null
      })),

      // Combat control actions
      startCombat: () => set((state) => {
        if (!state.activeCombat) return state
        
        const event: Omit<CombatEvent, 'timestamp'> = {
          type: 'COMBAT_STARTED',
          combatId: state.activeCombat.id,
          data: { participants: state.activeCombat.participants }
        }
        
        return {
          activeCombat: {
            ...state.activeCombat,
            isActive: true,
            isPaused: false,
          },
          combatEvents: [...state.combatEvents, { ...event, timestamp: new Date().toISOString() }]
        }
      }),
      
      pauseCombat: () => set((state) => ({
        activeCombat: state.activeCombat 
          ? { ...state.activeCombat, isPaused: true }
          : null
      })),
      
      resumeCombat: () => set((state) => ({
        activeCombat: state.activeCombat 
          ? { ...state.activeCombat, isPaused: false }
          : null
      })),
      
      endCombat: () => set((state) => {
        if (!state.activeCombat) return state
        
        const event: Omit<CombatEvent, 'timestamp'> = {
          type: 'COMBAT_ENDED',
          combatId: state.activeCombat.id,
          data: { finalRound: state.currentRound, finalTurn: state.currentTurn }
        }
        
        // Clear timer if running
        if (state.timerInterval) {
          clearInterval(state.timerInterval)
        }
        
        return {
          activeCombat: {
            ...state.activeCombat,
            isActive: false,
            isPaused: false,
          },
          combatEvents: [...state.combatEvents, { ...event, timestamp: new Date().toISOString() }],
          timerInterval: null,
          turnTimeRemaining: null,
        }
      }),
      
      nextTurn: () => set((state) => {
        if (!state.activeCombat) return state
        
        const nextTurn = state.currentTurn + 1
        const isNewRound = nextTurn >= state.activeCombat.participants.length
        const newTurn = isNewRound ? 0 : nextTurn
        const newRound = isNewRound ? state.currentRound + 1 : state.currentRound
        
        const currentParticipant = state.activeCombat.participants[newTurn]
        
        const event: Omit<CombatEvent, 'timestamp'> = {
          type: isNewRound ? 'ROUND_STARTED' : 'TURN_CHANGED',
          combatId: state.activeCombat.id,
          data: { 
            round: newRound, 
            turn: newTurn,
            participant: currentParticipant?.id 
          }
        }
        
        return {
          currentTurn: newTurn,
          currentRound: newRound,
          activeCombat: {
            ...state.activeCombat,
            currentTurn: newTurn,
            round: newRound,
          },
          combatEvents: [...state.combatEvents, { ...event, timestamp: new Date().toISOString() }],
          // Reset turn timer if configured
          turnTimeRemaining: state.activeCombat.turnTimer || null,
        }
      }),
      
      previousTurn: () => set((state) => {
        if (!state.activeCombat) return state
        
        const prevTurn = state.currentTurn - 1
        const isNewRound = prevTurn < 0
        const newTurn = isNewRound ? state.activeCombat.participants.length - 1 : prevTurn
        const newRound = isNewRound ? Math.max(1, state.currentRound - 1) : state.currentRound
        
        return {
          currentTurn: newTurn,
          currentRound: newRound,
          activeCombat: {
            ...state.activeCombat,
            currentTurn: newTurn,
            round: newRound,
          },
        }
      }),
      
      goToTurn: (turnIndex) => set((state) => ({
        currentTurn: turnIndex,
        activeCombat: state.activeCombat 
          ? { ...state.activeCombat, currentTurn: turnIndex }
          : null
      })),
      
      nextRound: () => set((state) => {
        const newRound = state.currentRound + 1
        
        const event: Omit<CombatEvent, 'timestamp'> = {
          type: 'ROUND_STARTED',
          combatId: state.activeCombat?.id || '',
          data: { round: newRound }
        }
        
        return {
          currentRound: newRound,
          currentTurn: 0,
          activeCombat: state.activeCombat 
            ? { ...state.activeCombat, round: newRound, currentTurn: 0 }
            : null,
          combatEvents: [...state.combatEvents, { ...event, timestamp: new Date().toISOString() }],
        }
      }),

      // Initiative actions
      setInitiativeResults: (results) => set({ initiativeResults: results }),
      
      addInitiativeResult: (result) => set((state) => ({
        initiativeResults: [...state.initiativeResults, result]
      })),
      
      updateInitiativeResult: (participantId, updates) => set((state) => ({
        initiativeResults: state.initiativeResults.map(result => 
          result.participantId === participantId ? { ...result, ...updates } : result
        )
      })),
      
      clearInitiativeResults: () => set({ initiativeResults: [] }),
      
      startRollingInitiative: () => set({ isRollingInitiative: true }),
      finishRollingInitiative: () => set({ isRollingInitiative: false }),
      
      rollInitiativeForAll: () => {
        const state = get()
        if (!state.activeCombat) return
        
        const results: InitiativeResult[] = state.activeCombat.participants.map(participant => {
          const roll = Math.floor(Math.random() * 20) + 1
          // TODO: Get actual dex modifier from character
          const modifier = 0 // placeholder
          
          return {
            participantId: participant.id,
            roll,
            modifier,
            total: roll + modifier,
          }
        })
        
        // Sort by total initiative (highest first)
        results.sort((a, b) => b.total - a.total)
        
        set({ initiativeResults: results })
      },

      // Participant actions
      addParticipant: (participant) => set((state) => {
        if (!state.activeCombat) return state
        
        const newParticipant: CombatParticipant = {
          ...participant,
          id: `participant-${Date.now()}`,
          createdAt: new Date().toISOString(),
          turnOrder: state.activeCombat.participants.length,
        }
        
        const event: Omit<CombatEvent, 'timestamp'> = {
          type: 'PARTICIPANT_ADDED',
          combatId: state.activeCombat.id,
          data: { participant: newParticipant }
        }
        
        return {
          activeCombat: {
            ...state.activeCombat,
            participants: [...state.activeCombat.participants, newParticipant],
          },
          combatEvents: [...state.combatEvents, { ...event, timestamp: new Date().toISOString() }],
        }
      }),
      
      updateParticipant: (participantId, updates) => set((state) => {
        if (!state.activeCombat) return state
        
        return {
          activeCombat: {
            ...state.activeCombat,
            participants: state.activeCombat.participants.map(participant => 
              participant.id === participantId ? { ...participant, ...updates } : participant
            ),
          },
        }
      }),
      
      removeParticipant: (participantId) => set((state) => {
        if (!state.activeCombat) return state
        
        const event: Omit<CombatEvent, 'timestamp'> = {
          type: 'PARTICIPANT_REMOVED',
          combatId: state.activeCombat.id,
          data: { participantId }
        }
        
        return {
          activeCombat: {
            ...state.activeCombat,
            participants: state.activeCombat.participants.filter(p => p.id !== participantId),
          },
          combatEvents: [...state.combatEvents, { ...event, timestamp: new Date().toISOString() }],
        }
      }),
      
      moveParticipant: (participantId, newPosition) => set((state) => {
        if (!state.activeCombat) return state
        
        const participants = [...state.activeCombat.participants]
        const participantIndex = participants.findIndex(p => p.id === participantId)
        
        if (participantIndex === -1) return state
        
        const [participant] = participants.splice(participantIndex, 1)
        participants.splice(newPosition, 0, participant)
        
        // Update turn orders
        const updatedParticipants = participants.map((p, index) => ({
          ...p,
          turnOrder: index
        }))
        
        return {
          activeCombat: {
            ...state.activeCombat,
            participants: updatedParticipants,
          },
        }
      }),

      // Health and conditions
      dealDamage: (participantId, damage, damageType) => {
        const state = get()
        if (!state.activeCombat) return { participantId, damage: 0, damageType: '', newHP: 0, isDead: false, isUnconscious: false }
        
        const participant = state.activeCombat.participants.find(p => p.id === participantId)
        if (!participant || !participant.currentHP) return { participantId, damage: 0, damageType: '', newHP: 0, isDead: false, isUnconscious: false }
        
        const newHP = Math.max(0, participant.currentHP - damage)
        const isDead = newHP === 0 && damage > 0
        const isUnconscious = newHP === 0
        
        const result: DamageResult = {
          participantId,
          damage,
          damageType,
          newHP,
          isDead,
          isUnconscious
        }
        
        get().updateParticipant(participantId, { currentHP: newHP })
        
        const event: Omit<CombatEvent, 'timestamp'> = {
          type: 'DAMAGE_DEALT',
          combatId: state.activeCombat.id,
          data: result
        }
        
        get().addCombatEvent(event)
        
        return result
      },
      
      healParticipant: (participantId, healing) => set((state) => {
        if (!state.activeCombat) return state
        
        const participant = state.activeCombat.participants.find(p => p.id === participantId)
        if (!participant || participant.currentHP === undefined || participant.maxHP === undefined) return state
        
        const newHP = Math.min(participant.maxHP, participant.currentHP + healing)
        
        return {
          activeCombat: {
            ...state.activeCombat,
            participants: state.activeCombat.participants.map(p => 
              p.id === participantId ? { ...p, currentHP: newHP } : p
            ),
          },
        }
      }),
      
      addCondition: (participantId, condition) => set((state) => {
        if (!state.activeCombat) return state
        
        const event: Omit<CombatEvent, 'timestamp'> = {
          type: 'CONDITION_APPLIED',
          combatId: state.activeCombat.id,
          data: { participantId, condition }
        }
        
        return {
          activeCombat: {
            ...state.activeCombat,
            participants: state.activeCombat.participants.map(participant => 
              participant.id === participantId 
                ? { ...participant, conditions: [...participant.conditions, condition] }
                : participant
            ),
          },
          combatEvents: [...state.combatEvents, { ...event, timestamp: new Date().toISOString() }],
        }
      }),
      
      removeCondition: (participantId, conditionName) => set((state) => {
        if (!state.activeCombat) return state
        
        const event: Omit<CombatEvent, 'timestamp'> = {
          type: 'CONDITION_REMOVED',
          combatId: state.activeCombat.id,
          data: { participantId, conditionName }
        }
        
        return {
          activeCombat: {
            ...state.activeCombat,
            participants: state.activeCombat.participants.map(participant => 
              participant.id === participantId 
                ? { ...participant, conditions: participant.conditions.filter(c => c.name !== conditionName) }
                : participant
            ),
          },
          combatEvents: [...state.combatEvents, { ...event, timestamp: new Date().toISOString() }],
        }
      }),
      
      updateCondition: (participantId, conditionName, updates) => set((state) => {
        if (!state.activeCombat) return state
        
        return {
          activeCombat: {
            ...state.activeCombat,
            participants: state.activeCombat.participants.map(participant => 
              participant.id === participantId 
                ? { 
                    ...participant, 
                    conditions: participant.conditions.map(c => 
                      c.name === conditionName ? { ...c, ...updates } : c
                    )
                  }
                : participant
            ),
          },
        }
      }),

      // Turn timer actions
      startTurnTimer: (seconds) => {
        const state = get()
        
        // Clear existing timer
        if (state.timerInterval) {
          clearInterval(state.timerInterval)
        }
        
        set({ 
          turnTimer: seconds, 
          turnTimeRemaining: seconds 
        })
        
        const interval = setInterval(() => {
          const currentState = get()
          const timeLeft = (currentState.turnTimeRemaining || 0) - 1
          
          if (timeLeft <= 0) {
            get().stopTurnTimer()
            // Auto-advance turn when timer expires (optional)
            // get().nextTurn()
          } else {
            set({ turnTimeRemaining: timeLeft })
          }
        }, 1000)
        
        set({ timerInterval: interval })
      },
      
      pauseTurnTimer: () => {
        const state = get()
        if (state.timerInterval) {
          clearInterval(state.timerInterval)
          set({ timerInterval: null })
        }
      },
      
      resumeTurnTimer: () => {
        const state = get()
        if (state.turnTimeRemaining && !state.timerInterval) {
          get().startTurnTimer(state.turnTimeRemaining)
        }
      },
      
      stopTurnTimer: () => {
        const state = get()
        if (state.timerInterval) {
          clearInterval(state.timerInterval)
        }
        set({ 
          timerInterval: null,
          turnTimeRemaining: null,
          turnTimer: null,
        })
      },
      
      resetTurnTimer: () => {
        const state = get()
        if (state.turnTimer) {
          get().startTurnTimer(state.turnTimer)
        }
      },

      // Events
      addCombatEvent: (event) => set((state) => ({
        combatEvents: [
          ...state.combatEvents, 
          { ...event, timestamp: new Date().toISOString() }
        ]
      })),
      
      clearCombatEvents: () => set({ combatEvents: [] }),

      // UI actions
      toggleInitiativeTracker: () => set((state) => ({ 
        isInitiativeTrackerOpen: !state.isInitiativeTrackerOpen 
      })),
      
      toggleCombatLog: () => set((state) => ({ 
        isCombatLogOpen: !state.isCombatLogOpen 
      })),
      
      setSelectedParticipant: (participantId) => set({ selectedParticipantId: participantId }),
      
      startAddingParticipant: () => set({ 
        isAddingParticipant: true,
        participantForm: {
          npcName: '',
          initiative: 0,
          currentHP: 1,
          maxHP: 1,
          armorClass: 10,
          conditions: [],
          isNPC: true,
          isVisible: true,
        }
      }),
      
      cancelAddingParticipant: () => set({ 
        isAddingParticipant: false,
        participantForm: null
      }),
      
      setParticipantForm: (data) => set((state) => ({
        participantForm: state.participantForm ? { ...state.participantForm, ...data } : data
      })),
      
      startEditingParticipant: (participant) => set({ 
        isEditingParticipant: true,
        participantForm: { ...participant },
        selectedParticipantId: participant.id,
      }),
      
      cancelEditingParticipant: () => set({ 
        isEditingParticipant: false,
        participantForm: null
      }),

      // Reset
      reset: () => {
        const state = get()
        if (state.timerInterval) {
          clearInterval(state.timerInterval)
        }
        set(initialState)
      },
    }),
    {
      name: 'combat-store',
    }
  )
)