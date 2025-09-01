import type { Meta, StoryObj } from '@storybook/react'
import { Textarea } from './textarea'

const meta = {
  title: 'UI/Textarea',
  component: Textarea,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Textarea>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    placeholder: 'Type your message here.',
  },
}

export const WithValue: Story = {
  args: {
    defaultValue: 'This is a textarea with a default value.',
  },
}

export const Disabled: Story = {
  args: {
    placeholder: 'Disabled textarea',
    disabled: true,
  },
}

export const WithRows: Story = {
  args: {
    placeholder: 'Type your message here.',
    rows: 8,
  },
}