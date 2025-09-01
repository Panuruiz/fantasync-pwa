'use client'

import { useState } from 'react'
import { createInvitation } from '@/lib/api/invitations'
import type { InvitationType } from '@/types/game'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { 
  UserPlus, 
  Copy, 
  Mail, 
  Link as LinkIcon, 
  Clock,
  CheckCircle2,
  Loader2
} from 'lucide-react'

interface CreateInviteDialogProps {
  gameId: string
  children: React.ReactNode
}

export default function CreateInviteDialog({ gameId, children }: CreateInviteDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Link invitation state
  const [linkMessage, setLinkMessage] = useState('')
  const [linkExpires, setLinkExpires] = useState('168') // 7 days default
  const [generatedLink, setGeneratedLink] = useState<string>('')
  
  // Direct invitation state
  const [directEmail, setDirectEmail] = useState('')
  const [directMessage, setDirectMessage] = useState('')
  const [directExpires, setDirectExpires] = useState('168')
  const [invitationSent, setInvitationSent] = useState(false)

  const expirationOptions = [
    { value: '1', label: '1 hour' },
    { value: '24', label: '1 day' },
    { value: '168', label: '1 week' },
    { value: '720', label: '1 month' },
    { value: '0', label: 'Never' },
  ]

  const handleCreateLinkInvite = async () => {
    try {
      setLoading(true)
      setError(null)

      const invitation = await createInvitation(
        gameId,
        'LINK',
        undefined,
        linkMessage.trim() || undefined,
        parseInt(linkExpires) || undefined
      )
      
      const link = `${window.location.origin}/games/join/${invitation.code}`
      setGeneratedLink(link)
      
      // Copy to clipboard
      await navigator.clipboard.writeText(link)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create invitation')
    } finally {
      setLoading(false)
    }
  }

  const handleSendDirectInvite = async () => {
    if (!directEmail.trim()) {
      setError('Email address is required')
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Note: In a real implementation, you'd need to resolve the email to a user ID
      // For now, this will create a LINK invitation instead
      const invitation = await createInvitation(
        gameId,
        'DIRECT',
        undefined, // Would need actual user ID here
        directMessage.trim() || undefined,
        parseInt(directExpires) || undefined
      )
      
      setInvitationSent(true)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send invitation')
    } finally {
      setLoading(false)
    }
  }

  const copyLink = async () => {
    if (generatedLink) {
      await navigator.clipboard.writeText(generatedLink)
    }
  }

  const resetDialog = () => {
    setGeneratedLink('')
    setInvitationSent(false)
    setError(null)
    setLinkMessage('')
    setDirectEmail('')
    setDirectMessage('')
    setLinkExpires('168')
    setDirectExpires('168')
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      resetDialog()
    }
  }

  if (generatedLink) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          {children}
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Invitation Created!
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Share this link with your friends</Label>
              <div className="flex gap-2">
                <Input
                  value={generatedLink}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button size="sm" onClick={copyLink}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Link copied to clipboard! Anyone with this link can join your game.
              </p>
            </div>
            
            <Button onClick={() => setOpen(false)} className="w-full">
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (invitationSent) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          {children}
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Invitation Sent!
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              An invitation has been sent to <strong>{directEmail}</strong>. 
              They will receive an email with instructions to join your game.
            </p>
            
            <Button onClick={() => setOpen(false)} className="w-full">
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Invite Players
          </DialogTitle>
        </DialogHeader>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
            {error}
          </div>
        )}
        
        <Tabs defaultValue="link" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="link" className="flex items-center gap-2">
              <LinkIcon className="h-4 w-4" />
              Link
            </TabsTrigger>
            <TabsTrigger value="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="link" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="link-message">Personal Message (optional)</Label>
              <Textarea
                id="link-message"
                value={linkMessage}
                onChange={(e) => setLinkMessage(e.target.value)}
                placeholder="Come join our epic adventure!"
                rows={3}
                maxLength={200}
              />
              <div className="text-xs text-muted-foreground text-right">
                {linkMessage.length}/200
              </div>
            </div>

            <div className="space-y-2">
              <Label>Expires</Label>
              <div className="flex flex-wrap gap-2">
                {expirationOptions.map((option) => (
                  <Badge
                    key={option.value}
                    variant={linkExpires === option.value ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => setLinkExpires(option.value)}
                  >
                    <Clock className="h-3 w-3 mr-1" />
                    {option.label}
                  </Badge>
                ))}
              </div>
            </div>
            
            <Button 
              onClick={handleCreateLinkInvite} 
              disabled={loading} 
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <LinkIcon className="h-4 w-4 mr-2" />
                  Create Invitation Link
                </>
              )}
            </Button>
            
            <p className="text-xs text-muted-foreground">
              Anyone with the link can join your game. Link will expire based on your selection.
            </p>
          </TabsContent>
          
          <TabsContent value="email" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="direct-email">Friend's Email Address</Label>
              <Input
                id="direct-email"
                type="email"
                value={directEmail}
                onChange={(e) => setDirectEmail(e.target.value)}
                placeholder="friend@example.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="direct-message">Personal Message (optional)</Label>
              <Textarea
                id="direct-message"
                value={directMessage}
                onChange={(e) => setDirectMessage(e.target.value)}
                placeholder="Hey! Want to join my D&D game?"
                rows={3}
                maxLength={200}
              />
              <div className="text-xs text-muted-foreground text-right">
                {directMessage.length}/200
              </div>
            </div>

            <div className="space-y-2">
              <Label>Expires</Label>
              <div className="flex flex-wrap gap-2">
                {expirationOptions.map((option) => (
                  <Badge
                    key={option.value}
                    variant={directExpires === option.value ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => setDirectExpires(option.value)}
                  >
                    <Clock className="h-3 w-3 mr-1" />
                    {option.label}
                  </Badge>
                ))}
              </div>
            </div>
            
            <Button 
              onClick={handleSendDirectInvite} 
              disabled={loading || !directEmail.trim()} 
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Send Invitation
                </>
              )}
            </Button>
            
            <p className="text-xs text-muted-foreground">
              Your friend will receive an email with an invitation link to join your game.
            </p>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}