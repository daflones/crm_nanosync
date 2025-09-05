import { useEffect } from 'react'
import { RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { router } from './router'
import { NotificationProvider } from './contexts/NotificationContext'
import './styles/globals.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos
      gcTime: 10 * 60 * 1000, // 10 minutos
    },
  },
})

function App() {
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
