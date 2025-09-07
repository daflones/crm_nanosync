import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Package,
  Calendar,
  FileText,
  FolderOpen,
  Settings,
  Layers,
  Tags,
  LogOut,
  Activity,
  Bot,
  MessageCircle
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'

const menuItems = [
  { 
    label: 'Dashboard', 
    icon: LayoutDashboard, 
    href: '/dashboard',
    color: 'text-blue-600'
  },
  { 
    label: 'Clientes', 
    icon: Users, 
    href: '/clientes',
    color: 'text-green-600'
  },
  { 
    label: 'Vendedores', 
    icon: UserCheck, 
    href: '/vendedores',
    color: 'text-purple-600',
    adminOnly: true
  },
  { 
    label: 'Produtos', 
    icon: Package, 
    href: '/produtos',
    color: 'text-orange-600'
  },
  { 
    label: 'Categorias', 
    icon: Tags, 
    href: '/categorias',
    color: 'text-pink-600'
  },
  { 
    label: 'Segmentos', 
    icon: Layers, 
    href: '/segmentos',
    color: 'text-indigo-600'
  },
  { 
    label: 'Agendamentos', 
    icon: Calendar, 
    href: '/agendamentos',
    color: 'text-cyan-600'
  },
  { 
    label: 'Propostas', 
    icon: FileText, 
    href: '/propostas',
    color: 'text-amber-600'
  },
  { 
    label: 'Arquivos', 
    icon: FolderOpen, 
    href: '/arquivos',
    color: 'text-teal-600'
  },
  { 
    label: 'Arquivos IA', 
    icon: FolderOpen, 
    href: '/arquivos-ia',
    color: 'text-violet-600'
  },
  // { 
  //   label: 'Relatórios', 
  //   icon: BarChart3, 
  //   href: '/relatorios',
  //   color: 'text-red-600'
  // },
  { 
    label: 'Resumo de Atividades', 
    icon: Activity, 
    href: '/atividades',
    color: 'text-emerald-600'
  },
  { 
    label: 'Configurações', 
    icon: Settings, 
    href: '/configuracoes',
    color: 'text-gray-600',
    adminOnly: true
  },
  { 
    label: 'Configurações IA', 
    icon: Bot, 
    href: '/configuracoes-ia',
    color: 'text-purple-600',
    adminOnly: true
  },
  { 
    label: 'WhatsApp', 
    icon: MessageCircle, 
    href: '/whatsapp',
    color: 'text-green-600',
    adminOnly: true
  },
]

export function Sidebar() {
  const location = useLocation()
  const { user, signOut } = useAuthStore()
  const isAdmin = user?.role === 'admin'

  const filteredMenuItems = menuItems.filter(item => 
    !item.adminOnly || (item.adminOnly && isAdmin)
  )

  return (
    <div className="flex h-full w-64 flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shadow-lg">
      {/* Logo */}
      <div className="flex h-20 items-center justify-center border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-indigo-600 to-purple-600">
        <Link to="/app/dashboard" className="flex items-center justify-center px-4 w-full h-full">
          <img 
            src="/LogoNanoSyncBranca.png" 
            alt="NanoSync CRM Logo" 
            className="h-[65%] w-auto object-contain"
          />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2 px-4 py-6 overflow-y-auto">
        {filteredMenuItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === `/app${item.href}` || location.pathname.startsWith(`/app${item.href}/`)
          
          return (
            <Link
              key={item.href}
              to={`/app${item.href}`}
              className={cn(
                'flex items-center space-x-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 group',
                isActive
                  ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/25'
                  : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 hover:shadow-md'
              )}
            >
              <Icon className={cn(
                'h-5 w-5 transition-transform group-hover:scale-110', 
                isActive ? 'text-white' : item.color
              )} />
              <span className="font-medium">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* User Section */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800/50">
        <div className="flex items-center space-x-3 mb-4">
          <div className="h-12 w-12 rounded-full bg-gradient-to-r from-primary-600 to-primary-700 flex items-center justify-center text-white font-bold text-lg shadow-lg">
            {user?.full_name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
              {user?.full_name}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {user?.cargo ? `${user.cargo} • ${user?.role === 'admin' ? 'Administrador' : 'Vendedor'}` : (user?.role === 'admin' ? 'Administrador' : 'Vendedor')}
            </p>
            <div className="flex items-center mt-1">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              <span className="text-xs text-green-600 dark:text-green-400">Online</span>
            </div>
          </div>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          className="w-full hover:bg-red-50 hover:border-red-200 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:border-red-800 dark:hover:text-red-400 transition-colors"
          onClick={() => signOut()}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sair
        </Button>
      </div>
    </div>
  )
}
