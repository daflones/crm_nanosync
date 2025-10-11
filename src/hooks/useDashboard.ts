import { useQuery } from '@tanstack/react-query'
import { 
  getDashboardStats, 
  getRecentActivities, 
  getRecentProposals, 
  getSalesConversion,
  getSalesPipeline,
  type DashboardStats,
  type RecentActivity,
  type RecentProposal,
  type SalesConversion,
  type PipelineStage
} from '../services/api/dashboard'
import { useAuthStore } from '../stores/authStore'
import { useCurrentUser, useIsAdmin, useCurrentVendedorId } from './useCurrentUser'

// Hook para buscar estatísticas do dashboard
export const useDashboardStats = () => {
  const { user } = useAuthStore()
  const { data: currentUser } = useCurrentUser()
  const isAdmin = useIsAdmin()
  const currentVendedorId = useCurrentVendedorId()
  
  return useQuery({
    queryKey: ['dashboard-stats', user?.id, currentUser?.id],
    queryFn: async (): Promise<DashboardStats> => {
      if (!user || !currentUser) {
        throw new Error('Usuário não autenticado')
      }
      
      return getDashboardStats(currentVendedorId, isAdmin)
    },
    enabled: !!user && !!currentUser,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos cache
    refetchInterval: false, // Desabilitar auto-refetch
    refetchOnWindowFocus: false, // Não refetch ao focar janela
    refetchOnReconnect: true, // Apenas ao reconectar
  })
}

// Hook para buscar atividades recentes
export const useRecentActivities = (limit: number = 10) => {
  const { user } = useAuthStore()
  const { data: currentUser } = useCurrentUser()
  
  return useQuery({
    queryKey: ['recent-activities', user?.id, currentUser?.id, limit],
    queryFn: async (): Promise<RecentActivity[]> => {
      if (!user || !currentUser) {
        throw new Error('Usuário não autenticado')
      }
      
      return getRecentActivities(limit)
    },
    enabled: !!user && !!currentUser,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos cache
    refetchInterval: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  })
}

// Hook para buscar propostas recentes
export const useRecentProposals = (limit: number = 5) => {
  const { user } = useAuthStore()
  const { data: currentUser } = useCurrentUser()
  const isAdmin = useIsAdmin()
  const currentVendedorId = useCurrentVendedorId()
  
  return useQuery({
    queryKey: ['recent-proposals', user?.id, currentUser?.id, limit],
    queryFn: async (): Promise<RecentProposal[]> => {
      if (!user || !currentUser) {
        throw new Error('Usuário não autenticado')
      }
      
      return getRecentProposals(limit, currentVendedorId, isAdmin)
    },
    enabled: !!user && !!currentUser,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos cache
    refetchInterval: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  })
}

// Hook para buscar conversão de vendas
export const useSalesConversion = () => {
  const { user } = useAuthStore()
  const { data: currentUser } = useCurrentUser()
  const isAdmin = useIsAdmin()
  const currentVendedorId = useCurrentVendedorId()
  
  return useQuery({
    queryKey: ['sales-conversion', user?.id, currentUser?.id],
    queryFn: async (): Promise<SalesConversion[]> => {
      if (!user || !currentUser) {
        throw new Error('Usuário não autenticado')
      }
      
      return getSalesConversion(currentVendedorId, isAdmin)
    },
    enabled: !!user && !!currentUser,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos cache
    refetchInterval: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  })
}

// Hook para buscar pipeline de vendas
export const useSalesPipeline = () => {
  const { user } = useAuthStore()
  const { data: currentUser } = useCurrentUser()
  const isAdmin = useIsAdmin()
  const currentVendedorId = useCurrentVendedorId()
  
  return useQuery({
    queryKey: ['sales-pipeline', user?.id, currentUser?.id],
    queryFn: async (): Promise<PipelineStage[]> => {
      if (!user || !currentUser) {
        throw new Error('Usuário não autenticado')
      }
      
      return getSalesPipeline(currentVendedorId, isAdmin)
    },
    enabled: !!user && !!currentUser,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos cache
    refetchInterval: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  })
}

// Hook combinado para todos os dados do dashboard
export const useDashboardData = () => {
  const stats = useDashboardStats()
  const activities = useRecentActivities()
  const proposals = useRecentProposals()
  const conversion = useSalesConversion()
  const pipeline = useSalesPipeline()
  
  return {
    stats,
    activities,
    proposals,
    conversion,
    pipeline,
    isLoading: stats.isLoading || activities.isLoading || proposals.isLoading || conversion.isLoading || pipeline.isLoading,
    isError: stats.isError || activities.isError || proposals.isError || conversion.isError || pipeline.isError,
    error: stats.error || activities.error || proposals.error || conversion.error || pipeline.error,
    refetchAll: () => {
      stats.refetch()
      activities.refetch()
      proposals.refetch()
      conversion.refetch()
      pipeline.refetch()
    }
  }
}
