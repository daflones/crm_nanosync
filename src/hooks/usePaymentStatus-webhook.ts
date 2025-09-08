import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useCurrentUser } from './useCurrentUser';

interface PaymentStatusHook {
  isPaymentApproved: boolean;
  isLoading: boolean;
  error: string | null;
  startRealtimeListener: (paymentId: string) => () => void;
}

export function usePaymentStatus(): PaymentStatusHook {
  const [isPaymentApproved, setIsPaymentApproved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { data: user } = useCurrentUser();

  // Função para verificar status do plano no banco
  const checkPlanoStatus = async () => {
    if (!user?.id) return false;

    try {
      console.log('🔍 Verificando status do plano_ativo no banco...');
      
      const { data, error } = await supabase
        .from('profiles')
        .select('plano_ativo')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('❌ Erro ao verificar plano_ativo:', error);
        return false;
      }

      console.log('📊 Status atual do plano_ativo:', data?.plano_ativo);
      
      if (data?.plano_ativo === true) {
        console.log('✅ Plano já está ativo!');
        setIsPaymentApproved(true);
        setIsLoading(false);
        return true;
      }

      return false;
    } catch (error) {
      console.error('❌ Erro na verificação do plano:', error);
      return false;
    }
  };

  // Função para iniciar listener do plano_ativo na tabela profiles
  const startRealtimeListener = (paymentId: string) => {
    console.log('🚀 Iniciando verificação de plano_ativo para pagamento:', paymentId);
    setIsLoading(true);
    setError(null);
    
    if (!user?.id) {
      console.error('❌ User ID não encontrado');
      setError('Usuário não encontrado');
      setIsLoading(false);
      return () => {};
    }

    // Primeira verificação imediata
    checkPlanoStatus();

    // Configurar polling a cada 3 segundos
    const pollInterval = setInterval(async () => {
      const isActive = await checkPlanoStatus();
      if (isActive) {
        clearInterval(pollInterval);
        channel.unsubscribe();
      }
    }, 3000);

    // Configurar listener para mudanças na tabela profiles (backup)
    const channel = supabase
      .channel('profile-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`
        },
        (payload: any) => {
          console.log('📡 Atualização recebida na tabela profiles:', payload);
          
          if (payload.new && payload.new.plano_ativo === true) {
            console.log('✅ Plano ativado via Realtime!');
            setIsPaymentApproved(true);
            setIsLoading(false);
            clearInterval(pollInterval);
            channel.unsubscribe();
          }
        }
      )
      .subscribe();

    console.log('👂 Polling e Realtime listener ativos para plano_ativo');
      
    // Cleanup function
    return () => {
      console.log('🛑 Parando verificação de plano_ativo');
      clearInterval(pollInterval);
      channel.unsubscribe();
      setIsLoading(false);
    };
  };

  return {
    isPaymentApproved,
    isLoading,
    error,
    startRealtimeListener
  };
}
