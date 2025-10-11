import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useCurrentUser } from './useCurrentUser';

interface Payment {
  id: string;
  mercadopago_payment_id: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  status_detail: string;
  amount: number;
  plan_name: string;
  created_at: string;
  updated_at: string;
}

interface PaymentStatusHook {
  payment: Payment | null;
  isLoading: boolean;
  error: string | null;
  checkPaymentStatus: (paymentId: string) => Promise<void>;
  pollPaymentStatus: (paymentId: string) => void;
  stopPolling: () => void;
  startRealtimeListener: (paymentId: string) => () => void;
}

export function usePaymentStatus(): PaymentStatusHook {
  const [payment, setPayment] = useState<Payment | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
  const { data: user } = useCurrentUser();

  // Função para verificar status via API do Mercado Pago
  const checkPaymentStatus = async (paymentId: string) => {
    if (!paymentId) return;

    setIsLoading(true);
    setError(null);

    try {
      // Usar a função get-payment-status do Supabase
      const { data, error: functionError } = await supabase.functions.invoke('get-payment-status', {
        body: { paymentId }
      });

      if (functionError) {
        throw new Error(`Erro na função: ${functionError.message}`);
      }

      if (!data) {
        throw new Error('Resposta vazia da função');
      }

      // Atualizar no banco local se necessário
      if (user?.id) {
        const { error: updateError } = await supabase
          .from('pagamentos')
          .update({
            status: data.status,
            status_detail: data.status_detail,
            response_data: data,
            updated_at: new Date().toISOString()
          })
          .eq('mercadopago_payment_id', paymentId)
          .eq('user_id', user.id);

        if (updateError) {
          console.error('Erro ao atualizar pagamento local:', updateError);
        }
      }

      // Função para iniciar listener do Supabase Realtime
      const startRealtimeListener = (paymentId: string) => {
        // Configurar listener para mudanças na tabela pagamentos
        const channel = supabase
          .channel('payment-updates')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'pagamentos',
              filter: `mercadopago_payment_id=eq.${paymentId}`
            },
            (payload: any) => {
              if (payload.new) {
                const newPayment = payload.new as any;
                setPayment({
                  id: newPayment.id,
                  mercadopago_payment_id: newPayment.mercadopago_payment_id,
                  status: newPayment.status as 'pending' | 'approved' | 'rejected' | 'cancelled',
                  status_detail: newPayment.status_detail,
                  amount: newPayment.valor,
                  plan_name: newPayment.plano_nome,
                  created_at: newPayment.created_at,
                  updated_at: newPayment.updated_at
                });
                
                if (newPayment.status === 'approved') {
                  // Cleanup do listener
                  channel.unsubscribe();
                }
              }
            }
          )
          .subscribe();
          
        // Cleanup function
        return () => {
          channel.unsubscribe();
        };
      };

      startRealtimeListener(paymentId);

      // Buscar dados atualizados do banco usando a estrutura existente
      if (user?.id) {
        const { data: paymentData, error: fetchError } = await supabase
          .from('pagamentos')
          .select('*')
          .eq('mercadopago_payment_id', paymentId)
          .eq('user_id', user.id)
          .single();

        if (!fetchError && paymentData) {
          setPayment({
            id: paymentData.id,
            mercadopago_payment_id: paymentData.mercadopago_payment_id,
            status: paymentData.status as 'pending' | 'approved' | 'rejected' | 'cancelled',
            status_detail: paymentData.status_detail,
            amount: paymentData.valor,
            plan_name: paymentData.plano_nome,
            created_at: paymentData.created_at,
            updated_at: paymentData.updated_at
          });
        }
      }

    } catch (err: any) {
      setError(err.message || 'Erro ao verificar status do pagamento');
      console.error('Erro ao verificar pagamento:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Função para fazer polling (verificação periódica)
  const pollPaymentStatus = (paymentId: string, maxAttempts: number = 20) => {
    let attempts = 0;
    
    const poll = async () => {
      attempts++;
      
      await checkPaymentStatus(paymentId);
      
      // Parar se o pagamento foi aprovado/rejeitado ou se excedeu tentativas
      if (payment?.status === 'approved' || payment?.status === 'rejected' || attempts >= maxAttempts) {
        stopPolling();
        return;
      }
      
      // Continuar polling a cada 5 segundos
      const timeout = setTimeout(poll, 5000);
      setPollingInterval(timeout);
    };

    poll();
  };

  // Parar polling
  const stopPolling = () => {
    if (pollingInterval) {
      clearTimeout(pollingInterval);
      setPollingInterval(null);
    }
  };

  // Cleanup no unmount
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, []);

  // Função para iniciar listener em tempo real
  const startRealtimeListener = useCallback((paymentId: string) => {
    if (!user?.id) return () => {};

    const channel = supabase
      .channel(`payment-${paymentId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'pagamentos',
          filter: `mercadopago_payment_id=eq.${paymentId}`
        },
        (payload: any) => {
          if (payload.new) {
            const newPayment = payload.new as any;
            setPayment({
              id: newPayment.id,
              mercadopago_payment_id: newPayment.mercadopago_payment_id,
              status: newPayment.status as 'pending' | 'approved' | 'rejected' | 'cancelled',
              status_detail: newPayment.status_detail,
              amount: newPayment.valor,
              plan_name: newPayment.plano_nome,
              created_at: newPayment.created_at,
              updated_at: newPayment.updated_at
            });
            
            if (newPayment.status === 'approved') {
              // Cleanup do listener
              channel.unsubscribe();
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, stopPolling]);

  // Escutar mudanças em tempo real via Supabase Realtime
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('payment-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'pagamentos',
          filter: `user_id=eq.${user.id}`
        },
        (payload: any) => {
          const updatedPayment = payload.new;
          setPayment({
            id: updatedPayment.id,
            mercadopago_payment_id: updatedPayment.mercadopago_payment_id,
            status: updatedPayment.status as 'pending' | 'approved' | 'rejected' | 'cancelled',
            status_detail: updatedPayment.status_detail,
            amount: updatedPayment.valor,
            plan_name: updatedPayment.plano_nome,
            created_at: updatedPayment.created_at,
            updated_at: updatedPayment.updated_at
          });
          
          // Se foi aprovado, parar polling
          if (updatedPayment.status === 'approved') {
            stopPolling();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  return {
    payment,
    isLoading,
    error,
    checkPaymentStatus,
    pollPaymentStatus,
    stopPolling,
    startRealtimeListener
  };
}
