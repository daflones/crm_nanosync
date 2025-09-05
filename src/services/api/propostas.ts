import { supabase } from '@/lib/supabase'
import { AtividadeService } from './atividades'

export interface Proposta {
  id: string
  cliente_id: string
  vendedor_id: string
  numero_proposta: string
  titulo: string
  versao: number
  proposta_pai?: string
  descricao?: string
  observacoes?: string
  termos_condicoes?: string
  valor_produtos: number
  valor_servicos: number
  valor_desconto: number
  percentual_desconto: number
  valor_frete: number
  valor_impostos: number
  valor_total: number
  forma_pagamento?: string
  condicoes_pagamento?: string
  prazo_entrega?: string
  local_entrega?: string
  responsavel_frete: 'cliente' | 'fornecedor' | 'compartilhado'
  condicoes_especiais?: string
  garantia?: string
  suporte_incluido: boolean
  treinamento_incluido: boolean
  status: 'rascunho' | 'revisao' | 'aprovada_interna' | 'enviada' | 'visualizada' | 'em_negociacao' | 'aprovada' | 'rejeitada' | 'vencida'
  validade_dias: number
  data_vencimento?: string
  data_aprovacao_interna?: string
  data_envio?: string
  data_visualizacao?: string
  data_resposta?: string
  data_assinatura?: string
  feedback_cliente?: string
  objecoes?: string
  pontos_negociacao?: string
  motivo_rejeicao?: string
  arquivo_pdf_url?: string
  template_usado?: string
  assinatura_digital_url?: string
  documentos_anexos?: string[]
  visualizacoes: number
  tempo_visualizacao: number
  paginas_visualizadas?: number[]
  ultima_interacao?: string
  requer_aprovacao: boolean
  aprovada_por?: string
  motivo_aprovacao?: string
  itens?: PropostaItem[]
  created_at: string
  updated_at: string
}

export interface PropostaItem {
  id?: string
  proposta_id?: string
  tipo: 'produto' | 'servico'
  produto_id?: string
  servico_id?: string
  nome: string
  descricao?: string
  quantidade: number
  unidade: string
  valor_unitario: number
  percentual_desconto: number
  valor_desconto: number
  valor_total: number
  observacoes?: string
  especificacoes_customizadas?: any
  ordem: number
}

export interface PropostaCreateData {
  cliente_id: string
  vendedor_id: string
  numero_proposta?: string
  titulo: string
  versao?: number
  proposta_pai?: string
  descricao?: string
  observacoes?: string
  termos_condicoes?: string
  valor_produtos?: number
  valor_servicos?: number
  valor_desconto?: number
  percentual_desconto?: number
  valor_frete?: number
  valor_impostos?: number
  valor_total: number
  forma_pagamento?: string
  condicoes_pagamento?: string
  prazo_entrega?: string
  local_entrega?: string
  responsavel_frete?: 'cliente' | 'fornecedor' | 'compartilhado'
  condicoes_especiais?: string
  garantia?: string
  suporte_incluido?: boolean
  treinamento_incluido?: boolean
  status?: 'rascunho' | 'revisao' | 'aprovada_interna' | 'enviada' | 'visualizada' | 'em_negociacao' | 'aprovada' | 'rejeitada' | 'vencida'
  validade_dias?: number
  data_vencimento?: string
  feedback_cliente?: string
  objecoes?: string
  pontos_negociacao?: string
  motivo_rejeicao?: string
  template_usado?: string
  requer_aprovacao?: boolean
  motivo_aprovacao?: string
  itens?: Omit<PropostaItem, 'id' | 'proposta_id'>[]
}

export interface PropostaUpdateData extends Partial<PropostaCreateData> {}

