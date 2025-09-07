import { useState } from 'react';
import { useSubscriptionStatus, formatTimeRemaining, getExpirationUrgency } from '../hooks/useSubscriptionStatus';
import { AlertTriangle, X, CreditCard, Clock, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export function SubscriptionAlert() {
  const subscription = useSubscriptionStatus();
  const [dismissed, setDismissed] = useState(false);

  // Não mostrar se ainda está carregando ou foi dispensado
  if (subscription.isLoading || dismissed) {
    return null;
  }

  // Não mostrar se está ativo e não está próximo do vencimento
  if (subscription.isActive && subscription.daysRemaining !== null && subscription.daysRemaining > 7) {
    return null;
  }

  // Não mostrar se não há informações de expiração
  if (!subscription.daysRemaining && subscription.status === 'inactive') {
    return null;
  }

  const urgency = getExpirationUrgency(subscription.daysRemaining);
  const timeRemaining = formatTimeRemaining(subscription.daysRemaining);

  const getAlertStyle = () => {
    switch (urgency) {
      case 'critical':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'normal':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getIcon = () => {
    switch (urgency) {
      case 'critical':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'normal':
        return <CheckCircle className="h-5 w-5 text-blue-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getMessage = () => {
    if (!subscription.isActive) {
      switch (subscription.status) {
        case 'expired':
          return 'Seu plano expirou. Renove agora para continuar usando todas as funcionalidades.';
        case 'cancelled':
          return 'Seu plano foi cancelado. Assine novamente para reativar sua conta.';
        case 'pending':
          return 'Pagamento pendente. Aguarde a confirmação ou tente novamente.';
        default:
          return 'Você não possui um plano ativo. Assine agora para acessar todas as funcionalidades.';
      }
    }

    if (subscription.daysRemaining !== null) {
      if (subscription.daysRemaining <= 0) {
        return 'Seu plano expira hoje! Renove agora para evitar interrupções.';
      }
      if (subscription.daysRemaining <= 3) {
        return `Seu plano expira em ${timeRemaining}. Renove agora para evitar interrupções.`;
      }
      if (subscription.daysRemaining <= 7) {
        return `Seu plano expira em ${timeRemaining}. Considere renovar em breve.`;
      }
    }

    return 'Verifique o status da sua assinatura.';
  };

  const getActionButton = () => {
    if (!subscription.isActive || urgency === 'critical') {
      return (
        <Link
          to="/planos"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          <CreditCard className="h-4 w-4 mr-2" />
          {subscription.isActive ? 'Renovar Agora' : 'Assinar Agora'}
        </Link>
      );
    }

    if (urgency === 'warning') {
      return (
        <Link
          to="/planos"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
        >
          <CreditCard className="h-4 w-4 mr-2" />
          Renovar Plano
        </Link>
      );
    }

    return (
      <Link
        to="/planos"
        className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        Ver Planos
      </Link>
    );
  };

  return (
    <div className={`border-l-4 p-4 ${getAlertStyle()}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        <div className="ml-3 flex-1">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm font-medium">
                Status da Assinatura
              </h3>
              <p className="mt-1 text-sm">
                {getMessage()}
              </p>
              {subscription.planId && (
                <p className="mt-1 text-xs opacity-75">
                  Plano atual: {subscription.planId.toUpperCase()}
                </p>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {getActionButton()}
              <button
                type="button"
                className="inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:text-gray-500"
                onClick={() => setDismissed(true)}
              >
                <span className="sr-only">Dispensar</span>
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Componente menor para sidebar ou header
export function SubscriptionStatusIndicator() {
  const subscription = useSubscriptionStatus();

  if (subscription.isLoading) {
    return (
      <div className="flex items-center text-xs text-gray-500">
        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-400 mr-1"></div>
        Verificando...
      </div>
    );
  }

  const urgency = getExpirationUrgency(subscription.daysRemaining);
  const timeRemaining = formatTimeRemaining(subscription.daysRemaining);

  const getIndicatorColor = () => {
    if (!subscription.isActive) return 'text-red-600';
    
    switch (urgency) {
      case 'critical': return 'text-red-600';
      case 'warning': return 'text-yellow-600';
      case 'normal': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusText = () => {
    if (!subscription.isActive) {
      switch (subscription.status) {
        case 'expired': return 'Expirado';
        case 'cancelled': return 'Cancelado';
        case 'pending': return 'Pendente';
        default: return 'Inativo';
      }
    }

    if (subscription.daysRemaining !== null && subscription.daysRemaining <= 7) {
      return timeRemaining;
    }

    return 'Ativo';
  };

  return (
    <div className={`flex items-center text-xs ${getIndicatorColor()}`}>
      <div className={`w-2 h-2 rounded-full mr-2 ${
        subscription.isActive && urgency !== 'critical' && urgency !== 'warning' 
          ? 'bg-green-500' 
          : urgency === 'warning' 
          ? 'bg-yellow-500' 
          : 'bg-red-500'
      }`}></div>
      {getStatusText()}
    </div>
  );
}
