'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getInvitationByCode, acceptInvitation, declineInvitation } from '@/lib/api/invitations'
import { useGameStore } from '@/stores/game-store'
import type { GameInvitation } from '@/types/game'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { 
  ArrowLeft, 
  Loader2, 
  Users, 
  Crown, 
  Clock, 
  Shield, 
  Eye, 
  EyeOff,
  CheckCircle2,
  XCircle,
  Calendar
} from 'lucide-react'

export default function JoinGamePage() {
  const params = useParams()
  const router = useRouter()
  const code = params.code as string
  
  const { addGame } = useGameStore()
  
  const [invitation, setInvitation] = useState<GameInvitation | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadInvitation()
  }, [code])

  const loadInvitation = async () => {
    try {
      setLoading(true)
      setError(null)

      const invite = await getInvitationByCode(code)
      if (!invite) {
        setError('Invitation not found or expired')
        return
      }

      setInvitation(invite)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load invitation')
    } finally {
      setLoading(false)
    }
  }

  const handleAccept = async () => {
    if (!invitation) return

    try {
      setActionLoading(true)
      setError(null)

      await acceptInvitation(invitation.id)
      
      // Add game to user's games list
      if (invitation.game) {
        addGame({
          id: invitation.game.id,
          name: invitation.game.name,
          system: invitation.game.system,
          masterId: invitation.game.master.id,
          masterName: invitation.game.master.username,
          playerCount: invitation.game._count.count + 1, // Include the new player
          maxPlayers: invitation.game.max_players,
          status: invitation.game.status,
          privacy: invitation.game.privacy,
          lastActivity: new Date(),
          unreadMessages: 0,
          myCharacters: [],
        })
      }

      // Redirect to the game
      router.push(`/games/${invitation.gameId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept invitation')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDecline = async () => {
    if (!invitation) return

    try {
      setActionLoading(true)
      setError(null)

      await declineInvitation(invitation.id)
      router.push('/games')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to decline invitation')
    } finally {
      setActionLoading(false)
    }
  }

  const formatGameSystem = (system: string) => {
    switch (system) {
      case 'DND5E':
        return 'D&D 5e'
      case 'PATHFINDER2E':
        return 'Pathfinder 2e'
      case 'CALL_OF_CTHULHU':
        return 'Call of Cthulhu'
      case 'VAMPIRE':
        return 'Vampire'
      default:
        return system
    }
  }

  const getPrivacyIcon = (privacy: string) => {
    switch (privacy) {
      case 'PRIVATE':
        return Shield
      case 'FRIENDS':
        return Users
      case 'PUBLIC':
        return Eye
      default:
        return EyeOff
    }
  }

  const getPrivacyLabel = (privacy: string) => {
    switch (privacy) {
      case 'PRIVATE':
        return 'Private'
      case 'FRIENDS':
        return 'Friends Only'
      case 'PUBLIC':
        return 'Public'
      default:
        return privacy
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-500'
      case 'PREPARING':
        return 'bg-yellow-500'
      case 'PAUSED':
        return 'bg-orange-500'
      default:
        return 'bg-gray-400'
    }
  }

  const formatExpiryTime = (date: Date) => {
    const now = new Date()
    const diffMs = date.getTime() - now.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)

    if (diffMs < 0) return 'Expired'
    if (diffHours < 1) return 'Expires soon'
    if (diffHours < 24) return `Expires in ${diffHours}h`
    if (diffDays < 7) return `Expires in ${diffDays}d`
    return date.toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="p-8">
            <CardContent className="flex items-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Loading invitation...</span>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (error || !invitation) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Button
          variant="ghost"
          onClick={() => router.push('/games')}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Games
        </Button>

        <Card className="p-12 text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-semibold mb-2">Invalid Invitation</h2>
          <p className="text-muted-foreground mb-6">
            {error || 'This invitation link is no longer valid or has expired.'}
          </p>
          <Button onClick={() => router.push('/games')}>
            View My Games
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Button
        variant="ghost"
        onClick={() => router.push('/games')}
        className="mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Games
      </Button>

      <div className="space-y-6">
        <div className="text-center">
          <div className="text-6xl mb-4">🎲</div>
          <h1 className="text-3xl font-bold mb-2">Game Invitation</h1>
          <p className="text-muted-foreground">
            {invitation.invitedBy?.username} has invited you to join a game
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-start gap-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src={invitation.invitedBy?.avatarUrl} />
                <AvatarFallback>
                  {invitation.invitedBy?.username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-xl">{invitation.game?.name}</CardTitle>
                <CardDescription className="flex items-center gap-2 mt-1">
                  <Badge variant="outline">
                    {formatGameSystem(invitation.game?.system || '')}
                  </Badge>
                  <div className={`w-2 h-2 rounded-full ${getStatusColor(invitation.game?.status || '')}`} />
                  <span className="capitalize">{invitation.game?.status?.toLowerCase()}</span>
                </CardDescription>
              </div>
            </div>

            {invitation.message && (
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <p className="text-sm italic">"{invitation.message}"</p>
              </div>
            )}
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Crown className="h-4 w-4" />
                  <span>Game Master</span>
                </div>
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={invitation.game?.master?.avatarUrl} />
                    <AvatarFallback className="text-xs">
                      {invitation.game?.master?.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium">
                    {invitation.game?.master?.username}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>Players</span>
                </div>
                <div className="font-medium">
                  {invitation.game?._count?.count || 0} / {invitation.game?.max_players || 0}
                </div>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                {(() => {
                  const PrivacyIcon = getPrivacyIcon(invitation.game?.privacy || '')
                  return <PrivacyIcon className="h-4 w-4 text-muted-foreground" />
                })()}
                <span>{getPrivacyLabel(invitation.game?.privacy || '')}</span>
              </div>

              {invitation.expiresAt && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{formatExpiryTime(invitation.expiresAt)}</span>
                </div>
              )}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                size="lg"
                onClick={handleAccept}
                disabled={actionLoading}
                className="flex-1"
              >
                {actionLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                )}
                Accept Invitation
              </Button>
              
              <Button
                variant="outline"
                size="lg"
                onClick={handleDecline}
                disabled={actionLoading}
                className="flex-1"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Decline
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}