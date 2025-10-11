import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import { CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { NotificacaoService, type Notificacao } from '@/services/api/notificacoes'

interface Notification {
  id: string
  title: string
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
  read: boolean
  created_at: string
  action_url?: string
}

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  addNotification: (notification: Omit<Notification, 'id' | 'created_at' | 'read'>) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  clearNotifications: () => void
  playSound: (type: 'success' | 'error' | 'warning' | 'info') => void
  // Novas funcionalidades para notificações do banco
  createDatabaseNotification: (notificacao: Omit<Notificacao, 'id' | 'user_id' | 'created_at' | 'lida' | 'expires_at'>) => Promise<void>
  isRealTimeConnected: boolean
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}

interface NotificationProviderProps {
  children: ReactNode
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [sounds, setSounds] = useState<Record<string, HTMLAudioElement>>({})
  const [isRealTimeConnected, setIsRealTimeConnected] = useState(false)
  const { user } = useAuthStore()

  useEffect(() => {
    // Criar objetos de áudio para os sons
    const audioFiles = {
      success: '/sounds/success.mp3',
      error: '/sounds/error.mp3',
      warning: '/sounds/warning.mp3',
      info: '/sounds/info.mp3',
    }

    const loadedSounds: Record<string, HTMLAudioElement> = {}
    Object.entries(audioFiles).forEach(([key, path]) => {
      const audio = new Audio(path)
      audio.volume = 0.5
      loadedSounds[key] = audio
    })
    setSounds(loadedSounds)

    // Configurar listener para notificações em tempo real do Supabase
    if (user?.id) {
      const channel = supabase
        .channel('notificacoes-realtime')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'notificacoes',
          filter: `user_id=eq.${user.id}`
        }, (payload: any) => {
          const notificacao = payload.new as Notificacao
          const toastType = NotificacaoService.getToastType(notificacao.tipo)
          
          // Adicionar à lista local também
          addNotification({
            title: notificacao.titulo,
            message: notificacao.descricao || '',
            type: toastType,
          })
        })
        .subscribe((status: any) => {
          setIsRealTimeConnected(status === 'SUBSCRIBED')
        })

      return () => {
        supabase.removeChannel(channel)
        setIsRealTimeConnected(false)
      }
    }
  }, [])

  const addNotification = (notification: Omit<Notification, 'id' | 'created_at' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Math.random().toString(36).substring(7),
      created_at: new Date().toISOString(),
      read: false,
    }

    setNotifications(prev => [newNotification, ...prev])
    
    // Mostrar toast com ícone apropriado
    const icons = {
      success: <CheckCircle className="h-5 w-5" />,
      error: <XCircle className="h-5 w-5" />,
      warning: <AlertCircle className="h-5 w-5" />,
      info: <Info className="h-5 w-5" />,
    }

    toast[notification.type](notification.message, {
      description: notification.title,
      icon: icons[notification.type],
      action: notification.action_url ? {
        label: 'Ver',
        onClick: () => window.location.href = notification.action_url!
      } : undefined
    })

    // Tocar som
    playSound(notification.type)
  }

  const playSound = (type: 'success' | 'error' | 'warning' | 'info') => {
    if (sounds[type]) {
      sounds[type].play().catch(() => {})
    }
  }

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    )
  }

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(n => ({ ...n, read: true }))
    )
  }

  const clearNotifications = () => {
    setNotifications([])
  }

  const createDatabaseNotification = async (notificacao: Omit<Notificacao, 'id' | 'user_id' | 'created_at' | 'lida' | 'expires_at'>) => {
    if (!user?.id) return
    
    try {
      await NotificacaoService.criarNotificacao({
        ...notificacao,
        user_id: user.id
      })
    } catch (error) {
      console.error('Erro ao criar notificação no banco:', error)
    }
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      addNotification,
      markAsRead,
      markAllAsRead,
      clearNotifications,
      playSound,
      createDatabaseNotification,
      isRealTimeConnected
    }}>
      {children}
    </NotificationContext.Provider>
  )
}
