import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { vendedoresService, type Vendedor, type VendedorCreateData, type VendedorUpdateData } from '@/services/api/vendedores'
import { toast } from 'sonner'

export const useVendedores = () => {
  return useQuery<Vendedor[]>({
    queryKey: ['vendedores'],
    queryFn: vendedoresService.getAll,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

export const useVendedor = (id: string) => {
  return useQuery<Vendedor | null>({
    queryKey: ['vendedores', id],
    queryFn: () => vendedoresService.getById(id),
    enabled: !!id,
  })
}

export const useCreateVendedor = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: VendedorCreateData) => vendedoresService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendedores'] })
      toast.success('Vendedor criado com sucesso!')
    },
    onError: (error: Error) => {
      // Não mostrar toast aqui, deixar o componente tratar
      console.error('Erro no hook useCreateVendedor:', error)
    },
  })
}

export const useUpdateVendedor = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: VendedorUpdateData }) =>
      vendedoresService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendedores'] })
      toast.success('Vendedor atualizado com sucesso!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao atualizar vendedor')
    },
  })
}

export const useDeleteVendedor = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => vendedoresService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendedores'] })
      toast.success('Vendedor excluído com sucesso!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao excluir vendedor')
    },
  })
}

export const useVendedorPerformance = (vendedorId: string, periodo?: { inicio: string; fim: string }) => {
  return useQuery({
    queryKey: ['vendedores', vendedorId, 'performance', periodo],
    queryFn: () => vendedoresService.getPerformance(vendedorId, periodo),
    enabled: !!vendedorId,
  })
}

export const useVendedorWithPerformance = (vendedorId: string) => {
  return useQuery({
    queryKey: ['vendedores', vendedorId, 'with-performance'],
    queryFn: () => vendedoresService.getVendedorWithPerformance(vendedorId),
    enabled: !!vendedorId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  })
}

export const useVendedoresStats = () => {
  return useQuery({
    queryKey: ['vendedores', 'stats'],
    queryFn: vendedoresService.getStats,
    staleTime: 1000 * 60 * 2, // 2 minutes
  })
}
