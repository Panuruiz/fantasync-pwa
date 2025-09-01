import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  isDevelopment,
  isRLSBypassEnabled,
  toggleRLSBypass,
  analyzeRLSError,
  withRLSErrorHandling,
} from '../rls-helper'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value },
    clear: () => { store = {} },
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

// Mock window.location.reload
Object.defineProperty(window, 'location', {
  value: {
    reload: vi.fn(),
    href: '',
  },
  writable: true,
})

describe('RLS Helper', () => {
  beforeEach(() => {
    localStorageMock.clear()
    vi.clearAllMocks()
  })

  describe('isDevelopment', () => {
    it('should return true when NODE_ENV is development', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'
      expect(isDevelopment()).toBe(true)
      process.env.NODE_ENV = originalEnv
    })

    it('should return false when NODE_ENV is production', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'
      expect(isDevelopment()).toBe(false)
      process.env.NODE_ENV = originalEnv
    })
  })

  describe('isRLSBypassEnabled', () => {
    it('should return false in production', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'
      localStorageMock.setItem('rls_bypass_enabled', 'true')
      expect(isRLSBypassEnabled()).toBe(false)
      process.env.NODE_ENV = originalEnv
    })

    it('should return true when enabled in development', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'
      localStorageMock.setItem('rls_bypass_enabled', 'true')
      expect(isRLSBypassEnabled()).toBe(true)
      process.env.NODE_ENV = originalEnv
    })

    it('should return false when disabled in development', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'
      localStorageMock.setItem('rls_bypass_enabled', 'false')
      expect(isRLSBypassEnabled()).toBe(false)
      process.env.NODE_ENV = originalEnv
    })
  })

  describe('toggleRLSBypass', () => {
    it('should not toggle in production', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'
      const result = toggleRLSBypass(true)
      expect(result).toBe(false)
      expect(localStorageMock.getItem('rls_bypass_enabled')).toBeNull()
      process.env.NODE_ENV = originalEnv
    })

    it('should toggle in development', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'
      const result = toggleRLSBypass(true)
      expect(result).toBe(true)
      expect(localStorageMock.getItem('rls_bypass_enabled')).toBe('true')
      expect(window.location.reload).toHaveBeenCalled()
      process.env.NODE_ENV = originalEnv
    })
  })

  describe('analyzeRLSError', () => {
    it('should identify RLS errors by code', () => {
      const error = { code: '42501', message: 'insufficient privilege' }
      const result = analyzeRLSError(error)
      
      expect(result.isRLSError).toBe(true)
      expect(result.message).toContain('permission')
      expect(result.actions.length).toBeGreaterThan(0)
    })

    it('should identify RLS errors by message', () => {
      const error = { message: 'violates row-level security policy' }
      const result = analyzeRLSError(error)
      
      expect(result.isRLSError).toBe(true)
      expect(result.actions.length).toBeGreaterThan(0)
    })

    it('should not identify non-RLS errors', () => {
      const error = { code: '500', message: 'Internal server error' }
      const result = analyzeRLSError(error)
      
      expect(result.isRLSError).toBe(false)
    })

    it('should provide development-specific actions', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'
      
      const error = { code: '42501' }
      const result = analyzeRLSError(error)
      
      expect(result.requiresPolicyApplication).toBe(true)
      expect(result.actions.some(a => a.label.includes('Apply RLS'))).toBe(true)
      
      process.env.NODE_ENV = originalEnv
    })
  })

  describe('withRLSErrorHandling', () => {
    it('should pass through successful calls', async () => {
      const mockData = { id: 1, name: 'Test' }
      const apiCall = vi.fn().mockResolvedValue(mockData)
      
      const result = await withRLSErrorHandling(apiCall)
      
      expect(result).toEqual(mockData)
      expect(apiCall).toHaveBeenCalled()
    })

    it('should handle RLS errors', async () => {
      const rlsError = { code: '42501', message: 'permission denied' }
      const apiCall = vi.fn().mockRejectedValue(rlsError)
      const onError = vi.fn()
      
      await expect(
        withRLSErrorHandling(apiCall, {
          context: 'test operation',
          onError,
        })
      ).rejects.toThrow()
      
      expect(onError).toHaveBeenCalled()
      const errorInfo = onError.mock.calls[0][0]
      expect(errorInfo.isRLSError).toBe(true)
    })

    it('should re-throw non-RLS errors', async () => {
      const normalError = new Error('Network error')
      const apiCall = vi.fn().mockRejectedValue(normalError)
      const onError = vi.fn()
      
      await expect(
        withRLSErrorHandling(apiCall, {
          onError,
        })
      ).rejects.toThrow('Network error')
      
      expect(onError).not.toHaveBeenCalled()
    })

    it('should log warnings in bypass mode', async () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'
      localStorageMock.setItem('rls_bypass_enabled', 'true')
      
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const apiCall = vi.fn().mockResolvedValue({ success: true })
      
      await withRLSErrorHandling(apiCall, {
        bypassInDev: true,
      })
      
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('RLS Bypass Mode Active')
      )
      
      consoleWarnSpy.mockRestore()
      process.env.NODE_ENV = originalEnv
    })
  })
})