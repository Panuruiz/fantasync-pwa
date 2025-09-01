import type { Meta, StoryObj } from '@storybook/react'
import { Label } from './label'
import { Input } from './input'

const meta = {
  title: 'UI/Label',
  component: Label,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Label>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    children: 'Email',
  },
}

export const WithInput: Story = {
  render: () => (
    <div className="grid w-full max-w-sm items-center gap-1.5">
      <Label htmlFor="email">Email</Label>
      <Input type="email" id="email" placeholder="Email" />
    </div>
  ),
}

export const Required: Story = {
  render: () => (
    <div className="grid w-full max-w-sm items-center gap-1.5">
      <Label htmlFor="email-required">
        Email <span className="text-red-500">*</span>
      </Label>
      <Input type="email" id="email-required" placeholder="Email" required />
    </div>
  ),
}