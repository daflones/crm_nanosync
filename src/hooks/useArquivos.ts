import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { arquivosService, type Arquivo, type ArquivoUpdateData, type CategoriaArquivo, type ArquivoCreateData } from '@/services/api/arquivos'
import { toast } from 'sonner'

export const useArquivos = (filters?: {
  categoria?: CategoriaArquivo
  entity_type?: string
  entity_id?: string
  tags?: string[]
}) => {
  return useQuery<Arquivo[]>({
    queryKey: ['arquivos', filters],
    queryFn: () => arquivosService.getAll(filters),
    staleTime: 1000 * 30, // 30 seconds for real-time updates
    refetchInterval: 1000 * 60, // Refetch every minute
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  })
}

export const useArquivosStats = () => {
  return useQuery({
    queryKey: ['arquivos-stats'],
    queryFn: async () => {
      try {
        // Get all files from arquivos table
        const allFiles = await arquivosService.getAll()
        
        // Calculate stats by category
        const categories = ['propostas', 'contratos', 'marketing', 'produtos', 'relatorios', 'sistema', 'juridico', 'vendas']
        const stats = categories.map(categoria => {
          const categoryFiles = allFiles.filter(file => file.categoria === categoria)
          return {
            categoria,
            count: categoryFiles.length,
            size: categoryFiles.reduce((total, file) => total + (file.tamanho || 0), 0)
          }
        })
        
        const totalFiles = allFiles.length
        const totalSize = allFiles.reduce((sum, file) => sum + (file.tamanho || 0), 0)
        
        // Calculate shared files (is_public = true)
        const sharedFiles = allFiles.filter(file => file.is_public === true).length
        
        // Calculate available space (500GB - used space)
        const maxStorage = 500 * 1024 * 1024 * 1024 // 500GB in bytes
        const availableSpace = maxStorage - totalSize
        
        // Calculate today's downloads from downloaded_at column
        const today = new Date().toISOString().split('T')[0]
        const todayDownloads = allFiles.filter(file => 
          file.downloaded_at && file.downloaded_at.startsWith(today)
        ).reduce((sum, file) => sum + (file.downloaded_times || 0), 0)
        
        return {
          totalFiles,
          totalSize,
          availableSpace,
          sharedFiles,
          todayDownloads,
          categories: stats
        }
      } catch (error) {
        console.error('Error in useArquivosStats:', error)
        return {
          totalFiles: 0,
          totalSize: 0,
          availableSpace: 500 * 1024 * 1024 * 1024, // 500GB
          sharedFiles: 0,
          todayDownloads: 0,
          categories: []
        }
      }
    },
    retry: 1,
    staleTime: 1000 * 30, // 30 seconds for real-time updates
    refetchInterval: 1000 * 60, // Refetch every minute
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  })
}

export const useArquivo = (id: string) => {
  return useQuery<Arquivo | null>({
    queryKey: ['arquivos', id],
    queryFn: () => arquivosService.getById(id),
    enabled: !!id,
    staleTime: 1000 * 30, // 30 seconds for real-time updates
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  })
}

export const useUploadArquivo = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ file, data }: { 
      file: File
      data: ArquivoCreateData
    }) => arquivosService.upload(file, data),
    onSuccess: () => {
      // Immediately refetch data for real-time updates
      queryClient.invalidateQueries({ queryKey: ['arquivos'] })
      queryClient.invalidateQueries({ queryKey: ['arquivos-stats'] })
      queryClient.refetchQueries({ queryKey: ['arquivos'] })
      queryClient.refetchQueries({ queryKey: ['arquivos-stats'] })
      toast.success('Arquivo enviado com sucesso!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao enviar arquivo')
      // Refetch data even on error to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['arquivos'] })
      queryClient.invalidateQueries({ queryKey: ['arquivos-stats'] })
    },
  })
}

export const useUpdateArquivo = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ArquivoUpdateData }) =>
      arquivosService.update(id, data),
    onSuccess: () => {
      // Immediately refetch data for real-time updates
      queryClient.invalidateQueries({ queryKey: ['arquivos'] })
      queryClient.invalidateQueries({ queryKey: ['arquivos-stats'] })
      queryClient.refetchQueries({ queryKey: ['arquivos'] })
      queryClient.refetchQueries({ queryKey: ['arquivos-stats'] })
      toast.success('Arquivo atualizado com sucesso!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao atualizar arquivo')
      // Refetch data even on error to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['arquivos'] })
      queryClient.invalidateQueries({ queryKey: ['arquivos-stats'] })
    },
  })
}

export const useDeleteArquivo = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => arquivosService.delete(id),
    onSuccess: () => {
      // Immediately refetch data for real-time updates
      queryClient.invalidateQueries({ queryKey: ['arquivos'] })
      queryClient.invalidateQueries({ queryKey: ['arquivos-stats'] })
      queryClient.refetchQueries({ queryKey: ['arquivos'] })
      queryClient.refetchQueries({ queryKey: ['arquivos-stats'] })
      toast.success('Arquivo excluído com sucesso!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao excluir arquivo')
      // Refetch data even on error to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['arquivos'] })
      queryClient.invalidateQueries({ queryKey: ['arquivos-stats'] })
    },
  })
}
