import type { Meta, StoryObj } from '@storybook/react'
import { GameCard } from './game-card'

const meta = {
  title: 'Dashboard/GameCard',
  component: GameCard,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof GameCard>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    game: {
      id: '1',
      name: 'The Lost Mines of Phandelver',
      description: 'A classic D&D adventure for beginners',
      imageUrl: 'https://placehold.co/400x200',
      playerCount: 4,
      maxPlayers: 6,
      isGM: false,
      lastActivity: new Date().toISOString(),
      unreadCount: 5,
    },
  },
}

export const AsGM: Story = {
  args: {
    game: {
      id: '2',
      name: 'Waterdeep: Dragon Heist',
      description: 'Urban adventure in the City of Splendors',
      imageUrl: 'https://placehold.co/400x200',
      playerCount: 5,
      maxPlayers: 5,
      isGM: true,
      lastActivity: new Date(Date.now() - 86400000).toISOString(),
      unreadCount: 0,
    },
  },
}

export const WithUnread: Story = {
  args: {
    game: {
      id: '3',
      name: 'Curse of Strahd',
      description: 'Gothic horror adventure',
      imageUrl: 'https://placehold.co/400x200',
      playerCount: 3,
      maxPlayers: 4,
      isGM: false,
      lastActivity: new Date(Date.now() - 3600000).toISOString(),
      unreadCount: 12,
    },
  },
}