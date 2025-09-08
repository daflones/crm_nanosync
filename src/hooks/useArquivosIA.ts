import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  getArquivosIA,
  getArquivoIA,
  uploadArquivoIA,
  updateArquivoIA,
  deleteArquivoIA,
  hardDeleteArquivoIA,
  markAsProcessed,
  updateUsageStats,
  getArquivosByCategory,
  getCategoryStats
} from '../services/api/arquivos-ia'
import type { CreateArquivoIAData, UpdateArquivoIAData, ArquivoIAFilters } from '../types/arquivos-ia'

// Query keys
const QUERY_KEYS = {
  arquivosIA: ['arquivos-ia'] as const,
  arquivoIA: (id: string) => ['arquivos-ia', id] as const,
  categoryStats: ['arquivos-ia', 'category-stats'] as const,
  byCategory: (categoria: string, subcategoria?: string) => 
    ['arquivos-ia', 'category', categoria, subcategoria] as const,
}

// Get all AI files with real-time updates
export const useArquivosIA = (filters?: ArquivoIAFilters) => {
  return useQuery({
    queryKey: [...QUERY_KEYS.arquivosIA, filters],
    queryFn: () => getArquivosIA(filters),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // 1 minute
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  })
}

// Get single AI file
export const useArquivoIA = (id: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.arquivoIA(id),
    queryFn: () => getArquivoIA(id),
    enabled: !!id,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  })
}

// Get files by category
export const useArquivosByCategory = (categoria: string, subcategoria?: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.byCategory(categoria, subcategoria),
    queryFn: () => getArquivosByCategory(categoria, subcategoria),
    enabled: !!categoria,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  })
}

// Get category statistics
export const useCategoryStats = () => {
  return useQuery({
    queryKey: QUERY_KEYS.categoryStats,
    queryFn: getCategoryStats,
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 2 * 60 * 1000, // 2 minutes
  })
}

// Upload AI file mutation
export const useUploadArquivoIA = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ file, data }: { file: File; data: CreateArquivoIAData }) =>
      uploadArquivoIA(file, data),
    onSuccess: () => {
      toast.success('Arquivo IA enviado com sucesso!')
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.arquivosIA })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.categoryStats })
    },
    onError: (error) => {
      console.error('Erro no upload:', error)
      toast.error('Erro ao fazer upload do arquivo')
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.arquivosIA })
    },
  })
}

// Update AI file mutation
export const useUpdateArquivoIA = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateArquivoIAData }) =>
      updateArquivoIA(id, data),
    onSuccess: (updatedArquivo) => {
      toast.success('Arquivo IA atualizado com sucesso!')
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.arquivosIA })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.arquivoIA(updatedArquivo.id) })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.categoryStats })
    },
    onError: (error) => {
      console.error('Erro na atualização:', error)
      toast.error('Erro ao atualizar arquivo')
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.arquivosIA })
    },
  })
}

// Delete AI file mutation (soft delete)
export const useDeleteArquivoIA = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteArquivoIA,
    onSuccess: () => {
      toast.success('Arquivo IA excluído com sucesso!')
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.arquivosIA })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.categoryStats })
    },
    onError: (error) => {
      console.error('Erro na exclusão:', error)
      toast.error('Erro ao excluir arquivo')
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.arquivosIA })
    },
  })
}

// Hard delete AI file mutation
export const useHardDeleteArquivoIA = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: hardDeleteArquivoIA,
    onSuccess: () => {
      // Toast will be handled by the component
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.arquivosIA })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.categoryStats })
    },
    onError: (error) => {
      console.error('Erro na exclusão permanente:', error)
      toast.error('Erro ao excluir permanentemente o arquivo')
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.arquivosIA })
    },
  })
}

// Mark as processed mutation
export const useMarkAsProcessed = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: markAsProcessed,
    onSuccess: (updatedArquivo) => {
      // Toast will be handled by the component
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.arquivosIA })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.arquivoIA(updatedArquivo.id) })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.categoryStats })
    },
    onError: (error) => {
      console.error('Erro ao marcar como processado:', error)
      toast.error('Erro ao marcar arquivo como processado')
    },
  })
}

// Update usage stats mutation
export const useUpdateUsageStats = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, type }: { id: string; type: 'view' | 'download' | 'ai_usage' }) =>
      updateUsageStats(id, type),
    onSuccess: () => {
      // Silently update - no toast needed for usage stats
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.arquivosIA })
    },
    onError: (error) => {
      console.error('Erro ao atualizar estatísticas:', error)
      // Silent error - don't show toast for usage stats
    },
  })
}

// Batch operations
export const useBatchOperations = () => {
  const queryClient = useQueryClient()

  const batchDelete = useMutation({
    mutationFn: async (ids: string[]) => {
      const promises = ids.map(id => deleteArquivoIA(id))
      await Promise.all(promises)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.arquivosIA })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.categoryStats })
    },
    onError: (error) => {
      console.error('Erro na exclusão em lote:', error)
      toast.error('Erro ao excluir arquivos selecionados')
    },
  })

  const batchUpdateStatus = useMutation({
    mutationFn: async ({ ids, status }: { ids: string[]; status: string }) => {
      const promises = ids.map(id => updateArquivoIA(id, { status: status as any }))
      await Promise.all(promises)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.arquivosIA })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.categoryStats })
    },
    onError: (error) => {
      console.error('Erro na atualização em lote:', error)
      toast.error('Erro ao atualizar status dos arquivos')
    },
  })

  const batchMarkAsProcessed = useMutation({
    mutationFn: async (ids: string[]) => {
      const promises = ids.map(id => markAsProcessed(id))
      await Promise.all(promises)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.arquivosIA })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.categoryStats })
    },
    onError: (error) => {
      console.error('Erro ao marcar como processado em lote:', error)
      toast.error('Erro ao marcar arquivos como processados')
    },
  })

  return {
    batchDelete,
    batchUpdateStatus,
    batchMarkAsProcessed,
  }
}
