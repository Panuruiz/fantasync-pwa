'use client'

import { useState } from 'react'
import { updateParticipant } from '@/lib/api/combat'
import type { CombatParticipant, Condition } from '@/types/combat'
import { DND_CONDITIONS, type ConditionName } from '@/types/combat'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Plus, X, Clock, Info, Zap, AlertTriangle } from 'lucide-react'

interface ConditionsManagerProps {
  participant: CombatParticipant
  onConditionsUpdate: (conditions: Condition[]) => void
}

export default function ConditionsManager({ participant, onConditionsUpdate }: ConditionsManagerProps) {
  const [conditions, setConditions] = useState<Condition[]>(participant.conditions)
  const [addConditionOpen, setAddConditionOpen] = useState(false)
  const [selectedCondition, setSelectedCondition] = useState<ConditionName | ''>('')
  const [customCondition, setCustomCondition] = useState({
    name: '',
    description: '',
    duration: '',
    source: ''
  })
  const [loading, setLoading] = useState(false)

  const handleAddPredefinedCondition = () => {
    if (!selectedCondition) return

    const conditionTemplate = DND_CONDITIONS[selectedCondition]
    const newCondition: Condition = {
      name: conditionTemplate.name,
      description: conditionTemplate.description,
      source: 'Manual',
    }

    const updatedConditions = [...conditions, newCondition]
    setConditions(updatedConditions)
    setSelectedCondition('')
  }

  const handleAddCustomCondition = () => {
    if (!customCondition.name.trim()) return

    const newCondition: Condition = {
      name: customCondition.name,
      description: customCondition.description || undefined,
      duration: customCondition.duration ? parseInt(customCondition.duration) : undefined,
      source: customCondition.source || undefined,
    }

    const updatedConditions = [...conditions, newCondition]
    setConditions(updatedConditions)
    
    setCustomCondition({
      name: '',
      description: '',
      duration: '',
      source: ''
    })
    setAddConditionOpen(false)
  }

  const handleRemoveCondition = (index: number) => {
    const updatedConditions = conditions.filter((_, i) => i !== index)
    setConditions(updatedConditions)
  }

  const handleUpdateDuration = (index: number, duration: number) => {
    const updatedConditions = conditions.map((condition, i) =>
      i === index ? { ...condition, duration: duration || undefined } : condition
    )
    setConditions(updatedConditions)
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      await updateParticipant({
        id: participant.id,
        conditions: conditions
      })
      onConditionsUpdate(conditions)
    } catch (error) {
      console.error('Error updating conditions:', error)
    } finally {
      setLoading(false)
    }
  }

  const getConditionIcon = (conditionName: string) => {
    const name = conditionName.toLowerCase()
    if (name.includes('poison') || name.includes('disease')) return <AlertTriangle className="h-4 w-4 text-green-500" />
    if (name.includes('charm') || name.includes('fear')) return <Zap className="h-4 w-4 text-purple-500" />
    if (name.includes('blind') || name.includes('deaf')) return <Info className="h-4 w-4 text-blue-500" />
    return <Zap className="h-4 w-4 text-yellow-500" />
  }

  const getConditionColor = (conditionName: string) => {
    const name = conditionName.toLowerCase()
    if (name.includes('unconscious') || name.includes('dead')) return 'destructive'
    if (name.includes('poison') || name.includes('disease')) return 'secondary'
    if (name.includes('charm') || name.includes('fear')) return 'outline'
    return 'default'
  }

  return (
    <div className="space-y-6">
      {/* Current Conditions */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Active Conditions</h3>
        {conditions.length > 0 ? (
          <div className="space-y-3">
            {conditions.map((condition, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        {getConditionIcon(condition.name)}
                        <span className="font-medium">{condition.name}</span>
                        <Badge variant={getConditionColor(condition.name)}>
                          {condition.source || 'Unknown'}
                        </Badge>
                        {condition.duration !== undefined && (
                          <div className="flex items-center gap-1 text-sm">
                            <Clock className="h-3 w-3" />
                            <Input
                              type="number"
                              value={condition.duration}
                              onChange={(e) => handleUpdateDuration(index, parseInt(e.target.value))}
                              className="w-16 h-6 text-xs"
                              min="0"
                            />
                            <span className="text-muted-foreground">rounds</span>
                          </div>
                        )}
                      </div>
                      {condition.description && (
                        <p className="text-sm text-muted-foreground">
                          {condition.description}
                        </p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRemoveCondition(index)}
                      className="text-destructive hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              No active conditions
            </CardContent>
          </Card>
        )}
      </div>

      <Separator />

      {/* Add Conditions */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Add Conditions</h3>
        
        {/* Quick Add D&D Conditions */}
        <div className="space-y-3">
          <div>
            <Label>Common D&D 5e Conditions</Label>
            <div className="flex gap-2 mt-2">
              <Select value={selectedCondition} onValueChange={(value: ConditionName) => setSelectedCondition(value)}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select a condition" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(DND_CONDITIONS).map(([key, condition]) => (
                    <SelectItem key={key} value={key}>
                      {condition.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                onClick={handleAddPredefinedCondition} 
                disabled={!selectedCondition}
              >
                Add
              </Button>
            </div>
          </div>

          {/* Preview selected condition */}
          {selectedCondition && (
            <Card className="bg-muted/50">
              <CardContent className="p-3">
                <div className="flex items-start gap-2">
                  {getConditionIcon(DND_CONDITIONS[selectedCondition].name)}
                  <div>
                    <div className="font-medium text-sm">
                      {DND_CONDITIONS[selectedCondition].name}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {DND_CONDITIONS[selectedCondition].description}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="mt-4">
          <Dialog open={addConditionOpen} onOpenChange={setAddConditionOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Custom Condition
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Custom Condition</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="condition-name">Condition Name</Label>
                  <Input
                    id="condition-name"
                    value={customCondition.name}
                    onChange={(e) => setCustomCondition(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Burning"
                  />
                </div>
                <div>
                  <Label htmlFor="condition-description">Description (optional)</Label>
                  <Textarea
                    id="condition-description"
                    value={customCondition.description}
                    onChange={(e) => setCustomCondition(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe the condition's effects..."
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="condition-duration">Duration (rounds, optional)</Label>
                    <Input
                      id="condition-duration"
                      type="number"
                      value={customCondition.duration}
                      onChange={(e) => setCustomCondition(prev => ({ ...prev, duration: e.target.value }))}
                      placeholder="e.g., 3"
                      min="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="condition-source">Source (optional)</Label>
                    <Input
                      id="condition-source"
                      value={customCondition.source}
                      onChange={(e) => setCustomCondition(prev => ({ ...prev, source: e.target.value }))}
                      placeholder="e.g., Fireball"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setAddConditionOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddCustomCondition} disabled={!customCondition.name.trim()}>
                    Add Condition
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Separator />

      {/* Save Changes */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={loading}>
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  )
}