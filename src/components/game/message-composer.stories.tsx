import type { Meta, StoryObj } from '@storybook/react'
import { MessageComposer } from './message-composer'

const meta = {
  title: 'Game/MessageComposer',
  component: MessageComposer,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof MessageComposer>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    onSendMessage: (message: string) => console.log('Message sent:', message),
  },
}

export const WithDiceRoll: Story = {
  args: {
    onSendMessage: (message: string) => console.log('Message sent:', message),
    enableDiceRoll: true,
  },
}

export const Disabled: Story = {
  args: {
    onSendMessage: (message: string) => console.log('Message sent:', message),
    disabled: true,
  },
}