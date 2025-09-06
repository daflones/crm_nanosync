import { QueryClient } from '@tanstack/react-query'

export class CacheManager {
  private static queryClient: QueryClient | null = null

  static setQueryClient(client: QueryClient) {
    this.queryClient = client
  }

  // Clear all React Query cache
  static clearAllCache() {
    if (this.queryClient) {
      this.queryClient.clear()
    }
  }

  // Clear specific query cache
  static clearQueryCache(queryKey: string[]) {
    if (this.queryClient) {
      this.queryClient.removeQueries({ queryKey })
    }
  }

  // Invalidate and refetch specific queries
  static async invalidateQueries(queryKey: string[]) {
    if (this.queryClient) {
      await this.queryClient.invalidateQueries({ queryKey })
    }
  }

  // Force refetch specific queries
  static async refetchQueries(queryKey: string[]) {
    if (this.queryClient) {
      await this.queryClient.refetchQueries({ queryKey })
    }
  }

  // Clear browser storage
  static clearBrowserStorage() {
    localStorage.clear()
    sessionStorage.clear()
    
    // Clear IndexedDB if available
    if ('indexedDB' in window) {
      indexedDB.databases?.().then(databases => {
        databases.forEach(db => {
          if (db.name) {
            indexedDB.deleteDatabase(db.name)
          }
        })
      }).catch(console.warn)
    }
  }

  // Clear browser cache
  static async clearBrowserCache() {
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys()
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        )
      } catch (error) {
        console.warn('Failed to clear browser cache:', error)
      }
    }
  }

  // Complete cache cleanup (for logout)
  static async clearAllData() {
    // Clear React Query cache
    this.clearAllCache()
    
    // Clear browser storage
    this.clearBrowserStorage()
    
    // Clear browser cache
    await this.clearBrowserCache()
  }

  // Performance optimization: Clean old cache entries
  static cleanupOldCache() {
    if (this.queryClient) {
      // Remove queries that haven't been used in the last 30 minutes
      const thirtyMinutesAgo = Date.now() - (30 * 60 * 1000)
      
      this.queryClient.getQueryCache().getAll().forEach(query => {
        if (query.state.dataUpdatedAt < thirtyMinutesAgo && !query.getObserversCount()) {
          this.queryClient?.removeQueries({ queryKey: query.queryKey })
        }
      })
    }
  }

  // Auto-refresh critical data after CRUD operations
  static async refreshCriticalData() {
    if (!this.queryClient) return

    const criticalQueries = [
      ['auth', 'profile'],
      ['dashboard'],
      ['clientes'],
      ['produtos'],
      ['vendedores'],
      ['propostas'],
      ['agendamentos']
    ]

    await Promise.all(
      criticalQueries.map(queryKey => 
        this.invalidateQueries(queryKey).catch(console.warn)
      )
    )
  }

  // Memory optimization: Limit cache size
  static optimizeMemoryUsage() {
    if (!this.queryClient) return

    const cache = this.queryClient.getQueryCache()
    const queries = cache.getAll()

    // If we have too many cached queries, remove the oldest ones
    if (queries.length > 100) {
      const sortedQueries = queries
        .sort((a, b) => a.state.dataUpdatedAt - b.state.dataUpdatedAt)
        .slice(0, queries.length - 50) // Keep only 50 most recent

      sortedQueries.forEach(query => {
        if (!query.getObserversCount()) {
          cache.remove(query)
        }
      })
    }
  }
}

// Auto cleanup every 15 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    CacheManager.cleanupOldCache()
    CacheManager.optimizeMemoryUsage()
  }, 15 * 60 * 1000)
}
