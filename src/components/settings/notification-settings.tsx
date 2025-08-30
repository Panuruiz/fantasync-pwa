'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateUserPreferences } from '@/lib/api/user'
import { toast } from 'sonner'
import { Mail, Smartphone, Bell, MessageCircle, Users, Gamepad2 } from 'lucide-react'

interface NotificationPreferences {
  email: {
    gameInvites: boolean
    friendRequests: boolean
    messages: boolean
    gameUpdates: boolean
    weeklyDigest: boolean
  }
  push: {
    enabled: boolean
    gameActivity: boolean
    mentions: boolean
    friendsOnline: boolean
  }
}

export function NotificationSettings() {
  const queryClient = useQueryClient()
  
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    email: {
      gameInvites: true,
      friendRequests: true,
      messages: true,
      gameUpdates: true,
      weeklyDigest: false,
    },
    push: {
      enabled: false,
      gameActivity: true,
      mentions: true,
      friendsOnline: false,
    },
  })

  const updatePreferencesMutation = useMutation({
    mutationFn: updateUserPreferences,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] })
      toast.success('Notification settings updated!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update notification settings')
    },
  })

  const handleEmailChange = (key: keyof NotificationPreferences['email'], value: boolean) => {
    setPreferences(prev => ({
      ...prev,
      email: { ...prev.email, [key]: value }
    }))
  }

  const handlePushChange = (key: keyof NotificationPreferences['push'], value: boolean) => {
    setPreferences(prev => ({
      ...prev,
      push: { ...prev.push, [key]: value }
    }))
  }

  const handleSave = () => {
    updatePreferencesMutation.mutate({
      notifications: preferences,
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Notifications</h3>
        <p className="text-sm text-muted-foreground">
          Choose how you want to be notified about game activity and updates.
        </p>
      </div>

      {/* Email Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Mail className="h-4 w-4" />
            <span>Email Notifications</span>
          </CardTitle>
          <CardDescription>
            Receive updates via email
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5 flex-1">
              <div className="flex items-center space-x-2">
                <Gamepad2 className="h-4 w-4" />
                <Label htmlFor="email-game-invites">Game Invitations</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                When someone invites you to join their game
              </p>
            </div>
            <Switch
              id="email-game-invites"
              checked={preferences.email.gameInvites}
              onCheckedChange={(checked) => handleEmailChange('gameInvites', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5 flex-1">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <Label htmlFor="email-friend-requests">Friend Requests</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                When someone sends you a friend request
              </p>
            </div>
            <Switch
              id="email-friend-requests"
              checked={preferences.email.friendRequests}
              onCheckedChange={(checked) => handleEmailChange('friendRequests', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5 flex-1">
              <div className="flex items-center space-x-2">
                <MessageCircle className="h-4 w-4" />
                <Label htmlFor="email-messages">Direct Messages</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                When you receive private messages
              </p>
            </div>
            <Switch
              id="email-messages"
              checked={preferences.email.messages}
              onCheckedChange={(checked) => handleEmailChange('messages', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5 flex-1">
              <div className="flex items-center space-x-2">
                <Bell className="h-4 w-4" />
                <Label htmlFor="email-game-updates">Game Updates</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Important updates in your active games
              </p>
            </div>
            <Switch
              id="email-game-updates"
              checked={preferences.email.gameUpdates}
              onCheckedChange={(checked) => handleEmailChange('gameUpdates', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-weekly-digest">Weekly Digest</Label>
              <p className="text-sm text-muted-foreground">
                A summary of your week's gaming activity
              </p>
            </div>
            <Switch
              id="email-weekly-digest"
              checked={preferences.email.weeklyDigest}
              onCheckedChange={(checked) => handleEmailChange('weeklyDigest', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Push Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Smartphone className="h-4 w-4" />
            <span>Push Notifications</span>
          </CardTitle>
          <CardDescription>
            Instant notifications on your device
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="push-enabled">Enable Push Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Allow browser notifications for real-time updates
              </p>
            </div>
            <Switch
              id="push-enabled"
              checked={preferences.push.enabled}
              onCheckedChange={(checked) => handlePushChange('enabled', checked)}
            />
          </div>

          {preferences.push.enabled && (
            <>
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="push-game-activity">Game Activity</Label>
                  <p className="text-sm text-muted-foreground">
                    New messages and updates in your games
                  </p>
                </div>
                <Switch
                  id="push-game-activity"
                  checked={preferences.push.gameActivity}
                  onCheckedChange={(checked) => handlePushChange('gameActivity', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="push-mentions">Mentions</Label>
                  <p className="text-sm text-muted-foreground">
                    When someone mentions you in a message
                  </p>
                </div>
                <Switch
                  id="push-mentions"
                  checked={preferences.push.mentions}
                  onCheckedChange={(checked) => handlePushChange('mentions', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="push-friends-online">Friends Online</Label>
                  <p className="text-sm text-muted-foreground">
                    When your friends come online
                  </p>
                </div>
                <Switch
                  id="push-friends-online"
                  checked={preferences.push.friendsOnline}
                  onCheckedChange={(checked) => handlePushChange('friendsOnline', checked)}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Separator />

      <div className="flex justify-end">
        <Button 
          onClick={handleSave}
          disabled={updatePreferencesMutation.isPending}
        >
          {updatePreferencesMutation.isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  )
}