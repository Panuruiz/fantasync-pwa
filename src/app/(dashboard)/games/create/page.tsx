'use client'

import { useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createGame } from '@/lib/api/games'
import { useGameStore } from '@/stores/game-store'
import { toast, handleApiError } from '@/lib/utils/toast'
import { withRLSErrorHandling, getRLSStatusInfo } from '@/lib/utils/rls-helper'
import { debounce } from '@/lib/utils'
import type { GameCreationData, GameSystem, GamePrivacy } from '@/types/game'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ArrowLeft, ArrowRight, Check, Palette, Users, Dice6, Shield, Eye, EyeOff, Users as UsersIcon, Loader2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

const GAME_SYSTEMS: { value: GameSystem; label: string; description: string }[] = [
  { value: 'DND5E', label: 'D&D 5th Edition', description: 'The most popular tabletop RPG system' },
  { value: 'PATHFINDER2E', label: 'Pathfinder 2e', description: 'Deep character customization and tactics' },
  { value: 'CALL_OF_CTHULHU', label: 'Call of Cthulhu', description: 'Horror and investigation in the Cthulhu Mythos' },
  { value: 'VAMPIRE', label: 'Vampire: The Masquerade', description: 'Gothic horror and political intrigue' },
  { value: 'CUSTOM', label: 'Custom System', description: 'Use your own homebrew rules' },
]

const PRIVACY_OPTIONS: { value: GamePrivacy; label: string; description: string; icon: any }[] = [
  { 
    value: 'PRIVATE', 
    label: 'Private', 
    description: 'Invitation only - only you can invite players',
    icon: Shield
  },
  { 
    value: 'FRIENDS', 
    label: 'Friends Only', 
    description: 'Your friends can request to join',
    icon: Users
  },
  { 
    value: 'PUBLIC', 
    label: 'Public', 
    description: 'Anyone can discover and join your game',
    icon: Eye
  },
]

const THEME_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ec4899', // pink
]

