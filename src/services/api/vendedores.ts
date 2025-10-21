import { supabase } from '@/lib/supabase'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { AtividadeService } from './atividades'

export interface Vendedor {
  id: string
  user_id: string | null
  cpf?: string
  whatsapp?: string
  telefone?: string
  data_nascimento?: string
  endereco?: string
  numero?: string
  complemento?: string
  bairro?: string
  cidade?: string
  estado?: string
  cep?: string
  segmentos_principais?: string[]
  segmentos_secundarios?: string[]
  regioes_atendimento?: string[]
  tipo_atendimento?: 'presencial' | 'online' | 'hibrido'
  meta_mensal?: number
  comissao_percentual?: number
  data_contratacao?: string
  salario_base?: number
  status?: 'ativo' | 'inativo' | 'ferias' | 'afastado' | 'desligado'
  observacoes?: string
  horarios_vendedor?: {
    [key: string]: {
      ativo: boolean
      periodos: Array<{
        inicio: string
        fim: string
      }>
    }
  }
  profile: string // Campo para filtro por empresa
  created_at: string
  updated_at: string
  // Profile fields
  nome?: string
  email?: string
  full_name?: string
  avatar_url?: string
  role?: string
}

export interface VendedorCreateData {
  nome: string
  email: string
  senha: string
  cpf?: string
  whatsapp?: string
  telefone?: string
  data_nascimento?: string
  endereco?: string
  numero?: string
  complemento?: string
  bairro?: string
  cidade?: string
  estado?: string
  cep?: string
  segmentos_principais?: string[]
  segmentos_secundarios?: string[]
  regioes_atendimento?: string[]
  tipo_atendimento?: 'presencial' | 'online' | 'hibrido'
  meta_mensal?: number
  comissao_percentual?: number
  data_contratacao?: string
  salario_base?: number
  status?: 'ativo' | 'inativo' | 'ferias' | 'afastado' | 'desligado'
  observacoes?: string
  horarios_vendedor?: {
    [key: string]: {
      ativo: boolean
      periodos: Array<{
        inicio: string
        fim: string
      }>
    }
  }
}

export interface VendedorUpdateData {
  nome?: string
  email?: string
  telefone?: string
  cpf?: string
  whatsapp?: string
  cargo?: string
  meta_mensal?: number
  comissao_percentual?: number
  salario_base?: number
  data_contratacao?: string
  segmentos_principais?: string[]
  segmentos_secundarios?: string[]
  regioes_atendimento?: string[]
  status?: 'ativo' | 'inativo' | 'ferias' | 'afastado' | 'desligado'
  ativo?: boolean
  horarios_vendedor?: {
    [key: string]: {
      ativo: boolean
      periodos: Array<{
        inicio: string
        fim: string
      }>
    }
  }
}

