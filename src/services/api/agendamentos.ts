import { supabase } from '@/lib/supabase'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { AtividadeService } from './atividades'

export interface Agendamento {
  id: string
  cliente_id: string
  vendedor_id: string
  titulo: string
  descricao?: string
  objetivo?: string
  data_inicio: string // timestamptz
  data_fim: string // timestamptz
  duracao_minutos: number // int4
  tipo: string // text
  categoria: string // text
  prioridade: string // text
  modalidade: string // text
  endereco_reuniao?: string // text
  link_online?: string // text
  plataforma?: string // text
  senha_reuniao?: string // text
  id_sala_online?: string // text
  participantes: any[] // jsonb
  participantes_externos: string[] // text[]
  agenda?: string // text
  materiais_necessarios: string[] // text[]
  documentos_anexos: string[] // text[]
  produtos_apresentar: string[] // text[]
  servicos_apresentar: string[] // text[]
  status: string // text
  lembrete_enviado: boolean // bool
  lembrete_enviado_em?: string // timestamptz
  confirmacao_cliente: boolean // bool
  confirmacao_em?: string // timestamptz
  resultado?: string // text
  ata_reuniao?: string // text
  proximos_passos?: string // text
  data_proximo_contato?: string // timestamptz
  valor_discutido?: number // numeric
  interesse_demonstrado?: number // int4
  reagendamento_de?: string // uuid
  motivo_reagendamento?: string // text
  contador_reagendamentos: number // int4
  google_event_id?: string // text
  outlook_event_id?: string // text
  created_at: string // timestamptz
  updated_at: string // timestamptz
  user_id: string // uuid foreign key to auth.users.id
  profile: string // uuid foreign key to profiles.id for multi-tenant
}

export interface AgendamentoCreateData {
  cliente_id: string
  vendedor_id: string
  titulo: string
  descricao?: string
  objetivo?: string
  data_inicio: string // timestamptz
  data_fim: string // timestamptz
  duracao_minutos?: number // int4
  tipo?: string // text
  categoria?: string // text
  prioridade?: string // text
  modalidade?: string // text
  endereco_reuniao?: string // text
  link_online?: string // text
  plataforma?: string // text
  senha_reuniao?: string // text
  id_sala_online?: string // text
  participantes?: any[] // jsonb
  participantes_externos?: string[] // text[]
  agenda?: string // text
  materiais_necessarios?: string[] // text[]
  documentos_anexos?: string[] // text[]
  produtos_apresentar?: string[] // text[]
  servicos_apresentar?: string[] // text[]
  status?: string // text
  lembrete_enviado?: boolean // bool
  lembrete_enviado_em?: string // timestamptz
  confirmacao_cliente?: boolean // bool
  confirmacao_em?: string // timestamptz
  resultado?: string // text
  ata_reuniao?: string // text
  proximos_passos?: string // text
  data_proximo_contato?: string // timestamptz
  valor_discutido?: number // numeric
  interesse_demonstrado?: number // int4
  reagendamento_de?: string // uuid
  motivo_reagendamento?: string // text
  contador_reagendamentos?: number // int4
  google_event_id?: string // text
  outlook_event_id?: string // text
  user_id: string // uuid foreign key to auth.users.id
}

export interface AgendamentoUpdateData extends Partial<AgendamentoCreateData> {}

