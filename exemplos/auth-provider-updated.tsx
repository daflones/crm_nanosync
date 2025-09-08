import React, { createContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/services/api';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AuthContextData {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextData>({} as AuthContextData);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  
  // Refs para controle de estado
  const lastCheckRef = useRef<number>(0);
  const isCheckingRef = useRef(false);
  const hasInitializedRef = useRef(false);

  // Função para buscar dados do usuário
  const fetchUser = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setUser(null);
        return false;
      }

      // Configura o token no header padrão
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      const response = await api.get('/auth/me');
      setUser(response.data);
      return true;
    } catch (error) {
      console.error('Erro ao buscar usuário:', error);
      // Se houver erro de autenticação, limpa o token
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
      setUser(null);
      return false;
    }
  }, []);

  // Função de refresh com controle de intervalo
  const refreshUser = useCallback(async () => {
    const now = Date.now();
    const timeSinceLastCheck = now - lastCheckRef.current;
    
    // Evita múltiplas chamadas simultâneas
    if (isCheckingRef.current) {
      console.log('[Auth] Refresh já em andamento, ignorando...');
      return;
    }
    
    // Evita refresh muito frequente (mínimo 30 segundos)
    if (timeSinceLastCheck < 30000 && lastCheckRef.current > 0) {
      console.log('[Auth] Refresh muito recente, ignorando...', { 
        timeSinceLastCheck, 
        minInterval: 30000 
      });
      return;
    }

    try {
      isCheckingRef.current = true;
      console.log('[Auth] Refreshing user...');
      await fetchUser();
      lastCheckRef.current = now;
    } finally {
      isCheckingRef.current = false;
    }
  }, [fetchUser]);

  // Carregamento inicial
  useEffect(() => {
    // Evita dupla inicialização (React StrictMode)
    if (hasInitializedRef.current) {
      return;
    }
    
    const initAuth = async () => {
      console.log('[Auth] Inicializando autenticação...');
      hasInitializedRef.current = true;
      setIsLoading(true);
      
      try {
        await fetchUser();
        lastCheckRef.current = Date.now();
      } finally {
        setIsLoading(false);
        console.log('[Auth] Autenticação inicializada');
      }
    };

    initAuth();
  }, [fetchUser]);

  // Gerenciamento de sessão com eventos do navegador
  useEffect(() => {
    // Só ativa após carregamento inicial
    if (isLoading) {
      return;
    }

    let inactivityTimer: NodeJS.Timeout;
    let lastActivity = Date.now();

    // Função para verificar sessão quando volta à aba
    const handleVisibilityChange = () => {
      if (!document.hidden && user) {
        const now = Date.now();
        const timeSinceLastCheck = now - lastCheckRef.current;
        
        // Verifica se passou tempo suficiente desde a última verificação
        if (timeSinceLastCheck >= 60000) { // 1 minuto
          console.log('[Auth] Tab voltou ao foco, verificando sessão...');
          refreshUser();
        }
      }
    };

    // Função para rastrear atividade
    const handleActivity = () => {
      lastActivity = Date.now();
      
      // Limpa timer anterior
      if (inactivityTimer) {
        clearTimeout(inactivityTimer);
      }
      
      // Define novo timer para 5 minutos de inatividade
      if (user) {
        inactivityTimer = setTimeout(() => {
          console.log('[Auth] Inatividade detectada, verificando sessão...');
          refreshUser();
        }, 300000); // 5 minutos
      }
    };

    // Função para quando volta online
    const handleOnline = () => {
      if (user) {
        console.log('[Auth] Conexão restaurada, verificando sessão...');
        refreshUser();
      }
    };

    // Adiciona listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', handleOnline);
    
    // Eventos de atividade
    const activityEvents = ['mousedown', 'keydown', 'touchstart'];
    activityEvents.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    // Inicia timer de inatividade
    if (user) {
      handleActivity();
    }

    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
      activityEvents.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
      if (inactivityTimer) {
        clearTimeout(inactivityTimer);
      }
    };
  }, [isLoading, user, refreshUser]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      setUser(user);
      lastCheckRef.current = Date.now();
      navigate('/dashboard');
    } catch (error) {
      console.error('Erro no login:', error);
      throw error;
    }
  }, [navigate]);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
    lastCheckRef.current = 0;
    navigate('/login');
  }, [navigate]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}