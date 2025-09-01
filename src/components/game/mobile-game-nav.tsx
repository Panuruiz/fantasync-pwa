'use client'

import { useGameStore } from '@/stores/game-store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  MessageCircle, 
  Users, 
  Dice6, 
  MoreHorizontal,
  Send
} from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import CreateInviteDialog from './create-invite-dialog'
import { useUserStore } from '@/stores/user-store'
import type { Game } from '@/types/game'

interface MobileGameNavProps {
  game: Game
}

export default function MobileGameNav({ game }: MobileGameNavProps) {
  const { 
    isChatOpen, 
    isPlayerListOpen, 
    toggleChat, 
    togglePlayerList 
  } = useGameStore()
  
  const { id: userId } = useUserStore()
  const isGameMaster = game.masterId === userId
  const activePlayers = game.players?.filter(p => p.isActive) || []
  const unreadCount = 0 // TODO: Implement unread message count

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t sm:hidden">
      <div className="flex items-center justify-around p-2">
        {/* Chat Toggle */}
        <Button
          variant={isChatOpen ? "default" : "ghost"}
          size="sm"
          onClick={toggleChat}
          className="flex flex-col gap-1 h-12 px-3 relative"
        >
          <MessageCircle className="h-5 w-5" />
          <span className="text-xs">Chat</span>
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs flex items-center justify-center"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>

        {/* Players List Toggle */}
        <Button
          variant={isPlayerListOpen ? "default" : "ghost"}
          size="sm"
          onClick={togglePlayerList}
          className="flex flex-col gap-1 h-12 px-3"
        >
          <Users className="h-5 w-5" />
          <span className="text-xs">Players</span>
          <Badge variant="outline" className="text-xs">
            {activePlayers.length}
          </Badge>
        </Button>

        {/* Dice Roll Button */}
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="flex flex-col gap-1 h-12 px-3"
            >
              <Dice6 className="h-5 w-5" />
              <span className="text-xs">Dice</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-auto">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <Dice6 className="h-5 w-5" />
                Quick Dice Rolls
              </SheetTitle>
            </SheetHeader>
            
            <div className="py-4">
              <div className="grid grid-cols-4 gap-3">
                {[
                  { formula: '1d4', label: 'D4' },
                  { formula: '1d6', label: 'D6' },
                  { formula: '1d8', label: 'D8' },
                  { formula: '1d10', label: 'D10' },
                  { formula: '1d12', label: 'D12' },
                  { formula: '1d20', label: 'D20' },
                  { formula: '2d6', label: '2D6' },
                  { formula: '1d20+3', label: 'D20+3' },
                ].map((roll) => (
                  <Button
                    key={roll.formula}
                    variant="outline"
                    size="sm"
                    className="aspect-square flex flex-col gap-1"
                    onClick={() => {
                      // TODO: Implement quick dice roll
                      console.log(`Rolling ${roll.formula}`)
                    }}
                  >
                    <Dice6 className="h-4 w-4" />
                    <span className="text-xs font-medium">{roll.label}</span>
                  </Button>
                ))}
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* More Options */}
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="flex flex-col gap-1 h-12 px-3"
            >
              <MoreHorizontal className="h-5 w-5" />
              <span className="text-xs">More</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-auto">
            <SheetHeader>
              <SheetTitle>Game Options</SheetTitle>
            </SheetHeader>
            
            <div className="py-4 space-y-2">
              {isGameMaster && activePlayers.length < game.maxPlayers && (
                <CreateInviteDialog gameId={game.id}>
                  <Button variant="outline" className="w-full justify-start">
                    <Users className="h-4 w-4 mr-2" />
                    Invite Players
                  </Button>
                </CreateInviteDialog>
              )}
              
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => {
                  // TODO: Implement voice chat toggle
                }}
              >
                <Send className="h-4 w-4 mr-2" />
                Voice Chat
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => {
                  // TODO: Implement game settings
                }}
              >
                <Users className="h-4 w-4 mr-2" />
                Game Settings
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  )
}