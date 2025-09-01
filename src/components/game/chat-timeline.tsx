'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { editMessage, deleteMessage } from '@/lib/api/messages'
import { useGameStore } from '@/stores/game-store'
import type { ChatMessage, DiceRollMetadata } from '@/types/game'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { 
  MoreVertical, 
  Edit3, 
  Trash2, 
  Dice6, 
  Crown, 
  Clock,
  Check,
  X,
  XIcon,
  BookOpen,
  ScrollIcon
} from 'lucide-react'

interface ChatTimelineProps {
  messages: ChatMessage[]
  gameId: string
  userId: string
}

export default function ChatTimeline({ messages, gameId, userId }: ChatTimelineProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { updateMessage, deleteMessage: removeMessage } = useGameStore()
  
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [loadingAction, setLoadingAction] = useState<string | null>(null)

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  const handleEditStart = (message: ChatMessage) => {
    setEditingMessageId(message.id)
    setEditContent(message.content)
  }

  const handleEditSave = async (messageId: string) => {
    try {
      setLoadingAction(messageId)
      const updatedMessage = await editMessage(messageId, editContent.trim())
      updateMessage(messageId, updatedMessage)
      setEditingMessageId(null)
    } catch (error) {
      console.error('Failed to edit message:', error)
    } finally {
      setLoadingAction(null)
    }
  }

  const handleEditCancel = () => {
    setEditingMessageId(null)
    setEditContent('')
  }

  const handleDelete = async (messageId: string) => {
    try {
      setLoadingAction(messageId)
      await deleteMessage(messageId)
      removeMessage(messageId)
    } catch (error) {
      console.error('Failed to delete message:', error)
    } finally {
      setLoadingAction(null)
    }
  }

  const canEditMessage = (message: ChatMessage): boolean => {
    if (message.authorId !== userId) return false
    const messageAge = Date.now() - new Date(message.createdAt).getTime()
    const fiveMinutes = 5 * 60 * 1000
    return messageAge <= fiveMinutes && !message.isEdited
  }

  const canDeleteMessage = (message: ChatMessage): boolean => {
    if (message.authorId !== userId) return false
    const messageAge = Date.now() - new Date(message.createdAt).getTime()
    const fiveMinutes = 5 * 60 * 1000
    return messageAge <= fiveMinutes
  }

  const renderMessageContent = (message: ChatMessage) => {
    switch (message.type) {
      case 'DICE_ROLL':
        return <DiceRollMessage message={message} />
      case 'SYSTEM':
        return <SystemMessage message={message} />
      case 'ACTION':
        return (
          <div className="italic">
            <span className="font-medium">{message.author.username}</span> {message.content}
          </div>
        )
      case 'NARRATION':
        return (
          <div className="text-secondary font-extrabold border-l-2 border-primary pl-3">
            <ScrollIcon /><span>{message.content}</span>
          </div>
        )
      default:
        return <span className="whitespace-pre-wrap break-words">{message.content}</span>
    }
  }

  const groupedMessages = messages.reduce((groups: ChatMessage[][], message, index) => {
    const previousMessage = messages[index - 1]
    const shouldGroup = previousMessage && 
      previousMessage.authorId === message.authorId &&
      previousMessage.type === message.type &&
      message.type === 'CHAT' &&
      new Date(message.createdAt).getTime() - new Date(previousMessage.createdAt).getTime() < 60000

    if (shouldGroup) {
      groups[groups.length - 1].push(message)
    } else {
      groups.push([message])
    }

    return groups
  }, [])

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center text-muted-foreground">
          <Dice6 className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">No messages yet</h3>
          <p>Start the conversation or roll some dice!</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {groupedMessages.map((group, groupIndex) => (
        <div key={groupIndex} className="space-y-1">
          {group.map((message, messageIndex) => {
            const isFirstInGroup = messageIndex === 0
            const isOwn = message.authorId === userId
            const isEditing = editingMessageId === message.id

            return (
              <div
                key={message.id}
                className={`group flex gap-3 ${isOwn ? 'justify-end' : ''}`}
              >
                {/* Avatar (only show for first message in group) */}
                {!isOwn && isFirstInGroup && (
                  <Avatar className="h-8 w-8 mt-1">
                    <AvatarImage src={message.author.avatarUrl} />
                    <AvatarFallback className="text-xs">
                      {message.author.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                )}

                {/* Spacer for grouped messages */}
                {!isOwn && !isFirstInGroup && (
                  <div className="w-8" />
                )}

                {/* Message Content */}
                <div className={`flex-1 max-w-2xl ${isOwn ? 'text-right' : ''}`}>
                  {/* Author and timestamp (only for first message in group) */}
                  {isFirstInGroup && (
                    <div className={`flex items-center gap-2 mb-1 ${isOwn ? 'justify-end' : ''}`}>
                      <span className="text-sm font-medium">
                        {message.author.username}
                      </span>
                      {message.type === 'SYSTEM' && (
                        <Crown className="h-3 w-3 text-yellow-500" />
                      )}
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                  )}

                  {/* Message bubble */}
                  <div
                    className={`
                      relative rounded-lg px-4 py-2 
                      ${isOwn 
                        ? 'bg-primary text-primary-foreground ml-auto' 
                        : 'bg-muted'
                      }
                      ${message.isOptimistic ? 'opacity-50' : ''}
                    `}
                  >
                    {/* Editing mode */}
                    {isEditing ? (
                      <div className="space-y-2">
                        <Input
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault()
                              handleEditSave(message.id)
                            } else if (e.key === 'Escape') {
                              handleEditCancel()
                            }
                          }}
                          className="text-sm"
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleEditSave(message.id)}
                            disabled={loadingAction === message.id}
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleEditCancel}
                            disabled={loadingAction === message.id}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {renderMessageContent(message)}
                        
                        {/* Edit indicator */}
                        {message.isEdited && (
                          <div className="text-xs opacity-70 mt-1">
                            <Clock className="h-3 w-3 inline mr-1" />
                            edited
                          </div>
                        )}
                      </>
                    )}

                    {/* Message actions */}
                    {!isEditing && (canEditMessage(message) || canDeleteMessage(message)) && (
                      <div className="absolute -top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="secondary" size="sm" className="h-6 w-6 p-0">
                              <MoreVertical className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            {canEditMessage(message) && (
                              <DropdownMenuItem onClick={() => handleEditStart(message)}>
                                <Edit3 className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                            )}
                            {canDeleteMessage(message) && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete message?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This action cannot be undone. The message will be permanently deleted.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction 
                                      onClick={() => handleDelete(message.id)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  )
}

// Dice roll message component
function DiceRollMessage({ message }: { message: ChatMessage }) {
  const metadata = message.metadata as DiceRollMetadata

  if (!metadata) {
    return <div>{message.content}</div>
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Dice6 className="h-4 w-4" />
        <span className="font-medium">Dice Roll</span>
        {metadata.reason && (
          <Badge variant="secondary" className="text-xs">
            {metadata.reason}
          </Badge>
        )}
      </div>
      
      <div className="space-y-1">
        <div className="font-mono text-sm">
          {metadata.formula} = {metadata.results.join(' + ')}
          {metadata.modifier !== 0 && ` ${metadata.modifier >= 0 ? '+' : ''}${metadata.modifier}`}
        </div>
        <div className="text-lg font-bold">
          Total: {metadata.total}
        </div>
      </div>
    </div>
  )
}

// System message component
function SystemMessage({ message }: { message: ChatMessage }) {
  return (
    <div className="flex items-center gap-2 text-muted-foreground italic text-sm">
      <Crown className="h-3 w-3" />
      <span>{message.content}</span>
    </div>
  )
}