export default function CreateGamePage() {
  const router = useRouter()
  const { addGame } = useGameStore()
  
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  
  const [gameData, setGameData] = useState<GameCreationData>({
    name: '',
    system: 'DND5E',
    privacy: 'PRIVATE',
    maxPlayers: 4,
  })

  const totalSteps = 3
  const progress = (step / totalSteps) * 100

  const updateGameData = (updates: Partial<GameCreationData>) => {
    setGameData(prev => ({ ...prev, ...updates }))
    // Clear validation errors for updated fields
    const updatedFields = Object.keys(updates)
    setValidationErrors(prev => {
      const newErrors = { ...prev }
      updatedFields.forEach(field => delete newErrors[field])
      return newErrors
    })
  }

  const validateField = useCallback((field: string, value: any): string | undefined => {
    switch (field) {
      case 'name':
        if (!value || value.trim().length === 0) return 'Game name is required'
        if (value.trim().length < 3) return 'Game name must be at least 3 characters'
        if (value.trim().length > 100) return 'Game name must be less than 100 characters'
        // Check for special characters that might cause issues
        if (!/^[a-zA-Z0-9\s\-_',.:!?&]+$/.test(value)) {
          return 'Game name contains invalid characters'
        }
        break
      case 'description':
        if (value && value.length > 500) return 'Description must be less than 500 characters'
        break
      case 'campaignName':
        if (value && value.length > 100) return 'Campaign name must be less than 100 characters'
        break
      case 'coverImage':
        if (value && !isValidUrl(value)) return 'Please enter a valid URL'
        if (value && !isValidImageUrl(value)) return 'URL must point to an image (jpg, png, gif, webp)'
        break
      case 'maxPlayers':
        if (value < 2) return 'Minimum 2 players required'
        if (value > 10) return 'Maximum 10 players allowed'
        break
    }
    return undefined
  }, [])

  const isValidUrl = (string: string): boolean => {
    try {
      const url = new URL(string)
      return url.protocol === 'http:' || url.protocol === 'https:'
    } catch (_) {
      return false
    }
  }
  
  const isValidImageUrl = (url: string): boolean => {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg']
    const lowercaseUrl = url.toLowerCase()
    
    // Check for common image extensions in the URL
    const hasExtension = imageExtensions.some(ext => lowercaseUrl.includes(ext))
    
    // Also allow known image hosting services that don't always show extensions
    const knownImageHosts = [
      'unsplash.com',
      'pexels.com',
      'pixabay.com',
      'cloudinary.com',
      'imgur.com',
      'flickr.com',
      'gravatar.com',
      'picsum.photos',
      'placeholder.com',
      'placehold.co'
    ]
    
    const isKnownHost = knownImageHosts.some(host => lowercaseUrl.includes(host))
    
    return hasExtension || isKnownHost
  }

  // Debounced validation for better performance
  const debouncedValidate = useMemo(
    () => debounce((field: string, value: any) => {
      const error = validateField(field, value)
      setValidationErrors(prev => {
        if (error) {
          return { ...prev, [field]: error }
        } else {
          const newErrors = { ...prev }
          delete newErrors[field]
          return newErrors
        }
      })
    }, 300),
    [validateField]
  )
  
  const handleFieldBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }))
    const error = validateField(field, (gameData as any)[field])
    if (error) {
      setValidationErrors(prev => ({ ...prev, [field]: error }))
    }
  }
  
  const handleFieldChange = (field: string, value: any) => {
    updateGameData({ [field]: value })
    // Only validate if field has been touched
    if (touched[field]) {
      debouncedValidate(field, value)
    }
  }

  const nextStep = () => {
    if (step < totalSteps) {
      setStep(step + 1)
    }
  }

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  const canProceed = () => {
    switch (step) {
      case 1:
        const nameError = validateField('name', gameData.name)
        const descError = validateField('description', gameData.description)
        const campaignError = validateField('campaignName', gameData.campaignName)
        return !nameError && !descError && !campaignError && gameData.name.trim().length > 0
      case 2:
        const coverError = validateField('coverImage', gameData.coverImage)
        return !coverError
      case 3:
        const maxPlayersError = validateField('maxPlayers', gameData.maxPlayers)
        return !maxPlayersError
      default:
        return false
    }
  }

  const handleSubmit = async () => {
    if (!canProceed()) {
      // Mark all fields as touched to show validation errors
      setTouched({
        name: true,
        description: true,
        campaignName: true,
        coverImage: true,
        maxPlayers: true,
      })
      
      // Validate all fields
      const errors: Record<string, string> = {}
      if (!gameData.name) errors.name = 'Game name is required'
      const nameError = validateField('name', gameData.name)
      if (nameError) errors.name = nameError
      
      setValidationErrors(errors)
      
      toast.warning('Please complete all required fields', {
        description: 'Check the form for validation errors',
      })
      return
    }

    const toastId = toast.loading('Creating your game...')
    let retryCount = 0
    const maxRetries = 2

    const attemptCreate = async (): Promise<void> => {
      try {
        setLoading(true)

        // Use RLS error handling wrapper
        const game = await withRLSErrorHandling(
          () => createGame(gameData),
          {
            context: 'game creation',
            onError: (rlsInfo) => {
              toast.dismiss(toastId)
              // RLS error is handled by the wrapper
            },
          }
        )
        
        addGame({
          id: game.id,
          name: game.name,
          system: game.system,
          masterId: game.masterId,
          masterName: game.master?.username || 'Unknown',
          playerCount: game.players?.length || 1,
          maxPlayers: game.maxPlayers,
          status: game.status,
          privacy: game.privacy,
          coverImage: game.coverImage,
          lastActivity: new Date(),
          unreadMessages: 0,
          myCharacters: [],
        })

        toast.dismiss(toastId)
        toast.success('🎲 Game created successfully!', {
          description: `"${game.name}" is ready for adventure!`,
          duration: 3000,
        })

        // Small delay for toast to be visible
        setTimeout(() => {
          router.push(`/games/${game.id}`)
        }, 500)
      } catch (err: any) {
        toast.dismiss(toastId)
        
        // Check if it's a network error and we should retry
        if (
          retryCount < maxRetries && 
          (err?.name === 'NetworkError' || 
           err?.message?.includes('fetch failed') ||
           err?.code === 'ECONNREFUSED')
        ) {
          retryCount++
          toast.warning(`Connection failed. Retrying... (${retryCount}/${maxRetries})`, {
            duration: 2000,
          })
          
          // Wait a bit before retrying
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount))
          return attemptCreate()
        }
        
        // Handle the error with enhanced error handling
        // handleApiError(err, 'game creation')
      } finally {
        setLoading(false)
      }
    }

    await attemptCreate()
  }

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-1">
                Game Name <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="name"
                  placeholder="Enter your game name"
                  value={gameData.name}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                  onBlur={() => handleFieldBlur('name')}
                  maxLength={100}
                  className={cn(
                    touched.name && validationErrors.name && "border-red-500 focus:ring-red-500"
                  )}
                  aria-invalid={touched.name && !!validationErrors.name}
                  aria-describedby={touched.name && validationErrors.name ? "name-error" : undefined}
                />
                {touched.name && validationErrors.name && (
                  <AlertCircle className="absolute right-3 top-3 h-4 w-4 text-red-500" />
                )}
              </div>
              {touched.name && validationErrors.name ? (
                <p id="name-error" className="text-sm text-red-500" role="alert">
                  {validationErrors.name}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Choose a name that your players will recognize
                </p>
              )}
              <div className={cn(
                "text-xs text-right transition-colors",
                gameData.name.length > 90 ? "text-orange-500" : "text-muted-foreground",
                gameData.name.length >= 100 ? "text-red-500 font-semibold" : ""
              )}>
                {gameData.name.length}/100
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <div className="relative">
                <Textarea
                  id="description"
                  placeholder="Describe your game world, campaign, or adventure"
                  value={gameData.description || ''}
                  onChange={(e) => handleFieldChange('description', e.target.value)}
                  onBlur={() => handleFieldBlur('description')}
                  rows={3}
                  maxLength={500}
                  className={cn(
                    touched.description && validationErrors.description && "border-red-500 focus:ring-red-500"
                  )}
                  aria-invalid={touched.description && !!validationErrors.description}
                  aria-describedby={touched.description && validationErrors.description ? "description-error" : undefined}
                />
                {touched.description && validationErrors.description && (
                  <AlertCircle className="absolute right-3 top-3 h-4 w-4 text-red-500" />
                )}
              </div>
              {touched.description && validationErrors.description && (
                <p id="description-error" className="text-sm text-red-500" role="alert">
                  {validationErrors.description}
                </p>
              )}
              <div className={cn(
                "text-xs text-right transition-colors",
                (gameData.description || '').length > 450 ? "text-orange-500" : "text-muted-foreground",
                (gameData.description || '').length >= 500 ? "text-red-500 font-semibold" : ""
              )}>
                {(gameData.description || '').length}/500
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="campaign">Campaign Name</Label>
              <Input
                id="campaign"
                placeholder="Optional: Name of your campaign or adventure"
                value={gameData.campaignName || ''}
                onChange={(e) => updateGameData({ campaignName: e.target.value })}
                maxLength={100}
              />
            </div>

            <div className="space-y-3">
              <Label>Game System *</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {GAME_SYSTEMS.map((system) => (
                  <Card
                    key={system.value}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      gameData.system === system.value 
                        ? 'ring-2 ring-primary bg-primary/5' 
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => updateGameData({ system: system.value })}
                  >
                    <CardHeader className="p-4">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm">{system.label}</CardTitle>
                        {gameData.system === system.value && (
                          <Check className="h-4 w-4 text-primary" />
                        )}
                      </div>
                      <CardDescription className="text-xs">
                        {system.description}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Palette className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h3 className="text-lg font-semibold mb-2">Customize Your Game</h3>
              <p className="text-muted-foreground">
                Add visual elements to make your game stand out
              </p>
            </div>

            <div className="space-y-3">
              <Label>Theme Color</Label>
              <div className="flex flex-wrap gap-2">
                {THEME_COLORS.map((color) => (
                  <button
                    key={color}
                    className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${
                      gameData.themeColor === color
                        ? 'border-white shadow-lg scale-110'
                        : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => updateGameData({ themeColor: color })}
                  />
                ))}
                <button
                  className={`w-8 h-8 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:bg-gray-50 ${
                    !gameData.themeColor ? 'bg-gray-100' : ''
                  }`}
                  onClick={() => updateGameData({ themeColor: undefined })}
                >
                  <span className="text-xs">×</span>
                </button>
              </div>
              <p className="text-sm text-muted-foreground">
                This color will be used for your game's theme and branding
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cover">Cover Image URL</Label>
              <div className="relative">
                <Input
                  id="cover"
                  placeholder="https://example.com/image.jpg"
                  value={gameData.coverImage || ''}
                  onChange={(e) => handleFieldChange('coverImage', e.target.value)}
                  onBlur={() => handleFieldBlur('coverImage')}
                  className={cn(
                    touched.coverImage && validationErrors.coverImage && "border-red-500 focus:ring-red-500"
                  )}
                  aria-invalid={touched.coverImage && !!validationErrors.coverImage}
                  aria-describedby={touched.coverImage && validationErrors.coverImage ? "cover-error" : undefined}
                />
                {touched.coverImage && validationErrors.coverImage && (
                  <AlertCircle className="absolute right-3 top-3 h-4 w-4 text-red-500" />
                )}
              </div>
              {touched.coverImage && validationErrors.coverImage ? (
                <p id="cover-error" className="text-sm text-red-500" role="alert">
                  {validationErrors.coverImage}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Add a cover image to make your game more appealing (jpg, png, gif, webp)
                </p>
              )}
            </div>

            {gameData.coverImage && (
              <div className="space-y-2">
                <Label>Preview</Label>
                <div 
                  className="w-full h-32 bg-cover bg-center rounded-lg border"
                  style={{ backgroundImage: `url(${gameData.coverImage})` }}
                />
              </div>
            )}
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <UsersIcon className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h3 className="text-lg font-semibold mb-2">Game Settings</h3>
              <p className="text-muted-foreground">
                Configure who can join and how many players
              </p>
            </div>

            <div className="space-y-3">
              <Label>Privacy Settings *</Label>
              <div className="space-y-3">
                {PRIVACY_OPTIONS.map((option) => {
                  const IconComponent = option.icon
                  return (
                    <Card
                      key={option.value}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        gameData.privacy === option.value 
                          ? 'ring-2 ring-primary bg-primary/5' 
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => updateGameData({ privacy: option.value })}
                    >
                      <CardHeader className="p-4">
                        <div className="flex items-center gap-3">
                          <IconComponent className="h-5 w-5 text-primary" />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-sm">{option.label}</CardTitle>
                              {gameData.privacy === option.value && (
                                <Check className="h-4 w-4 text-primary" />
                              )}
                            </div>
                            <CardDescription className="text-xs mt-1">
                              {option.description}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  )
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxPlayers">Maximum Players *</Label>
              <Select 
                value={gameData.maxPlayers.toString()} 
                onValueChange={(value) => updateGameData({ maxPlayers: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 9 }, (_, i) => i + 2).map((num) => (
                    <SelectItem key={num} value={num.toString()}>
                      {num} players {num === 4 && '(recommended)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Include yourself as the Game Master
              </p>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Create New Game</h1>
          <p className="text-muted-foreground">
            Step {step} of {totalSteps}: Set up your new RPG game
          </p>
        </div>
        
        <div className="mt-6">
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>Basic Info</span>
            <span>Visuals</span>
            <span>Settings</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {step === 1 && <Dice6 className="h-5 w-5" />}
            {step === 2 && <Palette className="h-5 w-5" />}
            {step === 3 && <UsersIcon className="h-5 w-5" />}
            {step === 1 && 'Basic Information'}
            {step === 2 && 'Visual Customization'}
            {step === 3 && 'Game Settings'}
          </CardTitle>
          <CardDescription>
            {step === 1 && 'Tell us about your game and what system you\'ll be using'}
            {step === 2 && 'Customize the look and feel of your game'}
            {step === 3 && 'Configure privacy settings and player limits'}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {loading && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 rounded-lg">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Creating your game...</p>
              </div>
            </div>
          )}
          
          {renderStep()}
          
          <div className="flex justify-between mt-8 pt-6 border-t">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={step === 1}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
            
            {step < totalSteps ? (
              <Button
                onClick={nextStep}
                disabled={!canProceed()}
              >
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!canProceed() || loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    Create Game
                    <Check className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}