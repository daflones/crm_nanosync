import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { agendamentosService, type Agendamento, type AgendamentoCreateData, type AgendamentoUpdateData } from '@/services/api/agendamentos'
import { toast } from 'sonner'

export const useAgendamentos = (filters?: {
  vendedor_id?: string
  cliente_id?: string
  status?: string
  tipo?: string
  data_inicio?: string
  data_fim?: string
}) => {
  const query = useQuery<Agendamento[]>({
    queryKey: ['agendamentos', filters],
    queryFn: () => agendamentosService.getAll(filters),
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchInterval: 1000 * 60, // Refetch every minute
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  })

  return query
}

export const useAgendamento = (id: string) => {
  return useQuery<Agendamento | null>({
    queryKey: ['agendamentos', id],
    queryFn: () => agendamentosService.getById(id),
    enabled: !!id,
    staleTime: 1000 * 30, // 30 seconds for real-time updates
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  })
}

export const useCreateAgendamento = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: AgendamentoCreateData) => agendamentosService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agendamentos'] })
      queryClient.refetchQueries({ queryKey: ['agendamentos'] })
      toast.success('Agendamento criado com sucesso!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao criar agendamento')
      queryClient.invalidateQueries({ queryKey: ['agendamentos'] })
    },
  })
}

export const useUpdateAgendamento = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AgendamentoUpdateData }) =>
      agendamentosService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agendamentos'] })
      queryClient.refetchQueries({ queryKey: ['agendamentos'] })
      toast.success('Agendamento atualizado com sucesso!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao atualizar agendamento')
      queryClient.invalidateQueries({ queryKey: ['agendamentos'] })
    },
  })
}

export const useDeleteAgendamento = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => agendamentosService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agendamentos'] })
      queryClient.refetchQueries({ queryKey: ['agendamentos'] })
      toast.success('Agendamento excluído com sucesso!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao excluir agendamento')
      queryClient.invalidateQueries({ queryKey: ['agendamentos'] })
    },
  })
}

export const useUpdateAgendamentoStatus = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      agendamentosService.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agendamentos'] })
      queryClient.refetchQueries({ queryKey: ['agendamentos'] })
      // Toast will be handled by the component
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao atualizar status')
      queryClient.invalidateQueries({ queryKey: ['agendamentos'] })
    },
  })
}
