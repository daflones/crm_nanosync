import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { produtosService, type Produto, type ProdutoCreateData, type ProdutoUpdateData } from '@/services/api/produtos'
import { toast } from 'sonner'

export const useProdutos = (filters?: {
  categoria_id?: string
  segmento_id?: string
  status?: 'ativo' | 'inativo'
  destaque?: boolean
  mais_vendido?: boolean
  novidade?: boolean
}) => {
  return useQuery<Produto[]>({
    queryKey: ['produtos', filters],
    queryFn: () => produtosService.getAll(filters),
    staleTime: 1000 * 30, // 30 seconds for real-time updates
    refetchInterval: 1000 * 60, // Refetch every minute
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  })
}

export const useProdutosStats = () => {
  return useQuery({
    queryKey: ['produtos', 'stats'],
    queryFn: produtosService.getStats,
    staleTime: 1000 * 30, // 30 seconds for real-time updates
    refetchInterval: 1000 * 60, // Refetch every minute
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  })
}

export const useProduto = (id: string) => {
  return useQuery<Produto | null>({
    queryKey: ['produtos', id],
    queryFn: () => produtosService.getById(id),
    enabled: !!id,
  })
}

export const useCreateProduto = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: ProdutoCreateData) => produtosService.create(data),
    onSuccess: () => {
      // Immediately refetch data for real-time updates
      queryClient.invalidateQueries({ queryKey: ['produtos'] })
      queryClient.refetchQueries({ queryKey: ['produtos'] })
      // Toast will be handled by the component
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
      // Immediately refetch data for real-time updates
      queryClient.invalidateQueries({ queryKey: ['produtos'] })
      queryClient.refetchQueries({ queryKey: ['produtos'] })
      // Toast will be handled by the component
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
      // Immediately refetch data for real-time updates
      queryClient.invalidateQueries({ queryKey: ['produtos'] })
      queryClient.refetchQueries({ queryKey: ['produtos'] })
      // Toast will be handled by the component
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao excluir produto')
      // Refetch data even on error to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['produtos'] })
    },
  })
}
