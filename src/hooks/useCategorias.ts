import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { categoriasService, type Categoria, type CategoriaCreateData, type CategoriaUpdateData } from '@/services/api/categorias'
import { toast } from 'sonner'

export const useCategorias = () => {
  return useQuery<Categoria[]>({
    queryKey: ['categorias'],
    queryFn: categoriasService.getAll,
    staleTime: 1000 * 60 * 5,
  })
}

export const useCategoria = (id: string) => {
  return useQuery<Categoria | null>({
    queryKey: ['categorias', id],
    queryFn: () => categoriasService.getById(id),
    enabled: !!id,
  })
}

export const useCreateCategoria = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CategoriaCreateData) => categoriasService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categorias'] })
      toast.success('Categoria criada com sucesso!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao criar categoria')
    },
  })
}

export const useUpdateCategoria = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CategoriaUpdateData }) =>
      categoriasService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categorias'] })
      toast.success('Categoria atualizada com sucesso!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao atualizar categoria')
    },
  })
}

export const useDeleteCategoria = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => categoriasService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categorias'] })
      toast.success('Categoria excluída com sucesso!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao excluir categoria')
    },
  })
}
