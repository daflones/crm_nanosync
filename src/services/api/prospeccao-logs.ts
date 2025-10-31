import { supabase } from '@/lib/supabase'

interface LogProspeccao {
  id: string
  profile_id: string
  place_id: string
  nome_estabelecimento: string
  endereco: string
  telefone?: string
  whatsapp_valido: boolean
  jid?: string
  mensagem_enviada: boolean
  cliente_salvo: boolean
  cliente_id?: string
  data_prospeccao: string
  tipo_estabelecimento: string
  cidade: string
  observacoes?: string
  created_at: string
  updated_at: string
}

interface LogProspeccaoCreateData {
  place_id: string
  nome_estabelecimento: string
  endereco: string
  telefone?: string
  whatsapp_valido: boolean
  jid?: string
  mensagem_enviada: boolean
  cliente_salvo: boolean
  cliente_id?: string
  tipo_estabelecimento: string
  cidade: string
  observacoes?: string
}

export const prospeccaoLogsService = {
  // Verificar se um estabelecimento já foi prospectado pelo usuário
  async verificarJaProspectado(placeId: string): Promise<boolean> {
    try {
      // Get current user's profile
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      if (!currentUser) {
        throw new Error('Usuário não autenticado')
      }

      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('id, admin_profile_id')
        .eq('id', currentUser.id)
        .single()

      if (!currentProfile) {
        throw new Error('Perfil não encontrado')
      }

      const profileId = currentProfile.admin_profile_id || currentProfile.id

      const { data, error } = await supabase
        .from('logs_prospeccao')
        .select('id')
        .eq('profile_id', profileId)
        .eq('place_id', placeId)
        .limit(1)

      if (error) {
        console.error('Erro ao verificar prospecção:', error)
        return false // Em caso de erro, não bloquear
      }

      return data && data.length > 0
    } catch (error) {
      console.error('Erro ao verificar prospecção:', error)
      return false
    }
  },

  // Salvar log de prospecção
  async salvarLog(logData: LogProspeccaoCreateData): Promise<LogProspeccao> {
    try {
      // Get current user's profile
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      if (!currentUser) {
        throw new Error('Usuário não autenticado')
      }

      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('id, admin_profile_id')
        .eq('id', currentUser.id)
        .single()

      if (!currentProfile) {
        throw new Error('Perfil não encontrado')
      }

      const profileId = currentProfile.admin_profile_id || currentProfile.id

      const insertData = {
        ...logData,
        profile_id: profileId,
        data_prospeccao: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('logs_prospeccao')
        .insert(insertData)
        .select()
        .single()

      if (error) {
        console.error('Erro ao salvar log de prospecção:', error)
        throw new Error(`Erro ao salvar log: ${error.message}`)
      }

      return data
    } catch (error) {
      console.error('Erro ao salvar log de prospecção:', error)
      throw error
    }
  },

  // Buscar logs de prospecção do usuário
  async buscarLogs(filtros?: {
    tipo_estabelecimento?: string
    cidade?: string
    whatsapp_valido?: boolean
    mensagem_enviada?: boolean
    cliente_salvo?: boolean
    data_inicio?: string
    data_fim?: string
    page?: number
    limit?: number
  }): Promise<{ data: LogProspeccao[], count: number }> {
    try {
      console.log('📋 Buscando logs com filtros:', filtros)
      
      // Get current user's profile
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      if (!currentUser) {
        throw new Error('Usuário não autenticado')
      }

      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('id, admin_profile_id')
        .eq('id', currentUser.id)
        .single()

      if (!currentProfile) {
        throw new Error('Perfil não encontrado')
      }

      const profileId = currentProfile.admin_profile_id || currentProfile.id

      const page = filtros?.page || 1
      const limit = filtros?.limit || 50
      const offset = (page - 1) * limit

      let query = supabase
        .from('logs_prospeccao')
        .select('*', { count: 'exact' })
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      // Aplicar filtros
      if (filtros?.tipo_estabelecimento) {
        query = query.ilike('tipo_estabelecimento', `%${filtros.tipo_estabelecimento}%`)
      }
      if (filtros?.cidade) {
        query = query.ilike('cidade', `%${filtros.cidade}%`)
      }
      if (filtros?.whatsapp_valido !== undefined) {
        query = query.eq('whatsapp_valido', filtros.whatsapp_valido)
      }
      if (filtros?.mensagem_enviada !== undefined) {
        query = query.eq('mensagem_enviada', filtros.mensagem_enviada)
      }
      if (filtros?.cliente_salvo !== undefined) {
        query = query.eq('cliente_salvo', filtros.cliente_salvo)
      }
      if (filtros?.data_inicio) {
        query = query.gte('data_prospeccao', filtros.data_inicio)
      }
      if (filtros?.data_fim) {
        query = query.lte('data_prospeccao', filtros.data_fim)
      }

      const { data, error, count } = await query

      if (error) {
        console.error('Erro ao buscar logs:', error)
        throw new Error(`Erro ao buscar logs: ${error.message}`)
      }

      console.log(`✅ Logs encontrados: ${count} registros (mostrando ${data?.length || 0})`)
      return { data: data || [], count: count || 0 }
    } catch (error) {
      console.error('Erro ao buscar logs:', error)
      throw error
    }
  },

  // Obter estatísticas de prospecção
  async obterEstatisticas(): Promise<{
    total_prospectados: number
    whatsapp_validos: number
    mensagens_enviadas: number
    clientes_salvos: number
    taxa_conversao: number
  }> {
    try {
      // Get current user's profile
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      if (!currentUser) {
        throw new Error('Usuário não autenticado')
      }

      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('id, admin_profile_id')
        .eq('id', currentUser.id)
        .single()

      if (!currentProfile) {
        throw new Error('Perfil não encontrado')
      }

      const profileId = currentProfile.admin_profile_id || currentProfile.id

      // Buscar estatísticas
      const { data: stats, error } = await supabase
        .from('logs_prospeccao')
        .select('whatsapp_valido, mensagem_enviada, cliente_salvo')
        .eq('profile_id', profileId)

      if (error) {
        console.error('Erro ao buscar estatísticas:', error)
        throw new Error(`Erro ao buscar estatísticas: ${error.message}`)
      }

      const total_prospectados = stats?.length || 0
      const whatsapp_validos = stats?.filter((s: any) => s.whatsapp_valido).length || 0
      const mensagens_enviadas = stats?.filter((s: any) => s.mensagem_enviada).length || 0
      const clientes_salvos = stats?.filter((s: any) => s.cliente_salvo).length || 0
      const taxa_conversao = total_prospectados > 0 ? (clientes_salvos / total_prospectados) * 100 : 0

      return {
        total_prospectados,
        whatsapp_validos,
        mensagens_enviadas,
        clientes_salvos,
        taxa_conversao: Math.round(taxa_conversao * 100) / 100
      }
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error)
      throw error
    }
  }
}

export type { LogProspeccao, LogProspeccaoCreateData }
