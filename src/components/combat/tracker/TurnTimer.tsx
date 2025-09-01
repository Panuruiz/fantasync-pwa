'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Play, Pause, RotateCcw, Timer } from 'lucide-react'

interface TurnTimerProps {
  duration: number // seconds
  isActive: boolean
  onTimeUp?: () => void
  showControls?: boolean
}

export default function TurnTimer({ duration, isActive, onTimeUp, showControls = false }: TurnTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState(duration)
  const [isRunning, setIsRunning] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (isActive && !isPaused) {
      setIsRunning(true)
    } else {
      setIsRunning(false)
    }
  }, [isActive, isPaused])

  useEffect(() => {
    if (isRunning && timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          const newTime = prev - 1
          if (newTime <= 0) {
            setIsRunning(false)
            onTimeUp?.()
            return 0
          }
          return newTime
        })
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning, timeRemaining, onTimeUp])

  const handlePlayPause = () => {
    setIsPaused(prev => !prev)
  }

  const handleReset = () => {
    setTimeRemaining(duration)
    setIsPaused(false)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getProgressPercentage = () => {
    return ((duration - timeRemaining) / duration) * 100
  }

  const getTimerColor = () => {
    const percentage = (timeRemaining / duration) * 100
    if (percentage > 50) return 'text-green-600'
    if (percentage > 25) return 'text-yellow-600'
    if (percentage > 10) return 'text-orange-600'
    return 'text-red-600'
  }

  const getProgressColor = () => {
    const percentage = (timeRemaining / duration) * 100
    if (percentage > 50) return 'bg-green-500'
    if (percentage > 25) return 'bg-yellow-500'
    if (percentage > 10) return 'bg-orange-500'
    return 'bg-red-500'
  }

  if (!showControls) {
    // Compact display for turn order
    return (
      <div className="flex items-center gap-2">
        <Timer className="h-4 w-4" />
        <span className={`font-mono text-sm ${getTimerColor()}`}>
          {formatTime(timeRemaining)}
        </span>
        <Progress 
          value={getProgressPercentage()} 
          className="w-16 h-2"
        />
      </div>
    )
  }

  return (
    <Card className="w-full max-w-sm">
      <CardContent className="p-4">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <Timer className="h-5 w-5" />
            <span className="font-semibold">Turn Timer</span>
          </div>
          
          <div className={`text-4xl font-mono ${getTimerColor()}`}>
            {formatTime(timeRemaining)}
          </div>
          
          <Progress 
            value={getProgressPercentage()} 
            className="w-full h-3"
          />
          
          <div className="flex items-center justify-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handlePlayPause}
              disabled={timeRemaining === 0}
            >
              {isPaused || !isRunning ? (
                <Play className="h-4 w-4" />
              ) : (
                <Pause className="h-4 w-4" />
              )}
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              onClick={handleReset}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
          
          {timeRemaining === 0 && (
            <div className="text-sm text-destructive font-medium animate-pulse">
              Time's up!
            </div>
          )}
          
          {isPaused && isActive && (
            <div className="text-sm text-muted-foreground">
              Timer paused
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}