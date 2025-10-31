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
  volume_mensal?: string
  expectativa?: string
  data_criacao: string
  data_atualizacao: string
  vendedor_id?: string
  analise_cliente?: string
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
  // Dados básicos do contato
  nome_contato: string
  cargo?: string
  email?: string
  whatsapp?: string
  telefone?: string
  
  // Dados da empresa
  nome_empresa: string
  razao_social?: string
  cnpj?: string
  
  // Endereço
  endereco: string
  numero?: string
  cidade: string
  estado: string
  cep?: string
  pais?: string
  
  // Segmentação e produtos
  segmento_cliente: string
  produtos_interesse?: string
  volume_mensal?: string
  volume_mensal_numero?: number
  orcamento_estimado?: number
  sazonalidade?: string
  fornecedor_atual?: string
  motivo_troca?: string
  
  // Pipeline e qualificação
  etapa_pipeline: string
  valor_estimado?: number
  valor_final?: number
  probabilidade?: number
  qualificacao_score?: number
  qualificacao_completa?: boolean
  informacoes_faltantes?: string[]
  criterios_qualificacao?: any
  
  // Origem e classificação
  origem: string
  fonte_detalhada?: string
  classificacao: string
  
  // Datas de contato
  primeiro_contato_em?: string
  ultimo_contato_em?: string
  proximo_contato_em?: string
  frequencia_contato?: string
  data_ultima_etapa?: string
  
  // Proposta
  proposta_enviada?: boolean
  proposta_enviada_em?: string
  proposta_valor?: number
  proposta_status?: string
  proposta_em_andamento?: boolean
  
  // Perda/Rejeição
  motivo_perda?: string
  categoria_perda?: string
  concorrente?: string
  feedback_rejeicao?: string
  
  // Observações e análise
  observacoes?: string
  tags?: string[]
  caracteristicas_especiais?: string
  restricoes?: string
  preferencias_contato?: string
  analise_cliente?: string
  dores_atuais?: string
  motivacao?: string
  expectativa?: string
  
  // Controle e estatísticas
  numero_pedidos?: number
  vendedor_id?: string
  formulario_site?: boolean
  atendimento_ia?: string
  ultima_mensagem?: string
  follow_up?: boolean
  respondeu_fup?: boolean
  remotejid?: string
  ultima_conversa?: string
  ultima_mensagem_fup?: string
  instancia?: string
  cadastrado_rp?: boolean
  
  // Documentos adicionais
  cpf?: string
  telefone_empresa?: string
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

    // Preparar dados para inserção no banco - TODOS os campos da tabela clientes
    const insertData = {
      // Dados básicos do contato
      nome_contato: clienteData.nome_contato,
      cargo: clienteData.cargo,
      email: clienteData.email,
      whatsapp: clienteData.whatsapp,
      telefone: clienteData.telefone,
      
      // Dados da empresa
      nome_empresa: clienteData.nome_empresa,
      razao_social: clienteData.razao_social,
      cnpj: clienteData.cnpj,
      
      // Endereço
      endereco: clienteData.endereco,
      numero: clienteData.numero,
      cidade: clienteData.cidade,
      estado: clienteData.estado,
      cep: clienteData.cep,
      pais: clienteData.pais,
      
      // Segmentação e produtos
      segmento_cliente: clienteData.segmento_cliente,
      produtos_interesse: clienteData.produtos_interesse,
      volume_mensal: clienteData.volume_mensal,
      volume_mensal_numero: clienteData.volume_mensal_numero,
      orcamento_estimado: clienteData.orcamento_estimado,
      sazonalidade: clienteData.sazonalidade,
      fornecedor_atual: clienteData.fornecedor_atual,
      motivo_troca: clienteData.motivo_troca,
      
      // Pipeline e qualificação
      etapa_pipeline: clienteData.etapa_pipeline,
      valor_estimado: clienteData.valor_estimado,
      valor_final: clienteData.valor_final,
      probabilidade: clienteData.probabilidade,
      qualificacao_score: clienteData.qualificacao_score,
      qualificacao_completa: clienteData.qualificacao_completa,
      informacoes_faltantes: clienteData.informacoes_faltantes,
      criterios_qualificacao: clienteData.criterios_qualificacao,
      
      // Origem e classificação
      origem: clienteData.origem,
      fonte_detalhada: clienteData.fonte_detalhada,
      classificacao: clienteData.classificacao,
      
      // Datas de contato
      primeiro_contato_em: clienteData.primeiro_contato_em,
      ultimo_contato_em: clienteData.ultimo_contato_em,
      proximo_contato_em: clienteData.proximo_contato_em,
      frequencia_contato: clienteData.frequencia_contato,
      data_ultima_etapa: clienteData.data_ultima_etapa,
      
      // Proposta
      proposta_enviada: clienteData.proposta_enviada,
      proposta_enviada_em: clienteData.proposta_enviada_em,
      proposta_valor: clienteData.proposta_valor,
      proposta_status: clienteData.proposta_status,
      proposta_em_andamento: clienteData.proposta_em_andamento,
      
      // Perda/Rejeição
      motivo_perda: clienteData.motivo_perda,
      categoria_perda: clienteData.categoria_perda,
      concorrente: clienteData.concorrente,
      feedback_rejeicao: clienteData.feedback_rejeicao,
      
      // Observações e análise
      observacoes: clienteData.observacoes,
      tags: clienteData.tags,
      caracteristicas_especiais: clienteData.caracteristicas_especiais,
      restricoes: clienteData.restricoes,
      preferencias_contato: clienteData.preferencias_contato,
      analise_cliente: clienteData.analise_cliente,
      dores_atuais: clienteData.dores_atuais,
      motivacao: clienteData.motivacao,
      expectativa: clienteData.expectativa,
      
      // Controle e estatísticas
      numero_pedidos: clienteData.numero_pedidos,
      vendedor_id: clienteData.vendedor_id,
      formulario_site: clienteData.formulario_site,
      atendimento_ia: clienteData.atendimento_ia,
      ultima_mensagem: clienteData.ultima_mensagem,
      follow_up: clienteData.follow_up,
      respondeu_fup: clienteData.respondeu_fup,
      remotejid: clienteData.remotejid,
      ultima_conversa: clienteData.ultima_conversa,
      ultima_mensagem_fup: clienteData.ultima_mensagem_fup,
      instancia: clienteData.instancia,
      cadastrado_rp: clienteData.cadastrado_rp,
      
      // Documentos adicionais
      cpf: clienteData.cpf,
      telefone_empresa: clienteData.telefone_empresa,
      inscricao_estadual: clienteData.inscricao_estadual,
      
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
    console.log('🔵 [Service] Iniciando update do cliente...', { id, updates })
    
    // Buscar dados anteriores para o log
    const clienteAnterior = await clientesService.getById(id)
    console.log('🔵 [Service] Cliente anterior encontrado:', clienteAnterior)
    
    const updateData = {
      ...updates,
      updated_at: new Date().toISOString()
    }
    console.log('🔵 [Service] Dados para update:', updateData)
    
    const { data, error } = await supabase
      .from('clientes')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('❌ [Service] Erro ao atualizar cliente:', error)
      throw new Error(`Erro ao atualizar cliente: ${error.message}`)
    }

    console.log('✅ [Service] Cliente atualizado com sucesso:', data)

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
