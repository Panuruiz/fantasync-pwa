'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createGame } from '@/lib/api/games'
import { useGameStore } from '@/stores/game-store'
import type { GameCreationData, GameSystem, GamePrivacy } from '@/types/game'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ArrowLeft, ArrowRight, Check, Palette, Users, Dice6, Shield, Eye, EyeOff, Users as UsersIcon } from 'lucide-react'

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
  const [error, setError] = useState<string | null>(null)
  
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
    setError(null)
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
        return gameData.name.trim().length > 0
      case 2:
        return true // Visuals are optional
      case 3:
        return gameData.maxPlayers >= 2 && gameData.maxPlayers <= 10
      default:
        return false
    }
  }

  const handleSubmit = async () => {
    if (!canProceed()) return

    try {
      setLoading(true)
      setError(null)

      const game = await createGame(gameData)
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

      router.push(`/games/${game.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create game')
    } finally {
      setLoading(false)
    }
  }

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Game Name *</Label>
              <Input
                id="name"
                placeholder="Enter your game name"
                value={gameData.name}
                onChange={(e) => updateGameData({ name: e.target.value })}
                maxLength={100}
              />
              <p className="text-sm text-muted-foreground">
                Choose a name that your players will recognize
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe your game world, campaign, or adventure"
                value={gameData.description || ''}
                onChange={(e) => updateGameData({ description: e.target.value })}
                rows={3}
                maxLength={500}
              />
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
              <Input
                id="cover"
                placeholder="https://example.com/image.jpg"
                value={gameData.coverImage || ''}
                onChange={(e) => updateGameData({ coverImage: e.target.value })}
              />
              <p className="text-sm text-muted-foreground">
                Add a cover image to make your game more appealing
              </p>
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
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
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
                {loading ? 'Creating...' : 'Create Game'}
                <Check className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}