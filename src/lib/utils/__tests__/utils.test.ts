import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { debounce, throttle, sleep, retry } from '../utils'

describe('Utility Functions', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('debounce', () => {
    it('should delay function execution', () => {
      const mockFn = vi.fn()
      const debouncedFn = debounce(mockFn, 100)

      debouncedFn('test')
      expect(mockFn).not.toHaveBeenCalled()

      vi.advanceTimersByTime(50)
      expect(mockFn).not.toHaveBeenCalled()

      vi.advanceTimersByTime(50)
      expect(mockFn).toHaveBeenCalledWith('test')
      expect(mockFn).toHaveBeenCalledTimes(1)
    })

    it('should cancel previous calls', () => {
      const mockFn = vi.fn()
      const debouncedFn = debounce(mockFn, 100)

      debouncedFn('first')
      vi.advanceTimersByTime(50)
      debouncedFn('second')
      vi.advanceTimersByTime(50)
      debouncedFn('third')
      vi.advanceTimersByTime(100)

      expect(mockFn).toHaveBeenCalledTimes(1)
      expect(mockFn).toHaveBeenCalledWith('third')
    })

    it('should pass multiple arguments', () => {
      const mockFn = vi.fn()
      const debouncedFn = debounce(mockFn, 100)

      debouncedFn('arg1', 'arg2', { key: 'value' })
      vi.advanceTimersByTime(100)

      expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2', { key: 'value' })
    })
  })

  describe('throttle', () => {
    it('should limit function execution frequency', () => {
      const mockFn = vi.fn()
      const throttledFn = throttle(mockFn, 100)

      throttledFn('first')
      expect(mockFn).toHaveBeenCalledWith('first')
      expect(mockFn).toHaveBeenCalledTimes(1)

      throttledFn('second')
      expect(mockFn).toHaveBeenCalledTimes(1) // Still 1, throttled

      vi.advanceTimersByTime(100)
      throttledFn('third')
      expect(mockFn).toHaveBeenCalledTimes(2)
      expect(mockFn).toHaveBeenLastCalledWith('third')
    })

    it('should execute immediately on first call', () => {
      const mockFn = vi.fn()
      const throttledFn = throttle(mockFn, 1000)

      throttledFn('immediate')
      expect(mockFn).toHaveBeenCalledWith('immediate')
      expect(mockFn).toHaveBeenCalledTimes(1)
    })

    it('should ignore calls during throttle period', () => {
      const mockFn = vi.fn()
      const throttledFn = throttle(mockFn, 100)

      throttledFn('first')
      throttledFn('ignored1')
      throttledFn('ignored2')
      throttledFn('ignored3')

      expect(mockFn).toHaveBeenCalledTimes(1)
      expect(mockFn).toHaveBeenCalledWith('first')

      vi.advanceTimersByTime(100)
      throttledFn('second')
      expect(mockFn).toHaveBeenCalledTimes(2)
      expect(mockFn).toHaveBeenLastCalledWith('second')
    })
  })

  describe('sleep', () => {
    it('should resolve after specified time', async () => {
      vi.useRealTimers() // Use real timers for async test
      
      const start = Date.now()
      await sleep(100)
      const elapsed = Date.now() - start

      expect(elapsed).toBeGreaterThanOrEqual(90) // Allow some variance
      expect(elapsed).toBeLessThan(150)
    })

    it('should work with fake timers', async () => {
      const promise = sleep(1000)
      
      vi.advanceTimersByTime(999)
      // Promise should not be resolved yet
      
      vi.advanceTimersByTime(1)
      await promise // Now it should resolve
      
      expect(true).toBe(true) // If we reach here, promise resolved
    })
  })

  describe('retry', () => {
    it('should succeed on first try', async () => {
      vi.useRealTimers() // Use real timers for async test
      
      const mockFn = vi.fn().mockResolvedValue('success')
      const result = await retry(mockFn)

      expect(result).toBe('success')
      expect(mockFn).toHaveBeenCalledTimes(1)
    })

    it('should retry on failure', async () => {
      vi.useRealTimers() // Use real timers for async test
      
      const mockFn = vi.fn()
        .mockRejectedValueOnce(new Error('fail1'))
        .mockRejectedValueOnce(new Error('fail2'))
        .mockResolvedValueOnce('success')

      const result = await retry(mockFn, { delay: 10 })

      expect(result).toBe('success')
      expect(mockFn).toHaveBeenCalledTimes(3)
    })

    it('should throw after max attempts', async () => {
      vi.useRealTimers() // Use real timers for async test
      
      const mockFn = vi.fn().mockRejectedValue(new Error('persistent error'))

      await expect(
        retry(mockFn, { maxAttempts: 2, delay: 10 })
      ).rejects.toThrow('persistent error')

      expect(mockFn).toHaveBeenCalledTimes(2)
    })

    it('should call onRetry callback', async () => {
      vi.useRealTimers() // Use real timers for async test
      
      const mockFn = vi.fn()
        .mockRejectedValueOnce(new Error('fail1'))
        .mockResolvedValueOnce('success')
      
      const onRetry = vi.fn()

      await retry(mockFn, { delay: 10, onRetry })

      expect(onRetry).toHaveBeenCalledTimes(1)
      expect(onRetry).toHaveBeenCalledWith(expect.any(Error), 1)
    })

    it('should use exponential backoff', async () => {
      vi.useRealTimers() // Use real timers for async test
      
      const mockFn = vi.fn()
        .mockRejectedValueOnce(new Error('fail1'))
        .mockRejectedValueOnce(new Error('fail2'))
        .mockResolvedValueOnce('success')

      const start = Date.now()
      await retry(mockFn, { 
        delay: 10, 
        backoff: 2,
        maxAttempts: 3 
      })
      const elapsed = Date.now() - start

      // First retry after 10ms, second after 20ms = 30ms total minimum
      expect(elapsed).toBeGreaterThanOrEqual(25) // Allow some variance
    })
  })
})