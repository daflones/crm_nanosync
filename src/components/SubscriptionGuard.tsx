import { type ReactNode } from 'react';
import { toast } from 'sonner';
import { useSubscriptionStatus } from '../hooks/useSubscriptionStatus';
import { AlertTriangle, Lock, CreditCard } from 'lucide-react';
import { Link } from 'react-router-dom';

interface SubscriptionGuardProps {
  children: ReactNode;
  action: 'create' | 'update' | 'delete' | 'export';
  feature?: string;
  fallback?: ReactNode;
  showUpgradePrompt?: boolean;
}

export function SubscriptionGuard({ 
  children, 
  action, 
  feature,
  fallback,
  showUpgradePrompt = true 
}: SubscriptionGuardProps) {
  const subscription = useSubscriptionStatus();

  // Se ainda está carregando, mostrar loading
  if (subscription.isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-sm text-gray-600">Verificando permissões...</span>
      </div>
    );
  }

  // Verificar se pode executar a ação
  const canPerform = (() => {
    switch (action) {
      case 'create': return subscription.canCreate;
      case 'update': return subscription.canUpdate;
      case 'delete': return subscription.canDelete;
      case 'export': return subscription.canExport;
      default: return false;
    }
  })();

  // Se pode executar, renderizar normalmente
  if (canPerform) {
    return <>{children}</>;
  }

  // Se tem fallback customizado, usar ele
  if (fallback) {
    return <>{fallback}</>;
  }

  // Renderizar bloqueio padrão
  return (
    <div className="relative">
      {/* Overlay de bloqueio */}
      <div className="absolute inset-0 bg-gray-100 bg-opacity-75 rounded-lg flex items-center justify-center z-10">
        <div className="text-center p-4 max-w-sm">
          <Lock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <h3 className="text-sm font-medium text-gray-900 mb-1">
            {getBlockTitle(action, feature)}
          </h3>
          <p className="text-xs text-gray-600 mb-3">
            {getBlockMessage(subscription.status, action)}
          </p>
          
          {showUpgradePrompt && (
            <Link
              to="/planos"
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <CreditCard className="h-3 w-3 mr-1" />
              Ver Planos
            </Link>
          )}
        </div>
      </div>
      
      {/* Conteúdo desabilitado */}
      <div className="opacity-30 pointer-events-none">
        {children}
      </div>
    </div>
  );
}

// Componente para botões específicos
interface ProtectedButtonProps {
  children: ReactNode;
  action: 'create' | 'update' | 'delete' | 'export';
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  feature?: string;
}

export function ProtectedButton({ 
  children, 
  action, 
  className = '', 
  onClick,
  disabled = false,
  feature 
}: ProtectedButtonProps) {
  const subscription = useSubscriptionStatus();

  const canPerform = (() => {
    switch (action) {
      case 'create': return subscription.canCreate;
      case 'update': return subscription.canUpdate;
      case 'delete': return subscription.canDelete;
      case 'export': return subscription.canExport;
      default: return false;
    }
  })();

  const isDisabled = disabled || !canPerform || subscription.isLoading;

  const handleClick = () => {
    if (!canPerform && !subscription.isLoading) {
      // Mostrar modal ou toast explicando o bloqueio
      toast.error(getBlockMessage(subscription.status, action));
      return;
    }
    onClick?.();
  };

  return (
    <button
      className={`${className} ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      onClick={handleClick}
      disabled={isDisabled}
      title={!canPerform ? getBlockTitle(action, feature) : undefined}
    >
      {subscription.isLoading ? (
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
          Verificando...
        </div>
      ) : (
        children
      )}
    </button>
  );
}

// Componente para exibir status da assinatura
export function SubscriptionStatusBadge() {
  const subscription = useSubscriptionStatus();

  if (subscription.isLoading) {
    return (
      <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-600 mr-1"></div>
        Verificando...
      </div>
    );
  }

  const { status, isActive, daysRemaining } = subscription;

  const getBadgeStyle = () => {
    if (isActive) {
      if (daysRemaining !== null && daysRemaining <= 7) {
        return 'bg-yellow-100 text-yellow-800';
      }
      return 'bg-green-100 text-green-800';
    }
    
    switch (status) {
      case 'expired':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      case 'pending':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = () => {
    if (isActive) {
      if (daysRemaining !== null) {
        if (daysRemaining <= 0) return 'Expira hoje';
        if (daysRemaining <= 7) return `${daysRemaining}d restantes`;
        return 'Ativo';
      }
      return 'Ativo';
    }
    
    switch (status) {
      case 'expired': return 'Expirado';
      case 'cancelled': return 'Cancelado';
      case 'pending': return 'Pendente';
      default: return 'Inativo';
    }
  };

  return (
    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getBadgeStyle()}`}>
      {!isActive && <AlertTriangle className="h-3 w-3 mr-1" />}
      {getStatusText()}
    </div>
  );
}

// Funções auxiliares
function getBlockTitle(action: string, feature?: string): string {
  const actionMap = {
    create: 'Criar',
    update: 'Editar', 
    delete: 'Excluir',
    export: 'Exportar'
  };
  
  const actionText = actionMap[action as keyof typeof actionMap] || action;
  return `${actionText} ${feature || 'item'} bloqueado`;
}

function getBlockMessage(status: string, action: string): string {
  const actionMap = {
    create: 'criar novos itens',
    update: 'editar itens',
    delete: 'excluir itens', 
    export: 'exportar dados'
  };
  
  const actionText = actionMap[action as keyof typeof actionMap] || action;
  
  switch (status) {
    case 'expired':
      return `Seu plano expirou. Renove para continuar a ${actionText}.`;
    case 'cancelled':
      return `Seu plano foi cancelado. Assine novamente para ${actionText}.`;
    case 'pending':
      return `Pagamento pendente. Aguarde a confirmação para ${actionText}.`;
    default:
      return `Você precisa de um plano ativo para ${actionText}.`;
  }
}
