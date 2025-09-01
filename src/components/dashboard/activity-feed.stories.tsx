import type { Meta, StoryObj } from '@storybook/react'
import { ActivityFeed } from './activity-feed'

const meta = {
  title: 'Dashboard/ActivityFeed',
  component: ActivityFeed,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ActivityFeed>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    activities: [
      {
        id: '1',
        type: 'message',
        user: 'John Doe',
        game: 'The Lost Mines',
        content: 'Posted a new message',
        timestamp: new Date().toISOString(),
      },
      {
        id: '2',
        type: 'dice',
        user: 'Jane Smith',
        game: 'Dragon Heist',
        content: 'Rolled 18 on Investigation',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
      },
    ],
  },
}

export const Empty: Story = {
  args: {
    activities: [],
  },
}