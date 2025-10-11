import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { produtosService, type Produto, type ProdutoCreateData, type ProdutoUpdateData } from '@/services/api/produtos'
import { toast } from 'sonner'

export const useProdutos = (filters?: {
  categoria_id?: string
  segmento_id?: string
  status?: string
  destaque?: boolean
  mais_vendido?: boolean
  novidade?: boolean
  page?: number
  limit?: number
}) => {
  const query = useQuery({
    queryKey: ['produtos', filters],
    queryFn: () => produtosService.getAll(filters),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
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

export function useProdutosStatusStats() {
  return useQuery({
    queryKey: ['produtos-status-stats'],
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
      return produtosService.getStatusStats(adminId)
    },
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: false,
  })
}

export const useProdutosStats = () => {
  return useQuery({
    queryKey: ['produtos', 'stats'],
    queryFn: produtosService.getStats,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes cache
    refetchInterval: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  })
}

export const useProduto = (id: string) => {
  return useQuery<Produto | null>({
    queryKey: ['produtos', id],
    queryFn: () => produtosService.getById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes cache
  })
}

export const useCreateProduto = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: ProdutoCreateData) => produtosService.create(data),
    onSuccess: () => {
      // Only invalidate, let React Query handle refetch on demand
      queryClient.invalidateQueries({ queryKey: ['produtos'] })
      toast.success('Produto criado com sucesso!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao criar produto')
      // Refetch data even on error to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['produtos'] })
    },
  })
}

export const useUpdateProduto = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ProdutoUpdateData }) =>
      produtosService.update(id, data),
    onSuccess: () => {
      // Only invalidate, let React Query handle refetch on demand
      queryClient.invalidateQueries({ queryKey: ['produtos'] })
      toast.success('Produto atualizado com sucesso!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao atualizar produto')
      // Refetch data even on error to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['produtos'] })
    },
  })
}

export const useDeleteProduto = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => produtosService.delete(id),
    onSuccess: () => {
      // Only invalidate, let React Query handle refetch on demand
      queryClient.invalidateQueries({ queryKey: ['produtos'] })
      toast.success('Produto excluído com sucesso!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao excluir produto')
      // Refetch data even on error to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['produtos'] })
    },
  })
}
