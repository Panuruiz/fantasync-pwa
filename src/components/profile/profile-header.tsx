'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, MapPin, Edit3 } from 'lucide-react'
import { useUser } from '@/hooks/use-user'
import { formatDistanceToNow, format } from 'date-fns'

export function ProfileHeader() {
  const { user, loading } = useUser()

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start space-x-4">
            <div className="h-20 w-20 bg-muted rounded-full animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-6 bg-muted rounded w-32 animate-pulse" />
              <div className="h-4 bg-muted rounded w-24 animate-pulse" />
              <div className="h-4 bg-muted rounded w-48 animate-pulse" />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!user) {
    return null
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={user.avatarUrl} alt={user.username} />
              <AvatarFallback className="text-2xl">
                {user.username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="space-y-2">
              <div>
                <h1 className="text-2xl font-bold">{user.username}</h1>
                <p className="text-muted-foreground">{user.email}</p>
              </div>
              
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>Joined {format(user.createdAt, 'MMMM yyyy')}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span>Last active {formatDistanceToNow(user.updatedAt, { addSuffix: true })}</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Badge variant="secondary">{user.theme}</Badge>
                <Badge variant="outline">{user.fontSize} text</Badge>
              </div>
            </div>
          </div>
          
          <Button variant="outline" size="sm">
            <Edit3 className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}