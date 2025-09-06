import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { clientesService } from '@/services/api/clientes'
import { useIsAdmin, useCurrentVendedorId } from '@/hooks/useAuth'
import { useAutoRefresh } from '@/hooks/useAutoRefresh'
import { toast } from 'sonner'
import { useMemo } from 'react'

interface UseClientesOptions {
  etapa?: string
  origem?: string
  classificacao?: string
  search?: string
}

export function useClientes(options: UseClientesOptions = {}) {
  const isAdmin = useIsAdmin()
  const currentVendedorId = useCurrentVendedorId()

  const query = useQuery({
    queryKey: ['clientes', options],
    queryFn: () => clientesService.getAll(options),
    staleTime: 1000 * 30, // 30 seconds for real-time updates
    refetchInterval: 1000 * 60, // Refetch every minute
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  })

  // Filter clients based on user role
  const filteredData = useMemo(() => {
    if (!query.data) return []
    
    // Admins see all clients
    if (isAdmin) return query.data
    
    // Vendedores only see clients assigned to them
    return query.data.filter(cliente => 
      cliente.vendedor_id === currentVendedorId && cliente.vendedor_id !== null
    )
  }, [query.data, isAdmin, currentVendedorId])

  return {
    ...query,
    data: filteredData
  }
}

export function useCliente(id: string) {
  return useQuery({
    queryKey: ['clientes', id],
    queryFn: () => clientesService.getById(id),
    enabled: !!id,
    staleTime: 1000 * 30, // 30 seconds for real-time updates
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  })
}

export function useCreateCliente() {
  const queryClient = useQueryClient()
  const { refreshAfterMutation } = useAutoRefresh()
  
  return useMutation({
    mutationFn: clientesService.create,
    onSuccess: async () => {
      await refreshAfterMutation('cliente', 'create')
      // Toast will be handled by the component
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar cliente: ${error.message}`)
      queryClient.invalidateQueries({ queryKey: ['clientes'] })
    }
  })
}

export function useUpdateCliente() {
  const queryClient = useQueryClient()
  const { refreshAfterMutation } = useAutoRefresh()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      clientesService.update(id, data),
    onSuccess: async () => {
      await refreshAfterMutation('cliente', 'update')
      // Toast will be handled by the component
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar cliente: ${error.message}`)
      queryClient.invalidateQueries({ queryKey: ['clientes'] })
    }
  })
}

export function useDeleteCliente() {
  const queryClient = useQueryClient()
  const { refreshAfterMutation } = useAutoRefresh()
  
  return useMutation({
    mutationFn: clientesService.delete,
    onSuccess: async () => {
      await refreshAfterMutation('cliente', 'delete')
      // Toast will be handled by the component
    },
    onError: (error: Error) => {
      toast.error(`Erro ao remover cliente: ${error.message}`)
      queryClient.invalidateQueries({ queryKey: ['clientes'] })
    }
  })
}

export function useUpdatePipelineStage() {
  const queryClient = useQueryClient()
  const { refreshAfterMutation } = useAutoRefresh()
  
  return useMutation({
    mutationFn: ({ id, etapa }: { id: string; etapa: string }) =>
      clientesService.updatePipelineStage(id, etapa),
    onSuccess: async () => {
      await refreshAfterMutation('cliente', 'update')
      // Toast will be handled by the component
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar etapa: ${error.message}`)
      queryClient.invalidateQueries({ queryKey: ['clientes'] })
    }
  })
}
