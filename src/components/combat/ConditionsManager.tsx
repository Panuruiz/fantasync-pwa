'use client'

import { useState } from 'react'
import { useCombatStore } from '@/stores/combat-store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Plus, 
  X, 
  Clock, 
  AlertTriangle,
  Info,
  Edit2,
  Trash2
} from 'lucide-react'
import { DND_CONDITIONS, type ConditionName, type Condition } from '@/types/combat'

interface ConditionsManagerProps {
  participantId: string
  isGameMaster: boolean
}

export default function ConditionsManager({ participantId, isGameMaster }: ConditionsManagerProps) {
  const {
    activeCombat,
    addCondition,
    removeCondition,
    updateCondition,
  } = useCombatStore()

  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editingCondition, setEditingCondition] = useState<Condition | null>(null)
  const [selectedCondition, setSelectedCondition] = useState<ConditionName | ''>('')
  const [customCondition, setCustomCondition] = useState({
    name: '',
    description: '',
    duration: '',
    source: ''
  })

  const participant = activeCombat?.participants.find(p => p.id === participantId)
  
  if (!participant) {
    return (
      <div className="text-center text-muted-foreground py-4">
        Participant not found
      </div>
    )
  }

  const conditions = participant.conditions || []

  const handleAddPredefinedCondition = () => {
    if (!selectedCondition) return
    
    const conditionData = DND_CONDITIONS[selectedCondition]
    const duration = customCondition.duration ? parseInt(customCondition.duration) : undefined
    
    const condition: Condition = {
      name: conditionData.name,
      description: conditionData.description,
      duration,
      source: customCondition.source || undefined,
    }

    addCondition(participantId, condition)
    setAddDialogOpen(false)
    resetForm()
  }

  const handleAddCustomCondition = () => {
    if (!customCondition.name || !customCondition.description) return

    const duration = customCondition.duration ? parseInt(customCondition.duration) : undefined
    
    const condition: Condition = {
      name: customCondition.name,
      description: customCondition.description,
      duration,
      source: customCondition.source || undefined,
    }

    addCondition(participantId, condition)
    setAddDialogOpen(false)
    resetForm()
  }

  const resetForm = () => {
    setSelectedCondition('')
    setCustomCondition({
      name: '',
      description: '',
      duration: '',
      source: ''
    })
  }

  const handleRemoveCondition = (conditionName: string) => {
    removeCondition(participantId, conditionName)
  }

  const handleUpdateCondition = (conditionName: string, updates: Partial<Condition>) => {
    updateCondition(participantId, conditionName, updates)
  }

  const getConditionIcon = (condition: Condition) => {
    const severity = getSeverity(condition.name)
    switch (severity) {
      case 'high': return <AlertTriangle className="h-3 w-3 text-red-500" />
      case 'medium': return <Clock className="h-3 w-3 text-yellow-500" />
      default: return <Info className="h-3 w-3 text-blue-500" />
    }
  }

  const getSeverity = (conditionName: string): 'low' | 'medium' | 'high' => {
    const highSeverity = ['UNCONSCIOUS', 'PARALYZED', 'PETRIFIED', 'STUNNED']
    const mediumSeverity = ['FRIGHTENED', 'POISONED', 'RESTRAINED', 'PRONE']
    
    if (highSeverity.includes(conditionName.toUpperCase())) return 'high'
    if (mediumSeverity.includes(conditionName.toUpperCase())) return 'medium'
    return 'low'
  }

  const getConditionColor = (condition: Condition) => {
    const severity = getSeverity(condition.name)
    switch (severity) {
      case 'high': return 'destructive'
      case 'medium': return 'warning'
      default: return 'secondary'
    }
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="font-semibold">Conditions</h4>
        {isGameMaster && (
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add Condition</DialogTitle>
                <DialogDescription>
                  Add a condition to this participant
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                {/* Predefined Conditions */}
                <div className="space-y-2">
                  <Label>D&D 5e Conditions</Label>
                  <Select value={selectedCondition} onValueChange={(value) => setSelectedCondition(value as ConditionName)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a condition..." />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(DND_CONDITIONS).map(([key, condition]) => (
                        <SelectItem key={key} value={key}>
                          {condition.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedCondition && (
                    <p className="text-xs text-muted-foreground">
                      {DND_CONDITIONS[selectedCondition].description}
                    </p>
                  )}
                </div>

                {/* Custom Condition */}
                <div className="space-y-2">
                  <Label>Or create custom condition</Label>
                  <Input
                    placeholder="Condition name"
                    value={customCondition.name}
                    onChange={(e) => setCustomCondition(prev => ({...prev, name: e.target.value}))}
                  />
                  <Textarea
                    placeholder="Description"
                    rows={3}
                    value={customCondition.description}
                    onChange={(e) => setCustomCondition(prev => ({...prev, description: e.target.value}))}
                  />
                </div>

                {/* Common fields */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="duration">Duration (rounds)</Label>
                    <Input
                      id="duration"
                      type="number"
                      placeholder="∞"
                      min="1"
                      value={customCondition.duration}
                      onChange={(e) => setCustomCondition(prev => ({...prev, duration: e.target.value}))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="source">Source</Label>
                    <Input
                      id="source"
                      placeholder="e.g. Hold Person"
                      value={customCondition.source}
                      onChange={(e) => setCustomCondition(prev => ({...prev, source: e.target.value}))}
                    />
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                  Cancel
                </Button>
                {selectedCondition ? (
                  <Button onClick={handleAddPredefinedCondition}>
                    Add {DND_CONDITIONS[selectedCondition]?.name}
                  </Button>
                ) : (
                  <Button 
                    onClick={handleAddCustomCondition}
                    disabled={!customCondition.name || !customCondition.description}
                  >
                    Add Custom
                  </Button>
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Conditions List */}
      <div className="space-y-2">
        {conditions.map((condition, index) => (
          <div 
            key={`${condition.name}-${index}`}
            className="p-3 rounded-lg border bg-card"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {getConditionIcon(condition)}
                  <span className="font-semibold">{condition.name}</span>
                  {condition.duration && (
                    <Badge variant="outline" className="ml-auto">
                      {condition.duration} rounds
                    </Badge>
                  )}
                </div>
                
                <p className="text-sm text-muted-foreground mb-2">
                  {condition.description}
                </p>
                
                {condition.source && (
                  <p className="text-xs text-muted-foreground">
                    Source: {condition.source}
                  </p>
                )}
              </div>

              {isGameMaster && (
                <div className="flex gap-1 ml-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0"
                    onClick={() => setEditingCondition(condition)}
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                    onClick={() => handleRemoveCondition(condition.name)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        ))}

        {conditions.length === 0 && (
          <div className="text-center text-muted-foreground py-6">
            <Info className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No conditions applied</p>
          </div>
        )}
      </div>

      {/* Edit Condition Dialog */}
      {editingCondition && (
        <Dialog open={true} onOpenChange={() => setEditingCondition(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Condition</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Duration (rounds)</Label>
                <Input
                  type="number"
                  value={editingCondition.duration || ''}
                  onChange={(e) => setEditingCondition(prev => prev ? {
                    ...prev,
                    duration: e.target.value ? parseInt(e.target.value) : undefined
                  } : null)}
                />
              </div>
              <div>
                <Label>Source</Label>
                <Input
                  value={editingCondition.source || ''}
                  onChange={(e) => setEditingCondition(prev => prev ? {
                    ...prev,
                    source: e.target.value
                  } : null)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingCondition(null)}>
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  if (editingCondition) {
                    handleUpdateCondition(editingCondition.name, editingCondition)
                  }
                  setEditingCondition(null)
                }}
              >
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}