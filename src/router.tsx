import { createBrowserRouter, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { AppLayout } from './components/layout/AppLayout'

// Lazy load pages
const LoginPage = lazy(() => import('./pages/auth/LoginPage').then(m => ({ default: m.LoginPage })))
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage').then(m => ({ default: m.RegisterPage })))
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage').then(m => ({ default: m.ForgotPasswordPage })))
const DashboardPage = lazy(() => import('./pages/dashboard/DashboardPage').then(m => ({ default: m.DashboardPage })))
const ClientesPage = lazy(() => import('./pages/clientes/ClientesPage').then(m => ({ default: m.ClientesPage })))
const VendedoresPage = lazy(() => import('./pages/vendedores/VendedoresPage'))
const ProdutosPage = lazy(() => import('./pages/produtos/ProdutosPage').then(m => ({ default: m.ProdutosPage })))
const CategoriasPage = lazy(() => import('./pages/categorias/CategoriasPage').then(m => ({ default: m.CategoriasPage })))
const SegmentosPage = lazy(() => import('./pages/segmentos/SegmentosPage').then(m => ({ default: m.SegmentosPage })))
const AgendamentosPage = lazy(() => import('./pages/agendamentos/AgendamentosPage').then(m => ({ default: m.AgendamentosPage })))
const PropostasPage = lazy(() => import('./pages/propostas/PropostasPage').then(m => ({ default: m.PropostasPage })))
const ArquivosPage = lazy(() => import('./pages/arquivos/ArquivosPage').then(m => ({ default: m.ArquivosPage })))
const ArquivosIAPage = lazy(() => import('./pages/arquivos-ia/ArquivosIAPage').then(m => ({ default: m.default })))
const RelatoriosPage = lazy(() => import('./pages/relatorios/RelatoriosPage').then(m => ({ default: m.RelatoriosPage })))
const ConfiguracoesPage = lazy(() => import('./pages/configuracoes/ConfiguracoesPage').then(m => ({ default: m.ConfiguracoesPage })))
const AtividadesPage = lazy(() => import('./pages/atividades/AtividadesPage').then(m => ({ default: m.AtividadesPage })))
const LandingPage = lazy(() => import('./pages/landing/LandingPage').then(m => ({ default: m.LandingPage })))

// Loading component for Suspense fallback
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
)

// Wrap lazy components with Suspense
const withSuspense = (Component: React.LazyExoticComponent<any>) => {
  return (
    <Suspense fallback={<PageLoader />}>
      <Component />
    </Suspense>
  )
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: withSuspense(LoginPage),
  },
  {
    path: '/register',
    element: withSuspense(RegisterPage),
  },
  {
    path: '/forgot-password',
    element: withSuspense(ForgotPasswordPage),
  },
  {
    path: '/landing',
    element: withSuspense(LandingPage),
  },
  {
    path: '/',
    element: <Navigate to="/app/dashboard" replace />,
  },
  {
    path: '/app',
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: withSuspense(DashboardPage),
      },
      {
        path: 'clientes',
        element: withSuspense(ClientesPage),
      },
      {
        path: 'vendedores',
        element: withSuspense(VendedoresPage),
      },
      {
        path: 'produtos',
        element: withSuspense(ProdutosPage),
      },
      {
        path: 'categorias',
        element: withSuspense(CategoriasPage),
      },
      {
        path: 'segmentos',
        element: withSuspense(SegmentosPage),
      },
      {
        path: 'agendamentos',
        element: withSuspense(AgendamentosPage),
      },
      {
        path: 'propostas',
        element: withSuspense(PropostasPage),
      },
      {
        path: 'arquivos',
        element: withSuspense(ArquivosPage),
      },
      {
        path: 'arquivos-ia',
        element: withSuspense(ArquivosIAPage),
      },
      {
        path: 'relatorios',
        element: withSuspense(RelatoriosPage),
      },
      {
        path: 'configuracoes',
        element: withSuspense(ConfiguracoesPage),
      },
      {
        path: 'atividades',
        element: withSuspense(AtividadesPage),
      },
    ],
  },
])
