import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { propostasService, type Proposta, type PropostaCreateData, type PropostaUpdateData } from '@/services/api/propostas'
import { toast } from 'sonner'

export const usePropostas = (filters?: {
  vendedor_id?: string
  cliente_id?: string
  status?: string
  data_inicio?: string
  data_fim?: string
  page?: number
  limit?: number
}) => {
  const query = useQuery({
    queryKey: ['propostas', filters],
    queryFn: () => propostasService.getAll(filters),
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchInterval: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  })

  return {
    ...query,
    data: query.data?.data || [],
    count: query.data?.count || 0
  }
}

export const useProposta = (id: string) => {
  return useQuery<Proposta | null>({
    queryKey: ['propostas', id],
    queryFn: () => propostasService.getById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  })
}

export function usePropostasStatusStats() {
  return useQuery({
    queryKey: ['propostas-status-stats'],
    queryFn: async () => {
      const { supabase } = await import('@/lib/supabase')
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Não autenticado')
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, admin_profile_id')
        .eq('id', user.id)
        .single()
      
      const adminId = profile?.admin_profile_id || profile?.id
      return propostasService.getStatusStats(adminId)
    },
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: false,
  })
}

export function usePropostasValorStats() {
  return useQuery({
    queryKey: ['propostas-valor-stats'],
    queryFn: async () => {
      const { supabase } = await import('@/lib/supabase')
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Não autenticado')
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, admin_profile_id')
        .eq('id', user.id)
        .single()
      
      const adminId = profile?.admin_profile_id || profile?.id
      return propostasService.getValorStats(adminId)
    },
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: false,
  })
}

export const useCreateProposta = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: PropostaCreateData) => propostasService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['propostas'] })
      queryClient.refetchQueries({ queryKey: ['propostas'] })
      toast.success('Proposta criada com sucesso!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao criar proposta')
      queryClient.invalidateQueries({ queryKey: ['propostas'] })
    },
  })
}

export const useUpdateProposta = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: PropostaUpdateData }) =>
      propostasService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['propostas'] })
      queryClient.refetchQueries({ queryKey: ['propostas'] })
      toast.success('Proposta atualizada com sucesso!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao atualizar proposta')
      queryClient.invalidateQueries({ queryKey: ['propostas'] })
    },
  })
}

export const useDeleteProposta = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => propostasService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['propostas'] })
      queryClient.refetchQueries({ queryKey: ['propostas'] })
      toast.success('Proposta excluída com sucesso!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao excluir proposta')
      queryClient.invalidateQueries({ queryKey: ['propostas'] })
    },
  })
}

export const useUpdatePropostaStatus = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      propostasService.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['propostas'] })
      queryClient.refetchQueries({ queryKey: ['propostas'] })
      // Toast will be handled by the component
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao atualizar status')
      queryClient.invalidateQueries({ queryKey: ['propostas'] })
    },
  })
}
