'use client'

import { ReactNode } from 'react'

interface GameLayoutProps {
  children: ReactNode
}

export default function GameLayout({ children }: GameLayoutProps) {
  return (
    <div className="h-screen bg-background overflow-hidden">
      {children}
    </div>
  )
}