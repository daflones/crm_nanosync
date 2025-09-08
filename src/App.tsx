import React, { useEffect, useRef } from 'react'
import { RouterProvider } from 'react-router-dom'
import { Toaster } from 'sonner'
import { router } from './router'
import { NotificationProvider } from './contexts/NotificationContext'
import { usePerformanceOptimization } from './hooks/usePerformanceOptimization'
import { useAuthStore } from '@/stores/authStore'
import { PWAInstallPrompt } from './components/PWAInstallPrompt'
import './styles/globals.css'

// Global flag to prevent double initialization in React StrictMode
let hasGlobalInitialized = false

// Loading component
function LoadingScreen() {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      backgroundColor: 'var(--background)'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: '50px',
          height: '50px',
          border: '3px solid #e0e0e0',
          borderTop: '3px solid #333',
          borderRadius: '50%',
          margin: '0 auto 20px',
          animation: 'spin 1s linear infinite'
        }} />
        <p style={{ color: '#666' }}>Carregando...</p>
      </div>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

// App content that renders after auth initialization
function AppContent() {
  const { loading, initialized } = useAuthStore()
  const [showTimeout, setShowTimeout] = React.useState(false)
  
  // Initialize performance optimization only after auth is ready
  usePerformanceOptimization()

  // Timeout para evitar loading infinito (baseado no exemplo)
  React.useEffect(() => {
    if (loading && !initialized) {
      const timer = setTimeout(() => {
        console.error('[App] Timeout no carregamento inicial')
        setShowTimeout(true)
      }, 5000) // 5 segundos

      return () => clearTimeout(timer)
    } else {
      setShowTimeout(false)
    }
  }, [loading, initialized])

  
  // Show loading screen only if not initialized yet
  if (!initialized) {
    return <LoadingScreen />
  }
  
  // If initialized but still loading, show timeout logic
  if (loading && !showTimeout) {
    return <LoadingScreen />
  }

  // Se houve timeout, força recarregamento uma vez
  if (showTimeout) {
    if (!sessionStorage.getItem('auth_reload_attempted')) {
      sessionStorage.setItem('auth_reload_attempted', 'true')
      window.location.reload()
      return <LoadingScreen />
    } else {
      // Se já tentou recarregar, continua sem auth
      console.warn('[App] Auth timeout após reload, continuando sem autenticação')
    }
  }

  return <RouterProvider router={router} />
}

function App() {
  const hasInitializedRef = useRef(false)

  useEffect(() => {
    // Apply saved theme
    const theme = localStorage.getItem('theme') || 'light'
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    }
    
    // Clear auth reload flag on fresh page load
    sessionStorage.removeItem('auth_reload_attempted')
    hasGlobalInitialized = false
    
    // Force reset authStore state to ensure clean initialization
    const authStore = useAuthStore.getState()
    if (authStore.initialized && authStore.loading) {
      useAuthStore.setState({ initialized: false, loading: true })
    }
    
    // Prevent double initialization in React StrictMode
    if (hasInitializedRef.current || hasGlobalInitialized) {
      return
    }
    
    hasInitializedRef.current = true
    hasGlobalInitialized = true
    
    // Initialize auth immediately without blocking
    useAuthStore.getState().initializeAuth().catch((error) => {
      console.error('[App] Auth initialization failed:', error)
      // Reset flags on error to allow retry
      hasInitializedRef.current = false
      hasGlobalInitialized = false
    })
  }, [])

  return (
    <NotificationProvider>
      <AppContent />
      <PWAInstallPrompt />
      <Toaster 
        position="top-right"
        richColors
        closeButton
        duration={4000}
      />
    </NotificationProvider>
  )
}

export default App
