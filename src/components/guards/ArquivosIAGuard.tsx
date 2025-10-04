import { Navigate } from 'react-router-dom'
import { useIAConfig } from '@/hooks/useIAConfig'

interface ArquivosIAGuardProps {
  children: React.ReactNode
}

export function ArquivosIAGuard({ children }: ArquivosIAGuardProps) {
  const { data: iaConfigData, isLoading } = useIAConfig()

  // Mostrar loading enquanto carrega a configuração
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Se envia_documento for false ou undefined (não configurado), redirecionar para dashboard
  // Só permite acesso se for explicitamente true
  if (iaConfigData?.envia_documento !== true) {
    return <Navigate to="/app/dashboard" replace />
  }

  // Se estiver habilitado (true), permitir acesso
  return <>{children}</>
}
