import type { Meta, StoryObj } from '@storybook/react'
import { GameHeader } from './game-header'

const meta = {
  title: 'Game/GameHeader',
  component: GameHeader,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof GameHeader>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    game: {
      id: '1',
      name: 'The Lost Mines of Phandelver',
      description: 'A classic D&D adventure',
      isGM: false,
    },
  },
}

export const AsGM: Story = {
  args: {
    game: {
      id: '2',
      name: 'Dragon Heist',
      description: 'Urban adventure in Waterdeep',
      isGM: true,
    },
  },
}