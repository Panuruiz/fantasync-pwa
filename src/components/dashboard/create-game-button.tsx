'use client'

import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export function CreateGameButton() {
  return (
    <Button asChild>
      <Link href="/games/create">
        <Plus className="h-4 w-4 mr-2" />
        Create Game
      </Link>
    </Button>
  )
}