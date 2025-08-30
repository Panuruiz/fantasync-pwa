'use client'

import { useUser } from '@/hooks/use-user'
import { formatDistanceToNow } from 'date-fns'

export function WelcomeSection() {
  const { user, loading } = useUser()

  if (loading) {
    return (
      <div className="space-y-2">
        <div className="h-8 bg-muted rounded w-64 animate-pulse" />
        <div className="h-5 bg-muted rounded w-48 animate-pulse" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  const lastSeenText = user.updatedAt 
    ? `Last active ${formatDistanceToNow(user.updatedAt, { addSuffix: true })}`
    : 'First time here!'

  return (
    <div className="space-y-2">
      <h1 className="text-3xl font-bold">
        Welcome back, {user.username}!
      </h1>
      <p className="text-muted-foreground">
        {lastSeenText}
      </p>
    </div>
  )
}