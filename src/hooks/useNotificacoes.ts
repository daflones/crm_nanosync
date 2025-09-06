import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { NotificacaoService, type Notificacao, type NotificacaoCreateData, type NotificacaoFilters } from '@/services/api/notificacoes'
import { useAuthStore } from '@/stores/authStore'
import { toast } from 'sonner'

// Hook para buscar notificações
export function useNotificacoes(
  filtros: NotificacaoFilters = {},
  page = 1,
  limit = 20
) {
  const { user } = useAuthStore()
  
  return useQuery({
    queryKey: ['notificacoes', user?.id, filtros, page, limit],
    queryFn: () => NotificacaoService.buscarNotificacoes(user!.id, filtros, page, limit),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutos
  })
}

// Hook para contar notificações não lidas
export function useNotificacoesNaoLidas() {
  const { user } = useAuthStore()
  
  return useQuery({
    queryKey: ['notificacoes-nao-lidas', user?.id],
    queryFn: () => NotificacaoService.contarNaoLidas(user!.id),
    enabled: !!user?.id,
    refetchInterval: 1000 * 30, // Atualizar a cada 30 segundos
  })
}

// Hook para buscar notificações recentes
export function useNotificacoesRecentes() {
  const { user } = useAuthStore()
  
  return useQuery({
    queryKey: ['notificacoes-recentes', user?.id],
    queryFn: () => NotificacaoService.buscarRecentes(user!.id),
    enabled: !!user?.id,
    refetchInterval: 1000 * 60, // Atualizar a cada minuto
  })
}

// Hook para estatísticas de notificações
export function useEstatisticasNotificacoes() {
  const { user } = useAuthStore()
  
  return useQuery({
    queryKey: ['notificacoes-estatisticas', user?.id],
    queryFn: () => NotificacaoService.obterEstatisticas(user!.id),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 10, // 10 minutos
  })
}

// Hook para criar notificação
export function useCreateNotificacao() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  
  return useMutation({
    mutationFn: (dados: Omit<NotificacaoCreateData, 'user_id'>) => 
      NotificacaoService.criarNotificacao({
        ...dados,
        user_id: user!.id
      }),
    onSuccess: (data) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['notificacoes'] })
      queryClient.invalidateQueries({ queryKey: ['notificacoes-nao-lidas'] })
      queryClient.invalidateQueries({ queryKey: ['notificacoes-recentes'] })
      
      // Mostrar toast baseado no tipo
      const toastType = NotificacaoService.getToastType(data.tipo)
      toast[toastType](data.titulo, {
        description: data.descricao
      })
    },
    onError: (error) => {
      console.error('Erro ao criar notificação:', error)
      toast.error('Erro ao criar notificação')
    }
  })
}

// Hook para marcar como lida
export function useMarcarComoLida() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: NotificacaoService.marcarComoLida,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificacoes'] })
      queryClient.invalidateQueries({ queryKey: ['notificacoes-nao-lidas'] })
      queryClient.invalidateQueries({ queryKey: ['notificacoes-recentes'] })
    },
    onError: (error) => {
      console.error('Erro ao marcar como lida:', error)
      toast.error('Erro ao marcar notificação como lida')
    }
  })
}

// Hook para marcar todas como lidas
export function useMarcarTodasComoLidas() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  
  return useMutation({
    mutationFn: () => NotificacaoService.marcarTodasComoLidas(user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificacoes'] })
      queryClient.invalidateQueries({ queryKey: ['notificacoes-nao-lidas'] })
      queryClient.invalidateQueries({ queryKey: ['notificacoes-recentes'] })
      toast.success('Todas as notificações foram marcadas como lidas')
    },
    onError: (error) => {
      console.error('Erro ao marcar todas como lidas:', error)
      toast.error('Erro ao marcar todas as notificações como lidas')
    }
  })
}

// Hook para apagar notificação
export function useApagarNotificacao() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: NotificacaoService.apagarNotificacao,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificacoes'] })
      queryClient.invalidateQueries({ queryKey: ['notificacoes-nao-lidas'] })
      queryClient.invalidateQueries({ queryKey: ['notificacoes-recentes'] })
      toast.success('Notificação removida')
    },
    onError: (error) => {
      console.error('Erro ao apagar notificação:', error)
      toast.error('Erro ao remover notificação')
    }
  })
}

// Hook para apagar todas as notificações
export function useApagarTodasNotificacoes() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  
  return useMutation({
    mutationFn: () => NotificacaoService.apagarTodasNotificacoes(user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificacoes'] })
      queryClient.invalidateQueries({ queryKey: ['notificacoes-nao-lidas'] })
      queryClient.invalidateQueries({ queryKey: ['notificacoes-recentes'] })
      toast.success('Todas as notificações foram removidas')
    },
    onError: (error) => {
      console.error('Erro ao apagar todas as notificações:', error)
      toast.error('Erro ao remover todas as notificações')
    }
  })
}

// Hook para executar verificações automáticas
export function useVerificacoesAutomaticas() {
  return useMutation({
    mutationFn: NotificacaoService.executarVerificacoes,
    onSuccess: () => {
      toast.success('Verificações automáticas executadas')
    },
    onError: (error) => {
      console.error('Erro ao executar verificações:', error)
      toast.error('Erro ao executar verificações automáticas')
    }
  })
}

// Hook personalizado para gerenciar notificações em tempo real
export function useNotificacoesRealTime() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    if (!user?.id) return

    // Configurar listener para notificações em tempo real
    const { supabase } = require('@/lib/supabase')
    
    const channel = supabase
      .channel('notificacoes-realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notificacoes',
        filter: `user_id=eq.${user.id}`
      }, (payload: any) => {
        const notificacao = payload.new as Notificacao
        
        // Invalidar queries para atualizar a UI
        queryClient.invalidateQueries({ queryKey: ['notificacoes'] })
        queryClient.invalidateQueries({ queryKey: ['notificacoes-nao-lidas'] })
        queryClient.invalidateQueries({ queryKey: ['notificacoes-recentes'] })
        
        // Mostrar toast
        const toastType = NotificacaoService.getToastType(notificacao.tipo)
        toast[toastType](notificacao.titulo, {
          description: notificacao.descricao
        })
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'notificacoes',
        filter: `user_id=eq.${user.id}`
      }, () => {
        // Atualizar queries quando notificações são marcadas como lidas
        queryClient.invalidateQueries({ queryKey: ['notificacoes'] })
        queryClient.invalidateQueries({ queryKey: ['notificacoes-nao-lidas'] })
      })
      .subscribe((status: string) => {
        setIsConnected(status === 'SUBSCRIBED')
      })

    return () => {
      supabase.removeChannel(channel)
      setIsConnected(false)
    }
  }, [user?.id, queryClient])

  return { isConnected }
}

// Hook para executar verificações periódicas
export function useVerificacoesPeriodicas() {
  const executarVerificacoes = useVerificacoesAutomaticas()

  useEffect(() => {
    // Executar verificações a cada 5 minutos
    const interval = setInterval(() => {
      executarVerificacoes.mutate()
    }, 1000 * 60 * 5)

    // Executar uma vez ao inicializar
    executarVerificacoes.mutate()

    return () => clearInterval(interval)
  }, [])

  return executarVerificacoes
}
