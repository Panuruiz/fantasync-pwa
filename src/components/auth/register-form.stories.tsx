import type { Meta, StoryObj } from '@storybook/react'
import { RegisterForm } from './register-form'

const meta = {
  title: 'Auth/RegisterForm',
  component: RegisterForm,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof RegisterForm>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}