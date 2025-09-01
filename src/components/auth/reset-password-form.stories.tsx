import type { Meta, StoryObj } from '@storybook/react'
import { ResetPasswordForm } from './reset-password-form'

const meta = {
  title: 'Auth/ResetPasswordForm',
  component: ResetPasswordForm,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ResetPasswordForm>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}