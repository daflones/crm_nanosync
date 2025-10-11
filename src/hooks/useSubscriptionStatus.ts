import { useState, useEffect, useCallback } from 'react';
import { useCurrentUser } from './useCurrentUser';
import { supabase } from '../lib/supabase';

export interface SubscriptionStatus {
  isActive: boolean;
  isLoading: boolean;
  planId: string | null;
  expiresAt: Date | null;
  daysRemaining: number | null;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canExport: boolean;
  status: 'active' | 'inactive' | 'expired' | 'cancelled' | 'pending';
  error: string | null;
}

export interface SubscriptionLimits {
  maxClients: number;
  maxPets: number;
  maxAppointments: number;
  maxUsers: number;
  hasAdvancedReports: boolean;
  hasApiAccess: boolean;
  hasCustomFields: boolean;
}

const DEFAULT_LIMITS: SubscriptionLimits = {
  maxClients: 10,
  maxPets: 20,
  maxAppointments: 50,
  maxUsers: 1,
  hasAdvancedReports: false,
  hasApiAccess: false,
  hasCustomFields: false,
};

const PLAN_LIMITS: Record<string, SubscriptionLimits> = {
  'basic': {
    maxClients: 100,
    maxPets: 200,
    maxAppointments: 500,
    maxUsers: 2,
    hasAdvancedReports: false,
    hasApiAccess: false,
    hasCustomFields: false,
  },
  'pro': {
    maxClients: 1000,
    maxPets: 2000,
    maxAppointments: 5000,
    maxUsers: 5,
    hasAdvancedReports: true,
    hasApiAccess: true,
    hasCustomFields: true,
  },
  'enterprise': {
    maxClients: -1, // Ilimitado
    maxPets: -1,
    maxAppointments: -1,
    maxUsers: -1,
    hasAdvancedReports: true,
    hasApiAccess: true,
    hasCustomFields: true,
  },
};

export function useSubscriptionStatus(): SubscriptionStatus {
  const { data: user } = useCurrentUser();
  const [status, setStatus] = useState<SubscriptionStatus>({
    isActive: false,
    isLoading: true,
    planId: null,
    expiresAt: null,
    daysRemaining: null,
    canCreate: false,
    canUpdate: false,
    canDelete: false,
    canExport: false,
    status: 'inactive',
    error: null,
  });

  const checkSubscriptionStatus = useCallback(async () => {
    if (!user?.id) {
      setStatus(prev => ({
        ...prev,
        isLoading: false,
        isActive: false,
        canCreate: false,
        canUpdate: false,
        canDelete: false,
        canExport: false,
        status: 'inactive',
      }));
      return;
    }

    try {
      setStatus(prev => ({ ...prev, isLoading: true, error: null }));

      // Chamar função do Supabase para verificar plano
      const { data, error } = await supabase
        .rpc('verificar_plano_ativo', { p_user_id: user.id });

      if (error) {
        throw error;
      }

      // Buscar dados completos do perfil
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('plano_ativo, plano_id, plano_expira_em, subscription_status')
        .eq('id', user.id)
        .single();

      if (profileError) {
        throw profileError;
      }

      const isActive = data === true && profile?.plano_ativo === true;
      const expiresAt = profile?.plano_expira_em ? new Date(profile.plano_expira_em) : null;
      const daysRemaining = expiresAt ? 
        Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;

      // Determinar permissões baseadas no status
      const canCreate = isActive;
      const canUpdate = isActive;
      const canDelete = isActive;
      const canExport = isActive;

      setStatus({
        isActive,
        isLoading: false,
        planId: profile?.plano_id || null,
        expiresAt,
        daysRemaining,
        canCreate,
        canUpdate,
        canDelete,
        canExport,
        status: profile?.subscription_status || 'inactive',
        error: null,
      });

    } catch (error) {
      console.error('Erro ao verificar status da assinatura:', error);
      setStatus(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        isActive: false,
        canCreate: false,
        canUpdate: false,
        canDelete: false,
        canExport: false,
      }));
    }
  }, [user?.id]);

  // Verificar status inicial e configurar polling
  useEffect(() => {
    checkSubscriptionStatus();

    // Verificar a cada 5 minutos
    const interval = setInterval(checkSubscriptionStatus, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [checkSubscriptionStatus]);

  // Escutar mudanças em tempo real na tabela profiles
  useEffect(() => {
    if (!user?.id) return;

    const subscription = supabase
      .channel('subscription_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`,
        },
        (payload: any) => {
          checkSubscriptionStatus();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id, checkSubscriptionStatus]);

  return status;
}

export function useSubscriptionLimits(): SubscriptionLimits {
  const { planId, isActive } = useSubscriptionStatus();

  if (!isActive || !planId) {
    return DEFAULT_LIMITS;
  }

  return PLAN_LIMITS[planId] || DEFAULT_LIMITS;
}

// Hook para verificar se uma ação específica é permitida
export function useCanPerformAction(action: 'create' | 'update' | 'delete' | 'export') {
  const status = useSubscriptionStatus();
  
  switch (action) {
    case 'create':
      return status.canCreate;
    case 'update':
      return status.canUpdate;
    case 'delete':
      return status.canDelete;
    case 'export':
      return status.canExport;
    default:
      return false;
  }
}

// Hook para verificar limites específicos
export function useCheckLimit(type: keyof SubscriptionLimits, currentCount: number) {
  const limits = useSubscriptionLimits();
  const limit = limits[type];
  
  // -1 significa ilimitado
  if (limit === -1) {
    return { canAdd: true, isNearLimit: false, remaining: -1 };
  }
  
  if (typeof limit === 'number') {
    const remaining = limit - currentCount;
    const canAdd = remaining > 0;
    const isNearLimit = remaining <= Math.ceil(limit * 0.1); // 10% do limite
    
    return { canAdd, isNearLimit, remaining };
  }
  
  // Para campos booleanos
  return { canAdd: Boolean(limit), isNearLimit: false, remaining: 0 };
}

// Utilitário para formatar tempo restante
export function formatTimeRemaining(daysRemaining: number | null): string {
  if (daysRemaining === null) return 'Indefinido';
  
  if (daysRemaining < 0) return 'Expirado';
  if (daysRemaining === 0) return 'Expira hoje';
  if (daysRemaining === 1) return '1 dia restante';
  if (daysRemaining <= 7) return `${daysRemaining} dias restantes`;
  if (daysRemaining <= 30) return `${daysRemaining} dias restantes`;
  
  const months = Math.floor(daysRemaining / 30);
  if (months === 1) return '1 mês restante';
  return `${months} meses restantes`;
}

// Utilitário para determinar urgência
export function getExpirationUrgency(daysRemaining: number | null): 'critical' | 'warning' | 'normal' | 'none' {
  if (daysRemaining === null) return 'none';
  if (daysRemaining < 0) return 'critical';
  if (daysRemaining <= 3) return 'critical';
  if (daysRemaining <= 7) return 'warning';
  return 'normal';
}
