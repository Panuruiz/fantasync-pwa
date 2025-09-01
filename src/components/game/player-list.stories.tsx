import type { Meta, StoryObj } from '@storybook/react'
import { PlayerList } from './player-list'

const meta = {
  title: 'Game/PlayerList',
  component: PlayerList,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof PlayerList>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    players: [
      {
        id: '1',
        name: 'John (DM)',
        characterName: null,
        isGM: true,
        isOnline: true,
        avatarUrl: 'https://placehold.co/40x40',
      },
      {
        id: '2',
        name: 'Alice',
        characterName: 'Elara the Ranger',
        isGM: false,
        isOnline: true,
        avatarUrl: 'https://placehold.co/40x40',
      },
      {
        id: '3',
        name: 'Bob',
        characterName: 'Thorin the Fighter',
        isGM: false,
        isOnline: false,
        avatarUrl: 'https://placehold.co/40x40',
      },
    ],
  },
}

export const Empty: Story = {
  args: {
    players: [],
  },
}