import { useEffect, useState } from 'react'
import { Outlet, Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { MobileNav } from './MobileNav'
import { NotificationCenter } from '@/components/notifications/NotificationCenter'
import { Loader2 } from 'lucide-react'

export function AppLayout() {
  const { user, loading, initialized, checkAuth } = useAuthStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notificationCenterOpen, setNotificationCenterOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    if (!initialized) {
      checkAuth()
    }
  }, [checkAuth, initialized])

  useEffect(() => {
    // Fechar sidebar mobile ao mudar de rota
    setSidebarOpen(false)
  }, [location])

  // Show loading only if not initialized yet
  if (!initialized || loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  // Only redirect to login if we're initialized and there's no user
  if (initialized && !user) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="flex h-screen w-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* Sidebar Desktop */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <Sidebar />
      </div>

      {/* Main Content */}
      <div className="flex flex-1 flex-col w-full h-full">
        <Header 
          onMenuClick={() => setSidebarOpen(true)} 
          onNotificationCenterOpen={() => setNotificationCenterOpen(true)}
        />
        
        <main className="flex-1 w-full h-full overflow-y-auto bg-gray-50 dark:bg-gray-900">
          <div className="w-full h-full px-4 sm:px-6 lg:px-8 py-6 max-w-full overflow-x-hidden">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile Navigation */}
      <MobileNav open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* Notification Center */}
      <NotificationCenter 
        open={notificationCenterOpen} 
        onOpenChange={setNotificationCenterOpen} 
      />
    </div>
  )
}
