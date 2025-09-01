import type { Meta, StoryObj } from '@storybook/react'
import { ActiveGames } from './active-games'

const meta = {
  title: 'Dashboard/ActiveGames',
  component: ActiveGames,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ActiveGames>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    games: [
      {
        id: '1',
        name: 'The Lost Mines',
        isGM: false,
        lastActivity: new Date().toISOString(),
        unreadCount: 3,
        playerCount: 4,
      },
      {
        id: '2',
        name: 'Dragon Heist',
        isGM: true,
        lastActivity: new Date(Date.now() - 86400000).toISOString(),
        unreadCount: 0,
        playerCount: 5,
      },
    ],
  },
}

export const Empty: Story = {
  args: {
    games: [],
  },
}

export const Loading: Story = {
  args: {
    games: [],
    isLoading: true,
  },
}