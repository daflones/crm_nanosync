import { supabase } from '@/lib/supabase'

export interface Notificacao {
  id: string
  user_id: string
  tipo: 'agendamento_criado' | 'agendamento_hoje' | 'agendamento_expirado' | 'agendamento_atualizado' |
        'proposta_criada' | 'proposta_mudou_categoria' | 'proposta_aprovada' | 
        'proposta_recusada' | 'proposta_negociacao' | 'proposta_expirada' | 'proposta_atualizada' |
        'cliente_criado' | 'cliente_atualizado' | 
        'vendedor_criado' | 'vendedor_atualizado' |
        'categoria_criada' | 'categoria_atualizada' |
        'segmento_criado' | 'segmento_atualizado' |
        'produto_criado' | 'produto_atualizado' |
        'sistema' | 'erro' | 'sucesso' | 'aviso'
  categoria: 'agendamento' | 'proposta' | 'cliente' | 'sistema' | 'geral'
  titulo: string
  descricao?: string
  dados_extras?: Record<string, any>
  referencia_id?: string
  referencia_tipo?: string
  prioridade: 'baixa' | 'normal' | 'alta' | 'urgente'
  lida: boolean
  ip_origem?: string
  user_agent?: string
  created_at: string
  lida_em?: string
  expires_at: string
}

export interface NotificacaoCreateData {
  user_id: string
  tipo: Notificacao['tipo']
  categoria: Notificacao['categoria']
  titulo: string
  descricao?: string
  dados_extras?: Record<string, any>
  referencia_id?: string
  referencia_tipo?: string
  prioridade?: Notificacao['prioridade']
}

export interface NotificacaoFilters {
  categoria?: string
  tipo?: string
  lida?: boolean
  prioridade?: string
  data_inicio?: string
  data_fim?: string
}

export class NotificacaoService {
  // Buscar notificações do usuário
  static async buscarNotificacoes(
    userId: string, 
    filtros: NotificacaoFilters = {},
    page = 1,
    limit = 20
  ) {
    try {
      let query = supabase
        .from('notificacoes')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      // Aplicar filtros
      if (filtros.categoria) {
        query = query.eq('categoria', filtros.categoria)
      }
      if (filtros.tipo) {
        query = query.eq('tipo', filtros.tipo)
      }
      if (filtros.lida !== undefined) {
        query = query.eq('lida', filtros.lida)
      }
      if (filtros.prioridade) {
        query = query.eq('prioridade', filtros.prioridade)
      }
      if (filtros.data_inicio) {
        query = query.gte('created_at', filtros.data_inicio)
      }
      if (filtros.data_fim) {
        query = query.lte('created_at', filtros.data_fim)
      }

      // Paginação
      const offset = (page - 1) * limit
      query = query.range(offset, offset + limit - 1)

      const { data, error, count } = await query

      if (error) throw error

      return {
        data: data as Notificacao[],
        count,
        page,
        limit,
        totalPages: count ? Math.ceil(count / limit) : 0
      }
    } catch (error) {
      console.error('Erro ao buscar notificações:', error)
      throw error
    }
  }

  // Contar notificações não lidas
  static async contarNaoLidas(userId: string) {
    try {
      const { count, error } = await supabase
        .from('notificacoes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('lida', false)

      if (error) throw error

      return count || 0
    } catch (error) {
      console.error('Erro ao contar notificações não lidas:', error)
      throw error
    }
  }

  // Criar notificação
  static async criarNotificacao(dados: NotificacaoCreateData) {
    try {
      // Adicionar metadados se disponíveis
      const notificacao = {
        ...dados,
        prioridade: dados.prioridade || 'normal',
        ip_origem: this.getClientIP(),
        user_agent: navigator.userAgent
      }

      const { data, error } = await supabase
        .from('notificacoes')
        .insert(notificacao)
        .select()
        .single()

      if (error) throw error

      return data as Notificacao
    } catch (error) {
      console.error('Erro ao criar notificação:', error)
      throw error
    }
  }

  // Marcar como lida
  static async marcarComoLida(notificacaoId: string) {
    try {
      const { data, error } = await supabase
        .from('notificacoes')
        .update({ 
          lida: true, 
          lida_em: new Date().toISOString() 
        })
        .eq('id', notificacaoId)
        .select()
        .single()

      if (error) throw error

      return data as Notificacao
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error)
      throw error
    }
  }

  // Marcar todas como lidas
  static async marcarTodasComoLidas(userId: string) {
    try {
      const { data, error } = await supabase
        .from('notificacoes')
        .update({ 
          lida: true, 
          lida_em: new Date().toISOString() 
        })
        .eq('user_id', userId)
        .eq('lida', false)
        .select()

      if (error) throw error

      return data as Notificacao[]
    } catch (error) {
      console.error('Erro ao marcar todas as notificações como lidas:', error)
      throw error
    }
  }

