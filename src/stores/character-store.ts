import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { 
  Character, 
  CharacterSummary, 
  CharacterCalculations,
  CharacterFormData,
  AbilityScores 
} from '@/types/character'

interface CharacterState {
  // Characters list for current game
  characters: CharacterSummary[]
  charactersLoading: boolean
  charactersError: string | null

  // Current active character (being viewed/edited)
  currentCharacter: Character | null
  currentCharacterLoading: boolean
  currentCharacterError: string | null

  // Character calculations cache
  calculations: Record<string, CharacterCalculations> // characterId -> calculations

  // Character creation/edit
  isCreating: boolean
  isEditing: boolean
  formData: CharacterFormData | null
  formErrors: Record<string, string>

  // UI State
  activeTab: 'stats' | 'skills' | 'combat' | 'spells' | 'inventory' | 'backstory'
  isSheetExpanded: boolean
  selectedCharacterId: string | null

  // Import/Export
  importData: any | null
  exportFormat: 'json' | 'pdf'

  // Actions - Character list
  setCharacters: (characters: CharacterSummary[]) => void
  addCharacter: (character: CharacterSummary) => void
  updateCharacterSummary: (characterId: string, updates: Partial<CharacterSummary>) => void
  removeCharacter: (characterId: string) => void
  setCharactersLoading: (loading: boolean) => void
  setCharactersError: (error: string | null) => void

  // Actions - Current character
  setCurrentCharacter: (character: Character | null) => void
  setCurrentCharacterLoading: (loading: boolean) => void
  setCurrentCharacterError: (error: string | null) => void
  updateCurrentCharacter: (updates: Partial<Character>) => void

  // Actions - Calculations
  setCalculations: (characterId: string, calculations: CharacterCalculations) => void
  updateCalculations: (characterId: string, updates: Partial<CharacterCalculations>) => void
  clearCalculations: (characterId: string) => void

  // Actions - Character creation/editing
  startCreating: () => void
  startEditing: (character: Character) => void
  cancelForm: () => void
  setFormData: (data: Partial<CharacterFormData>) => void
  setFormErrors: (errors: Record<string, string>) => void
  clearFormErrors: () => void

  // Actions - Character updates
  updateAbilityScore: (ability: keyof AbilityScores, value: number) => void
  updateHitPoints: (current: number, max?: number, temp?: number) => void
  updateSkillProficiency: (skill: string, proficient: boolean, expertise?: boolean) => void
  updateSavingThrowProficiency: (ability: string, proficient: boolean) => void
  addSpell: (spell: any) => void
  removeSpell: (spellId: string) => void
  updateSpellSlots: (level: number, used: number) => void
  addEquipment: (item: any) => void
  removeEquipment: (itemId: string) => void
  updateCurrency: (currency: Partial<Character['currency']>) => void

  // Actions - UI
  setActiveTab: (tab: CharacterState['activeTab']) => void
  toggleSheetExpanded: () => void
  setSelectedCharacter: (characterId: string | null) => void

  // Actions - Import/Export
  setImportData: (data: any) => void
  setExportFormat: (format: 'json' | 'pdf') => void
  clearImportData: () => void

  // Reset
  reset: () => void
}

const initialFormData: CharacterFormData = {
  name: '',
  race: '',
  class: [],
  background: '',
  alignment: '',
  abilityScores: {
    strength: 10,
    dexterity: 10,
    constitution: 10,
    intelligence: 10,
    wisdom: 10,
    charisma: 10,
  },
  personalityTraits: '',
  ideals: '',
  bonds: '',
  flaws: '',
  backstory: '',
}

const initialState = {
  characters: [],
  charactersLoading: false,
  charactersError: null,
  currentCharacter: null,
  currentCharacterLoading: false,
  currentCharacterError: null,
  calculations: {},
  isCreating: false,
  isEditing: false,
  formData: null,
  formErrors: {},
  activeTab: 'stats' as const,
  isSheetExpanded: false,
  selectedCharacterId: null,
  importData: null,
  exportFormat: 'json' as const,
}

