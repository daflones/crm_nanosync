import { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/authStore'
import { useIAConfig } from '@/hooks/useIAConfig'
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Package,
  Calendar,
  FileText,
  FolderOpen,
  BarChart3,
  Settings,
  Layers,
  Tags,
  LogOut,
  Activity,
  Bot
} from 'lucide-react'

interface MobileNavProps {
  open: boolean
  onClose: () => void
}

const menuItems = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/app/dashboard', color: 'text-blue-600' },
  { label: 'Clientes', icon: Users, href: '/app/clientes', color: 'text-green-600' },
  { label: 'Vendedores', icon: UserCheck, href: '/app/vendedores', color: 'text-purple-600', adminOnly: true },
  { label: 'Produtos', icon: Package, href: '/app/produtos', color: 'text-orange-600' },
  { label: 'Categorias', icon: Tags, href: '/app/categorias', color: 'text-pink-600' },
  { label: 'Segmentos', icon: Layers, href: '/app/segmentos', color: 'text-indigo-600' },
  { label: 'Agendamentos', icon: Calendar, href: '/app/agendamentos', color: 'text-cyan-600' },
  { label: 'Propostas', icon: FileText, href: '/app/propostas', color: 'text-amber-600' },
  { label: 'Arquivos', icon: FolderOpen, href: '/app/arquivos', color: 'text-teal-600' },
  { label: 'Arquivos IA', icon: FolderOpen, href: '/app/arquivos-ia', color: 'text-violet-600' },
  { label: 'Resumo de Atividades', icon: Activity, href: '/app/atividades', color: 'text-emerald-600' },
  { label: 'Relatórios', icon: BarChart3, href: '/app/relatorios', color: 'text-red-600', hideOnMobile: true },
  { label: 'Configurações', icon: Settings, href: '/app/configuracoes', color: 'text-gray-600', adminOnly: true },
  { label: 'Configurações IA', icon: Bot, href: '/app/configuracoes-ia', color: 'text-purple-600', adminOnly: true },
]

export function MobileNav({ open, onClose }: MobileNavProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, signOut } = useAuthStore()
  const { data: iaConfigData } = useIAConfig()
  const isAdmin = user?.role === 'admin'

  // Handler para navegar para o dashboard com refresh
  const handleDashboardClick = () => {
    onClose() // Fechar o menu mobile
    navigate('/app/dashboard')
  }

  const filteredMenuItems = menuItems.filter(item => {
    // Filtrar por permissão de admin
    if (item.adminOnly && !isAdmin) return false
    
    // Ocultar itens marcados para ocultar no mobile
    if (item.hideOnMobile) return false
    
    // Ocultar Arquivos IA se envia_documento não for explicitamente true
    if (item.href === '/app/arquivos-ia' && iaConfigData?.envia_documento !== true) return false
    
    return true
  })

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50 lg:hidden" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="transition-opacity ease-linear duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transition-opacity ease-linear duration-300"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-900/80" />
        </Transition.Child>

        <div className="fixed inset-0 flex">
          <Transition.Child
            as={Fragment}
            enter="transition ease-in-out duration-300 transform"
            enterFrom="-translate-x-full"
            enterTo="translate-x-0"
            leave="transition ease-in-out duration-300 transform"
            leaveFrom="translate-x-0"
            leaveTo="-translate-x-full"
          >
            <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
              <Transition.Child
                as={Fragment}
                enter="ease-in-out duration-300"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="ease-in-out duration-300"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                  <button type="button" className="-m-2.5 p-2.5" onClick={onClose}>
                    <X className="h-6 w-6 text-white" aria-hidden="true" />
                  </button>
                </div>
              </Transition.Child>

              <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white dark:bg-gray-800 px-6 pb-4">
                <div className="flex h-16 shrink-0 items-center justify-center bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg -mx-2">
                  <img 
                    src="/LogoNanoSyncBranca.png" 
                    alt="NanoSync CRM Logo" 
                    className="h-[65%] w-auto object-contain"
                  />
                </div>
                
                <nav className="flex flex-1 flex-col">
                  <ul role="list" className="flex flex-1 flex-col gap-y-7">
                    <li>
                      <ul role="list" className="-mx-2 space-y-1">
                        {filteredMenuItems.map((item) => {
                          const Icon = item.icon
                          const isActive = location.pathname === item.href
                          
                          // Se for o dashboard, usar o handler especial
                          if (item.href === '/app/dashboard') {
                            return (
                              <li key={item.href}>
                                <a
                                  href={item.href}
                                  onClick={handleDashboardClick}
                                  className={cn(
                                    'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold cursor-pointer',
                                    isActive
                                      ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400'
                                      : 'text-gray-700 hover:bg-gray-100 hover:text-primary-600 dark:text-gray-300 dark:hover:bg-gray-700'
                                  )}
                                >
                                  <Icon className={cn('h-6 w-6 shrink-0', isActive ? 'text-primary-600' : item.color)} />
                                  {item.label}
                                </a>
                              </li>
                            )
                          }
                          
                          return (
                            <li key={item.href}>
                              <Link
                                to={item.href}
                                onClick={onClose}
                                className={cn(
                                  'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold',
                                  isActive
                                    ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400'
                                    : 'text-gray-700 hover:bg-gray-100 hover:text-primary-600 dark:text-gray-300 dark:hover:bg-gray-700'
                                )}
                              >
                                <Icon className={cn('h-6 w-6 shrink-0', isActive ? 'text-primary-600' : item.color)} />
                                {item.label}
                              </Link>
                            </li>
                          )
                        })}
                      </ul>
                    </li>
                    
                    <li className="mt-auto">
                      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                        <div className="flex items-center gap-x-4 mb-4">
                          <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center text-white font-semibold">
                            {user?.full_name?.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {user?.full_name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {user?.role === 'admin' ? 'Administrador' : 'Vendedor'}
                            </p>
                          </div>
                        </div>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => {
                            signOut()
                            onClose()
                          }}
                        >
                          <LogOut className="mr-2 h-4 w-4" />
                          Sair
                        </Button>
                      </div>
                    </li>
                  </ul>
                </nav>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  )
}
