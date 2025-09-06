import { useEffect, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { CacheManager } from '@/utils/cacheManager'

export function usePerformanceOptimization() {
  const queryClient = useQueryClient()

  // Clean up memory and cache periodically
  const performCleanup = useCallback(() => {
    // Clean old cache entries
    CacheManager.cleanupOldCache()
    
    // Optimize memory usage
    CacheManager.optimizeMemoryUsage()
    
    // Force garbage collection if available
    if ('gc' in window && typeof window.gc === 'function') {
      window.gc()
    }
  }, [])

  // Set up performance monitoring and cleanup
  useEffect(() => {
    // Initial cleanup after component mount
    const initialCleanupTimer = setTimeout(performCleanup, 5000)

    // Set up periodic cleanup every 10 minutes
    const cleanupInterval = setInterval(performCleanup, 10 * 60 * 1000)

    // Clean up on page visibility change (when user returns to tab)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // User returned to tab, clean up stale data
        setTimeout(performCleanup, 1000)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    // Memory pressure handling (simplified)
    const handleBeforeUnload = () => {
      performCleanup()
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      clearTimeout(initialCleanupTimer)
      clearInterval(cleanupInterval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [performCleanup, queryClient])

  return {
    performCleanup
  }
}
