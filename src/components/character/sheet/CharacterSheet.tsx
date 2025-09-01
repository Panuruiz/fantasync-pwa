'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  User, 
  Sword, 
  Shield, 
  Heart, 
  Zap, 
  BookOpen, 
  Package,
  Settings,
  FileText
} from 'lucide-react'

import { useCharacterStore } from '@/stores/character-store'
import { calculateCharacterStats } from '@/lib/utils/dnd/calculations'
import { AbilityScores } from './sections/AbilityScores'
import { SkillsSection } from './sections/SkillsSection'
import { CombatStats } from './sections/CombatStats'
import { SpellSlots } from './sections/SpellSlots'
import { Inventory } from './sections/Inventory'
import { Backstory } from './sections/Backstory'

import type { Character } from '@/types/character'

interface CharacterSheetProps {
  character?: Character
  isEditable?: boolean
  className?: string
}

export function CharacterSheet({ 
  character, 
  isEditable = false, 
  className = '' 
}: CharacterSheetProps) {
  const { 
    currentCharacter,
    activeTab,
    setActiveTab,
    isSheetExpanded,
    toggleSheetExpanded,
  } = useCharacterStore()

  const [isLoading, setIsLoading] = useState(false)

  // Use provided character or current character from store
  const displayCharacter = character || currentCharacter

  if (!displayCharacter) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="text-center text-muted-foreground">
          <User className="h-12 w-12 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No Character Selected</h3>
          <p>Select a character to view their sheet</p>
        </div>
      </Card>
    )
  }

  // Calculate character statistics
  const calculations = calculateCharacterStats(displayCharacter)

  const formatClassString = (classes: Character['class']) => {
    return classes
      .map(c => `${c.name} ${c.level}`)
      .join(' / ')
  }

  const totalLevel = displayCharacter.class.reduce((sum, c) => sum + c.level, 0)

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Character Header */}
      <Card className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            {displayCharacter.avatarUrl ? (
              <img 
                src={displayCharacter.avatarUrl} 
                alt={displayCharacter.name}
                className="w-16 h-16 rounded-full object-cover border-2 border-muted"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                <User className="h-8 w-8" />
              </div>
            )}
            
            <div>
              <h1 className="text-2xl font-bold">{displayCharacter.name}</h1>
              <p className="text-muted-foreground">
                {displayCharacter.race} {formatClassString(displayCharacter.class)}
              </p>
              {displayCharacter.background && (
                <p className="text-sm text-muted-foreground">
                  {displayCharacter.background}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge variant={displayCharacter.isPublic ? 'default' : 'secondary'}>
              {displayCharacter.isPublic ? 'Public' : 'Private'}
            </Badge>
            
            {isEditable && (
              <Button
                variant="outline"
                size="sm"
                onClick={toggleSheetExpanded}
              >
                <Settings className="h-4 w-4" />
                {isSheetExpanded ? 'Collapse' : 'Expand'}
              </Button>
            )}
          </div>
        </div>
        
        {/* Quick Stats */}
        <Separator className="my-4" />
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              {totalLevel}
            </div>
            <div className="text-sm text-muted-foreground">Level</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {displayCharacter.currentHitPoints}
            </div>
            <div className="text-sm text-muted-foreground">
              HP ({displayCharacter.maxHitPoints} max)
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {displayCharacter.armorClass}
            </div>
            <div className="text-sm text-muted-foreground">Armor Class</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {calculations.initiative >= 0 ? '+' : ''}{calculations.initiative}
            </div>
            <div className="text-sm text-muted-foreground">Initiative</div>
          </div>
        </div>
      </Card>
      
      {/* Character Sheet Tabs */}
      <Card className="p-6">
        <Tabs 
          value={activeTab} 
          onValueChange={(value) => setActiveTab(value as any)}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="stats" className="flex items-center space-x-1">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Stats</span>
            </TabsTrigger>
            <TabsTrigger value="skills" className="flex items-center space-x-1">
              <Zap className="h-4 w-4" />
              <span className="hidden sm:inline">Skills</span>
            </TabsTrigger>
            <TabsTrigger value="combat" className="flex items-center space-x-1">
              <Sword className="h-4 w-4" />
              <span className="hidden sm:inline">Combat</span>
            </TabsTrigger>
            <TabsTrigger value="spells" className="flex items-center space-x-1">
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Spells</span>
            </TabsTrigger>
            <TabsTrigger value="inventory" className="flex items-center space-x-1">
              <Package className="h-4 w-4" />
              <span className="hidden sm:inline">Items</span>
            </TabsTrigger>
            <TabsTrigger value="backstory" className="flex items-center space-x-1">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Story</span>
            </TabsTrigger>
          </TabsList>
          
          <ScrollArea className="h-[500px] mt-4">
            <TabsContent value="stats" className="space-y-4">
              <AbilityScores 
                character={displayCharacter} 
                calculations={calculations}
                isEditable={isEditable}
              />
            </TabsContent>
            
            <TabsContent value="skills" className="space-y-4">
              <SkillsSection 
                character={displayCharacter} 
                calculations={calculations}
                isEditable={isEditable}
              />
            </TabsContent>
            
            <TabsContent value="combat" className="space-y-4">
              <CombatStats 
                character={displayCharacter} 
                calculations={calculations}
                isEditable={isEditable}
              />
            </TabsContent>
            
            <TabsContent value="spells" className="space-y-4">
              <SpellSlots 
                character={displayCharacter} 
                isEditable={isEditable}
              />
            </TabsContent>
            
            <TabsContent value="inventory" className="space-y-4">
              <Inventory 
                character={displayCharacter} 
                isEditable={isEditable}
              />
            </TabsContent>
            
            <TabsContent value="backstory" className="space-y-4">
              <Backstory 
                character={displayCharacter} 
                isEditable={isEditable}
              />
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </Card>
    </div>
  )
}