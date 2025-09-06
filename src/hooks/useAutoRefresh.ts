import { useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import { CacheManager } from '@/utils/cacheManager'

export function useAutoRefresh() {
  const queryClient = useQueryClient()

  // Auto-refresh after CRUD operations
  const refreshAfterMutation = useCallback(async (entityType: string, operation: 'create' | 'update' | 'delete') => {
    const refreshMap: Record<string, string[][]> = {
      cliente: [
        ['clientes'],
        ['dashboard'],
        ['atividades'],
        ['propostas'],
        ['agendamentos']
      ],
      produto: [
        ['produtos'],
        ['dashboard'],
        ['categorias'],
        ['segmentos']
      ],
      vendedor: [
        ['vendedores'],
        ['dashboard'],
        ['clientes'],
        ['propostas'],
        ['agendamentos']
      ],
      proposta: [
        ['propostas'],
        ['dashboard'],
        ['clientes'],
        ['atividades']
      ],
      agendamento: [
        ['agendamentos'],
        ['dashboard'],
        ['clientes'],
        ['atividades']
      ],
      categoria: [
        ['categorias'],
        ['produtos'],
        ['dashboard']
      ],
      segmento: [
        ['segmentos'],
        ['produtos'],
        ['dashboard']
      ],
      arquivo: [
        ['arquivos'],
        ['produtos'],
        ['clientes']
      ],
      atividade: [
        ['atividades'],
        ['dashboard']
      ]
    }

    const queriesToRefresh = refreshMap[entityType] || []
    
    // Invalidate and refetch related queries
    await Promise.all(
      queriesToRefresh.map(queryKey => 
        queryClient.invalidateQueries({ queryKey }).catch(console.warn)
      )
    )

    // For critical operations, also refresh auth data
    if (['create', 'delete'].includes(operation)) {
      await queryClient.invalidateQueries({ queryKey: ['auth', 'profile'] }).catch(console.warn)
    }
  }, [queryClient])

  // Force refresh specific entity
  const forceRefresh = useCallback(async (queryKeys: string[][]) => {
    await Promise.all(
      queryKeys.map(queryKey => 
        queryClient.refetchQueries({ queryKey }).catch(console.warn)
      )
    )
  }, [queryClient])

  // Refresh all critical data
  const refreshAll = useCallback(async () => {
    await CacheManager.refreshCriticalData()
  }, [])

  return {
    refreshAfterMutation,
    forceRefresh,
    refreshAll
  }
}
