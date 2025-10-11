import { supabase } from '@/lib/supabase'

export interface DashboardStats {
  totalClientes: number
  clientesAtivos: number
  clientesNovos: number
  propostasAbertas: number
  propostasEnviadas: number
  propostasGanhas: number
  propostasPerdidas: number
  agendamentosHoje: number
  agendamentosConfirmados: number
  agendamentosPendentes: number
  faturamentoMensal: number
  faturamentoAnual: number
  ticketMedio: number
  totalProdutos: number
  produtosAtivos: number
  totalVendedores: number
  vendedoresAtivos: number
}

export interface RecentActivity {
  id: string
  tipo: string
  titulo: string
  descricao: string
  data: string
  usuario: string
  icone: string
}

export interface TopProduct {
  id: string
  nome: string
  codigo: string
  imagem_principal?: string | null
  vendas_count: number
  valor_total: number
  crescimento: number
}

export interface RecentProposal {
  id: string
  numero_proposta: string
  status: string
  valor_total: number
  cliente_nome: string
  vendedor_nome: string
  created_at: string
}

export interface SalesConversion {
  vendedor_id: string
  vendedor_nome: string
  total_propostas: number
  propostas_aprovadas: number
  taxa_conversao: number
  valor_aprovado: number
}

export interface PipelineStage {
  etapa: string
  quantidade: number
  valor_total: number
  cor: string
}

export interface MonthlyRevenue {
  mes: string
  valor: number
  crescimento: number
}