  // Apagar notificação
  static async apagarNotificacao(notificacaoId: string) {
    try {
      const { error } = await supabase
        .from('notificacoes')
        .delete()
        .eq('id', notificacaoId)

      if (error) throw error

      return true
    } catch (error) {
      console.error('Erro ao apagar notificação:', error)
      throw error
    }
  }

  // Apagar todas as notificações
  static async apagarTodasNotificacoes(userId: string) {
    try {
      const { error } = await supabase
        .from('notificacoes')
        .delete()
        .eq('user_id', userId)

      if (error) throw error

      return true
    } catch (error) {
      console.error('Erro ao apagar todas as notificações:', error)
      throw error
    }
  }

  // Executar verificações automáticas
  static async executarVerificacoes() {
    try {
      // Verificar agendamentos expirados
      await supabase.rpc('verificar_agendamentos_expirados')
      
      // Verificar agendamentos de hoje
      await supabase.rpc('verificar_agendamentos_hoje')
      
      // Limpar notificações expiradas
      await supabase.rpc('cleanup_expired_notifications')

      return true
    } catch (error) {
      console.error('Erro ao executar verificações automáticas:', error)
      throw error
    }
  }

  // Buscar notificações recentes (últimas 10)
  static async buscarRecentes(userId: string) {
    try {
      const { data, error } = await supabase
        .from('notificacoes')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error

      return data as Notificacao[]
    } catch (error) {
      console.error('Erro ao buscar notificações recentes:', error)
      throw error
    }
  }

  // Obter estatísticas de notificações
  static async obterEstatisticas(userId: string) {
    try {
      const [total, naoLidas, porCategoria, porPrioridade] = await Promise.all([
        // Total de notificações
        supabase
          .from('notificacoes')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId),
        
        // Não lidas
        supabase
          .from('notificacoes')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('lida', false),
        
        // Por categoria
        supabase
          .from('notificacoes')
          .select('categoria')
          .eq('user_id', userId),
        
        // Por prioridade
        supabase
          .from('notificacoes')
          .select('prioridade')
          .eq('user_id', userId)
      ])

      // Processar estatísticas por categoria
      const categorias = porCategoria.data?.reduce((acc: any, item: any) => {
        acc[item.categoria] = (acc[item.categoria] || 0) + 1
        return acc
      }, {} as Record<string, number>) || {}

      // Processar estatísticas por prioridade
      const prioridades = porPrioridade.data?.reduce((acc: any, item: any) => {
        acc[item.prioridade] = (acc[item.prioridade] || 0) + 1
        return acc
      }, {} as Record<string, number>) || {}

      return {
        total: total.count || 0,
        naoLidas: naoLidas.count || 0,
        lidas: (total.count || 0) - (naoLidas.count || 0),
        porCategoria: categorias,
        porPrioridade: prioridades
      }
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error)
      throw error
    }
  }

  // Função auxiliar para obter IP do cliente (simplificada)
  private static getClientIP(): string | undefined {
    // Em um ambiente real, isso seria obtido do servidor
    // Por enquanto, retornamos undefined
    return undefined
  }

  // Mapear tipo de notificação para tipo de toast
  static getToastType(tipo: Notificacao['tipo']): 'success' | 'error' | 'warning' | 'info' {
    const typeMap: Record<Notificacao['tipo'], 'success' | 'error' | 'warning' | 'info'> = {
      'agendamento_criado': 'success',
      'agendamento_hoje': 'info',
      'agendamento_expirado': 'warning',
      'agendamento_atualizado': 'info',
      'proposta_criada': 'success',
      'proposta_mudou_categoria': 'info',
      'proposta_aprovada': 'success',
      'proposta_recusada': 'error',
      'proposta_negociacao': 'info',
      'proposta_expirada': 'warning',
      'proposta_atualizada': 'info',
      'cliente_criado': 'success',
      'cliente_atualizado': 'info',
      'vendedor_criado': 'success',
      'vendedor_atualizado': 'info',
      'categoria_criada': 'success',
      'categoria_atualizada': 'info',
      'segmento_criado': 'success',
      'segmento_atualizado': 'info',
      'produto_criado': 'success',
      'produto_atualizado': 'info',
      'sistema': 'info',
      'erro': 'error',
      'sucesso': 'success',
      'aviso': 'warning'
    }
    return typeMap[tipo] || 'info'
  }

  // Obter cor da prioridade
  static getPriorityColor(prioridade: Notificacao['prioridade']): string {
    const colors = {
      'baixa': 'text-gray-500',
      'normal': 'text-blue-500',
      'alta': 'text-orange-500',
      'urgente': 'text-red-500'
    }

    return colors[prioridade] || colors.normal
  }

  // Obter ícone da categoria
  static getCategoryIcon(categoria: Notificacao['categoria']): string {
    const icons = {
      'agendamento': 'calendar',
      'proposta': 'file-text',
      'cliente': 'user',
      'sistema': 'settings',
      'geral': 'bell'
    }

    return icons[categoria] || icons.geral
  }
}
