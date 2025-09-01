'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { FileText } from 'lucide-react'

import type { Character } from '@/types/character'

interface BackstoryProps {
  character: Character
  isEditable?: boolean
}

export function Backstory({ character, isEditable = false }: BackstoryProps) {
  const backstoryFields = [
    { 
      key: 'personalityTraits', 
      label: 'Personality Traits', 
      value: character.personalityTraits,
      placeholder: 'Describe your character\'s personality traits...'
    },
    { 
      key: 'ideals', 
      label: 'Ideals', 
      value: character.ideals,
      placeholder: 'What drives your character? What principles do they believe in?'
    },
    { 
      key: 'bonds', 
      label: 'Bonds', 
      value: character.bonds,
      placeholder: 'What connects your character to the world? People, places, or things that matter to them.'
    },
    { 
      key: 'flaws', 
      label: 'Flaws', 
      value: character.flaws,
      placeholder: 'What are your character\'s weaknesses or vices?'
    },
  ]

  const hasBackstory = character.backstory || backstoryFields.some(field => field.value)

  if (!hasBackstory && !isEditable) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <FileText className="h-12 w-12 mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">No Backstory</h3>
        <p>This character doesn't have backstory details yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Character Backstory</h3>
      
      {/* Character Traits */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {backstoryFields.map((field) => (
          <Card key={field.key}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">{field.label}</CardTitle>
            </CardHeader>
            <CardContent>
              {isEditable ? (
                <Textarea
                  placeholder={field.placeholder}
                  value={field.value || ''}
                  className="min-h-[100px] resize-none"
                  readOnly
                  // TODO: Add onChange handler when implementing editing
                />
              ) : field.value ? (
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {field.value}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  None specified
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Full Backstory */}
      <Card>
        <CardHeader>
          <CardTitle className="text-md">Backstory</CardTitle>
        </CardHeader>
        <CardContent>
          {isEditable ? (
            <Textarea
              placeholder="Tell your character's story. Where did they come from? What shaped them into who they are today? What are their goals and motivations?"
              value={character.backstory || ''}
              className="min-h-[200px] resize-none"
              readOnly
              // TODO: Add onChange handler when implementing editing
            />
          ) : character.backstory ? (
            <div className="prose prose-sm max-w-none">
              <p className="leading-relaxed whitespace-pre-wrap">
                {character.backstory}
              </p>
            </div>
          ) : (
            <p className="text-muted-foreground italic">
              No backstory written yet
            </p>
          )}
        </CardContent>
      </Card>
      
      {/* Character Details */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Race</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">{character.race}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Background</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">{character.background || 'None'}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Alignment</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">{character.alignment || 'Unaligned'}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Level</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">
              {character.class.reduce((sum, c) => sum + c.level, 0)}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}