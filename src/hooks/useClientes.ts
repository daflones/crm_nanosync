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
  page?: number
  limit?: number
}

export function useClientes(options: UseClientesOptions = {}) {
  const isAdmin = useIsAdmin()
  const currentVendedorId = useCurrentVendedorId()

  const query = useQuery({
    queryKey: ['clientes', options],
    queryFn: () => clientesService.getAll(options),
    staleTime: 1000 * 60 * 5, // 5 minutes - Reduced refetching for better performance
    gcTime: 1000 * 60 * 10, // 10 minutes cache
    refetchInterval: false, // Disabled auto-refetch - only manual refresh
    refetchOnWindowFocus: false, // Disabled - Prevents unnecessary refetches
    refetchOnReconnect: true,
  })

  // Filter clients based on user role
  const filteredData = useMemo(() => {
    if (!query.data?.data) return []
    
    // Admins see all clients
    if (isAdmin) return query.data.data
    
    // Vendedores only see clients assigned to them
    return query.data.data.filter(cliente => 
      cliente.vendedor_id === currentVendedorId && cliente.vendedor_id !== null
    )
  }, [query.data, isAdmin, currentVendedorId])

  return {
    ...query,
    data: filteredData,
    count: query.data?.count || 0
  }
}

export function useCliente(id: string) {
  return useQuery({
    queryKey: ['clientes', id],
    queryFn: () => clientesService.getById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes cache
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  })
}

export function useClientesStageStats() {
  return useQuery({
    queryKey: ['clientes-stage-stats'],
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
      return clientesService.getStageStats(adminId)
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchOnWindowFocus: false,
  })
}

export function useCreateCliente() {
  const queryClient = useQueryClient()
  const { refreshAfterMutation } = useAutoRefresh()
  const createMutation = useMutation({
    mutationFn: clientesService.create,
    onSuccess: async () => {
      await refreshAfterMutation('cliente', 'create')
      // Toast será exibido pelo componente
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar cliente: ${error.message}`)
      queryClient.invalidateQueries({ queryKey: ['clientes'] })
    }
  })

  return createMutation
}

export function useUpdateCliente() {
  const queryClient = useQueryClient()
  const { refreshAfterMutation } = useAutoRefresh()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      clientesService.update(id, data),
    onSuccess: async () => {
      await refreshAfterMutation('cliente', 'update')
      toast.success('Cliente atualizado com sucesso!')
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
      toast.success('Cliente excluído com sucesso!')
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

export function useClientesByVendedor(vendedorId: string) {
  return useQuery({
    queryKey: ['clientes', 'vendedor', vendedorId],
    queryFn: () => clientesService.getAll({ vendedorId }),
    enabled: !!vendedorId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes cache
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  })
}
