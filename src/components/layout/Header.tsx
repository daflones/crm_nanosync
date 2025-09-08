import { Button } from '@/components/ui/button'
import {
  Menu,
  Sun,
  Moon,
  User,
  CreditCard
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { NotificationButton } from '@/components/notifications/NotificationButton'
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus'
import { useCurrentUser } from '@/hooks/useCurrentUser'

interface HeaderProps {
  onMenuClick: () => void
  onNotificationCenterOpen?: () => void
}

export function Header({ onMenuClick, onNotificationCenterOpen }: HeaderProps) {
  const [isDark, setIsDark] = useState(false)
  const navigate = useNavigate()
  const { data: user } = useCurrentUser()
  const { isActive, status, daysRemaining } = useSubscriptionStatus()

  useEffect(() => {
    const isDarkMode = document.documentElement.classList.contains('dark')
    setIsDark(isDarkMode)
  }, [])

  const toggleTheme = () => {
    const newTheme = !isDark
    setIsDark(newTheme)
    
    if (newTheme) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }

  // Determinar se deve mostrar botão de assinatura
  const shouldShowSubscriptionButton = () => {
    if (!user) return false
    
    // Mostrar se nunca assinou (status inactive) ou se expirou
    return status === 'inactive' || status === 'expired' || (!isActive && daysRemaining !== null && daysRemaining < 0)
  }

  // Determinar texto do botão
  const getSubscriptionButtonText = () => {
    if (status === 'expired' || (!isActive && daysRemaining !== null && daysRemaining < 0)) {
      return 'Renovar'
    }
    return 'Assinar'
  }

  // Determinar para onde navegar
  const handleSubscriptionClick = () => {
    // Se é renovação (já teve assinatura), vai direto para planos
    if (status === 'expired' || (!isActive && daysRemaining !== null && daysRemaining < 0)) {
      navigate('/planos')
    } else {
      // Se nunca assinou, vai para página de planos para ver primeiro
      navigate('/planos')
    }
  }

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 lg:px-6 xl:px-8 2xl:px-12 w-full">
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onMenuClick}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Spacer */}
      <div className="flex-1"></div>

      {/* Actions */}
      <div className="flex items-center space-x-2">
        {/* Subscription Button - Only on mobile when needed */}
        {shouldShowSubscriptionButton() && (
          <Button
            onClick={handleSubscriptionClick}
            size="sm"
            className="lg:hidden bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 text-xs"
          >
            <CreditCard className="h-3 w-3 mr-1" />
            {getSubscriptionButtonText()}
          </Button>
        )}

        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="relative"
        >
          {isDark ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </Button>

        {/* Notifications */}
        <NotificationButton onOpenCenter={onNotificationCenterOpen} />

        {/* Profile */}
        <Link to="/app/configuracoes">
          <Button
            variant="ghost"
            size="icon"
          >
            <User className="h-5 w-5" />
          </Button>
        </Link>
      </div>
    </header>
  )
}
