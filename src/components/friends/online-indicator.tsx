import { cn } from '@/lib/utils'

interface OnlineIndicatorProps {
  status: 'online' | 'away' | 'busy' | 'offline' | string
  className?: string
}

export function OnlineIndicator({ status, className }: OnlineIndicatorProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500'
      case 'away': return 'bg-yellow-500'
      case 'busy': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <div 
      className={cn(
        'h-3 w-3 rounded-full border-2 border-background',
        getStatusColor(status),
        className
      )}
    />
  )
}