export const vendedoresService = {
  async getAll(): Promise<Vendedor[]> {
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

    // Use admin_profile_id to filter vendedores
    const adminId = currentProfile.admin_profile_id || currentProfile.id

    const { data, error } = await supabase
      .from('vendedores')
      .select(`
        id,
        cpf,
        whatsapp,
        telefone,
        data_nascimento,
        endereco,
        numero,
        complemento,
        bairro,
        cidade,
        estado,
        cep,
        segmentos_principais,
        segmentos_secundarios,
        regioes_atendimento,
        tipo_atendimento,
        meta_mensal,
        comissao_percentual,
        data_contratacao,
        salario_base,
        status,
        observacoes,
        horarios_vendedor,
        profile,
        created_at,
        updated_at,
        profiles!vendedores_user_id_fkey(
          full_name,
          email,
          avatar_url,
          role
        )
      `)
      .eq('profile', adminId) // Filter by company

    if (error) {
      console.error('Erro ao buscar vendedores:', error)
      throw new Error(`Erro ao buscar vendedores: ${error.message}`)
    }

    // Flatten profile data
    const vendedores = data?.map((vendedor: any) => ({
      ...vendedor,
      user_id: null, // Explicitly set to null to avoid user_id issues
      nome: vendedor.profiles?.full_name || '',
      email: vendedor.profiles?.email || '',
      full_name: vendedor.profiles?.full_name || '',
      avatar_url: vendedor.profiles?.avatar_url || '',
      role: vendedor.profiles?.role || '',
      profiles: undefined // Remove nested object
    })) || []

    return vendedores
  },

  async getStats() {
    // Total de vendedores
    const { count: totalVendedores } = await supabase
      .from('vendedores')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'ativo')

    // Meta total da equipe
    const { data: metaData } = await supabase
      .from('vendedores')
      .select('meta_mensal')
      .eq('status', 'ativo')

    const metaTotal = metaData?.reduce((acc: number, v: any) => acc + (v.meta_mensal || 0), 0) || 0

    // Vendas realizadas (soma de propostas aprovadas do mês atual)
    const inicioMes = new Date()
    inicioMes.setDate(1)
    inicioMes.setHours(0, 0, 0, 0)

    const { data: vendasData } = await supabase
      .from('propostas')
      .select('valor_total, vendedor_id')
      .eq('status', 'aprovada')
      .gte('created_at', inicioMes.toISOString())

    const realizadoTotal = vendasData?.reduce((acc: number, v: any) => acc + (v.valor_total || 0), 0) || 0

    // Melhor vendedor do mês
    const vendedorPerformance = vendasData?.reduce((acc: any, venda: any) => {
      const vendedorId = venda.vendedor_id
      if (!acc[vendedorId]) {
        acc[vendedorId] = { total: 0, vendedor_id: vendedorId }
      }
      acc[vendedorId].total += venda.valor_total || 0
      return acc
    }, {})

    const melhorVendedorData = Object.values(vendedorPerformance || {})
      .sort((a: any, b: any) => b.total - a.total)[0] as any

    let melhorVendedorNome = 'N/A'
    let melhorVendedorTotal = 0
    if (melhorVendedorData?.vendedor_id) {
      const { data: vendedorData } = await supabase
        .from('vendedores')
        .select('nome, email')
        .eq('id', melhorVendedorData.vendedor_id)
        .single()

      melhorVendedorNome = vendedorData?.nome || 'N/A'
      melhorVendedorTotal = melhorVendedorData.total
    }

    return {
      totalVendedores: totalVendedores || 0,
      metaTotal,
      realizadoTotal,
      melhorVendedor: melhorVendedorNome,
      melhorVendedorTotal,
      percentualMeta: metaTotal > 0 ? (realizadoTotal / metaTotal) * 100 : 0
    }
  },

  async getById(id: string): Promise<Vendedor | null> {
    const { data, error } = await supabase
      .from('vendedores')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Erro ao buscar vendedor:', error)
      throw new Error(`Erro ao buscar vendedor: ${error.message}`)
    }

    return data
  },

  async create(vendedorData: VendedorCreateData): Promise<Vendedor> {
    try {
      // Get current admin's profile ID
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      if (!currentUser) {
        throw new Error('Usuário não autenticado')
      }

      // Use Edge Function create-vendedor
      const response = await fetch(`${supabase.supabaseUrl}/functions/v1/create-vendedor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabase.supabaseKey}`,
        },
        body: JSON.stringify({
          vendedorData,
          adminId: currentUser.id
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('❌ Erro na Edge Function:', errorData)
        throw new Error(`Erro na Edge Function: ${errorData.error || 'Erro desconhecido'}`)
      }

      const result = await response.json()

      // Return the vendedor data from Edge Function response
      const vendedorResult = result.vendedor

      // Registrar atividade
      try {
        await AtividadeService.criar(
          'vendedor',
          vendedorResult.id,
          vendedorResult,
          `Vendedor criado: ${vendedorResult.nome || vendedorData.nome} (${vendedorResult.email || vendedorData.email})`
        )
      } catch (atividadeError) {
        console.error('⚠️ Erro ao registrar atividade (não crítico):', atividadeError)
      }
      return vendedorResult

    } catch (error) {
      console.error('❌ Erro ao criar vendedor:', error)
      throw error
    }
  },

  async update(id: string, updates: VendedorUpdateData): Promise<Vendedor> {
    // Buscar dados anteriores para o log
    const vendedorAnterior = await this.getById(id)
    
    const { data, error } = await supabase
      .from('vendedores')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar vendedor:', error)
      throw new Error(`Erro ao atualizar vendedor: ${error.message}`)
    }

    // Registrar atividade
    await AtividadeService.editar(
      'vendedor',
      data.id,
      vendedorAnterior,
      data,
      `Vendedor editado: ${data.nome} (${data.email})`
    )

    return data
  },

  async delete(id: string): Promise<void> {
    try {
      // Buscar dados do vendedor antes de deletar
      const vendedorCompleto = await this.getById(id)
      
      if (!vendedorCompleto) {
        throw new Error('Vendedor não encontrado')
      }

      // Buscar o vendedor para obter o user_id
      const { data: vendedor } = await supabase
        .from('vendedores')
        .select('user_id')
        .eq('id', id)
        .single()

      const userId = vendedor?.user_id

      if (!userId) {
        
        // Se não tem user_id, deletar apenas da tabela vendedores
        const { error: vendedorError } = await supabase
          .from('vendedores')
          .delete()
          .eq('id', id)

        if (vendedorError) {
          console.error('❌ Erro ao deletar vendedor:', vendedorError)
          throw new Error(`Erro ao deletar vendedor: ${vendedorError.message}`)
        }
      } else {
        // Step 1: Primeiro, remover a referência vendedor_id do profile para evitar constraint
        const { error: updateProfileError } = await supabaseAdmin
          .from('profiles')
          .update({ vendedor_id: null })
          .eq('id', userId)

        if (updateProfileError) {
          console.error('⚠️ Erro ao remover referência vendedor_id (continuando):', updateProfileError)
        }

        // Step 2: Deletar da tabela vendedores
        const { error: vendedorError } = await supabase
          .from('vendedores')
          .delete()
          .eq('id', id)

        if (vendedorError) {
          console.error('❌ Erro ao deletar vendedor:', vendedorError)
          throw new Error(`Erro ao deletar vendedor: ${vendedorError.message}`)
        }
        // Step 3: Usar Edge Function para deletar profile e auth user
        try {
          const response = await fetch(`${supabase.supabaseUrl}/functions/v1/delete-vendedor`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabase.supabaseKey}`,
            },
            body: JSON.stringify({ userId })
          })

          if (!response.ok) {
            const errorData = await response.json()
            console.error('❌ Erro na Edge Function:', errorData)
            throw new Error(`Erro na Edge Function: ${errorData.error || 'Erro desconhecido'}`)
          }

          const result = await response.json()
        } catch (edgeFunctionError) {
          console.error('⚠️ Erro na Edge Function (não crítico):', edgeFunctionError)
          // Não falhar aqui, pois o vendedor já foi deletado da tabela principal
        }
      }

      // Registrar atividade
      try {
        await AtividadeService.deletar(
          'vendedor',
          id,
          vendedorCompleto,
          `Vendedor deletado completamente: ${vendedorCompleto.nome} (${vendedorCompleto.email}) - Removido do sistema, perfil e autenticação`
        )
      } catch (atividadeError) {
        console.error('⚠️ Erro ao registrar atividade (não crítico):', atividadeError)
      }

    } catch (error) {
      console.error('❌ Erro ao deletar vendedor completamente:', error)
      throw error
    }
  },

  async getPerformance(vendedorId: string, periodo?: { inicio: string; fim: string }) {
    let query = supabase
      .from('propostas')
      .select('valor_total, status, created_at')
      .eq('vendedor_id', vendedorId)

    if (periodo) {
      query = query
        .gte('created_at', periodo.inicio)
        .lte('created_at', periodo.fim)
    } else {
      // Se não especificar período, usar mês atual
      const inicioMes = new Date()
      inicioMes.setDate(1)
      inicioMes.setHours(0, 0, 0, 0)
      query = query.gte('created_at', inicioMes.toISOString())
    }

    const { data: propostas, error } = await query

    if (error) {
      console.error('Erro ao buscar performance:', error)
      throw new Error(`Erro ao buscar performance: ${error.message}`)
    }

    const totalVendas = propostas?.filter((p: any) => p.status === 'aprovada').reduce((acc: number, p: any) => acc + (p.valor_total || 0), 0) || 0
    const aprovadas = propostas?.filter((p: any) => p.status === 'aprovada').length || 0
    const pendentes = propostas?.filter((p: any) => ['rascunho', 'revisao', 'enviada', 'em_negociacao'].includes(p.status)).length || 0
    const rejeitadas = propostas?.filter((p: any) => p.status === 'rejeitada').length || 0

    return {
      total_vendas: totalVendas,
      propostas_aprovadas: aprovadas,
      propostas_pendentes: pendentes,
      propostas_rejeitadas: rejeitadas,
      total_propostas: propostas?.length || 0,
      taxa_conversao: propostas?.length ? (aprovadas / propostas.length) * 100 : 0
    }
  },

  async getVendedorWithPerformance(vendedorId: string) {
    // Buscar dados do vendedor
    const vendedor = await this.getById(vendedorId)
    if (!vendedor) return null

    // Buscar performance do mês atual
    const performance = await this.getPerformance(vendedorId)

    return {
      ...vendedor,
      performance: {
        ...performance,
        meta_mensal: vendedor.meta_mensal || 0,
        percentual_meta: vendedor.meta_mensal ? (performance.total_vendas / vendedor.meta_mensal) * 100 : 0
      }
    }
  }
}
