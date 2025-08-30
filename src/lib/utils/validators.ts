import { z } from 'zod'

// Auth validation schemas
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be less than 30 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must be less than 100 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

export const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
})

export const updatePasswordSchema = z.object({
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must be less than 100 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

// Profile validation schemas
export const updateProfileSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be less than 30 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  timezone: z.string().optional(),
})

// Game validation schemas
export const createGameSchema = z.object({
  title: z
    .string()
    .min(1, 'Game title is required')
    .max(100, 'Game title must be less than 100 characters'),
  description: z.string().max(1000, 'Description must be less than 1000 characters').optional(),
  system: z.enum(['DND5E', 'PATHFINDER', 'CALL_OF_CTHULHU', 'VAMPIRE', 'CUSTOM']),
  maxPlayers: z.number().min(2, 'Minimum 2 players').max(20, 'Maximum 20 players').default(6),
})

// Message validation schemas
export const sendMessageSchema = z.object({
  content: z.string().min(1, 'Message cannot be empty').max(2000, 'Message too long'),
  isPrivate: z.boolean().default(false),
  recipientId: z.string().uuid().optional(),
})

// Character validation schemas
export const createCharacterSchema = z.object({
  name: z
    .string()
    .min(1, 'Character name is required')
    .max(50, 'Character name must be less than 50 characters'),
  data: z.record(z.string(), z.any()).default({}),
})

// Type exports
export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
export type CreateGameInput = z.infer<typeof createGameSchema>
export type SendMessageInput = z.infer<typeof sendMessageSchema>
export type CreateCharacterInput = z.infer<typeof createCharacterSchema>