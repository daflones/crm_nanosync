import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getTickets, getTicket, createTicket, updateTicket, deleteTicket, getTicketStats } from '@/services/api/tickets'
import type { TicketCreateData, TicketUpdateData, StatusTicket } from '@/types/ticket'
import { toast } from 'sonner'

// Hook para buscar tickets com filtros
export const useTickets = (filters?: {
  status?: StatusTicket
  cliente_id?: string
  vendedor_id?: string
  setor_id?: string
}) => {
  return useQuery({
    queryKey: ['tickets', filters],
    queryFn: async () => {
      const { data, error } = await getTickets(filters)
      if (error) throw error
      return data || []
    },
    staleTime: 1 * 60 * 1000, // 1 minuto
  })
}

// Hook para buscar um ticket específico
export const useTicket = (id: string) => {
  return useQuery({
    queryKey: ['tickets', id],
    queryFn: async () => {
      const { data, error } = await getTicket(id)
      if (error) throw error
      return data
    },
    enabled: !!id,
  })
}

// Hook para buscar estatísticas de tickets
export const useTicketStats = () => {
  return useQuery({
    queryKey: ['tickets', 'stats'],
    queryFn: async () => {
      return await getTicketStats()
    },
    staleTime: 2 * 60 * 1000, // 2 minutos
  })
}

// Hook para criar ticket
export const useCreateTicket = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (ticketData: TicketCreateData) => createTicket(ticketData),
    onSuccess: (response) => {
      if (response.error) {
        toast.error('Erro ao criar ticket')
        return
      }
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
      toast.success('Ticket criado com sucesso!')
    },
    onError: (error: any) => {
      console.error('Erro ao criar ticket:', error)
      toast.error('Erro ao criar ticket')
    },
  })
}

// Hook para atualizar ticket
export const useUpdateTicket = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: TicketUpdateData }) => updateTicket(id, data),
    onSuccess: (response) => {
      if (response.error) {
        toast.error('Erro ao atualizar ticket')
        return
      }
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
      toast.success('Ticket atualizado com sucesso!')
    },
    onError: (error: any) => {
      console.error('Erro ao atualizar ticket:', error)
      toast.error('Erro ao atualizar ticket')
    },
  })
}

// Hook para deletar ticket
export const useDeleteTicket = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteTicket(id),
    onSuccess: (response) => {
      if (response.error) {
        toast.error('Erro ao deletar ticket')
        return
      }
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
      toast.success('Ticket deletado com sucesso!')
    },
    onError: (error: any) => {
      console.error('Erro ao deletar ticket:', error)
      toast.error('Erro ao deletar ticket')
    },
  })
}
