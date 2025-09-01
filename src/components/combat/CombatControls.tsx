'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Play, 
  Pause, 
  Square, 
  SkipForward, 
  SkipBack,
  RotateCcw,
  Plus,
  Dice6,
  Settings
} from 'lucide-react'

interface CombatControlsProps {
  gameId: string
  isActive: boolean
  isPaused: boolean
  onStart: () => void
  onPause: () => void
  onResume: () => void
  onEnd: () => void
  onNext: () => void
  onPrevious: () => void
}

export default function CombatControls({
  gameId,
  isActive,
  isPaused,
  onStart,
  onPause,
  onResume,
  onEnd,
  onNext,
  onPrevious,
}: CombatControlsProps) {
  const [endDialogOpen, setEndDialogOpen] = useState(false)
  const [createCombatOpen, setCreateCombatOpen] = useState(false)
  const [combatName, setCombatName] = useState('')

  const handleEndCombat = () => {
    setEndDialogOpen(true)
  }

  const confirmEndCombat = () => {
    onEnd()
    setEndDialogOpen(false)
  }

  return (
    <div className="space-y-3">
      {/* Primary Combat Controls */}
      <div className="flex gap-2">
        {!isActive ? (
          <Button onClick={onStart} className="flex-1" size="sm">
            <Play className="h-4 w-4 mr-2" />
            Start Combat
          </Button>
        ) : (
          <>
            {isPaused ? (
              <Button onClick={onResume} variant="default" size="sm">
                <Play className="h-4 w-4 mr-2" />
                Resume
              </Button>
            ) : (
              <Button onClick={onPause} variant="secondary" size="sm">
                <Pause className="h-4 w-4 mr-2" />
                Pause
              </Button>
            )}
            <Button onClick={handleEndCombat} variant="destructive" size="sm">
              <Square className="h-4 w-4 mr-2" />
              End
            </Button>
          </>
        )}
      </div>

      {/* Turn Navigation */}
      {isActive && !isPaused && (
        <div className="flex gap-2">
          <Button 
            onClick={onPrevious} 
            variant="outline" 
            size="sm"
            className="flex-1"
          >
            <SkipBack className="h-4 w-4 mr-2" />
            Previous
          </Button>
          <Button 
            onClick={onNext} 
            variant="default" 
            size="sm"
            className="flex-1"
          >
            <SkipForward className="h-4 w-4 mr-2" />
            Next Turn
          </Button>
        </div>
      )}

      {/* Additional Actions */}
      <div className="flex gap-2">
        <Dialog open={createCombatOpen} onOpenChange={setCreateCombatOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="flex-1">
              <Plus className="h-4 w-4 mr-2" />
              New Combat
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Combat</DialogTitle>
              <DialogDescription>
                Start a new combat encounter. This will replace the current combat if one is active.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="combat-name">Combat Name</Label>
                <Input
                  id="combat-name"
                  value={combatName}
                  onChange={(e) => setCombatName(e.target.value)}
                  placeholder="Enter combat name..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateCombatOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  // TODO: Implement create combat
                  console.log('Creating combat:', combatName)
                  setCreateCombatOpen(false)
                  setCombatName('')
                }}
                disabled={!combatName.trim()}
              >
                Create Combat
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Button variant="outline" size="sm">
          <Dice6 className="h-4 w-4 mr-2" />
          Roll Initiative
        </Button>
      </div>

      {/* Settings Row */}
      <div className="flex gap-2">
        <Button variant="ghost" size="sm" className="flex-1">
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Button>
        <Button variant="ghost" size="sm">
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset Round
        </Button>
      </div>

      {/* End Combat Confirmation Dialog */}
      <AlertDialog open={endDialogOpen} onOpenChange={setEndDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>End Combat</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to end this combat? All combat data will be preserved 
              but the encounter will be marked as complete.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmEndCombat}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              End Combat
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}