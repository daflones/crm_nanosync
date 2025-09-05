import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { segmentosService, type Segmento, type SegmentoCreateData, type SegmentoUpdateData } from '@/services/api/segmentos'
import { toast } from 'sonner'

export const useSegmentos = () => {
  return useQuery<Segmento[]>({
    queryKey: ['segmentos'],
    queryFn: segmentosService.getAll,
    staleTime: 1000 * 60 * 5,
  })
}

export const useSegmento = (id: string) => {
  return useQuery<Segmento | null>({
    queryKey: ['segmentos', id],
    queryFn: () => segmentosService.getById(id),
    enabled: !!id,
  })
}

export const useCreateSegmento = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: SegmentoCreateData) => segmentosService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['segmentos'] })
      toast.success('Segmento criado com sucesso!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao criar segmento')
    },
  })
}

export const useUpdateSegmento = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: SegmentoUpdateData }) =>
      segmentosService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['segmentos'] })
      toast.success('Segmento atualizado com sucesso!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao atualizar segmento')
    },
  })
}

export const useDeleteSegmento = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => segmentosService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['segmentos'] })
      toast.success('Segmento excluído com sucesso!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao excluir segmento')
    },
  })
}
