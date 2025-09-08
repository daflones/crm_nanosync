import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface SessionManagerOptions {
  // Tempo mínimo entre verificações (em ms)
  minCheckInterval?: number;
  // Tempo de inatividade antes de verificar (em ms)
  inactivityTimeout?: number;
  // Debug mode
  debug?: boolean;
}

export function useSessionManager(options: SessionManagerOptions = {}) {
  const {
    minCheckInterval = 30000, // 30 segundos
    inactivityTimeout = 300000, // 5 minutos
    debug = false
  } = options;

  const { refreshUser, isAuthenticated } = useAuth();
  const lastCheckRef = useRef<number>(Date.now());
  const lastActivityRef = useRef<number>(Date.now());
  const inactivityTimerRef = useRef<NodeJS.Timeout>();
  const isCheckingRef = useRef(false);

  const log = useCallback((message: string, data?: any) => {
    if (debug) {
      console.log(`[SessionManager] ${message}`, data || '');
    }
  }, [debug]);

  // Função para verificar e atualizar sessão
  const checkAndRefreshSession = useCallback(async () => {
    // Evita verificações simultâneas
    if (isCheckingRef.current) {
      log('Verificação já em andamento, pulando...');
      return;
    }

    // Verifica intervalo mínimo
    const now = Date.now();
    const timeSinceLastCheck = now - lastCheckRef.current;
    
    if (timeSinceLastCheck < minCheckInterval) {
      log('Intervalo mínimo não atingido', {
        timeSinceLastCheck,
        minCheckInterval
      });
      return;
    }

    // Só verifica se estiver autenticado
    if (!isAuthenticated) {
      log('Usuário não autenticado, pulando verificação');
      return;
    }

    try {
      isCheckingRef.current = true;
      log('Iniciando verificação de sessão');
      
      await refreshUser();
      lastCheckRef.current = now;
      
      log('Sessão verificada com sucesso');
    } catch (error) {
      log('Erro ao verificar sessão', error);
    } finally {
      isCheckingRef.current = false;
    }
  }, [refreshUser, isAuthenticated, minCheckInterval, log]);

  // Registra atividade do usuário
  const registerActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    log('Atividade registrada');

    // Limpa timer anterior
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }

    // Define novo timer para verificação após inatividade
    inactivityTimerRef.current = setTimeout(() => {
      log('Tempo de inatividade atingido, verificando sessão');
      checkAndRefreshSession();
    }, inactivityTimeout);
  }, [inactivityTimeout, checkAndRefreshSession, log]);

  // Listener para mudança de visibilidade
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        log('Documento ficou oculto');
        // Limpa timer quando sai da aba
        if (inactivityTimerRef.current) {
          clearTimeout(inactivityTimerRef.current);
        }
      } else {
        log('Documento ficou visível');
        // Verifica tempo desde última verificação
        const timeSinceLastCheck = Date.now() - lastCheckRef.current;
        
        // Se passou mais que o intervalo mínimo, verifica
        if (timeSinceLastCheck >= minCheckInterval) {
          checkAndRefreshSession();
        }
        
        // Reinicia timer de inatividade
        registerActivity();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [checkAndRefreshSession, registerActivity, minCheckInterval, log]);

  // Listeners para atividade do usuário
  useEffect(() => {
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    
    const handleActivity = () => {
      registerActivity();
    };

    // Adiciona listeners
    events.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    // Inicia timer de inatividade
    registerActivity();

    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
      
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, [registerActivity]);

  // Listener para eventos de rede (online/offline)
  useEffect(() => {
    const handleOnline = () => {
      log('Conexão restaurada, verificando sessão');
      checkAndRefreshSession();
    };

    window.addEventListener('online', handleOnline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [checkAndRefreshSession, log]);

  // Retorna função manual de refresh se necessário
  return {
    refreshSession: checkAndRefreshSession,
    lastCheck: lastCheckRef.current
  };
}