// Buscar estatísticas gerais do dashboard
export const getDashboardStats = async (vendedorId?: string | null, isAdmin?: boolean): Promise<DashboardStats> => {
  try {
    // Get current user's profile to filter by company
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
      throw new Error('Perfil do usuário não encontrado')
    }

    // Determine company profile ID for filtering
    const adminId = currentProfile.admin_profile_id || currentProfile.id

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfYear = new Date(now.getFullYear(), 0, 1)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // OTIMIZADO: Usar contagens diretas do Supabase (muito mais rápido)
    
    // Contagens de clientes
    let clientesBaseQuery = supabase.from('clientes').select('*', { count: 'exact', head: true }).eq('profile', adminId)
    if (!isAdmin && vendedorId) clientesBaseQuery = clientesBaseQuery.eq('vendedor_id', vendedorId)
    
    const [
      { count: totalClientes },
      { count: clientesAtivos },
      { count: clientesNovos }
    ] = await Promise.all([
      clientesBaseQuery,
      supabase.from('clientes').select('*', { count: 'exact', head: true })
        .eq('profile', adminId)
        .not('etapa_pipeline', 'in', '(perdido,inativo)')
        .then(r => !isAdmin && vendedorId ? supabase.from('clientes').select('*', { count: 'exact', head: true }).eq('profile', adminId).eq('vendedor_id', vendedorId).not('etapa_pipeline', 'in', '(perdido,inativo)') : r),
      supabase.from('clientes').select('*', { count: 'exact', head: true })
        .eq('profile', adminId)
        .gte('created_at', startOfMonth.toISOString())
        .then(r => !isAdmin && vendedorId ? supabase.from('clientes').select('*', { count: 'exact', head: true }).eq('profile', adminId).eq('vendedor_id', vendedorId).gte('created_at', startOfMonth.toISOString()) : r)
    ])

    // Contagens de propostas
    let propostasBaseQuery = supabase.from('propostas').select('*', { count: 'exact', head: true }).eq('profile', adminId)
    if (!isAdmin && vendedorId) propostasBaseQuery = propostasBaseQuery.eq('vendedor_id', vendedorId)
    
    const [
      { count: propostasAbertas },
      { count: propostasEnviadas },
      { count: propostasGanhas },
      { count: propostasPerdidas }
    ] = await Promise.all([
      supabase.from('propostas').select('*', { count: 'exact', head: true })
        .eq('profile', adminId)
        .in('status', ['rascunho', 'revisao', 'aprovada_interna', 'enviada', 'visualizada', 'em_negociacao'])
        .then(r => !isAdmin && vendedorId ? supabase.from('propostas').select('*', { count: 'exact', head: true }).eq('profile', adminId).eq('vendedor_id', vendedorId).in('status', ['rascunho', 'revisao', 'aprovada_interna', 'enviada', 'visualizada', 'em_negociacao']) : r),
      supabase.from('propostas').select('*', { count: 'exact', head: true })
        .eq('profile', adminId)
        .eq('status', 'enviada')
        .then(r => !isAdmin && vendedorId ? supabase.from('propostas').select('*', { count: 'exact', head: true }).eq('profile', adminId).eq('vendedor_id', vendedorId).eq('status', 'enviada') : r),
      supabase.from('propostas').select('*', { count: 'exact', head: true })
        .eq('profile', adminId)
        .eq('status', 'aprovada')
        .then(r => !isAdmin && vendedorId ? supabase.from('propostas').select('*', { count: 'exact', head: true }).eq('profile', adminId).eq('vendedor_id', vendedorId).eq('status', 'aprovada') : r),
      supabase.from('propostas').select('*', { count: 'exact', head: true })
        .eq('profile', adminId)
        .in('status', ['rejeitada', 'vencida'])
        .then(r => !isAdmin && vendedorId ? supabase.from('propostas').select('*', { count: 'exact', head: true }).eq('profile', adminId).eq('vendedor_id', vendedorId).in('status', ['rejeitada', 'vencida']) : r)
    ])

    // Contagens de agendamentos
    const [
      { count: agendamentosHoje },
      { count: agendamentosConfirmados },
      { count: agendamentosPendentes }
    ] = await Promise.all([
      supabase.from('agendamentos').select('*', { count: 'exact', head: true })
        .eq('profile', adminId)
        .gte('data_inicio', today.toISOString())
        .lt('data_inicio', tomorrow.toISOString())
        .then(r => !isAdmin && vendedorId ? supabase.from('agendamentos').select('*', { count: 'exact', head: true }).eq('profile', adminId).eq('vendedor_id', vendedorId).gte('data_inicio', today.toISOString()).lt('data_inicio', tomorrow.toISOString()) : r),
      supabase.from('agendamentos').select('*', { count: 'exact', head: true })
        .eq('profile', adminId)
        .eq('status', 'confirmado')
        .then(r => !isAdmin && vendedorId ? supabase.from('agendamentos').select('*', { count: 'exact', head: true }).eq('profile', adminId).eq('vendedor_id', vendedorId).eq('status', 'confirmado') : r),
      supabase.from('agendamentos').select('*', { count: 'exact', head: true })
        .eq('profile', adminId)
        .eq('status', 'agendado')
        .then(r => !isAdmin && vendedorId ? supabase.from('agendamentos').select('*', { count: 'exact', head: true }).eq('profile', adminId).eq('vendedor_id', vendedorId).eq('status', 'agendado') : r)
    ])

    // Faturamento (buscar apenas propostas aprovadas com valores)
    let faturamentoQuery = supabase.from('propostas')
      .select('valor_total, data_aprovacao_interna, updated_at')
      .eq('profile', adminId)
      .eq('status', 'aprovada')
    
    if (!isAdmin && vendedorId) faturamentoQuery = faturamentoQuery.eq('vendedor_id', vendedorId)
    
    const { data: propostasAprovadas } = await faturamentoQuery
    
    const propostasAprovadasMes = propostasAprovadas?.filter((p: any) => {
      const dataAprovacao = p.data_aprovacao_interna || p.updated_at
      return new Date(dataAprovacao) >= startOfMonth
    }) || []
    
    const propostasAprovadasAno = propostasAprovadas?.filter((p: any) => {
      const dataAprovacao = p.data_aprovacao_interna || p.updated_at
      return new Date(dataAprovacao) >= startOfYear
    }) || []
    
    const faturamentoMensal = propostasAprovadasMes.reduce((sum: number, p: any) => sum + (p.valor_total || 0), 0)
    const faturamentoAnual = propostasAprovadasAno.reduce((sum: number, p: any) => sum + (p.valor_total || 0), 0)
    const ticketMedio = propostasAprovadasAno.length > 0 ? faturamentoAnual / propostasAprovadasAno.length : 0

    // Contagens de produtos e vendedores
    const [
      { count: totalProdutos },
      { count: produtosAtivos },
      { count: totalVendedores },
      { count: vendedoresAtivos }
    ] = await Promise.all([
      supabase.from('produtos').select('*', { count: 'exact', head: true }).eq('profile', adminId),
      supabase.from('produtos').select('*', { count: 'exact', head: true }).eq('profile', adminId).eq('status', 'ativo'),
      supabase.from('vendedores').select('*', { count: 'exact', head: true }).eq('profile', adminId),
      supabase.from('vendedores').select('*', { count: 'exact', head: true }).eq('profile', adminId).eq('status', 'ativo')
    ])

    return {
      totalClientes,
      clientesAtivos,
      clientesNovos,
      propostasAbertas,
      propostasEnviadas,
      propostasGanhas,
      propostasPerdidas,
      agendamentosHoje,
      agendamentosConfirmados,
      agendamentosPendentes,
      faturamentoMensal,
      faturamentoAnual,
      ticketMedio,
      totalProdutos,
      produtosAtivos,
      totalVendedores,
      vendedoresAtivos
    }
  } catch (error) {
    console.error('Erro ao buscar estatísticas do dashboard:', error)
    throw error
  }
}

