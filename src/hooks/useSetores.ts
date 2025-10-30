import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { SetorService, type Setor, type SetorCreateData, type SetorUpdateData } from '@/services/api/setores'
import { toast } from 'sonner'

export function useSetores() {
  return useQuery({
    queryKey: ['setores'],
    queryFn: SetorService.getAll,
    staleTime: 1000 * 60 * 5, // 5 minutos
  })
}

export function useSetor(id: string) {
  return useQuery({
    queryKey: ['setores', id],
    queryFn: () => SetorService.getById(id),
    enabled: !!id,
  })
}

export function useSetoresAtivos() {
  return useQuery({
    queryKey: ['setores', 'ativos'],
    queryFn: SetorService.getSetoresAtivos,
    staleTime: 1000 * 60 * 5, // 5 minutos
  })
}

export function useCreateSetor() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: SetorCreateData) => SetorService.create(data),
    onSuccess: (newSetor) => {
      queryClient.invalidateQueries({ queryKey: ['setores'] })
      toast.success(`Setor "${newSetor.nome}" criado com sucesso!`)
    },
    onError: (error: any) => {
      console.error('Erro ao criar setor:', error)
      const message = error?.message || 'Erro ao criar setor'
      toast.error(message)
    },
  })
}

export function useUpdateSetor() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: SetorUpdateData }) => 
      SetorService.update(id, data),
    onSuccess: (updatedSetor) => {
      queryClient.invalidateQueries({ queryKey: ['setores'] })
      queryClient.invalidateQueries({ queryKey: ['setores', updatedSetor.id] })
      toast.success(`Setor "${updatedSetor.nome}" atualizado com sucesso!`)
    },
    onError: (error: any) => {
      console.error('Erro ao atualizar setor:', error)
      const message = error?.message || 'Erro ao atualizar setor'
      toast.error(message)
    },
  })
}

export function useDeleteSetor() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => SetorService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['setores'] })
      toast.success('Setor excluído com sucesso!')
    },
    onError: (error: any) => {
      console.error('Erro ao excluir setor:', error)
      const message = error?.message || 'Erro ao excluir setor'
      toast.error(message)
    },
  })
}

export function useToggleSetorStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => SetorService.toggleStatus(id),
    onSuccess: (updatedSetor) => {
      queryClient.invalidateQueries({ queryKey: ['setores'] })
      queryClient.invalidateQueries({ queryKey: ['setores', updatedSetor.id] })
      const status = updatedSetor.ativo ? 'ativado' : 'desativado'
      toast.success(`Setor "${updatedSetor.nome}" ${status} com sucesso!`)
    },
    onError: (error: any) => {
      console.error('Erro ao alterar status do setor:', error)
      const message = error?.message || 'Erro ao alterar status do setor'
      toast.error(message)
    },
  })
}
