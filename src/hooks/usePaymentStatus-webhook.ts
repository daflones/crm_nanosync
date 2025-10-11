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
      const { data, error } = await supabase
        .from('profiles')
        .select('plano_ativo')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('❌ Erro ao verificar plano_ativo:', error);
        return false;
      }

      if (data?.plano_ativo === true) {
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
          if (payload.new && payload.new.plano_ativo === true) {
            setIsPaymentApproved(true);
            setIsLoading(false);
            clearInterval(pollInterval);
            channel.unsubscribe();
          }
        }
      )
      .subscribe();
      
    // Cleanup function
    return () => {
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
