'use client'

import { useState, useRef, useEffect } from 'react'
import { sendMessage, sendDiceRoll } from '@/lib/api/messages'
import { useGameStore } from '@/stores/game-store'
import { useUserStore } from '@/stores/user-store'
import type { MessageType } from '@/types/game'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Send, 
  Dice6, 
  Mic, 
  Paperclip, 
  Smile,
  Zap,
  BookOpen,
  MessageCircle,
  Loader2
} from 'lucide-react'

interface MessageComposerProps {
  gameId: string
}

export default function MessageComposer({ gameId }: MessageComposerProps) {
  const { addMessage, addOptimisticMessage } = useGameStore()
  const { id: userId, username } = useUserStore()
  
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<MessageType>('CHAT')
  const [sending, setSending] = useState(false)
  const [diceFormula, setDiceFormula] = useState('')
  const [diceReason, setDiceReason] = useState('')
  const [isDiceDialogOpen, setIsDiceDialogOpen] = useState(false)
  
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`
    }
  }, [message])

  // Focus textarea on mount
  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  const handleSendMessage = async () => {
    if (!message.trim() || sending || !userId) return

    const content = message.trim()
    setMessage('')
    setSending(true)

    // Create optimistic message
    const optimisticMessage = {
      id: `temp-${Date.now()}`,
      gameId,
      authorId: userId,
      content,
      type: messageType,
      metadata: null,
      isEdited: false,
      createdAt: new Date(),
      author: {
        id: userId,
        username: username || 'You',
        avatarUrl: undefined,
      },
      attachments: [],
      isOptimistic: true,
    }

    addOptimisticMessage(optimisticMessage)

    try {
      const sentMessage = await sendMessage(gameId, content, messageType)
      addMessage(sentMessage)
    } catch (error) {
      console.error('Failed to send message:', error)
      // TODO: Show error notification
    } finally {
      setSending(false)
      // Reset message type to CHAT after sending
      setMessageType('CHAT')
    }
  }

  const handleSendDiceRoll = async () => {
    if (!diceFormula.trim() || sending || !userId) return

    setIsDiceDialogOpen(false)
    setSending(true)

    try {
      const rollMessage = await sendDiceRoll(gameId, diceFormula.trim(), diceReason.trim() || undefined)
      addMessage(rollMessage)
      setDiceFormula('')
      setDiceReason('')
    } catch (error) {
      console.error('Failed to send dice roll:', error)
      // TODO: Show error notification
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const getMessageTypeIcon = (type: MessageType) => {
    switch (type) {
      case 'CHAT':
        return MessageCircle
      case 'ACTION':
        return Zap
      case 'NARRATION':
        return BookOpen
      default:
        return MessageCircle
    }
  }

  const getMessageTypeLabel = (type: MessageType) => {
    switch (type) {
      case 'CHAT':
        return 'Chat'
      case 'ACTION':
        return 'Action'
      case 'NARRATION':
        return 'Narration'
      default:
        return type
    }
  }

  const getMessageTypePlaceholder = (type: MessageType) => {
    switch (type) {
      case 'CHAT':
        return 'Type a message...'
      case 'ACTION':
        return 'Describe your action... (e.g., "draws sword and charges")'
      case 'NARRATION':
        return 'Describe the scene... (Game Master only)'
      default:
        return 'Type a message...'
    }
  }

  // Common dice formulas for quick access
  const commonDiceRolls = [
    { formula: '1d20', label: 'D20' },
    { formula: '1d20+3', label: 'D20+3' },
    { formula: '1d20+5', label: 'D20+5' },
    { formula: '2d6', label: '2D6' },
    { formula: '1d8', label: 'D8' },
    { formula: '1d6', label: 'D6' },
    { formula: '1d4', label: 'D4' },
    { formula: '1d12', label: 'D12' },
  ]

  return (
    <div className="p-4 space-y-3">
      {/* Message type selector */}
      {messageType !== 'CHAT' && (
        <div className="flex items-center gap-2 text-sm">
          <div className="flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded">
            {(() => {
              const Icon = getMessageTypeIcon(messageType)
              return <Icon className="h-3 w-3" />
            })()}
            <span>{getMessageTypeLabel(messageType)}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMessageType('CHAT')}
            className="h-6 px-2 text-xs"
          >
            Cancel
          </Button>
        </div>
      )}

      <div className="flex gap-2">
        {/* Message input */}
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={getMessageTypePlaceholder(messageType)}
            className="min-h-[40px] max-h-[120px] resize-none pr-12"
            disabled={sending}
          />
          
          {/* Emoji picker button (future implementation) */}
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-2 bottom-2 h-6 w-6 p-0 opacity-50 hover:opacity-100"
            disabled={sending}
          >
            <Smile className="h-4 w-4" />
          </Button>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-2">
          {/* Message type dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={sending}>
                {(() => {
                  const Icon = getMessageTypeIcon(messageType)
                  return <Icon className="h-4 w-4" />
                })()}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setMessageType('CHAT')}>
                <MessageCircle className="h-4 w-4 mr-2" />
                Chat
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setMessageType('ACTION')}>
                <Zap className="h-4 w-4 mr-2" />
                Action
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setMessageType('NARRATION')}>
                <BookOpen className="h-4 w-4 mr-2" />
                Narration
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled>
                <Paperclip className="h-4 w-4 mr-2" />
                Attach File
              </DropdownMenuItem>
              <DropdownMenuItem disabled>
                <Mic className="h-4 w-4 mr-2" />
                Voice Note
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Send button */}
          <Button
            onClick={handleSendMessage}
            disabled={!message.trim() || sending}
            size="sm"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Quick actions bar */}
      <div className="flex items-center gap-2">
        {/* Dice roll dialog */}
        <Dialog open={isDiceDialogOpen} onOpenChange={setIsDiceDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" disabled={sending}>
              <Dice6 className="h-4 w-4 mr-1" />
              Roll Dice
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Dice6 className="h-5 w-5" />
                Roll Dice
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="dice-formula">Dice Formula</Label>
                <Input
                  id="dice-formula"
                  value={diceFormula}
                  onChange={(e) => setDiceFormula(e.target.value)}
                  placeholder="e.g., 1d20+5, 2d6, 3d8+2"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSendDiceRoll()
                    }
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dice-reason">Reason (optional)</Label>
                <Input
                  id="dice-reason"
                  value={diceReason}
                  onChange={(e) => setDiceReason(e.target.value)}
                  placeholder="e.g., Attack roll, Stealth check"
                />
              </div>

              {/* Common dice formulas */}
              <div className="space-y-2">
                <Label>Quick Rolls</Label>
                <div className="grid grid-cols-4 gap-2">
                  {commonDiceRolls.map((roll) => (
                    <Button
                      key={roll.formula}
                      variant="outline"
                      size="sm"
                      onClick={() => setDiceFormula(roll.formula)}
                      className="text-xs"
                    >
                      {roll.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  onClick={handleSendDiceRoll}
                  disabled={!diceFormula.trim() || sending}
                  className="flex-1"
                >
                  {sending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Dice6 className="h-4 w-4 mr-2" />
                  )}
                  Roll
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsDiceDialogOpen(false)}
                  disabled={sending}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <div className="text-xs text-muted-foreground">
          Press Enter to send, Shift+Enter for new line
        </div>
      </div>
    </div>
  )
}