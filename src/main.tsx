import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import './index.css'
import App from './App.tsx'
import { CacheManager } from './utils/cacheManager'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Disable refetch on window focus to prevent tab switching issues
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      // Keep data briefly fresh to avoid thrashing but revalidate quickly
      staleTime: 30 * 1000,
      retry: 1,
    },
  },
})

// Expose queryClient to CacheManager utilities
CacheManager.setQueryClient(queryClient)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </StrictMode>,
)
