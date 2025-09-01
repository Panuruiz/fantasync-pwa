'use client'

import { useState } from 'react'
import { useCombatStore } from '@/stores/combat-store'
import { zClass } from '@/lib/utils/z-index'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  SkipBack,
  Plus,
  Settings,
  Clock,
  Users,
  Heart,
  Shield
} from 'lucide-react'
import TurnOrder from './TurnOrder'
import CombatControls from './CombatControls'
import ConditionsManager from './ConditionsManager'
import TurnTimer from './TurnTimer'
import { CombatParticipant } from '@/types/combat'

interface InitiativeTrackerProps {
  gameId: string
  isGameMaster: boolean
}

export default function InitiativeTracker({ gameId, isGameMaster }: InitiativeTrackerProps) {
  const {
    activeCombat,
    activeCombatLoading,
    isInitiativeTrackerOpen,
    toggleInitiativeTracker,
    currentTurn,
    currentRound,
    turnTimeRemaining,
    selectedParticipantId,
    setSelectedParticipant,
    nextTurn,
    previousTurn,
    startCombat,
    pauseCombat,
    resumeCombat,
    endCombat,
  } = useCombatStore()

  const [selectedTab, setSelectedTab] = useState<'order' | 'conditions' | 'timer'>('order')

  if (!isInitiativeTrackerOpen) return null

  const currentParticipant = activeCombat?.participants[currentTurn]
  const totalParticipants = activeCombat?.participants.length || 0

  return (
    <Card className={`fixed top-20 right-4 w-96 max-h-[80vh] bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85 ${zClass('combatTracker')} border-2`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5" />
            Initiative Tracker
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleInitiativeTracker}
            className="h-8 w-8 p-0"
          >
            ×
          </Button>
        </div>
        
        {activeCombat && (
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{activeCombat.name}</span>
            <Badge variant={activeCombat.isActive ? 'default' : 'secondary'}>
              {activeCombat.isActive 
                ? (activeCombat.isPaused ? 'Paused' : 'Active')
                : 'Inactive'
              }
            </Badge>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Combat Status */}
        {activeCombat && (
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">Round {currentRound}</div>
              <div className="text-muted-foreground">Round</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{totalParticipants}</div>
              <div className="text-muted-foreground">Participants</div>
            </div>
          </div>
        )}

        {/* Current Turn */}
        {currentParticipant && (
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold">Current Turn</div>
                <div className="text-lg">
                  {currentParticipant.npcName || `Character ${currentParticipant.characterId}`}
                </div>
              </div>
              {currentParticipant.currentHP !== undefined && currentParticipant.maxHP !== undefined && (
                <div className="text-right">
                  <div className="flex items-center gap-1">
                    <Heart className="h-4 w-4 text-red-500" />
                    <span>{currentParticipant.currentHP}/{currentParticipant.maxHP}</span>
                  </div>
                  {currentParticipant.armorClass && (
                    <div className="flex items-center gap-1">
                      <Shield className="h-4 w-4 text-blue-500" />
                      <span>AC {currentParticipant.armorClass}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Turn Timer */}
        {activeCombat?.turnTimer && turnTimeRemaining !== null && (
          <TurnTimer 
            timeRemaining={turnTimeRemaining}
            totalTime={activeCombat.turnTimer}
          />
        )}

        {/* Combat Controls - Only for GM */}
        {isGameMaster && (
          <CombatControls 
            gameId={gameId}
            isActive={activeCombat?.isActive || false}
            isPaused={activeCombat?.isPaused || false}
            onStart={startCombat}
            onPause={pauseCombat}
            onResume={resumeCombat}
            onEnd={endCombat}
            onNext={nextTurn}
            onPrevious={previousTurn}
          />
        )}

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-muted rounded-lg">
          {(['order', 'conditions', 'timer'] as const).map((tab) => (
            <Button
              key={tab}
              variant={selectedTab === tab ? 'default' : 'ghost'}
              size="sm"
              className="flex-1 h-8"
              onClick={() => setSelectedTab(tab)}
            >
              {tab === 'order' && <Users className="h-4 w-4" />}
              {tab === 'conditions' && <Settings className="h-4 w-4" />}
              {tab === 'timer' && <Clock className="h-4 w-4" />}
              <span className="ml-1 capitalize">{tab}</span>
            </Button>
          ))}
        </div>

        {/* Tab Content */}
        <ScrollArea className="h-64">
          {selectedTab === 'order' && activeCombat && (
            <TurnOrder 
              participants={activeCombat.participants}
              currentTurn={currentTurn}
              selectedParticipant={selectedParticipantId}
              onSelectParticipant={setSelectedParticipant}
              isGameMaster={isGameMaster}
            />
          )}

          {selectedTab === 'conditions' && selectedParticipantId && (
            <ConditionsManager 
              participantId={selectedParticipantId}
              isGameMaster={isGameMaster}
            />
          )}

          {selectedTab === 'timer' && (
            <div className="space-y-4 p-2">
              <div className="text-center text-muted-foreground">
                Timer settings will be available here
              </div>
            </div>
          )}
        </ScrollArea>

        {/* Quick Stats */}
        {activeCombat && (
          <div className="flex justify-between text-xs text-muted-foreground pt-2 border-t">
            <span>Turn {currentTurn + 1} of {totalParticipants}</span>
            <span>{activeCombat.participants.filter(p => p.isVisible).length} visible</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}