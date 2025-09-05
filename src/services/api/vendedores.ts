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
}

export interface VendedorUpdateData {
  nome?: string
  email?: string
  telefone?: string
  cargo?: string
  meta_mensal?: number
  comissao_percentual?: number
  ativo?: boolean
}

export const vendedoresService = {
  async getAll(): Promise<Vendedor[]> {
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
        created_at,
        updated_at,
        profiles!vendedores_user_id_fkey(
          full_name,
          email,
          avatar_url,
          role
        )
      `)

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

    const metaTotal = metaData?.reduce((acc, v) => acc + (v.meta_mensal || 0), 0) || 0

    // Vendas realizadas (soma de propostas aprovadas do mês atual)
    const inicioMes = new Date()
    inicioMes.setDate(1)
    inicioMes.setHours(0, 0, 0, 0)

    const { data: vendasData } = await supabase
      .from('propostas')
      .select('valor_total, vendedor_id')
      .eq('status', 'aprovada')
      .gte('created_at', inicioMes.toISOString())

    const realizadoTotal = vendasData?.reduce((acc, v) => acc + (v.valor_total || 0), 0) || 0

    // Melhor vendedor do mês
    const vendedorPerformance = vendasData?.reduce((acc: any, venda) => {
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
      // Step 1: Create auth user
      const password = vendedorData.senha || Math.random().toString(36).slice(-8) + 'A1!'
      
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: vendedorData.email,
        password: password,
        email_confirm: true,
        user_metadata: {
          full_name: vendedorData.nome,
          role: 'vendedor'
        }
      })

      if (authError) {
        console.error('Erro ao criar usuário de autenticação:', authError)
        throw new Error(`Erro ao criar usuário: ${authError.message}`)
      }

      const userId = authData.user.id

      try {
        // Step 2: Update or create profile (may already exist from trigger)
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: userId,
            full_name: vendedorData.nome,
            email: vendedorData.email,
            role: 'vendedor'
          })
          .select()
          .single()

        if (profileError) {
          console.error('Erro ao criar/atualizar profile:', profileError)
          throw new Error(`Erro ao criar profile: ${profileError.message}`)
        }

        // Step 3: Create vendedor linked to user
        const insertData: any = {
          user_id: userId,
          cpf: vendedorData.cpf || null,
          whatsapp: vendedorData.whatsapp || null,
          telefone: vendedorData.telefone || null,
          data_nascimento: vendedorData.data_nascimento || null,
          endereco: vendedorData.endereco || null,
          numero: vendedorData.numero || null,
          complemento: vendedorData.complemento || null,
          bairro: vendedorData.bairro || null,
          cidade: vendedorData.cidade || null,
          estado: vendedorData.estado || null,
          cep: vendedorData.cep || null,
          segmentos_principais: vendedorData.segmentos_principais || null,
          segmentos_secundarios: vendedorData.segmentos_secundarios || null,
          regioes_atendimento: vendedorData.regioes_atendimento || null,
          tipo_atendimento: vendedorData.tipo_atendimento || 'hibrido',
          meta_mensal: vendedorData.meta_mensal || 0,
          comissao_percentual: vendedorData.comissao_percentual || 5,
          data_contratacao: vendedorData.data_contratacao || null,
          salario_base: vendedorData.salario_base || 0,
          status: vendedorData.status || 'ativo',
          observacoes: vendedorData.observacoes || null,
          nome: vendedorData.nome,
          email: vendedorData.email
        }

        // Remove empty string values that should be null for database
        Object.keys(insertData).forEach(key => {
          if (insertData[key] === '') {
            insertData[key] = null
          }
        })

        const { data: vendedorResult, error: vendedorError } = await supabase
          .from('vendedores')
          .insert(insertData)
          .select()
          .single()

        if (vendedorError) {
          console.error('Erro ao criar vendedor:', vendedorError)
          throw new Error(`Erro ao criar vendedor: ${vendedorError.message}`)
        }

        // Registrar atividade
        await AtividadeService.criar(
          'vendedor',
          vendedorResult.id,
          vendedorResult,
          `Vendedor criado: ${vendedorResult.nome} (${vendedorResult.email})`
        )

        return vendedorResult

      } catch (error) {
        // If profile or vendedor creation fails, clean up the auth user
        await supabaseAdmin.auth.admin.deleteUser(userId)
        throw error
      }

    } catch (error) {
      console.error('Erro ao criar vendedor:', error)
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

      // Step 1: Deletar o vendedor da tabela vendedores
      const { error: vendedorError } = await supabase
        .from('vendedores')
        .delete()
        .eq('id', id)

      if (vendedorError) {
        console.error('Erro ao deletar vendedor:', vendedorError)
        throw new Error(`Erro ao deletar vendedor: ${vendedorError.message}`)
      }

      // Step 2: Deletar o profile se existir user_id
      if (userId) {
        const { error: profileError } = await supabase
          .from('profiles')
          .delete()
          .eq('id', userId)

        if (profileError) {
          console.error('Erro ao deletar profile:', profileError)
          // Não falhar aqui, apenas logar o erro
        }

        // Step 3: Deletar o usuário do Auth usando supabaseAdmin
        try {
          const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId)
          if (authError) {
            console.error('Erro ao deletar usuário do auth:', authError)
            // Não falhar aqui, apenas logar o erro
          }
        } catch (authDeleteError) {
          console.error('Erro ao deletar usuário do auth:', authDeleteError)
          // Não falhar aqui, apenas logar o erro
        }
      }

      // Registrar atividade
      await AtividadeService.deletar(
        'vendedor',
        id,
        vendedorCompleto,
        `Vendedor deletado completamente: ${vendedorCompleto.nome} (${vendedorCompleto.email}) - Removido do sistema, perfil e autenticação`
      )

    } catch (error) {
      console.error('Erro ao deletar vendedor completamente:', error)
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

    const totalVendas = propostas?.filter(p => p.status === 'aprovada').reduce((acc, p) => acc + (p.valor_total || 0), 0) || 0
    const aprovadas = propostas?.filter(p => p.status === 'aprovada').length || 0
    const pendentes = propostas?.filter(p => ['rascunho', 'revisao', 'enviada', 'em_negociacao'].includes(p.status)).length || 0
    const rejeitadas = propostas?.filter(p => p.status === 'rejeitada').length || 0

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