export const propostasService = {
  async getAll(filters?: {
    vendedor_id?: string
    cliente_id?: string
    status?: string
    data_inicio?: string
    data_fim?: string
  }): Promise<Proposta[]> {
    let query = supabase
      .from('propostas')
      .select('*, itens:proposta_itens(*)')
      .order('created_at', { ascending: false })

    if (filters?.vendedor_id) {
      query = query.eq('vendedor_id', filters.vendedor_id)
    }
    if (filters?.cliente_id) {
      query = query.eq('cliente_id', filters.cliente_id)
    }
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    if (filters?.data_inicio) {
      query = query.gte('created_at', filters.data_inicio)
    }
    if (filters?.data_fim) {
      query = query.lte('created_at', filters.data_fim)
    }

    const { data, error } = await query

    if (error) {
      console.error('Erro ao buscar propostas:', error)
      throw new Error(`Erro ao buscar propostas: ${error.message}`)
    }

    return data || []
  },

  async getById(id: string): Promise<Proposta | null> {
    const { data, error } = await supabase
      .from('propostas')
      .select('*, itens:proposta_itens(*)')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Erro ao buscar proposta:', error)
      throw new Error(`Erro ao buscar proposta: ${error.message}`)
    }

    return data
  },

  async create(propostaData: PropostaCreateData): Promise<Proposta> {
    // Gerar número da proposta
    const numeroSequencial = Date.now().toString().slice(-6)
    const numero_proposta = `PROP-${new Date().getFullYear()}-${numeroSequencial}`

    // Calcular data de vencimento se não fornecida
    const dataVencimento = propostaData.data_vencimento || 
      new Date(Date.now() + (propostaData.validade_dias || 30) * 24 * 60 * 60 * 1000).toISOString()

    // Criar proposta
    const { data: proposta, error: propostaError } = await supabase
      .from('propostas')
      .insert({
        numero_proposta,
        cliente_id: propostaData.cliente_id,
        vendedor_id: propostaData.vendedor_id,
        titulo: propostaData.titulo,
        versao: propostaData.versao || 1,
        descricao: propostaData.descricao,
        observacoes: propostaData.observacoes,
        termos_condicoes: propostaData.termos_condicoes,
        valor_produtos: propostaData.valor_produtos || 0,
        valor_servicos: propostaData.valor_servicos || 0,
        valor_desconto: propostaData.valor_desconto || 0,
        percentual_desconto: propostaData.percentual_desconto || 0,
        valor_frete: propostaData.valor_frete || 0,
        valor_impostos: propostaData.valor_impostos || 0,
        valor_total: propostaData.valor_total,
        forma_pagamento: propostaData.forma_pagamento,
        condicoes_pagamento: propostaData.condicoes_pagamento,
        prazo_entrega: propostaData.prazo_entrega,
        local_entrega: propostaData.local_entrega,
        responsavel_frete: propostaData.responsavel_frete || 'cliente',
        condicoes_especiais: propostaData.condicoes_especiais,
        garantia: propostaData.garantia,
        suporte_incluido: propostaData.suporte_incluido || false,
        treinamento_incluido: propostaData.treinamento_incluido || false,
        status: propostaData.status || 'rascunho',
        validade_dias: propostaData.validade_dias || 30,
        data_vencimento: dataVencimento,
        visualizacoes: 0,
        tempo_visualizacao: 0,
        requer_aprovacao: propostaData.requer_aprovacao || false
      })
      .select()
      .single()

    if (propostaError) {
      console.error('Erro ao criar proposta:', propostaError)
      throw new Error(`Erro ao criar proposta: ${propostaError.message}`)
    }

    // Adicionar itens se houver
    if (propostaData.itens && propostaData.itens.length > 0) {
      const itensComPropostaId = propostaData.itens.map(item => ({
        ...item,
        proposta_id: proposta.id
      }))

      const { error: itensError } = await supabase
        .from('proposta_itens')
        .insert(itensComPropostaId)

      if (itensError) {
        // Se falhar, deletar a proposta criada
        await supabase.from('propostas').delete().eq('id', proposta.id)
        console.error('Erro ao adicionar itens:', itensError)
        throw new Error(`Erro ao adicionar itens: ${itensError.message}`)
      }
    }

    // Registrar atividade
    await AtividadeService.criar(
      'proposta',
      proposta.id,
      proposta,
      `Proposta criada: ${proposta.titulo} (${proposta.numero_proposta})`
    )

    return proposta
  },

  async update(id: string, updates: PropostaUpdateData): Promise<Proposta> {
    const { itens, ...propostaUpdates } = updates

    // Buscar dados anteriores para o log
    const propostaAnterior = await this.getById(id)

    // Limpar campos undefined e validar dados
    const cleanedUpdates = Object.fromEntries(
      Object.entries(propostaUpdates).filter(([_, value]) => value !== undefined && value !== null && value !== '')
    )

    // Validar campos obrigatórios
    if (cleanedUpdates.valor_total !== undefined && isNaN(Number(cleanedUpdates.valor_total))) {
      throw new Error('Valor total deve ser um número válido')
    }

    // Garantir que campos obrigatórios não sejam removidos
    if (cleanedUpdates.numero_proposta === undefined && propostaAnterior) {
      cleanedUpdates.numero_proposta = propostaAnterior.numero_proposta
    }
    if (cleanedUpdates.titulo === undefined && propostaAnterior) {
      cleanedUpdates.titulo = propostaAnterior.titulo
    }

    console.log('Dados sendo enviados para atualização:', cleanedUpdates)

    // Atualizar proposta
    const { data, error } = await supabase
      .from('propostas')
      .update({
        ...cleanedUpdates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar proposta:', error)
      console.error('Dados que causaram erro:', cleanedUpdates)
      throw new Error(`Erro ao atualizar proposta: ${error.message}`)
    }

    // Atualizar itens se fornecidos
    if (itens && Array.isArray(itens)) {
      try {
        // Deletar itens existentes
        const { error: deleteError } = await supabase
          .from('proposta_itens')
          .delete()
          .eq('proposta_id', id)

        if (deleteError) {
          console.error('Erro ao deletar itens existentes:', deleteError)
        }

        // Adicionar novos itens
        if (itens.length > 0) {
          // Validar e limpar dados dos itens
          const itensValidos = itens.filter(item => 
            item && 
            item.nome && 
            item.tipo && 
            !isNaN(Number(item.quantidade)) && 
            !isNaN(Number(item.valor_unitario))
          ).map(item => ({
            proposta_id: id,
            tipo: item.tipo,
            produto_id: item.produto_id || null,
            servico_id: item.servico_id || null,
            nome: item.nome,
            descricao: item.descricao || '',
            quantidade: Number(item.quantidade) || 1,
            unidade: item.unidade || 'un',
            valor_unitario: Number(item.valor_unitario) || 0,
            percentual_desconto: Number(item.percentual_desconto) || 0,
            valor_desconto: Number(item.valor_desconto) || 0,
            valor_total: Number(item.valor_total) || 0,
            observacoes: item.observacoes || '',
            ordem: item.ordem || 0
          }))

          if (itensValidos.length > 0) {
            const { error: itensError } = await supabase
              .from('proposta_itens')
              .insert(itensValidos)

            if (itensError) {
              console.error('Erro ao inserir itens:', itensError)
              console.error('Itens que causaram erro:', itensValidos)
              throw new Error(`Erro ao atualizar itens: ${itensError.message}`)
            }
          }
        }
      } catch (error) {
        console.error('Erro no processo de atualização de itens:', error)
        // Não falhar a atualização da proposta por causa dos itens
        // throw error
      }
    }

    // Registrar atividade
    await AtividadeService.editar(
      'proposta',
      data.id,
      propostaAnterior,
      data,
      `Proposta editada: ${data.titulo} (${data.numero_proposta})`
    )

    return data
  },

  async delete(id: string): Promise<void> {
    // Buscar dados da proposta antes de deletar
    const proposta = await this.getById(id)
    
    const { error } = await supabase
      .from('propostas')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Erro ao deletar proposta:', error)
      throw new Error(`Erro ao deletar proposta: ${error.message}`)
    }

    // Registrar atividade
    if (proposta) {
      await AtividadeService.deletar(
        'proposta',
        id,
        proposta,
        `Proposta deletada: ${proposta.titulo} (${proposta.numero_proposta})`
      )
    }
  },

  async updateStatus(id: string, status: string): Promise<Proposta> {
    // Buscar dados anteriores
    const propostaAnterior = await this.getById(id)
    
    const { data, error } = await supabase
      .from('propostas')
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

    // Registrar atividade específica para mudança de status
    const statusDescricoes: Record<string, string> = {
      'rascunho': 'Rascunho',
      'revisao': 'Em Revisão',
      'aprovada_interna': 'Aprovada Internamente',
      'enviada': 'Enviada',
      'visualizada': 'Visualizada pelo Cliente',
      'em_negociacao': 'Em Negociação',
      'aprovada': 'Aprovada',
      'rejeitada': 'Rejeitada',
      'vencida': 'Vencida'
    }

    const statusAnterior = statusDescricoes[propostaAnterior?.status || ''] || propostaAnterior?.status
    const statusNovo = statusDescricoes[status] || status

    if (status === 'enviada') {
      await AtividadeService.enviar(
        'proposta',
        data.id,
        data,
        `Proposta enviada: ${data.titulo} (${data.numero_proposta})`
      )
    } else if (status === 'aprovada') {
      await AtividadeService.aprovar(
        'proposta',
        data.id,
        data,
        `Proposta aprovada: ${data.titulo} (${data.numero_proposta})`
      )
    } else {
      await AtividadeService.editar(
        'proposta',
        data.id,
        propostaAnterior,
        data,
        `Status da proposta alterado: ${data.titulo} de "${statusAnterior}" para "${statusNovo}"`
      )
    }

    return data
  }
}
