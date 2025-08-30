'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateUserPreferences } from '@/lib/api/user'
import { toast } from 'sonner'
import { Shield, Users, Eye, MessageCircle, Gamepad2 } from 'lucide-react'

interface PrivacyPreferences {
  profileVisibility: 'public' | 'friends' | 'private'
  showOnlineStatus: boolean
  allowFriendRequests: boolean
  showGameHistory: boolean
  allowDirectMessages: boolean
}

export function PrivacySettings() {
  const queryClient = useQueryClient()
  
  const [preferences, setPreferences] = useState<PrivacyPreferences>({
    profileVisibility: 'public',
    showOnlineStatus: true,
    allowFriendRequests: true,
    showGameHistory: true,
    allowDirectMessages: true,
  })

  const updatePreferencesMutation = useMutation({
    mutationFn: updateUserPreferences,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] })
      toast.success('Privacy settings updated!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update privacy settings')
    },
  })

  const handlePreferenceChange = <K extends keyof PrivacyPreferences>(
    key: K,
    value: PrivacyPreferences[K]
  ) => {
    setPreferences(prev => ({ ...prev, [key]: value }))
  }

  const handleSave = () => {
    updatePreferencesMutation.mutate({
      privacy: preferences,
    })
  }

  const visibilityOptions = [
    {
      value: 'public',
      label: 'Public',
      description: 'Anyone can view your profile and game activity'
    },
    {
      value: 'friends',
      label: 'Friends Only',
      description: 'Only your friends can see your profile and activity'
    },
    {
      value: 'private',
      label: 'Private',
      description: 'Your profile is hidden from other users'
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Privacy & Visibility</h3>
        <p className="text-sm text-muted-foreground">
          Control who can see your information and how others can interact with you.
        </p>
      </div>

      {/* Profile Visibility */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <Eye className="h-4 w-4" />
          <Label htmlFor="profile-visibility">Profile Visibility</Label>
        </div>
        <Select
          value={preferences.profileVisibility}
          onValueChange={(value: any) => handlePreferenceChange('profileVisibility', value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {visibilityOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                <div>
                  <div className="font-medium">{option.label}</div>
                  <div className="text-sm text-muted-foreground">{option.description}</div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Online Status */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Shield className="h-4 w-4" />
          <h4 className="font-medium">Activity & Status</h4>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="show-online-status">Show Online Status</Label>
              <p className="text-sm text-muted-foreground">
                Let friends see when you're online and active
              </p>
            </div>
            <Switch
              id="show-online-status"
              checked={preferences.showOnlineStatus}
              onCheckedChange={(checked) => handlePreferenceChange('showOnlineStatus', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5 flex-1">
              <div className="flex items-center space-x-2">
                <Gamepad2 className="h-4 w-4" />
                <Label htmlFor="show-game-history">Show Game History</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Display your games and characters in your public profile
              </p>
            </div>
            <Switch
              id="show-game-history"
              checked={preferences.showGameHistory}
              onCheckedChange={(checked) => handlePreferenceChange('showGameHistory', checked)}
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Social Interactions */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Users className="h-4 w-4" />
          <h4 className="font-medium">Social Interactions</h4>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="allow-friend-requests">Allow Friend Requests</Label>
              <p className="text-sm text-muted-foreground">
                Let other players send you friend requests
              </p>
            </div>
            <Switch
              id="allow-friend-requests"
              checked={preferences.allowFriendRequests}
              onCheckedChange={(checked) => handlePreferenceChange('allowFriendRequests', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5 flex-1">
              <div className="flex items-center space-x-2">
                <MessageCircle className="h-4 w-4" />
                <Label htmlFor="allow-direct-messages">Allow Direct Messages</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Let friends and game masters send you private messages
              </p>
            </div>
            <Switch
              id="allow-direct-messages"
              checked={preferences.allowDirectMessages}
              onCheckedChange={(checked) => handlePreferenceChange('allowDirectMessages', checked)}
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Privacy Notice */}
      <div className="bg-muted/50 p-4 rounded-lg">
        <h4 className="font-medium mb-2">Privacy Notice</h4>
        <p className="text-sm text-muted-foreground">
          These settings control your visibility to other users. Game masters in games you join 
          will always be able to see your profile and activity within their games, regardless 
          of these privacy settings.
        </p>
      </div>

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