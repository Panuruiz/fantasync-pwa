'use client'

import { useCombatStore } from '@/stores/combat-store'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Clock, Play, Pause, RotateCcw } from 'lucide-react'

interface TurnTimerProps {
  timeRemaining: number
  totalTime: number
}

export default function TurnTimer({ timeRemaining, totalTime }: TurnTimerProps) {
  const {
    timerInterval,
    startTurnTimer,
    pauseTurnTimer,
    resumeTurnTimer,
    resetTurnTimer,
  } = useCombatStore()

  const isRunning = timerInterval !== null
  const progress = ((totalTime - timeRemaining) / totalTime) * 100

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getTimerColor = () => {
    const percentage = (timeRemaining / totalTime) * 100
    if (percentage > 50) return 'bg-green-500'
    if (percentage > 25) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  return (
    <div className="space-y-3 p-3 rounded-lg bg-muted/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          <span className="font-semibold">Turn Timer</span>
        </div>
        <div className="text-lg font-mono font-bold">
          {formatTime(timeRemaining)}
        </div>
      </div>

      <Progress 
        value={progress} 
        className="h-2"
        aria-label={`Turn timer: ${formatTime(timeRemaining)} remaining`}
        aria-valuenow={timeRemaining}
        aria-valuemax={totalTime}
      />

      <div className="flex gap-2">
        {isRunning ? (
          <Button 
            size="default" 
            variant="outline" 
            onClick={pauseTurnTimer}
            className="min-h-[44px] min-w-[44px] flex-1"
            aria-label="Pause turn timer"
          >
            <Pause className="h-4 w-4 mr-2" aria-hidden="true" />
            Pause
          </Button>
        ) : (
          <Button 
            size="default" 
            variant="outline" 
            onClick={resumeTurnTimer}
            className="min-h-[44px] min-w-[44px] flex-1"
            aria-label="Resume turn timer"
          >
            <Play className="h-4 w-4 mr-2" aria-hidden="true" />
            Resume
          </Button>
        )}
        
        <Button 
          size="default" 
          variant="outline" 
          onClick={resetTurnTimer}
          className="min-h-[44px] min-w-[44px] flex-1"
          aria-label="Reset turn timer"
        >
          <RotateCcw className="h-4 w-4 mr-2" aria-hidden="true" />
          Reset
        </Button>
      </div>

      {timeRemaining <= 10 && timeRemaining > 0 && (
        <div className="text-center text-sm text-destructive font-semibold animate-pulse">
          Time running out!
        </div>
      )}

      {timeRemaining === 0 && (
        <div className="text-center text-sm text-destructive font-semibold">
          Time's up!
        </div>
      )}
    </div>
  )
}