// Buscar atividades recentes
export const getRecentActivities = async (limit: number = 10): Promise<RecentActivity[]> => {
  try {
    // Get current user's profile to filter by company
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
      throw new Error('Perfil do usuário não encontrado')
    }

    // Determine company profile ID for filtering
    const adminId = currentProfile.admin_profile_id || currentProfile.id

    // Buscar atividades da tabela atividades com filtro multi-tenant
    const { data: atividadesData } = await supabase
      .from('atividades')
      .select(`
        id,
        entidade_tipo,
        entidade_id,
        acao,
        descricao,
        created_at,
        usuario_id,
        profiles!atividades_usuario_id_fkey(nome, email)
      `)
      .eq('profile', adminId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (!atividadesData) return []

    const activities: RecentActivity[] = atividadesData.map((atividade: any) => {
      const usuario = (atividade.profiles as any)?.nome || (atividade.profiles as any)?.email || 'Sistema'
      
      let icone = 'activity'
      let titulo = atividade.descricao || atividade.acao
      
      // Definir ícone baseado no tipo de entidade e ação
      switch (atividade.entidade_tipo) {
        case 'cliente':
          icone = 'user-plus'
          break
        case 'proposta':
          icone = 'file-text'
          break
        case 'agendamento':
          icone = 'calendar'
          break
        case 'produto':
          icone = 'package'
          break
        case 'vendedor':
          icone = 'users'
          break
        default:
          icone = 'activity'
      }

      return {
        id: atividade.id,
        tipo: atividade.entidade_tipo,
        titulo: titulo,
        descricao: atividade.acao,
        data: atividade.created_at,
        usuario: usuario,
        icone: icone
      }
    })

    return activities

  } catch (error) {
    console.error('Erro ao buscar atividades recentes:', error)
    
    // Get profile again for fallback
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    if (!currentUser) return []

    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('id, role, admin_profile_id')
      .eq('id', currentUser.id)
      .single()

    if (!currentProfile) return []
    const adminId = currentProfile.admin_profile_id || currentProfile.id
    
    // Fallback: buscar atividades recentes de diferentes entidades se a tabela atividades não funcionar
    const { data: clientesRecentes } = await supabase
      .from('clientes')
      .select('id, nome_contato, nome_empresa, created_at')
      .eq('profile', adminId)
      .order('created_at', { ascending: false })
      .limit(3)

    const { data: propostasRecentes } = await supabase
      .from('propostas')
      .select('id, titulo, numero_proposta, created_at, status')
      .eq('profile', adminId)
      .order('created_at', { ascending: false })
      .limit(3)

    const { data: agendamentosRecentes } = await supabase
      .from('agendamentos')
      .select('id, titulo, created_at, status')
      .eq('profile', adminId)
      .order('created_at', { ascending: false })
      .limit(3)

    const activities: RecentActivity[] = []

    // Adicionar clientes recentes
    clientesRecentes?.forEach((cliente: any) => {
      activities.push({
        id: `cliente-${cliente.id}`,
        tipo: 'cliente',
        titulo: `Novo cliente: ${cliente.nome_empresa || cliente.nome_contato}`,
        descricao: 'Cliente adicionado ao sistema',
        data: cliente.created_at,
        usuario: 'Sistema',
        icone: 'user-plus'
      })
    })

    // Adicionar propostas recentes
    propostasRecentes?.forEach((proposta: any) => {
      activities.push({
        id: `proposta-${proposta.id}`,
        tipo: 'proposta',
        titulo: `Nova proposta: ${proposta.titulo}`,
        descricao: `Proposta ${proposta.numero_proposta} criada`,
        data: proposta.created_at,
        usuario: 'Sistema',
        icone: 'file-text'
      })
    })

    // Adicionar agendamentos recentes
    agendamentosRecentes?.forEach((agendamento: any) => {
      activities.push({
        id: `agendamento-${agendamento.id}`,
        tipo: 'agendamento',
        titulo: `Novo agendamento: ${agendamento.titulo}`,
        descricao: `Agendamento ${agendamento.status}`,
        data: agendamento.created_at,
        usuario: 'Sistema',
        icone: 'calendar'
      })
    })

    // Ordenar por data e limitar
    return activities
      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
      .slice(0, limit)
  }
}

