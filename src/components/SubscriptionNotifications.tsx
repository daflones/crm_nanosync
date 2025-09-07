import { useState, useEffect } from 'react';
import { useSubscriptionStatus } from '../hooks/useSubscriptionStatus';
import { usePlanoAtivo } from '../hooks/usePlanoAtivo';
import { AlertTriangle, CreditCard, X, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

interface NotificationState {
  showInactivePopup: boolean;
  showExpiredPopup: boolean;
  dismissedInactive: boolean;
  dismissedExpired: boolean;
}

export function SubscriptionNotifications() {
  const subscription = useSubscriptionStatus();
  const { planoAtivo, isLoading: planoLoading } = usePlanoAtivo();
  const [notifications, setNotifications] = useState<NotificationState>({
    showInactivePopup: false,
    showExpiredPopup: false,
    dismissedInactive: false,
    dismissedExpired: false,
  });


  // Verificar se deve mostrar notificações
  useEffect(() => {
    // Aguardar carregamento do plano ativo
    if (planoLoading) return;
    
    // Se o usuário tem plano ativo, não mostrar nenhum popup
    if (planoAtivo) {
      // Garantir que os popups estejam fechados
      setNotifications(prev => ({
        ...prev,
        showInactivePopup: false,
        showExpiredPopup: false
      }));
      return;
    }

    if (subscription.isLoading) return;

    const now = new Date();
    const hasExpiredPlan = subscription.expiresAt && new Date(subscription.expiresAt) < now;
    const hasNeverSubscribed = !subscription.planId && subscription.status === 'inactive';

    // Mostrar popup para usuários que nunca assinaram
    if (hasNeverSubscribed && !notifications.dismissedInactive) {
      setTimeout(() => {
        setNotifications(prev => ({ ...prev, showInactivePopup: true }));
      }, 3000); // Mostrar após 3 segundos
    }

    // Mostrar popup para usuários com assinatura expirada
    if (hasExpiredPlan && !notifications.dismissedExpired) {
      setTimeout(() => {
        setNotifications(prev => ({ ...prev, showExpiredPopup: true }));
      }, 2000); // Mostrar após 2 segundos
    }
  }, [subscription, notifications.dismissedInactive, notifications.dismissedExpired, planoAtivo, planoLoading]);

  const dismissInactivePopup = () => {
    setNotifications(prev => ({
      ...prev,
      showInactivePopup: false,
      dismissedInactive: true
    }));
    // Salvar no localStorage para não mostrar novamente na sessão
    localStorage.setItem('dismissedInactivePopup', 'true');
  };

  const dismissExpiredPopup = () => {
    setNotifications(prev => ({
      ...prev,
      showExpiredPopup: false,
      dismissedExpired: true
    }));
    // Salvar no localStorage para não mostrar novamente na sessão
    localStorage.setItem('dismissedExpiredPopup', 'true');
  };

  // Verificar localStorage na inicialização
  useEffect(() => {
    const dismissedInactive = localStorage.getItem('dismissedInactivePopup') === 'true';
    const dismissedExpired = localStorage.getItem('dismissedExpiredPopup') === 'true';
    
    setNotifications(prev => ({
      ...prev,
      dismissedInactive,
      dismissedExpired
    }));
  }, []);

  // Popup para usuários que nunca assinaram
  const InactivePopup = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative animate-pulse">
        <button
          onClick={dismissInactivePopup}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="h-5 w-5" />
        </button>
        
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
            <CreditCard className="h-6 w-6 text-blue-600" />
          </div>
          
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Libere Diversas Funções!
          </h3>
          
          <p className="text-sm text-gray-600 mb-6">
            Visite a página de planos para desbloquear recursos avançados como:
          </p>
          
          <ul className="text-left text-sm text-gray-600 mb-6 space-y-2">
            <li className="flex items-center">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
              Clientes e pets ilimitados
            </li>
            <li className="flex items-center">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
              Relatórios avançados
            </li>
            <li className="flex items-center">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
              Múltiplos usuários
            </li>
            <li className="flex items-center">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
              Suporte prioritário
            </li>
          </ul>
          
          <div className="flex space-x-3">
            <button
              onClick={dismissInactivePopup}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Depois
            </button>
            <Link
              to="/app/planos"
              onClick={dismissInactivePopup}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 text-center"
            >
              Ver Planos
            </Link>
          </div>
        </div>
      </div>
    </div>
  );

  // Popup para usuários com assinatura expirada
  const ExpiredPopup = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative animate-bounce">
        <button
          onClick={dismissExpiredPopup}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="h-5 w-5" />
        </button>
        
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Renove sua Assinatura!
          </h3>
          
          <p className="text-sm text-gray-600 mb-4">
            Sua assinatura expirou em{' '}
            <span className="font-medium">
              {subscription.expiresAt?.toLocaleDateString('pt-BR')}
            </span>
          </p>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-6">
            <div className="flex items-center">
              <Clock className="h-4 w-4 text-yellow-600 mr-2" />
              <p className="text-sm text-yellow-800">
                <strong>Não perca diversas funções!</strong> Renove agora para continuar usando todos os recursos.
              </p>
            </div>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={dismissExpiredPopup}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Depois
            </button>
            <Link
              to="/app/planos"
              onClick={dismissExpiredPopup}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 text-center"
            >
              Renovar Agora
            </Link>
          </div>
        </div>
      </div>
    </div>
  );

  // Se tem plano ativo ou ainda está carregando, não renderizar nenhum popup
  if (planoAtivo || planoLoading) {
    return null;
  }

  return (
    <>
      {notifications.showInactivePopup && <InactivePopup />}
      {notifications.showExpiredPopup && <ExpiredPopup />}
    </>
  );
}

// Componente menor para notificação na sidebar
export function SubscriptionStatusBanner() {
  const subscription = useSubscriptionStatus();
  const { planoAtivo } = usePlanoAtivo();

  if (subscription.isLoading || subscription.isActive || planoAtivo) return null;

  const isExpired = subscription.expiresAt && new Date(subscription.expiresAt) < new Date();
  const hasNeverSubscribed = !subscription.planId && subscription.status === 'inactive';

  if (hasNeverSubscribed) {
    return (
      <div className="mx-4 mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start">
          <CreditCard className="h-5 w-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-blue-900">
              Desbloqueie mais recursos
            </p>
            <p className="text-xs text-blue-700 mt-1">
              Assine um plano para acessar funcionalidades avançadas
            </p>
            <Link
              to="/app/planos"
              className="text-xs text-blue-600 hover:text-blue-800 font-medium mt-1 inline-block"
            >
              Ver planos →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isExpired) {
    return (
      <div className="mx-4 mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-start">
          <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 mr-2 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-900">
              Assinatura expirada
            </p>
            <p className="text-xs text-red-700 mt-1">
              Renove para continuar usando todas as funcionalidades
            </p>
            <Link
              to="/app/planos"
              className="text-xs text-red-600 hover:text-red-800 font-medium mt-1 inline-block"
            >
              Renovar agora →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
