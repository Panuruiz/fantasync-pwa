'use client'

import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCharacterStore } from '@/stores/character-store'
import * as charactersApi from '@/lib/api/characters'

/**
 * Hook for managing characters in a game
 */
export function useCharacters(gameId: string) {
  const { 
    setCharacters, 
    setCharactersLoading, 
    setCharactersError 
  } = useCharacterStore()
  
  const queryClient = useQueryClient()

  // Query for fetching characters
  const {
    data: characters = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['characters', gameId],
    queryFn: () => charactersApi.getCharacters(gameId),
    enabled: !!gameId,
  })

  // Sync with store
  useEffect(() => {
    setCharacters(characters)
    setCharactersLoading(isLoading)
    setCharactersError(error ? 'Failed to load characters' : null)
  }, [characters, isLoading, error, setCharacters, setCharactersLoading, setCharactersError])

  // Create character mutation
  const createCharacterMutation = useMutation({
    mutationFn: charactersApi.createCharacter,
    onSuccess: (newCharacter) => {
      queryClient.invalidateQueries({ queryKey: ['characters', gameId] })
      queryClient.setQueryData(['character', newCharacter.id], newCharacter)
    },
  })

  // Update character mutation
  const updateCharacterMutation = useMutation({
    mutationFn: charactersApi.updateCharacter,
    onSuccess: (updatedCharacter) => {
      queryClient.invalidateQueries({ queryKey: ['characters', gameId] })
      queryClient.setQueryData(['character', updatedCharacter.id], updatedCharacter)
    },
  })

  // Delete character mutation
  const deleteCharacterMutation = useMutation({
    mutationFn: charactersApi.deleteCharacter,
    onSuccess: (_, characterId) => {
      queryClient.invalidateQueries({ queryKey: ['characters', gameId] })
      queryClient.removeQueries({ queryKey: ['character', characterId] })
    },
  })

  return {
    characters,
    isLoading,
    error,
    createCharacter: createCharacterMutation.mutateAsync,
    updateCharacter: updateCharacterMutation.mutateAsync,
    deleteCharacter: deleteCharacterMutation.mutateAsync,
    isCreating: createCharacterMutation.isPending,
    isUpdating: updateCharacterMutation.isPending,
    isDeleting: deleteCharacterMutation.isPending,
  }
}

/**
 * Hook for managing a single character
 */
export function useCharacter(characterId: string) {
  const { 
    setCurrentCharacter, 
    setCurrentCharacterLoading, 
    setCurrentCharacterError 
  } = useCharacterStore()
  
  const queryClient = useQueryClient()

  // Query for fetching a specific character
  const {
    data: character,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['character', characterId],
    queryFn: () => charactersApi.getCharacter(characterId),
    enabled: !!characterId,
  })

  // Sync with store
  useEffect(() => {
    setCurrentCharacter(character || null)
    setCurrentCharacterLoading(isLoading)
    setCurrentCharacterError(error ? 'Failed to load character' : null)
  }, [character, isLoading, error, setCurrentCharacter, setCurrentCharacterLoading, setCurrentCharacterError])

  // Update HP mutation
  const updateHPMutation = useMutation({
    mutationFn: ({ current, max, temp }: { current: number; max?: number; temp?: number }) => 
      charactersApi.updateCharacterHitPoints(characterId, current, max, temp),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['character', characterId] })
      if (character) {
        queryClient.invalidateQueries({ queryKey: ['characters', character.gameId] })
      }
    },
  })

  return {
    character,
    isLoading,
    error,
    updateHitPoints: updateHPMutation.mutateAsync,
    isUpdatingHP: updateHPMutation.isPending,
  }
}

/**
 * Hook for character calculations
 */
export function useCharacterCalculations(character: any) {
  const { calculations, setCalculations } = useCharacterStore()
  
  useEffect(() => {
    if (character) {
      // Import calculations here to avoid circular dependency
      import('@/lib/utils/dnd/calculations').then(({ calculateCharacterStats }) => {
        const calculated = calculateCharacterStats(character)
        setCalculations(character.id, calculated)
      })
    }
  }, [character, setCalculations])

  return calculations[character?.id] || null
}