// Buscar propostas recentes
export const getRecentProposals = async (limit: number = 5, vendedorId?: string | null, isAdmin?: boolean): Promise<RecentProposal[]> => {
  try {
    // Get current user's profile to filter by company
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
      throw new Error('Perfil do usuário não encontrado')
    }

    // Determine company profile ID for filtering
    const adminId = currentProfile.admin_profile_id || currentProfile.id

    // Buscar propostas com filtro multi-tenant
    let propostasQuery = supabase
      .from('propostas')
      .select(`
        id,
        numero_proposta,
        titulo,
        status,
        valor_total,
        created_at,
        cliente_id,
        vendedor_id
      `)
      .eq('profile', adminId)
      .order('created_at', { ascending: false })
      .limit(limit)
    
    // Se não for admin, filtrar também por vendedor
    if (!isAdmin && vendedorId) {
      propostasQuery = propostasQuery.eq('vendedor_id', vendedorId)
    }
    
    const { data: propostas, error } = await propostasQuery

    if (error) {
      console.error('Erro ao buscar propostas:', error)
      return []
    }

    if (!propostas || propostas.length === 0) {
      return []
    }

    // Buscar clientes separadamente com filtro multi-tenant
    const clienteIds = [...new Set(propostas.map((p: any) => p.cliente_id).filter(Boolean))]
    
    const { data: clientes } = await supabase
      .from('clientes')
      .select('id, nome_contato, nome_empresa')
      .eq('profile', adminId)
      .in('id', clienteIds)

    // Buscar vendedores separadamente com filtro multi-tenant
    const vendedorIds = [...new Set(propostas.map((p: any) => p.vendedor_id).filter(Boolean))]
    
    const { data: vendedores } = await supabase
      .from('vendedores')
      .select('id, nome')
      .eq('profile', adminId)
      .in('id', vendedorIds)

    // Criar mapas para acesso rápido
    const clientesMap = new Map(clientes?.map((c: any) => [c.id, {
      nome_contato: c.nome_contato,
      nome_empresa: c.nome_empresa
    }]) || [])
    const vendedoresMap = new Map(vendedores?.map((v: any) => [v.id, v.nome]) || [])

    const result = propostas.map((proposta: any) => {
      const clienteData = clientesMap.get(proposta.cliente_id) || {} as any
      const vendedorNome = vendedoresMap.get(proposta.vendedor_id)
      
      // Formatar nome do cliente: "Nome do Contato (Nome da Empresa)" ou apenas um deles
      let clienteNome = 'Cliente não informado'
      if (clienteData) {
        const nomeContato = clienteData.nome_contato || ''
        const nomeEmpresa = clienteData.nome_empresa || ''
        
        if (nomeContato && nomeEmpresa) {
          clienteNome = `${nomeContato} (${nomeEmpresa})`
        } else if (nomeContato) {
          clienteNome = nomeContato
        } else if (nomeEmpresa) {
          clienteNome = nomeEmpresa
        }
      }
      
      return {
        id: proposta.id,
        numero_proposta: proposta.titulo || proposta.numero_proposta || `PROP-${proposta.id.slice(0, 8)}`,
        status: proposta.status || 'rascunho',
        valor_total: proposta.valor_total || 0,
        cliente_nome: clienteNome,
        vendedor_nome: vendedorNome || 'Vendedor não informado',
        created_at: proposta.created_at
      }
    })

    return result

  } catch (error) {
    console.error('Erro ao buscar propostas recentes:', error)
    return []
  }
}

