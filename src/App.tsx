import { useEffect } from 'react'
import { RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { router } from './router'
import { NotificationProvider } from './contexts/NotificationContext'
import { CacheManager } from './utils/cacheManager'
import { usePerformanceOptimization } from './hooks/usePerformanceOptimization'
import './styles/globals.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000, // 2 minutos (reduzido para melhor performance)
      gcTime: 5 * 60 * 1000, // 5 minutos (reduzido para economizar memória)
      retry: 2, // Reduzir tentativas para falhas mais rápidas
      refetchOnWindowFocus: false, // Evitar refetch desnecessário
      refetchOnReconnect: true, // Manter refetch na reconexão
    },
    mutations: {
      retry: 1, // Reduzir tentativas para mutations
    },
  },
})

// Initialize cache manager
CacheManager.setQueryClient(queryClient)

function App() {
  // Initialize performance optimization
  usePerformanceOptimization()

  useEffect(() => {
    // Aplicar tema salvo
    const theme = localStorage.getItem('theme') || 'light'
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    }
    
    // Initialize auth check on app load
    import('@/stores/authStore').then(({ useAuthStore }) => {
      useAuthStore.getState().checkAuth()
    })
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <NotificationProvider>
        <RouterProvider router={router} />
        <Toaster 
          position="top-right"
          richColors
          closeButton
          duration={4000}
        />
      </NotificationProvider>
    </QueryClientProvider>
  )
}

export default App