export const useCharacterStore = create<CharacterState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // Character list actions
      setCharacters: (characters) => set({ characters }),
      
      addCharacter: (character) => set((state) => ({
        characters: [...state.characters, character]
      })),
      
      updateCharacterSummary: (characterId, updates) => set((state) => ({
        characters: state.characters.map(char => 
          char.id === characterId ? { ...char, ...updates } : char
        )
      })),
      
      removeCharacter: (characterId) => set((state) => ({
        characters: state.characters.filter(char => char.id !== characterId),
        // Clear if this was the selected character
        selectedCharacterId: state.selectedCharacterId === characterId 
          ? null 
          : state.selectedCharacterId,
        currentCharacter: state.currentCharacter?.id === characterId 
          ? null 
          : state.currentCharacter,
      })),
      
      setCharactersLoading: (loading) => set({ charactersLoading: loading }),
      setCharactersError: (error) => set({ charactersError: error }),

      // Current character actions
      setCurrentCharacter: (character) => set({ 
        currentCharacter: character,
        selectedCharacterId: character?.id || null,
      }),
      
      setCurrentCharacterLoading: (loading) => set({ currentCharacterLoading: loading }),
      setCurrentCharacterError: (error) => set({ currentCharacterError: error }),
      
      updateCurrentCharacter: (updates) => set((state) => ({
        currentCharacter: state.currentCharacter 
          ? { ...state.currentCharacter, ...updates }
          : null
      })),

      // Calculations actions
      setCalculations: (characterId, calculations) => set((state) => ({
        calculations: {
          ...state.calculations,
          [characterId]: calculations
        }
      })),
      
      updateCalculations: (characterId, updates) => set((state) => ({
        calculations: {
          ...state.calculations,
          [characterId]: state.calculations[characterId] 
            ? { ...state.calculations[characterId], ...updates }
            : updates as CharacterCalculations
        }
      })),
      
      clearCalculations: (characterId) => set((state) => {
        const newCalculations = { ...state.calculations }
        delete newCalculations[characterId]
        return { calculations: newCalculations }
      }),

      // Form actions
      startCreating: () => set({ 
        isCreating: true, 
        isEditing: false, 
        formData: initialFormData,
        formErrors: {}
      }),
      
      startEditing: (character) => set({ 
        isCreating: false, 
        isEditing: true,
        formData: {
          name: character.name,
          race: character.race,
          class: character.class,
          background: character.background,
          alignment: character.alignment,
          abilityScores: {
            strength: character.strength,
            dexterity: character.dexterity,
            constitution: character.constitution,
            intelligence: character.intelligence,
            wisdom: character.wisdom,
            charisma: character.charisma,
          },
          personalityTraits: character.personalityTraits,
          ideals: character.ideals,
          bonds: character.bonds,
          flaws: character.flaws,
          backstory: character.backstory,
        },
        formErrors: {}
      }),
      
      cancelForm: () => set({ 
        isCreating: false, 
        isEditing: false, 
        formData: null,
        formErrors: {}
      }),
      
      setFormData: (data) => set((state) => ({
        formData: state.formData ? { ...state.formData, ...data } : data as CharacterFormData
      })),
      
      setFormErrors: (errors) => set({ formErrors: errors }),
      clearFormErrors: () => set({ formErrors: {} }),

      // Character update actions
      updateAbilityScore: (ability, value) => set((state) => {
        if (!state.currentCharacter) return state
        
        return {
          currentCharacter: {
            ...state.currentCharacter,
            [ability]: Math.max(1, Math.min(30, value)) // Clamp between 1-30
          }
        }
      }),
      
      updateHitPoints: (current, max, temp) => set((state) => {
        if (!state.currentCharacter) return state
        
        const updates: any = { currentHitPoints: current }
        if (max !== undefined) updates.maxHitPoints = max
        if (temp !== undefined) updates.tempHitPoints = temp
        
        return {
          currentCharacter: {
            ...state.currentCharacter,
            ...updates
          }
        }
      }),
      
      updateSkillProficiency: (skill, proficient, expertise = false) => set((state) => {
        if (!state.currentCharacter) return state
        
        return {
          currentCharacter: {
            ...state.currentCharacter,
            skills: {
              ...state.currentCharacter.skills,
              [skill]: { proficient, expertise }
            }
          }
        }
      }),
      
      updateSavingThrowProficiency: (ability, proficient) => set((state) => {
        if (!state.currentCharacter) return state
        
        return {
          currentCharacter: {
            ...state.currentCharacter,
            savingThrows: {
              ...state.currentCharacter.savingThrows,
              [ability]: proficient
            }
          }
        }
      }),
      
      addSpell: (spell) => set((state) => {
        if (!state.currentCharacter) return state
        
        const currentSpells = state.currentCharacter.spellsKnown || []
        return {
          currentCharacter: {
            ...state.currentCharacter,
            spellsKnown: [...currentSpells, spell]
          }
        }
      }),
      
      removeSpell: (spellId) => set((state) => {
        if (!state.currentCharacter) return state
        
        const currentSpells = state.currentCharacter.spellsKnown || []
        return {
          currentCharacter: {
            ...state.currentCharacter,
            spellsKnown: currentSpells.filter(spell => spell.name !== spellId)
          }
        }
      }),
      
      updateSpellSlots: (level, used) => set((state) => {
        if (!state.currentCharacter) return state
        
        const currentSlots = state.currentCharacter.spellSlots || {}
        return {
          currentCharacter: {
            ...state.currentCharacter,
            spellSlots: {
              ...currentSlots,
              [level]: {
                ...currentSlots[level],
                used: Math.max(0, used)
              }
            }
          }
        }
      }),
      
      addEquipment: (item) => set((state) => {
        if (!state.currentCharacter) return state
        
        return {
          currentCharacter: {
            ...state.currentCharacter,
            equipment: [...state.currentCharacter.equipment, item]
          }
        }
      }),
      
      removeEquipment: (itemId) => set((state) => {
        if (!state.currentCharacter) return state
        
        return {
          currentCharacter: {
            ...state.currentCharacter,
            equipment: state.currentCharacter.equipment.filter(item => item.id !== itemId)
          }
        }
      }),
      
      updateCurrency: (currency) => set((state) => {
        if (!state.currentCharacter) return state
        
        return {
          currentCharacter: {
            ...state.currentCharacter,
            currency: {
              ...state.currentCharacter.currency,
              ...currency
            }
          }
        }
      }),

      // UI actions
      setActiveTab: (tab) => set({ activeTab: tab }),
      toggleSheetExpanded: () => set((state) => ({ isSheetExpanded: !state.isSheetExpanded })),
      setSelectedCharacter: (characterId) => set({ selectedCharacterId: characterId }),

      // Import/Export actions
      setImportData: (data) => set({ importData: data }),
      setExportFormat: (format) => set({ exportFormat: format }),
      clearImportData: () => set({ importData: null }),

      // Reset
      reset: () => set(initialState),
    }),
    {
      name: 'character-store',
    }
  )
)