// Buscar conversão por vendedor
export const getSalesConversion = async (vendedorId?: string | null, isAdmin?: boolean): Promise<SalesConversion[]> => {
  try {
    // Get current user's profile to filter by company
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
      throw new Error('Perfil do usuário não encontrado')
    }

    // Determine company profile ID for filtering
    const adminId = currentProfile.admin_profile_id || currentProfile.id

    let vendedoresQuery = supabase
      .from('vendedores')
      .select(`
        id,
        nome,
        propostas!inner(
          id,
          status,
          valor_total
        )
      `)
      .eq('profile', adminId)
    
    // Se não for admin, filtrar apenas o vendedor atual
    if (!isAdmin && vendedorId) {
      vendedoresQuery = vendedoresQuery.eq('id', vendedorId)
    }
    
    const { data: vendedores, error } = await vendedoresQuery

    if (error) {
      console.error('Erro ao buscar dados de conversão:', error)
      return []
    }

    const conversaoData = vendedores?.map((vendedor: any) => {
      const propostas = vendedor.propostas || []
      const totalPropostas = propostas.length
      const propostasAprovadas = propostas.filter((p: any) => p.status === 'aprovada').length
      const valorAprovado = propostas
        .filter((p: any) => p.status === 'aprovada')
        .reduce((sum: number, p: any) => sum + (p.valor_total || 0), 0)
      
      const taxaConversao = totalPropostas > 0 ? (propostasAprovadas / totalPropostas) * 100 : 0

      return {
        vendedor_id: vendedor.id,
        vendedor_nome: vendedor.nome,
        total_propostas: totalPropostas,
        propostas_aprovadas: propostasAprovadas,
        taxa_conversao: taxaConversao,
        valor_aprovado: valorAprovado
      }
    }).filter((v: any) => v.total_propostas > 0) // Só mostrar vendedores com propostas
    .sort((a: any, b: any) => b.taxa_conversao - a.taxa_conversao) || []

    return conversaoData

  } catch (error) {
    console.error('Erro ao buscar conversão por vendedor:', error)
    return []
  }
}

