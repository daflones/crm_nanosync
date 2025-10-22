import { useQuery, useQueryClient } from '@tanstack/react-query'
import { prospeccaoLogsService } from '@/services/api/prospeccao-logs'

interface FiltrosLogsProspeccao {
  tipo_estabelecimento?: string
  cidade?: string
  whatsapp_valido?: boolean
  mensagem_enviada?: boolean
  cliente_salvo?: boolean
  data_inicio?: string
  data_fim?: string
  page?: number
  limit?: number
}

export function useLogsProspeccao(filtros?: FiltrosLogsProspeccao) {
  const queryClient = useQueryClient()

  const {
    data,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['logs-prospeccao', filtros],
    queryFn: () => prospeccaoLogsService.buscarLogs(filtros),
    staleTime: 1000 * 60 * 5, // 5 minutos
    refetchOnWindowFocus: true,
    retry: 3
  })

  const {
    data: estatisticas,
    isLoading: isLoadingEstatisticas,
    error: errorEstatisticas
  } = useQuery({
    queryKey: ['estatisticas-prospeccao'],
    queryFn: () => prospeccaoLogsService.obterEstatisticas(),
    staleTime: 1000 * 60 * 5, // 5 minutos
    refetchOnWindowFocus: true,
    retry: 3
  })

  const invalidateQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['logs-prospeccao'] })
    queryClient.invalidateQueries({ queryKey: ['estatisticas-prospeccao'] })
  }

  return {
    logs: data?.data || [],
    totalLogs: data?.count || 0,
    estatisticas: estatisticas || {
      total_prospectados: 0,
      whatsapp_validos: 0,
      mensagens_enviadas: 0,
      clientes_salvos: 0,
      taxa_conversao: 0
    },
    isLoading,
    isLoadingEstatisticas,
    error,
    errorEstatisticas,
    refetch,
    invalidateQueries
  }
}
