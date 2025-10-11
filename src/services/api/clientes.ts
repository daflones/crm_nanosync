import { supabase } from '@/lib/supabase'
import { AtividadeService } from './atividades'

export interface Cliente {
  id: string
  nome_contato: string
  email: string
  nome_empresa: string
  razao_social?: string
  cargo?: string
  segmento_cliente: string
  endereco: string
  cidade: string
  estado: string
  cep: string
  etapa_pipeline: string
  classificacao: string
  origem: string
  observacoes?: string
  produtos_interesse?: string[]
  expectativa?: string
  data_criacao: string
  data_atualizacao: string
  vendedor_id?: string
  contexto_cliente?: string
  data_ultima_etapa?: string
  dores_atuais?: string
  motivacao?: string
  whatsapp?: string
  telefone_empresa?: string
  cpf?: string
  cnpj?: string
  inscricao_estadual?: string
  profile: string // Campo para filtro por empresa
  created_at: string
  updated_at: string
}

export interface ClienteCreateData {
  nome_contato: string
  email: string
  nome_empresa: string
  razao_social?: string
  cargo?: string
  segmento_cliente: string
  endereco: string
  numero?: string
  cidade: string
  estado: string
  cep: string
  etapa_pipeline: string
  classificacao: string
  origem: string
  observacoes?: string
  produtos_interesse?: string[]
  expectativa?: string
  vendedor_id?: string
  contexto_cliente?: string
  dores_atuais?: string
  motivacao?: string
  whatsapp?: string
  telefone_empresa?: string
  cpf?: string
  cnpj?: string
  inscricao_estadual?: string
}

export interface ClienteUpdateData extends Partial<ClienteCreateData> {}

export const clientesService = {
  async getAll(filters?: {
    vendedorId?: string
    etapa?: string
    origem?: string
    classificacao?: string
    search?: string
    page?: number
    limit?: number
  }): Promise<{ data: Cliente[], count: number }> {
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

    const page = filters?.page || 1
    const limit = filters?.limit || 50
    const offset = (page - 1) * limit

    let query = supabase
      .from('clientes')
      .select('*', { count: 'exact' })
      .eq('profile', adminId) // Filter by company
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

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
      // Search in multiple fields: name, company, phone, email, CPF, CNPJ
      const searchTerm = filters.search.replace(/\D/g, '') // Remove non-digits for phone/CPF/CNPJ search
      query = query.or(`nome_contato.ilike.%${filters.search}%,nome_empresa.ilike.%${filters.search}%,email.ilike.%${filters.search}%,whatsapp.ilike.%${searchTerm}%,telefone_empresa.ilike.%${searchTerm}%,cpf.ilike.%${searchTerm}%,cnpj.ilike.%${searchTerm}%`)
    }

    const { data, error, count } = await query

    if (error) {
      console.error('Erro ao buscar clientes:', error)
      throw new Error(`Erro ao buscar clientes: ${error.message}`)
    }

    return { data: data || [], count: count || 0 }
  },

  async getStageStats(adminId: string): Promise<Record<string, number>> {
    const stages = ['novo', 'contactado', 'qualificado', 'proposta', 'negociacao', 'fechado', 'perdido']
    const stats: Record<string, number> = {}

    // Buscar contagem de cada etapa em paralelo
    const promises = stages.map(async (stage) => {
      const { count } = await supabase
        .from('clientes')
        .select('*', { count: 'exact', head: true })
        .eq('profile', adminId)
        .eq('etapa_pipeline', stage)
      
      return { stage, count: count || 0 }
    })

    const results = await Promise.all(promises)
    results.forEach(({ stage, count }) => {
      stats[stage] = count
    })

    return stats
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

    // Preparar dados para inserção no banco - APENAS campos que existem na tabela
    const insertData = {
      // Campos básicos
      nome_contato: clienteData.nome_contato,
      email: clienteData.email,
      nome_empresa: clienteData.nome_empresa,
      razao_social: clienteData.razao_social,
      cargo: clienteData.cargo,
      inscricao_estadual: clienteData.inscricao_estadual,
      
      // Telefones (whatsapp já processado, telefone_empresa direto)
      whatsapp: clienteData.whatsapp,
      telefone_empresa: clienteData.telefone_empresa,
      
      // Endereço
      endereco: clienteData.endereco,
      numero: clienteData.numero,
      cidade: clienteData.cidade,
      estado: clienteData.estado,
      cep: clienteData.cep,
      
      // Documentos
      cpf: clienteData.cpf,
      cnpj: clienteData.cnpj,
      
      // Pipeline
      etapa_pipeline: clienteData.etapa_pipeline,
      classificacao: clienteData.classificacao,
      origem: clienteData.origem,
      
      // Negócio
      segmento_cliente: clienteData.segmento_cliente,
      vendedor_id: clienteData.vendedor_id,
      
      // Contexto
      observacoes: clienteData.observacoes,
      produtos_interesse: clienteData.produtos_interesse,
      contexto_cliente: clienteData.contexto_cliente,
      dores_atuais: clienteData.dores_atuais,
      motivacao: clienteData.motivacao,
      expectativa: clienteData.expectativa,
      
      // Sistema
      profile: adminId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('clientes')
      .insert(insertData)
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
