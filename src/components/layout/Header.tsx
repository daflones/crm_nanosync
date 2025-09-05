import { Button } from '@/components/ui/button'
import {
  Menu,
  Sun,
  Moon,
  User
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { NotificationButton } from '@/components/notifications/NotificationButton'

interface HeaderProps {
  onMenuClick: () => void
  onNotificationCenterOpen?: () => void
}

export function Header({ onMenuClick, onNotificationCenterOpen }: HeaderProps) {
  const [isDark, setIsDark] = useState(false)

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
        <Link to="/perfil">
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
