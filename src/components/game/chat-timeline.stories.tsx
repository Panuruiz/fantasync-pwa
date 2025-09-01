import type { Meta, StoryObj } from '@storybook/react'
import { ChatTimeline } from './chat-timeline'

const meta = {
  title: 'Game/ChatTimeline',
  component: ChatTimeline,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ChatTimeline>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    messages: [
      {
        id: '1',
        userId: 'user1',
        userName: 'John (DM)',
        content: 'You enter the tavern...',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        type: 'narration',
      },
      {
        id: '2',
        userId: 'user2',
        userName: 'Alice (Ranger)',
        content: 'I look around for any suspicious characters',
        timestamp: new Date(Date.now() - 3000000).toISOString(),
        type: 'action',
      },
      {
        id: '3',
        userId: 'user2',
        userName: 'Alice (Ranger)',
        content: 'Rolling Investigation',
        timestamp: new Date(Date.now() - 2900000).toISOString(),
        type: 'dice',
        diceResult: {
          roll: '1d20+3',
          result: 18,
          details: '15 + 3',
        },
      },
    ],
    currentUserId: 'user2',
  },
}

export const Empty: Story = {
  args: {
    messages: [],
    currentUserId: 'user1',
  },
}