import { supabase } from '@/lib/supabase'
import { AtividadeService } from './atividades'

export interface Cliente {
  id: string
  nome_contato: string
  email: string
  nome_empresa: string
  razao_social?: string
  segmento_cliente: string
  endereco: string
  cidade: string
  estado: string
  cep: string
  etapa_pipeline: string
  classificacao: string
  origem: string
  observacoes?: string
  data_criacao: string
  data_atualizacao: string
  vendedor_id?: string
  contexto_cliente?: string
  data_ultima_etapa?: string
  dores_atuais?: string
  motivacao?: string
  whatsapp?: string
  cpf?: string
  cnpj?: string
  profile: string // Campo para filtro por empresa
  created_at: string
  updated_at: string
}

export interface ClienteCreateData {
  nome_contato: string
  email: string
  nome_empresa: string
  razao_social?: string
  segmento_cliente: string
  endereco: string
  cidade: string
  estado: string
  cep: string
  etapa_pipeline: string
  classificacao: string
  origem: string
  observacoes?: string
  vendedor_id?: string
  contexto_cliente?: string
  dores_atuais?: string
  motivacao?: string
  whatsapp?: string
  cpf?: string
  cnpj?: string
}

export interface ClienteUpdateData extends Partial<ClienteCreateData> {}

export const clientesService = {
  async getAll(filters?: {
    vendedorId?: string
    etapa?: string
    origem?: string
    classificacao?: string
    search?: string
  }): Promise<Cliente[]> {
    // Get current user's profile to filter by company
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

    // Use admin_profile_id to filter clientes
    const adminId = currentProfile.admin_profile_id || currentProfile.id

    let query = supabase
      .from('clientes')
      .select('*')
      .eq('profile', adminId) // Filter by company
      .order('created_at', { ascending: false })

    if (filters?.vendedorId) {
      query = query.eq('vendedor_id', filters.vendedorId)
    }
    if (filters?.etapa) {
      query = query.eq('etapa_pipeline', filters.etapa)
    }
    if (filters?.origem) {
      query = query.eq('origem', filters.origem)
    }
    if (filters?.classificacao) {
      query = query.eq('classificacao', filters.classificacao)
    }
    if (filters?.search) {
      query = query.or(`nome_contato.ilike.%${filters.search}%,nome_empresa.ilike.%${filters.search}%`)
    }

    const { data, error } = await query

    if (error) {
      console.error('Erro ao buscar clientes:', error)
      throw new Error(`Erro ao buscar clientes: ${error.message}`)
    }

    return data || []
  },

  async getById(id: string): Promise<Cliente | null> {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Erro ao buscar cliente:', error)
      throw new Error(`Erro ao buscar cliente: ${error.message}`)
    }

    return data
  },

  async create(clienteData: ClienteCreateData): Promise<Cliente> {
    if (!clienteData.nome_contato) {
      throw new Error('Nome do contato é obrigatório')
    }

    // Get current user's profile for company filtering
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

    const adminId = currentProfile.admin_profile_id || currentProfile.id

    const { data, error } = await supabase
      .from('clientes')
      .insert({
        ...clienteData,
        etapa_pipeline: clienteData.etapa_pipeline || 'novo',
        classificacao: clienteData.classificacao || 'morno',
        origem: clienteData.origem || 'manual',
        profile: adminId, // Add company filter
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar cliente:', error)
      throw new Error(`Erro ao criar cliente: ${error.message}`)
    }

    // Registrar atividade
    await AtividadeService.criar(
      'cliente',
      data.id,
      data,
      `Cliente criado: ${data.nome_contato}${data.nome_empresa ? ` (${data.nome_empresa})` : ''}`
    )

    return data
  },

  async update(id: string, updates: ClienteUpdateData): Promise<Cliente> {
    // Buscar dados anteriores para o log
    const clienteAnterior = await clientesService.getById(id)
    
    const { data, error } = await supabase
      .from('clientes')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar cliente:', error)
      throw new Error(`Erro ao atualizar cliente: ${error.message}`)
    }

    // Registrar atividade
    await AtividadeService.editar(
      'cliente',
      data.id,
      clienteAnterior,
      data,
      `Cliente editado: ${data.nome_contato}${data.nome_empresa ? ` (${data.nome_empresa})` : ''}`
    )

    return data
  },

  async delete(id: string): Promise<void> {
    // Buscar dados do cliente antes de deletar
    const cliente = await clientesService.getById(id)
    
    const { error } = await supabase
      .from('clientes')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Erro ao deletar cliente:', error)
      throw new Error(`Erro ao deletar cliente: ${error.message}`)
    }

    // Registrar atividade
    if (cliente) {
      await AtividadeService.deletar(
        'cliente',
        id,
        cliente,
        `Cliente deletado: ${cliente.nome_contato}${cliente.nome_empresa ? ` (${cliente.nome_empresa})` : ''}`
      )
    }
  },

  async updatePipelineStage(id: string, novaEtapa: string): Promise<Cliente> {
    // Buscar dados anteriores
    const clienteAnterior = await clientesService.getById(id)
    
    const { data, error } = await supabase
      .from('clientes')
      .update({
        etapa_pipeline: novaEtapa,
        data_ultima_etapa: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar pipeline:', error)
      throw new Error(`Erro ao atualizar pipeline: ${error.message}`)
    }

    // Registrar atividade
    await AtividadeService.editar(
      'cliente',
      data.id,
      clienteAnterior,
      data,
      `Pipeline atualizado: ${data.nome_contato} movido para ${novaEtapa}`
    )

    return data
  }
}
