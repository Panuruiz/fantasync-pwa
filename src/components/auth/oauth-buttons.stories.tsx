import type { Meta, StoryObj } from '@storybook/react'
import { OAuthButtons } from './oauth-buttons'

const meta = {
  title: 'Auth/OAuthButtons',
  component: OAuthButtons,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof OAuthButtons>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}