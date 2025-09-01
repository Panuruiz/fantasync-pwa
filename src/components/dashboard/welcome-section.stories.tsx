import type { Meta, StoryObj } from '@storybook/react'
import { WelcomeSection } from './welcome-section'

const meta = {
  title: 'Dashboard/WelcomeSection',
  component: WelcomeSection,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof WelcomeSection>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    userName: 'John Doe',
  },
}

export const NewUser: Story = {
  args: {
    userName: 'Jane Smith',
    isNewUser: true,
  },
}