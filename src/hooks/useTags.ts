import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getTags, getAllTags, getTag, createTag, updateTag, deleteTag, reorderTags } from '@/services/api/tags'
import type { TagCreateData, TagUpdateData } from '@/types/tag'
import { toast } from 'sonner'

// Hook para buscar tags ativas
export const useTags = () => {
  return useQuery({
    queryKey: ['tags'],
    queryFn: async () => {
      const { data, error } = await getTags()
      if (error) throw error
      return data || []
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  })
}

// Hook para buscar todas as tags (incluindo inativas)
export const useAllTags = () => {
  return useQuery({
    queryKey: ['tags', 'all'],
    queryFn: async () => {
      const { data, error } = await getAllTags()
      if (error) throw error
      return data || []
    },
    staleTime: 5 * 60 * 1000,
  })
}

// Hook para buscar uma tag específica
export const useTag = (id: string) => {
  return useQuery({
    queryKey: ['tags', id],
    queryFn: async () => {
      const { data, error } = await getTag(id)
      if (error) throw error
      return data
    },
    enabled: !!id,
  })
}

// Hook para criar tag
export const useCreateTag = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (tagData: TagCreateData) => createTag(tagData),
    onSuccess: (response) => {
      if (response.error) {
        toast.error(response.error.message || 'Erro ao criar tag')
        return
      }
      queryClient.invalidateQueries({ queryKey: ['tags'] })
      toast.success('Tag criada com sucesso!')
    },
    onError: (error: any) => {
      console.error('Erro ao criar tag:', error)
      toast.error('Erro ao criar tag')
    },
  })
}

// Hook para atualizar tag
export const useUpdateTag = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: TagUpdateData }) => updateTag(id, data),
    onSuccess: (response) => {
      if (response.error) {
        toast.error(response.error.message || 'Erro ao atualizar tag')
        return
      }
      queryClient.invalidateQueries({ queryKey: ['tags'] })
      toast.success('Tag atualizada com sucesso!')
    },
    onError: (error: any) => {
      console.error('Erro ao atualizar tag:', error)
      toast.error('Erro ao atualizar tag')
    },
  })
}

// Hook para deletar tag
export const useDeleteTag = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteTag(id),
    onSuccess: (response) => {
      if (response.error) {
        toast.error('Erro ao deletar tag')
        return
      }
      queryClient.invalidateQueries({ queryKey: ['tags'] })
      toast.success('Tag deletada com sucesso!')
    },
    onError: (error: any) => {
      console.error('Erro ao deletar tag:', error)
      toast.error('Erro ao deletar tag')
    },
  })
}

// Hook para reordenar tags
export const useReorderTags = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (tags: { id: string; ordem: number }[]) => reorderTags(tags),
    onSuccess: (response) => {
      if (response.error) {
        toast.error('Erro ao reordenar tags')
        return
      }
      queryClient.invalidateQueries({ queryKey: ['tags'] })
    },
    onError: (error: any) => {
      console.error('Erro ao reordenar tags:', error)
      toast.error('Erro ao reordenar tags')
    },
  })
}
