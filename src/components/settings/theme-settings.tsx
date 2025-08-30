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
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useTheme } from 'next-themes'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateUserPreferences } from '@/lib/api/user'
import { toast } from 'sonner'
import { Sun, Moon, Monitor, Palette, Type, Eye } from 'lucide-react'

interface ThemePreferences {
  theme: 'system' | 'light' | 'dark'
  fontSize: 'small' | 'medium' | 'large'
  compactMode: boolean
  showAvatars: boolean
  animationsEnabled: boolean
  highContrast: boolean
  colorblindMode?: 'protanopia' | 'deuteranopia' | 'tritanopia'
}

export function ThemeSettings() {
  const { theme, setTheme } = useTheme()
  const queryClient = useQueryClient()
  
  const [preferences, setPreferences] = useState<ThemePreferences>({
    theme: (theme as any) || 'system',
    fontSize: 'medium',
    compactMode: false,
    showAvatars: true,
    animationsEnabled: true,
    highContrast: false,
  })

  const updatePreferencesMutation = useMutation({
    mutationFn: updateUserPreferences,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] })
      toast.success('Theme preferences updated!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update preferences')
    },
  })

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme)
    setPreferences(prev => ({ ...prev, theme: newTheme as any }))
    updatePreferencesMutation.mutate({
      theme: newTheme as any,
      display: {
        ...preferences,
        compactMode: preferences.compactMode,
        showAvatars: preferences.showAvatars,
        animationsEnabled: preferences.animationsEnabled,
        highContrast: preferences.highContrast,
      }
    })
  }

  const handlePreferenceChange = <K extends keyof ThemePreferences>(
    key: K,
    value: ThemePreferences[K]
  ) => {
    setPreferences(prev => ({ ...prev, [key]: value }))
  }

  const handleSave = () => {
    updatePreferencesMutation.mutate({
      fontSize: preferences.fontSize,
      display: {
        compactMode: preferences.compactMode,
        showAvatars: preferences.showAvatars,
        animationsEnabled: preferences.animationsEnabled,
        highContrast: preferences.highContrast,
        colorblindMode: preferences.colorblindMode,
      }
    })
  }

  const themeOptions = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ]

  const fontSizeOptions = [
    { value: 'small', label: 'Small' },
    { value: 'medium', label: 'Medium' },
    { value: 'large', label: 'Large' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Appearance</h3>
        <p className="text-sm text-muted-foreground">
          Customize how Fantasync looks and feels for you.
        </p>
      </div>

      {/* Theme Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Palette className="h-4 w-4" />
            <span>Theme</span>
          </CardTitle>
          <CardDescription>
            Choose your preferred color scheme
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {themeOptions.map((option) => {
              const Icon = option.icon
              const isSelected = preferences.theme === option.value
              
              return (
                <Button
                  key={option.value}
                  variant={isSelected ? 'default' : 'outline'}
                  className="h-20 flex-col space-y-2"
                  onClick={() => handleThemeChange(option.value)}
                >
                  <Icon className="h-6 w-6" />
                  <span className="text-sm">{option.label}</span>
                </Button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Font Size */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <Type className="h-4 w-4" />
          <Label htmlFor="fontSize">Font Size</Label>
        </div>
        <Select
          value={preferences.fontSize}
          onValueChange={(value: any) => handlePreferenceChange('fontSize', value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {fontSizeOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Display Options */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Eye className="h-4 w-4" />
          <h4 className="font-medium">Display Options</h4>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="compact-mode">Compact Mode</Label>
              <p className="text-sm text-muted-foreground">
                Use smaller spacing and condensed layouts
              </p>
            </div>
            <Switch
              id="compact-mode"
              checked={preferences.compactMode}
              onCheckedChange={(checked) => handlePreferenceChange('compactMode', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="show-avatars">Show Avatars</Label>
              <p className="text-sm text-muted-foreground">
                Display user profile pictures throughout the app
              </p>
            </div>
            <Switch
              id="show-avatars"
              checked={preferences.showAvatars}
              onCheckedChange={(checked) => handlePreferenceChange('showAvatars', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="animations">Enable Animations</Label>
              <p className="text-sm text-muted-foreground">
                Show transitions and hover effects
              </p>
            </div>
            <Switch
              id="animations"
              checked={preferences.animationsEnabled}
              onCheckedChange={(checked) => handlePreferenceChange('animationsEnabled', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="high-contrast">High Contrast</Label>
              <p className="text-sm text-muted-foreground">
                Increase contrast for better visibility
              </p>
            </div>
            <Switch
              id="high-contrast"
              checked={preferences.highContrast}
              onCheckedChange={(checked) => handlePreferenceChange('highContrast', checked)}
            />
          </div>
        </div>
      </div>

      {/* Accessibility */}
      <Separator />
      
      <div className="space-y-3">
        <h4 className="font-medium">Accessibility</h4>
        
        <div className="space-y-2">
          <Label htmlFor="colorblind-mode">Colorblind Support</Label>
          <Select
            value={preferences.colorblindMode || 'none'}
            onValueChange={(value) => 
              handlePreferenceChange('colorblindMode', value === 'none' ? undefined : value as any)
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="protanopia">Protanopia</SelectItem>
              <SelectItem value="deuteranopia">Deuteranopia</SelectItem>
              <SelectItem value="tritanopia">Tritanopia</SelectItem>
            </SelectContent>
          </Select>
        </div>
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