// Buscar pipeline de vendas
export const getSalesPipeline = async (vendedorId?: string | null, isAdmin?: boolean): Promise<PipelineStage[]> => {
  try {
    // Get current user's profile to filter by company
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
      throw new Error('Perfil do usuário não encontrado')
    }

    // Determine company profile ID for filtering
    const adminId = currentProfile.admin_profile_id || currentProfile.id

    // Buscar propostas agrupadas por status com filtro multi-tenant
    let propostasQuery = supabase
      .from('propostas')
      .select('status, valor_total')
      .eq('profile', adminId)
    
    // Se não for admin, filtrar também por vendedor
    if (!isAdmin && vendedorId) {
      propostasQuery = propostasQuery.eq('vendedor_id', vendedorId)
    }
    
    const { data: propostas } = await propostasQuery

    if (!propostas) return []

    // Definir as etapas do pipeline baseadas nos status das propostas (conforme PropostasPage)
    const pipelineStages = [
      { etapa: 'Rascunho', status: 'rascunho', cor: 'bg-gray-500' },
      { etapa: 'Em Revisão', status: 'revisao', cor: 'bg-orange-500' },
      { etapa: 'Aprovada Interna', status: 'aprovada_interna', cor: 'bg-teal-500' },
      { etapa: 'Enviada', status: 'enviada', cor: 'bg-blue-500' },
      { etapa: 'Visualizada', status: 'visualizada', cor: 'bg-indigo-500' },
      { etapa: 'Em Negociação', status: 'em_negociacao', cor: 'bg-amber-500' },
      { etapa: 'Aprovada', status: 'aprovada', cor: 'bg-green-500' },
      { etapa: 'Rejeitada', status: 'rejeitada', cor: 'bg-red-500' }
    ]

    // Calcular estatísticas para cada etapa
    const pipeline = pipelineStages.map(stage => {
      const propostasEtapa = propostas.filter((p: any) => p.status === stage.status)
      const quantidade = propostasEtapa.length
      const valor_total = propostasEtapa.reduce((sum: number, p: any) => sum + (p.valor_total || 0), 0)

      return {
        etapa: stage.etapa,
        quantidade,
        valor_total,
        cor: stage.cor
      }
    }).filter(stage => stage.quantidade > 0) // Mostrar apenas etapas com propostas

    return pipeline

  } catch (error) {
    console.error('Erro ao buscar pipeline de vendas:', error)
    return []
  }
}

// Buscar receita mensal
export const getMonthlyRevenue = async (months: number = 12): Promise<MonthlyRevenue[]> => {
  try {
    const { data: propostas } = await supabase
      .from('propostas')
      .select('valor_total, data_aprovacao_interna, updated_at, status')
      .eq('status', 'aprovada')
      .order('updated_at', { ascending: false })

    if (!propostas) return []

    const monthlyData: { [key: string]: number } = {}
    const now = new Date()

    // Inicializar últimos meses
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      monthlyData[key] = 0
    }

    // Agrupar por mês usando data de aprovação
    propostas.forEach((proposta: any) => {
      const dataAprovacao = proposta.data_aprovacao_interna || proposta.updated_at
      const date = new Date(dataAprovacao)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      
      if (monthlyData[key] !== undefined) {
        monthlyData[key] += proposta.valor_total || 0
      }
    })

    // Converter para array com crescimento
    const monthNames = [
      'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
      'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
    ]

    const result: MonthlyRevenue[] = []
    const keys = Object.keys(monthlyData).sort()

    keys.forEach((key, index) => {
      const [year, month] = key.split('-')
      const monthName = monthNames[parseInt(month) - 1]
      const valor = monthlyData[key]
      
      let crescimento = 0
      if (index > 0) {
        const previousValue = monthlyData[keys[index - 1]]
        if (previousValue > 0) {
          crescimento = ((valor - previousValue) / previousValue) * 100
        }
      }

      result.push({
        mes: `${monthName}/${year.slice(2)}`,
        valor,
        crescimento: Math.round(crescimento)
      })
    })

    return result

  } catch (error) {
    console.error('Erro ao buscar receita mensal:', error)
    return []
  }
}
