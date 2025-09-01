'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Package, Coins, Plus } from 'lucide-react'

import type { Character } from '@/types/character'

interface InventoryProps {
  character: Character
  isEditable?: boolean
}

export function Inventory({ character, isEditable = false }: InventoryProps) {
  const totalCoins = Object.entries(character.currency).reduce((total, [type, amount]) => {
    const multiplier = type === 'cp' ? 1 : type === 'sp' ? 10 : type === 'ep' ? 50 : type === 'gp' ? 100 : 1000
    return total + (amount * multiplier)
  }, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Inventory</h3>
        {isEditable && (
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        )}
      </div>
      
      {/* Currency */}
      <Card>
        <CardHeader className="flex flex-row items-center space-y-0 pb-2">
          <CardTitle className="text-md flex items-center">
            <Coins className="h-4 w-4 mr-2" />
            Currency
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-2 text-center">
            {Object.entries(character.currency).map(([type, amount]) => (
              <div key={type}>
                <div className="text-lg font-bold">{amount}</div>
                <div className="text-xs text-muted-foreground uppercase">{type}</div>
              </div>
            ))}
          </div>
          <div className="mt-3 text-center text-sm text-muted-foreground">
            Total value: {Math.floor(totalCoins / 100)} gp {totalCoins % 100} cp
          </div>
        </CardContent>
      </Card>
      
      {/* Equipment */}
      <div className="space-y-4">
        <h4 className="text-md font-medium">Equipment</h4>
        
        {character.equipment.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <Package className="h-12 w-12 mx-auto mb-4" />
            <p>No equipment</p>
          </div>
        ) : (
          <div className="space-y-2">
            {character.equipment.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <div className="font-medium">{item.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {item.type} • Qty: {item.quantity}
                    {item.weight && ` • ${item.weight} lb`}
                  </div>
                  {item.description && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {item.description}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  {item.equipped && (
                    <Badge variant="secondary" className="text-xs">
                      Equipped
                    </Badge>
                  )}
                  {item.attuned && (
                    <Badge variant="outline" className="text-xs">
                      Attuned
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}