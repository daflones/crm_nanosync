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
    if (planoLoading) {
      return;
    }
    
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

    if (subscription.isLoading) {
      return;
    }

    const now = new Date();
    const hasExpiredPlan = subscription.expiresAt && new Date(subscription.expiresAt) < now;
    
    // Condições mais flexíveis para usuários sem plano
    const hasNeverSubscribed = !subscription.planId && subscription.status === 'inactive';
    const hasInactivePlan = !subscription.isActive && !planoAtivo;

    // Mostrar popup para usuários que nunca assinaram OU que têm plano inativo
    if ((hasNeverSubscribed || hasInactivePlan) && !notifications.dismissedInactive) {
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
    // Salvar no localStorage para não mostrar novamente por 24 horas
    const dismissTime = new Date().getTime() + (24 * 60 * 60 * 1000); // 24 horas
    localStorage.setItem('dismissedInactivePopup', dismissTime.toString());
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
    // Verificar se o popup inativo foi dispensado e se ainda está dentro do prazo
    const dismissedInactiveTime = localStorage.getItem('dismissedInactivePopup');
    const dismissedExpired = localStorage.getItem('dismissedExpiredPopup') === 'true';
    
    let dismissedInactive = false;
    if (dismissedInactiveTime) {
      const dismissTime = parseInt(dismissedInactiveTime);
      const now = new Date().getTime();
      dismissedInactive = now < dismissTime; // Só considera dispensado se ainda está dentro do prazo
      
      if (!dismissedInactive) {
        // Se passou do prazo, remove do localStorage
        localStorage.removeItem('dismissedInactivePopup');
      }
    }
    
    setNotifications(prev => ({
      ...prev,
      dismissedInactive,
      dismissedExpired
    }));
  }, []);

  // Função para resetar localStorage (útil para debug)
  useEffect(() => {
    // Adicionar função global para debug
    (window as any).resetSubscriptionPopups = () => {
      localStorage.removeItem('dismissedInactivePopup');
      localStorage.removeItem('dismissedExpiredPopup');
      setNotifications(prev => ({
        ...prev,
        dismissedInactive: false,
        dismissedExpired: false,
        showInactivePopup: false,
        showExpiredPopup: false
      }));
      // Popups resetados
    };
  }, []);

  // Popup para usuários que nunca assinaram
  const InactivePopup = () => (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
      <div className="bg-gradient-to-br from-white via-white to-purple-50/30 rounded-2xl shadow-2xl max-w-lg w-full relative overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 via-transparent to-blue-600/5"></div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-purple-200/20 to-transparent rounded-full -translate-y-16 translate-x-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-blue-200/20 to-transparent rounded-full translate-y-12 -translate-x-12"></div>
        
        <button
          onClick={dismissInactivePopup}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10 p-1 rounded-full hover:bg-gray-100"
        >
          <X className="h-5 w-5" />
        </button>
        
        <div className="relative p-8 text-center">
          {/* Icon with gradient background */}
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-600 mb-6 shadow-lg">
            <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          
          <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-3">
            Turbine Suas Vendas com IA!
          </h3>
          
          <p className="text-gray-600 mb-6 leading-relaxed">
            Desbloqueie o poder da <span className="font-semibold text-purple-600">automação inteligente</span> e 
            transforme seu negócio com nossa IA trabalhando <span className="font-semibold text-blue-600">24 horas por dia</span>!
          </p>
          
          <div className="grid grid-cols-1 gap-3 mb-8 text-left">
            <div className="flex items-center p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-100">
              <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div>
                <div className="font-semibold text-gray-800">WhatsApp IA Integrado</div>
                <div className="text-sm text-gray-600">Atendimento automático 24/7</div>
              </div>
            </div>
            
            <div className="flex items-center p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100">
              <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div>
                <div className="font-semibold text-gray-800">Captura de Leads Inteligente</div>
                <div className="text-sm text-gray-600">Converta visitantes em clientes</div>
              </div>
            </div>
            
            <div className="flex items-center p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-100">
              <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 00-2-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <div className="font-semibold text-gray-800">Relatórios Avançados</div>
                <div className="text-sm text-gray-600">Insights poderosos para crescer</div>
              </div>
            </div>
            
            <div className="flex items-center p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100">
              <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <div className="font-semibold text-gray-800">Equipe Ilimitada</div>
                <div className="text-sm text-gray-600">Colaboração sem limites</div>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-xl p-4 mb-6 border border-purple-200">
            <div className="flex items-center justify-center mb-2">
              <Clock className="h-5 w-5 text-purple-600 mr-2" />
              <span className="font-semibold text-purple-800">Oferta Especial</span>
            </div>
            <p className="text-sm text-purple-700">
              <strong>Comece hoje</strong> e tenha sua IA trabalhando para você ainda hoje!
            </p>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={dismissInactivePopup}
              className="flex-1 px-6 py-3 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all duration-200 hover:scale-105"
            >
              Talvez Depois
            </button>
            <Link
              to="/planos"
              onClick={dismissInactivePopup}
              className="flex-1 px-6 py-3 text-sm font-bold text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-xl transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl text-center"
            >
              Ativar Agora
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
              to="/planos"
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
              to="/planos"
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
              to="/planos"
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
