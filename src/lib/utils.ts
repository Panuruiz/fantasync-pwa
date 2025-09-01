import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import React from "react"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Debounce function - delays the execution of a function until after wait milliseconds
 * have elapsed since the last time the debounced function was invoked
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null
      func(...args)
    }
    
    if (timeout) {
      clearTimeout(timeout)
    }
    
    timeout = setTimeout(later, wait)
  }
}

/**
 * Throttle function - ensures a function is only called at most once every specified milliseconds
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => {
        inThrottle = false
      }, limit)
    }
  }
}

/**
 * Sleep function - returns a promise that resolves after the specified milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Retry function - retries a function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: {
    maxAttempts?: number
    delay?: number
    backoff?: number
    onRetry?: (error: Error, attempt: number) => void
  } = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    delay = 1000,
    backoff = 2,
    onRetry
  } = options
  
  let lastError: Error
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error
      
      if (attempt === maxAttempts) {
        throw lastError
      }
      
      if (onRetry) {
        onRetry(lastError, attempt)
      }
      
      const waitTime = delay * Math.pow(backoff, attempt - 1)
      await sleep(waitTime)
    }
  }
  
  throw lastError!
}

/**
 * Memoize function - caches the results of function calls based on arguments
 * Useful for expensive calculations that are called repeatedly with the same inputs
 */
export function memoize<TArgs extends any[], TResult>(
  fn: (...args: TArgs) => TResult,
  options: {
    maxSize?: number
    keyFn?: (...args: TArgs) => string
    ttl?: number // Time to live in milliseconds
  } = {}
): (...args: TArgs) => TResult {
  const { maxSize = 100, keyFn = JSON.stringify, ttl } = options
  const cache = new Map<string, { value: TResult; timestamp?: number }>()
  
  return function memoized(...args: TArgs): TResult {
    const key = keyFn(...args)
    
    if (cache.has(key)) {
      const cached = cache.get(key)!
      
      // Check if TTL has expired
      if (ttl && cached.timestamp) {
        const elapsed = Date.now() - cached.timestamp
        if (elapsed > ttl) {
          cache.delete(key)
        } else {
          return cached.value
        }
      } else {
        return cached.value
      }
    }
    
    const result = fn(...args)
    
    // Implement LRU cache eviction
    if (cache.size >= maxSize) {
      const firstKey = cache.keys().next().value
      cache.delete(firstKey)
    }
    
    cache.set(key, {
      value: result,
      timestamp: ttl ? Date.now() : undefined
    })
    
    return result
  }
}

/**
 * Create a lazy-loaded component wrapper for Next.js dynamic imports
 */
export function lazyLoad<T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallback?: React.ReactNode
) {
  const LazyComponent = React.lazy(importFn)
  
  return (props: React.ComponentProps<T>) => 
    React.createElement(
      React.Suspense, 
      { fallback: fallback || React.createElement('div', null, 'Loading...') },
      React.createElement(LazyComponent, props)
    )
}