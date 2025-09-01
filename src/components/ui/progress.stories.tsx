import type { Meta, StoryObj } from '@storybook/react'
import { Progress } from './progress'

const meta = {
  title: 'UI/Progress',
  component: Progress,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    value: {
      control: { type: 'range', min: 0, max: 100, step: 10 },
    },
  },
} satisfies Meta<typeof Progress>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    value: 60,
    className: 'w-[60%]',
  },
}

export const Zero: Story = {
  args: {
    value: 0,
    className: 'w-[60%]',
  },
}

export const Complete: Story = {
  args: {
    value: 100,
    className: 'w-[60%]',
  },
}

export const InProgress: Story = {
  args: {
    value: 33,
    className: 'w-[60%]',
  },
}