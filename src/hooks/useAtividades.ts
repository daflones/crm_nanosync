import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { AtividadeService, type AtividadeData } from '../services/api/atividades'

// Query keys
const QUERY_KEYS = {
  atividades: ['atividades'] as const,
  atividadesPaginated: (filters?: any) => ['atividades', 'paginated', filters] as const,
}

// Interface para filtros de atividades
export interface AtividadesFilters {
  entidade_tipo?: string
  entidade_id?: string
  usuario_id?: string
  acao?: string
  search?: string
  page?: number
  limit?: number
  entityType?: string
  action?: string
}

// Hook para buscar atividades com paginação e filtros
export const useAtividades = (filters?: AtividadesFilters) => {
  return useQuery({
    queryKey: QUERY_KEYS.atividadesPaginated(filters),
    queryFn: async () => {
      const result = await AtividadeService.buscarAtividades(filters)
      // Resolver nomes automaticamente
      const atividadesComNomes = await AtividadeService.resolverNomes(result.atividades || [])
      return {
        ...result,
        atividades: atividadesComNomes
      }
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // 1 minute
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  })
}

// Hook para buscar atividades simples (sem paginação)
export const useAtividadesSimples = (filters?: Omit<AtividadesFilters, 'page' | 'limit'>) => {
  return useQuery({
    queryKey: [...QUERY_KEYS.atividades, filters],
    queryFn: async () => {
      const atividades = await AtividadeService.buscarAtividadesSimples(filters)
      return AtividadeService.resolverNomes(atividades)
    },
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  })
}

// Hook para registrar uma nova atividade
export const useRegistrarAtividade = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: AtividadeData) => AtividadeService.registrar(data),
    onSuccess: () => {
      // Invalidar todas as queries de atividades para atualizar a lista
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.atividades })
      queryClient.invalidateQueries({ queryKey: ['atividades', 'paginated'] })
    },
    onError: (error) => {
      console.error('Erro ao registrar atividade:', error)
      toast.error('Erro ao registrar atividade')
    },
  })
}

// Hooks para ações específicas
export const useCriarAtividade = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ entidade_tipo, entidade_id, dados_novos, descricao }: {
      entidade_tipo: string
      entidade_id: string
      dados_novos: any
      descricao?: string
    }) => AtividadeService.criar(entidade_tipo, entidade_id, dados_novos, descricao),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.atividades })
      queryClient.invalidateQueries({ queryKey: ['atividades', 'paginated'] })
    },
    onError: (error) => {
      console.error('Erro ao registrar atividade de criação:', error)
    },
  })
}

export const useEditarAtividade = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ entidade_tipo, entidade_id, dados_anteriores, dados_novos, descricao }: {
      entidade_tipo: string
      entidade_id: string
      dados_anteriores: any
      dados_novos: any
      descricao?: string
    }) => AtividadeService.editar(entidade_tipo, entidade_id, dados_anteriores, dados_novos, descricao),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.atividades })
      queryClient.invalidateQueries({ queryKey: ['atividades', 'paginated'] })
    },
    onError: (error) => {
      console.error('Erro ao registrar atividade de edição:', error)
    },
  })
}

export const useDeletarAtividade = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ entidade_tipo, entidade_id, dados_anteriores, descricao }: {
      entidade_tipo: string
      entidade_id: string
      dados_anteriores: any
      descricao?: string
    }) => AtividadeService.deletar(entidade_tipo, entidade_id, dados_anteriores, descricao),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.atividades })
      queryClient.invalidateQueries({ queryKey: ['atividades', 'paginated'] })
    },
    onError: (error) => {
      console.error('Erro ao registrar atividade de exclusão:', error)
    },
  })
}

export const useEnviarAtividade = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ entidade_tipo, entidade_id, metadata, descricao }: {
      entidade_tipo: string
      entidade_id: string
      metadata?: any
      descricao?: string
    }) => AtividadeService.enviar(entidade_tipo, entidade_id, metadata, descricao),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.atividades })
      queryClient.invalidateQueries({ queryKey: ['atividades', 'paginated'] })
    },
    onError: (error) => {
      console.error('Erro ao registrar atividade de envio:', error)
    },
  })
}

export const useAprovarAtividade = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ entidade_tipo, entidade_id, dados_anteriores, dados_novos, descricao }: {
      entidade_tipo: string
      entidade_id: string
      dados_anteriores: any
      dados_novos: any
      descricao?: string
    }) => AtividadeService.aprovar(entidade_tipo, entidade_id, dados_anteriores, dados_novos, descricao),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.atividades })
      queryClient.invalidateQueries({ queryKey: ['atividades', 'paginated'] })
    },
    onError: (error) => {
      console.error('Erro ao registrar atividade de aprovação:', error)
    },
  })
}

export const useUploadAtividade = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ entidade_tipo, entidade_id, metadata, descricao }: {
      entidade_tipo: string
      entidade_id: string
      metadata: any
      descricao?: string
    }) => AtividadeService.upload(entidade_tipo, entidade_id, metadata, descricao),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.atividades })
      queryClient.invalidateQueries({ queryKey: ['atividades', 'paginated'] })
    },
    onError: (error) => {
      console.error('Erro ao registrar atividade de upload:', error)
    },
  })
}

export const useDownloadAtividade = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ entidade_tipo, entidade_id, metadata, descricao }: {
      entidade_tipo: string
      entidade_id: string
      metadata?: any
      descricao?: string
    }) => AtividadeService.download(entidade_tipo, entidade_id, metadata, descricao),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.atividades })
      queryClient.invalidateQueries({ queryKey: ['atividades', 'paginated'] })
    },
    onError: (error) => {
      console.error('Erro ao registrar atividade de download:', error)
    },
  })
}

// Hook para atividades de autenticação
export const useLoginAtividade = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (descricao?: string) => AtividadeService.login(descricao),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.atividades })
      queryClient.invalidateQueries({ queryKey: ['atividades', 'paginated'] })
    },
    onError: (error) => {
      console.error('Erro ao registrar atividade de login:', error)
    },
  })
}

export const useLogoutAtividade = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (descricao?: string) => AtividadeService.logout(descricao),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.atividades })
      queryClient.invalidateQueries({ queryKey: ['atividades', 'paginated'] })
    },
    onError: (error) => {
      console.error('Erro ao registrar atividade de logout:', error)
    },
  })
}

// Hook combinado para facilitar o uso
export const useAtividadesActions = () => {
  return {
    registrar: useRegistrarAtividade(),
    criar: useCriarAtividade(),
    editar: useEditarAtividade(),
    deletar: useDeletarAtividade(),
    enviar: useEnviarAtividade(),
    aprovar: useAprovarAtividade(),
    upload: useUploadAtividade(),
    download: useDownloadAtividade(),
    login: useLoginAtividade(),
    logout: useLogoutAtividade(),
  }
}
