import { Link, useLocation, useNavigate } from 'react-router-dom'
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
  MessageCircle,
  CreditCard,
  Target,
  QrCode,
  Building2
} from 'lucide-react'

interface MenuItem {
  label: string
  icon: any
  href: string
  color: string
  adminOnly?: boolean
  subItems?: MenuItem[]
}
import { useAuthStore } from '@/stores/authStore'
import { usePlanoAtivo } from '@/hooks/usePlanoAtivo'
import { useIAConfig } from '@/hooks/useIAConfig'
import { SubscriptionStatusBanner } from '@/components/SubscriptionNotifications'
import { Button } from '@/components/ui/button'

const menuItems: MenuItem[] = [
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
    label: 'Setores de Atendimento', 
    icon: Building2, 
    href: '/setores-atendimento',
    color: 'text-blue-600',
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
  { 
    label: 'Prospecção', 
    icon: Target, 
    href: '/prospeccao',
    color: 'text-red-600',
    subItems: [
      {
        label: 'Clientes de Prospecção',
        icon: Users,
        href: '/clientes-prospeccao',
        color: 'text-red-500'
      }
    ]
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
    label: 'Instancia IA', 
    icon: QrCode, 
    href: '/whatsapp',
    color: 'text-green-600',
    adminOnly: true
  },
  { 
    label: 'WhatsApp Web', 
    icon: MessageCircle, 
    href: '/whatsapp-web',
    color: 'text-green-700',
    adminOnly: true
  },
  { 
    label: 'Planos', 
    icon: CreditCard, 
    href: '/planos',
    color: 'text-yellow-600'
  },
]

export function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, signOut } = useAuthStore()
  const { planoAtivo } = usePlanoAtivo()
  const { data: iaConfigData } = useIAConfig()

  const handleDashboardClick = (e: React.MouseEvent) => {
    e.preventDefault()
    navigate('/app/dashboard')
  }

  const isAdmin = user?.role === 'admin'

  const filteredMenuItems = menuItems.filter(item => {
    if (item.adminOnly && !isAdmin) return false
    
    // Ocultar página Planos para vendedores (só admins podem ver)
    if (item.href === '/planos' && user?.role === 'vendedor') return false
    
    // Ocultar página Planos se o usuário já tem plano ativo
    if (item.href === '/planos' && planoAtivo) return false
    
    // Ocultar Arquivos IA se envia_documento não for explicitamente true
    if (item.href === '/arquivos-ia' && iaConfigData?.envia_documento !== true) return false
    
    // Ocultar WhatsApp se não tiver plano ativo
    if (item.href === '/whatsapp' && !planoAtivo) return false
    
    // Ocultar WhatsApp Web da sidebar (funcionalidade existe mas aba fica oculta)
    if (item.href === '/whatsapp-web') return false
    
    return true
  })

  return (
    <div className="flex h-full w-64 flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shadow-lg">
      {/* Logo */}
      <div className="flex h-20 items-center justify-center border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-indigo-600 to-purple-600">
        <a 
          href="/app/dashboard" 
          onClick={handleDashboardClick}
          className="flex items-center justify-center px-4 w-full h-full cursor-pointer"
        >
          <img 
            src="/LogoNanoSyncBranca.png" 
            alt="NanoSync CRM Logo" 
            className="h-[65%] w-auto object-contain"
          />
        </a>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-4 py-4 overflow-y-auto">
        {filteredMenuItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === `/app${item.href}` || location.pathname.startsWith(`/app${item.href}/`)
          const hasSubItems = item.subItems && item.subItems.length > 0
          const isParentActive = hasSubItems && item.subItems?.some(sub => location.pathname === `/app${sub.href}` || location.pathname.startsWith(`/app${sub.href}/`))
          
          // Se for o dashboard, usar o handler especial
          if (item.href === '/dashboard') {
            return (
              <a
                key={item.href}
                href={`/app${item.href}`}
                onClick={handleDashboardClick}
                className={cn(
                  'flex items-center space-x-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 group cursor-pointer',
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
              </a>
            )
          }

          // Se for Planos, usar link absoluto (fora do /app)
          if (item.href === '/planos') {
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  'flex items-center space-x-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 group',
                  location.pathname === item.href
                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/25'
                    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 hover:shadow-md'
                )}
              >
                <Icon className={cn(
                  'h-5 w-5 transition-transform group-hover:scale-110', 
                  location.pathname === item.href ? 'text-white' : item.color
                )} />
                <span className="font-medium">{item.label}</span>
              </Link>
            )
          }

          return (
            <div key={item.href}>
              <Link
                to={`/app${item.href}`}
                className={cn(
                  'flex items-center space-x-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 group',
                  isActive || isParentActive
                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/25'
                    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 hover:shadow-md'
                )}
              >
                <Icon className={cn(
                  'h-5 w-5 transition-transform group-hover:scale-110', 
                  isActive || isParentActive ? 'text-white' : item.color
                )} />
                <span className="font-medium">{item.label}</span>
              </Link>
              
              {/* Subitems */}
              {hasSubItems && (
                <div className="ml-4 mt-1 space-y-1">
                  {item.subItems!.map((subItem) => {
                    const SubIcon = subItem.icon
                    const isSubActive = location.pathname === `/app${subItem.href}` || location.pathname.startsWith(`/app${subItem.href}/`)
                    
                    return (
                      <Link
                        key={subItem.href}
                        to={`/app${subItem.href}`}
                        className={cn(
                          'flex items-center space-x-3 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 group',
                          isSubActive
                            ? 'bg-primary-500 text-white shadow-md'
                            : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700/50'
                        )}
                      >
                        <SubIcon className={cn(
                          'h-4 w-4 transition-transform group-hover:scale-110',
                          isSubActive ? 'text-white' : subItem.color
                        )} />
                        <span className="text-xs">{subItem.label}</span>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
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
        
        {/* Subscription Status Banner */}
        <SubscriptionStatusBanner />
        
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