export const agendamentosService = {
  async getAll(filters?: {
    vendedor_id?: string
    cliente_id?: string
    status?: string
    tipo?: string
    data_inicio?: string
    data_fim?: string
    user_id?: string
    user_role?: string
    page?: number
    limit?: number
  }): Promise<{ data: Agendamento[], count: number }> {
    // Obter usuário atual e perfil para filtro multi-tenant
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    if (!currentUser) {
      throw new Error('Usuário não autenticado')
    }

    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('id, role, admin_profile_id')
      .eq('id', currentUser.id)
      .single()

    if (!currentProfile) {
      throw new Error('Perfil não encontrado')
    }

    // Determinar o ID da empresa (admin_profile_id ou próprio ID se for admin)
    const adminId = currentProfile.admin_profile_id || currentProfile.id

    const page = filters?.page || 1
    const limit = filters?.limit || 50
    const offset = (page - 1) * limit

    let query = supabase
      .from('agendamentos')
      .select('*', { count: 'exact' })
      .eq('profile', adminId)
      .order('data_inicio', { ascending: true })
      .range(offset, offset + limit - 1)

    // Filtro adicional por role: vendedores só veem seus próprios agendamentos
    if (currentProfile.role === 'vendedor') {
      query = query.eq('user_id', currentUser.id)
    }

    if (filters?.vendedor_id) {
      query = query.eq('vendedor_id', filters.vendedor_id)
    }
    if (filters?.cliente_id) {
      query = query.eq('cliente_id', filters.cliente_id)
    }
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    if (filters?.tipo) {
      query = query.eq('tipo', filters.tipo)
    }
    if (filters?.data_inicio) {
      query = query.gte('data_inicio', filters.data_inicio)
    }
    if (filters?.data_fim) {
      query = query.lte('data_fim', filters.data_fim)
    }

    const { data, error, count } = await query

    if (error) {
      console.error('Erro ao buscar agendamentos:', error)
      throw new Error(`Erro ao buscar agendamentos: ${error.message}`)
    }

    return { data: data || [], count: count || 0 }
  },

  async getStatusStats(adminId: string): Promise<Record<string, number>> {
    const statuses = ['agendado', 'confirmado', 'realizado', 'cancelado', 'reagendado']
    const stats: Record<string, number> = {}

    const promises = statuses.map(async (status) => {
      const { count } = await supabase
        .from('agendamentos')
        .select('*', { count: 'exact', head: true })
        .eq('profile', adminId)
        .eq('status', status)
      
      return { status, count: count || 0 }
    })

    const results = await Promise.all(promises)
    results.forEach(({ status, count }) => {
      stats[status] = count
    })

    return stats
  },

  async getById(id: string): Promise<Agendamento | null> {
    // Obter usuário atual e perfil para filtro multi-tenant
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    if (!currentUser) {
      throw new Error('Usuário não autenticado')
    }

    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('id, role, admin_profile_id')
      .eq('id', currentUser.id)
      .single()

    if (!currentProfile) {
      throw new Error('Perfil não encontrado')
    }

    // Determinar o ID da empresa (admin_profile_id ou próprio ID se for admin)
    const adminId = currentProfile.admin_profile_id || currentProfile.id

    let query = supabase
      .from('agendamentos')
      .select(`
        *,
        clientes!inner(nome_contato, email, telefone),
        vendedores!inner(nome, email)
      `)
      .eq('id', id)
      .eq('profile', adminId)

    // Filtro adicional por role: vendedores só veem seus próprios agendamentos
    if (currentProfile.role === 'vendedor') {
      query = query.eq('user_id', currentUser.id)
    }

    const { data, error } = await query.single()

    if (error) {
      console.error('Erro ao buscar agendamento:', error)
      throw new Error(`Erro ao buscar agendamento: ${error.message}`)
    }

    return data
  },

  async create(agendamentoData: AgendamentoCreateData): Promise<Agendamento> {
    // Obter usuário atual e perfil para multi-tenant
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    if (!currentUser) {
      throw new Error('Usuário não autenticado')
    }

    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('id, role, admin_profile_id')
      .eq('id', currentUser.id)
      .single()

    if (!currentProfile) {
      throw new Error('Perfil não encontrado')
    }

    // Determinar o ID da empresa (admin_profile_id ou próprio ID se for admin)
    const adminId = currentProfile.admin_profile_id || currentProfile.id
    
    // Criar objeto com todos os campos da tabela agendamentos
    const insertData = {
      cliente_id: agendamentoData.cliente_id,
      vendedor_id: agendamentoData.vendedor_id,
      titulo: agendamentoData.titulo,
      descricao: agendamentoData.descricao || null,
      objetivo: agendamentoData.objetivo || null,
      data_inicio: agendamentoData.data_inicio,
      data_fim: agendamentoData.data_fim,
      duracao_minutos: agendamentoData.duracao_minutos || 60,
      tipo: agendamentoData.tipo || 'primeira_reuniao',
      categoria: agendamentoData.categoria || 'comercial',
      prioridade: agendamentoData.prioridade || 'media',
      modalidade: agendamentoData.modalidade || 'presencial',
      endereco_reuniao: agendamentoData.endereco_reuniao || null,
      link_online: agendamentoData.link_online || null,
      plataforma: agendamentoData.plataforma || null,
      senha_reuniao: agendamentoData.senha_reuniao || null,
      id_sala_online: agendamentoData.id_sala_online || null,
      participantes: agendamentoData.participantes || null,
      participantes_externos: agendamentoData.participantes_externos || [],
      agenda: agendamentoData.agenda || null,
      materiais_necessarios: agendamentoData.materiais_necessarios || [],
      documentos_anexos: agendamentoData.documentos_anexos || [],
      produtos_apresentar: agendamentoData.produtos_apresentar || [],
      servicos_apresentar: agendamentoData.servicos_apresentar || [],
      status: agendamentoData.status || 'agendado',
      lembrete_enviado: agendamentoData.lembrete_enviado || false,
      lembrete_enviado_em: agendamentoData.lembrete_enviado_em || null,
      confirmacao_cliente: agendamentoData.confirmacao_cliente || false,
      confirmacao_em: agendamentoData.confirmacao_em || null,
      resultado: agendamentoData.resultado || null,
      ata_reuniao: agendamentoData.ata_reuniao || null,
      proximos_passos: agendamentoData.proximos_passos || null,
      data_proximo_contato: agendamentoData.data_proximo_contato || null,
      valor_discutido: agendamentoData.valor_discutido || null,
      interesse_demonstrado: agendamentoData.interesse_demonstrado || null,
      reagendamento_de: agendamentoData.reagendamento_de || null,
      motivo_reagendamento: agendamentoData.motivo_reagendamento || null,
      contador_reagendamentos: agendamentoData.contador_reagendamentos || 0,
      google_event_id: agendamentoData.google_event_id || null,
      outlook_event_id: agendamentoData.outlook_event_id || null,
      user_id: agendamentoData.user_id || currentUser.id,
      profile: adminId
    }
    
    const { data, error } = await supabase
      .from('agendamentos')
      .insert(insertData)
      .select('*')
      .single()

    if (error) {
      console.error('Erro ao criar agendamento:', error)
      throw new Error(`Erro ao criar agendamento: ${error.message}`)
    }

    // Registrar atividade
    await AtividadeService.criar(
      'agendamento',
      data.id,
      data,
      `Agendamento criado: ${data.titulo} - ${new Date(data.data_inicio).toLocaleDateString()}`
    )

    return data
  },

  async update(id: string, updates: AgendamentoUpdateData): Promise<Agendamento> {
    // Buscar dados anteriores para o log
    const agendamentoAnterior = await this.getById(id)
    
    if (!agendamentoAnterior) {
      throw new Error('Agendamento não encontrado')
    }
    
    // Clean updates data - remove undefined/null/empty values and preserve required fields
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([key, value]) => {
        // Always preserve required fields from original data if not provided in updates
        if (['cliente_id', 'vendedor_id', 'titulo', 'data_inicio', 'data_fim'].includes(key)) {
          return value !== undefined && value !== null && value !== ''
        }
        // For other fields, filter out undefined/null but allow empty strings
        return value !== undefined && value !== null
      })
    )
    
    // Ensure required fields are preserved from original if not in updates
    const finalUpdates = {
      ...cleanUpdates,
      // Preserve required fields from original if not provided in updates
      cliente_id: cleanUpdates.cliente_id || agendamentoAnterior.cliente_id,
      vendedor_id: cleanUpdates.vendedor_id || agendamentoAnterior.vendedor_id,
      titulo: cleanUpdates.titulo || agendamentoAnterior.titulo,
      data_inicio: cleanUpdates.data_inicio || agendamentoAnterior.data_inicio,
      data_fim: cleanUpdates.data_fim || agendamentoAnterior.data_fim,
      updated_at: new Date().toISOString()
    }
    
    const { data, error } = await supabase
      .from('agendamentos')
      .update(finalUpdates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar agendamento:', error)
      throw new Error(`Erro ao atualizar agendamento: ${error.message}`)
    }

    // Registrar atividade
    await AtividadeService.editar(
      'agendamento',
      data.id,
      agendamentoAnterior,
      data,
      `Agendamento editado: ${data.titulo || agendamentoAnterior?.titulo} - ${new Date(data.data_inicio || agendamentoAnterior?.data_inicio).toLocaleDateString()}`
    )

    return data
  },

  async delete(id: string): Promise<void> {
    // Buscar dados do agendamento antes de deletar
    const agendamento = await this.getById(id)
    
    if (!agendamento) {
      throw new Error('Agendamento não encontrado')
    }
    
    const { error } = await supabase
      .from('agendamentos')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Erro ao deletar agendamento:', error)
      throw new Error(`Erro ao deletar agendamento: ${error.message}`)
    }

    // Registrar atividade
    await AtividadeService.deletar(
      'agendamento',
      id,
      agendamento,
      `Agendamento deletado: ${agendamento.titulo} - ${new Date(agendamento.data_inicio).toLocaleDateString()}`
    )
  },

  async updateStatus(id: string, status: string): Promise<Agendamento> {
    const { data, error } = await supabaseAdmin
      .from('agendamentos')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar status:', error)
      throw new Error(`Erro ao atualizar status: ${error.message}`)
    }

    return data
  }
}
