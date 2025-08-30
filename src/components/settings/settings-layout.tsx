'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { 
  User, 
  Palette, 
  Shield, 
  Bell, 
  Download,
  Trash2,
  Settings as SettingsIcon
} from 'lucide-react'
import { ProfileSettings } from '@/components/profile/profile-settings'
import { ThemeSettings } from './theme-settings'
import { PrivacySettings } from './privacy-settings'
import { NotificationSettings } from './notification-settings'
import { DataExport } from './data-export'
import { DeleteAccount } from './delete-account'

const settingsTabs = [
  {
    id: 'profile',
    label: 'Profile',
    icon: User,
    component: ProfileSettings,
  },
  {
    id: 'appearance',
    label: 'Appearance',
    icon: Palette,
    component: ThemeSettings,
  },
  {
    id: 'privacy',
    label: 'Privacy',
    icon: Shield,
    component: PrivacySettings,
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: Bell,
    component: NotificationSettings,
  },
  {
    id: 'data',
    label: 'Data & Export',
    icon: Download,
    component: DataExport,
  },
  {
    id: 'account',
    label: 'Delete Account',
    icon: Trash2,
    component: DeleteAccount,
  },
]

export function SettingsLayout() {
  const [activeTab, setActiveTab] = useState('profile')

  const activeTabData = settingsTabs.find(tab => tab.id === activeTab)
  const ActiveComponent = activeTabData?.component || ProfileSettings

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Settings Navigation */}
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <SettingsIcon className="h-5 w-5" />
              <span>Settings</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <nav className="space-y-1">
              {settingsTabs.map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                
                return (
                  <Button
                    key={tab.id}
                    variant={isActive ? 'secondary' : 'ghost'}
                    className={cn(
                      'w-full justify-start rounded-none border-r-2 border-transparent',
                      isActive && 'border-primary bg-secondary'
                    )}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {tab.label}
                  </Button>
                )
              })}
            </nav>
          </CardContent>
        </Card>
      </div>

      {/* Settings Content */}
      <div className="lg:col-span-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              {activeTabData && <activeTabData.icon className="h-5 w-5" />}
              <span>{activeTabData?.label}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ActiveComponent />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}