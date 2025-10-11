import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useCurrentUser } from './useCurrentUser';

interface PlanoAtivoHook {
  planoAtivo: boolean;
  isLoading: boolean;
  error: string | null;
  checkPlanoAtivo: () => Promise<boolean>;
  planoExpiraEm: Date | null;
  diasParaExpirar: number | null;
  isExpirandoEm3Dias: boolean;
}

export function usePlanoAtivo(): PlanoAtivoHook {
  const [planoAtivo, setPlanoAtivo] = useState(false);
  const [planoExpiraEm, setPlanoExpiraEm] = useState<Date | null>(null);
  const [diasParaExpirar, setDiasParaExpirar] = useState<number | null>(null);
  const [isExpirandoEm3Dias, setIsExpirandoEm3Dias] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { data: user } = useCurrentUser();

  const checkPlanoAtivo = async (): Promise<boolean> => {
    if (!user?.id) {
      setPlanoAtivo(false);
      setIsLoading(false);
      return false;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data, error: dbError } = await supabase
        .from('profiles')
        .select('plano_ativo, plano_expira_em')
        .eq('id', user.id)
        .single();

      if (dbError) {
        console.error('Erro ao verificar plano ativo:', dbError);
        setError('Erro ao verificar status do plano');
        setPlanoAtivo(false);
        setPlanoExpiraEm(null);
        setDiasParaExpirar(null);
        setIsExpirandoEm3Dias(false);
        return false;
      }

      const isActive = data?.plano_ativo === true;
      const expiraEm = data?.plano_expira_em ? new Date(data.plano_expira_em) : null;
      
      setPlanoAtivo(isActive);
      setPlanoExpiraEm(expiraEm);

      // Calcular dias para expirar
      if (isActive && expiraEm) {
        const agora = new Date();
        const diffTime = expiraEm.getTime() - agora.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        setDiasParaExpirar(diffDays > 0 ? diffDays : 0);
        setIsExpirandoEm3Dias(diffDays <= 3 && diffDays > 0);
      } else {
        setDiasParaExpirar(null);
        setIsExpirandoEm3Dias(false);
      }

      return isActive;

    } catch (error) {
      console.error('Erro na verificação do plano:', error);
      setError('Erro na verificação do plano');
      setPlanoAtivo(false);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Verificar status inicial
  useEffect(() => {
    if (user?.id) {
      checkPlanoAtivo();
    }
  }, [user?.id]);

  // Configurar listener para mudanças em tempo real
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('plano-status-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`
        },
        (payload: any) => {
          if (payload.new && typeof payload.new.plano_ativo === 'boolean') {
            const isActive = payload.new.plano_ativo;
            const expiraEm = payload.new.plano_expira_em ? new Date(payload.new.plano_expira_em) : null;
            
            setPlanoAtivo(isActive);
            setPlanoExpiraEm(expiraEm);

            // Recalcular dias para expirar
            if (isActive && expiraEm) {
              const agora = new Date();
              const diffTime = expiraEm.getTime() - agora.getTime();
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              
              setDiasParaExpirar(diffDays > 0 ? diffDays : 0);
              setIsExpirandoEm3Dias(diffDays <= 3 && diffDays > 0);
            } else {
              setDiasParaExpirar(null);
              setIsExpirandoEm3Dias(false);
            }
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [user?.id]);

  return {
    planoAtivo,
    isLoading,
    error,
    checkPlanoAtivo,
    planoExpiraEm,
    diasParaExpirar,
    isExpirandoEm3Dias
  };
}
