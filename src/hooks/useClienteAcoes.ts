import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { clienteAcoesService } from '@/services/api/cliente-acoes'
import type { ClienteAcaoCreateData, ClienteAcaoUpdateData } from '@/types/cliente-acao'
import { toast } from 'sonner'

export function useClienteAcoes(clienteId: string) {
  const queryClient = useQueryClient()

  const {
    data: acoes,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['cliente-acoes', clienteId],
    queryFn: () => clienteAcoesService.buscarPorCliente(clienteId),
    enabled: !!clienteId,
    staleTime: 1000 * 60 * 2 // 2 minutos
  })

  const criarMutation = useMutation({
    mutationFn: (data: ClienteAcaoCreateData) => clienteAcoesService.criar(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cliente-acoes', clienteId] })
      toast.success('Ação criada com sucesso!')
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar ação: ${error.message}`)
    }
  })

  const atualizarMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ClienteAcaoUpdateData }) =>
      clienteAcoesService.atualizar(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cliente-acoes', clienteId] })
      toast.success('Ação atualizada com sucesso!')
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar ação: ${error.message}`)
    }
  })

  const deletarMutation = useMutation({
    mutationFn: (id: string) => clienteAcoesService.deletar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cliente-acoes', clienteId] })
      toast.success('Ação deletada com sucesso!')
    },
    onError: (error: Error) => {
      toast.error(`Erro ao deletar ação: ${error.message}`)
    }
  })

  const reordenarMutation = useMutation({
    mutationFn: (acoes: { id: string; ordem: number }[]) =>
      clienteAcoesService.reordenar(acoes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cliente-acoes', clienteId] })
    },
    onError: (error: Error) => {
      toast.error(`Erro ao reordenar ações: ${error.message}`)
    }
  })

  const marcarConcluidaMutation = useMutation({
    mutationFn: (id: string) => clienteAcoesService.marcarConcluida(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cliente-acoes', clienteId] })
      toast.success('Ação marcada como concluída!')
    },
    onError: (error: Error) => {
      toast.error(`Erro ao marcar ação: ${error.message}`)
    }
  })

  return {
    acoes: acoes || [],
    isLoading,
    error,
    refetch,
    criar: criarMutation.mutateAsync,
    atualizar: atualizarMutation.mutateAsync,
    deletar: deletarMutation.mutateAsync,
    reordenar: reordenarMutation.mutateAsync,
    marcarConcluida: marcarConcluidaMutation.mutateAsync,
    isCriando: criarMutation.isPending,
    isAtualizando: atualizarMutation.isPending,
    isDeletando: deletarMutation.isPending,
    isReordenando: reordenarMutation.isPending
  }
}
