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
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfYear = new Date(now.getFullYear(), 0, 1)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Buscar dados das tabelas com filtros baseados no papel do usuário
    let clientesQuery = supabase.from('clientes').select('*')
    let propostasQuery = supabase.from('propostas').select('*')
    let agendamentosQuery = supabase.from('agendamentos').select('*')
    
    // Se não for admin, filtrar por vendedor
    if (!isAdmin && vendedorId) {
      clientesQuery = clientesQuery.eq('vendedor_id', vendedorId)
      propostasQuery = propostasQuery.eq('vendedor_id', vendedorId)
      agendamentosQuery = agendamentosQuery.eq('vendedor_id', vendedorId)
    }
    
    const { data: clientesData } = await clientesQuery
    const { data: propostasData } = await propostasQuery
    const { data: agendamentosData } = await agendamentosQuery

    const { data: produtosData } = await supabase
      .from('produtos')
      .select('*')

    const { data: vendedoresData } = await supabase
      .from('vendedores')
      .select('*')

    // Calcular estatísticas dos clientes (baseado na página de clientes)
    const totalClientes = clientesData?.length || 0
    const clientesAtivos = clientesData?.filter(c => 
      !['perdido', 'inativo'].includes(c.etapa_pipeline || '')
    ).length || 0
    const clientesNovos = clientesData?.filter(c => 
      new Date(c.created_at) >= startOfMonth
    ).length || 0

    // Calcular estatísticas das propostas (baseado na página de propostas)
    const propostasAbertas = propostasData?.filter(p => 
      ['rascunho', 'revisao', 'aprovada_interna', 'enviada', 'visualizada', 'em_negociacao'].includes(p.status)
    ).length || 0
    
    const propostasEnviadas = propostasData?.filter(p => p.status === 'enviada').length || 0
    const propostasGanhas = propostasData?.filter(p => p.status === 'aprovada').length || 0
    const propostasPerdidas = propostasData?.filter(p => 
      ['rejeitada', 'vencida'].includes(p.status)
    ).length || 0

    // Calcular estatísticas dos agendamentos (baseado na página de agendamentos)
    const agendamentosHoje = agendamentosData?.filter(a => {
      const agendamentoDate = new Date(a.data_inicio)
      return agendamentoDate >= today && agendamentoDate < tomorrow
    }).length || 0
    
    const agendamentosConfirmados = agendamentosData?.filter(a => a.status === 'confirmado').length || 0
    const agendamentosPendentes = agendamentosData?.filter(a => a.status === 'agendado').length || 0

    // Calcular faturamento mensal (propostas aprovadas no mês atual)
    const propostasAprovadasMes = propostasData?.filter(p => {
      if (p.status !== 'aprovada') return false
      // Usar data_aprovacao_interna se disponível, senão updated_at
      const dataAprovacao = p.data_aprovacao_interna || p.updated_at
      return new Date(dataAprovacao) >= startOfMonth
    }) || []
    
    const faturamentoMensal = propostasAprovadasMes
      .reduce((sum, p) => sum + (p.valor_total || 0), 0)
    
    // Faturamento anual
    const propostasAprovadasAno = propostasData?.filter(p => {
      if (p.status !== 'aprovada') return false
      const dataAprovacao = p.data_aprovacao_interna || p.updated_at
      return new Date(dataAprovacao) >= startOfYear
    }) || []
    
    const faturamentoAnual = propostasAprovadasAno
      .reduce((sum, p) => sum + (p.valor_total || 0), 0)

    const ticketMedio = propostasAprovadasAno.length > 0 
      ? faturamentoAnual / propostasAprovadasAno.length 
      : 0

    // Calcular estatísticas dos produtos
    const totalProdutos = produtosData?.length || 0
    const produtosAtivos = produtosData?.filter(p => p.status === 'ativo').length || 0

    // Calcular estatísticas dos vendedores
    const totalVendedores = vendedoresData?.length || 0
    const vendedoresAtivos = vendedoresData?.filter(v => v.status === 'ativo').length || 0

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
    // Buscar atividades da tabela atividades
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
      .order('created_at', { ascending: false })
      .limit(limit)

    if (!atividadesData) return []

    const activities: RecentActivity[] = atividadesData.map(atividade => {
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
    
    // Fallback: buscar atividades recentes de diferentes entidades se a tabela atividades não funcionar
    const { data: clientesRecentes } = await supabase
      .from('clientes')
      .select('id, nome_contato, nome_empresa, created_at')
      .order('created_at', { ascending: false })
      .limit(3)

    const { data: propostasRecentes } = await supabase
      .from('propostas')
      .select('id, titulo, numero_proposta, created_at, status')
      .order('created_at', { ascending: false })
      .limit(3)

    const { data: agendamentosRecentes } = await supabase
      .from('agendamentos')
      .select('id, titulo, created_at, status')
      .order('created_at', { ascending: false })
      .limit(3)

    const activities: RecentActivity[] = []

    // Adicionar clientes recentes
    clientesRecentes?.forEach(cliente => {
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
    propostasRecentes?.forEach(proposta => {
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
    agendamentosRecentes?.forEach(agendamento => {
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
    console.log('=== BUSCANDO PROPOSTAS RECENTES ===')
    
    // Primeiro verificar se existem propostas
    const { data: allPropostas } = await supabase
      .from('propostas')
      .select('id, numero_proposta, status, created_at')
      .limit(10)

    console.log('Total de propostas encontradas:', allPropostas?.length || 0)
    if (allPropostas && allPropostas.length > 0) {
      console.log('Exemplos de propostas:', allPropostas.slice(0, 3))
    }

    // Buscar propostas com joins separados para evitar problemas
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
      .order('created_at', { ascending: false })
      .limit(limit)
    
    // Se não for admin, filtrar por vendedor
    if (!isAdmin && vendedorId) {
      propostasQuery = propostasQuery.eq('vendedor_id', vendedorId)
    }
    
    const { data: propostas, error } = await propostasQuery

    if (error) {
      console.error('Erro ao buscar propostas:', error)
      return []
    }

    console.log('Propostas encontradas:', propostas?.length || 0)

    if (!propostas || propostas.length === 0) {
      console.log('Nenhuma proposta encontrada')
      return []
    }

    // Buscar clientes separadamente
    const clienteIds = [...new Set(propostas.map(p => p.cliente_id).filter(Boolean))]
    console.log('IDs de clientes para buscar:', clienteIds)
    
    const { data: clientes } = await supabase
      .from('clientes')
      .select('id, nome_contato, nome_empresa')
      .in('id', clienteIds)

    console.log('Clientes encontrados:', clientes?.length || 0)
    console.log('Dados dos clientes:', clientes)

    // Buscar vendedores separadamente  
    const vendedorIds = [...new Set(propostas.map(p => p.vendedor_id).filter(Boolean))]
    console.log('IDs de vendedores para buscar:', vendedorIds)
    
    const { data: vendedores } = await supabase
      .from('vendedores')
      .select('id, nome')
      .in('id', vendedorIds)

    console.log('Vendedores encontrados:', vendedores?.length || 0)
    console.log('Dados dos vendedores:', vendedores)

    // Criar mapas para acesso rápido
    const clientesMap = new Map(clientes?.map(c => [c.id, {
      nome_contato: c.nome_contato,
      nome_empresa: c.nome_empresa
    }]) || [])
    const vendedoresMap = new Map(vendedores?.map(v => [v.id, v.nome]) || [])
    
    console.log('Mapa de clientes:', Array.from(clientesMap.entries()))
    console.log('Mapa de vendedores:', Array.from(vendedoresMap.entries()))

    const result = propostas.map(proposta => {
      const clienteData = clientesMap.get(proposta.cliente_id)
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
      
      console.log(`Proposta ${proposta.numero_proposta}:`)
      console.log(`  - cliente_id: ${proposta.cliente_id}`)
      console.log(`  - vendedor_id: ${proposta.vendedor_id}`)
      console.log(`  - cliente_nome formatado: ${clienteNome}`)
      console.log(`  - vendedor_nome encontrado: ${vendedorNome}`)
      
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

    console.log('Resultado final:', result)
    return result

  } catch (error) {
    console.error('Erro ao buscar propostas recentes:', error)
    return []
  }
}

// Buscar conversão por vendedor
export const getSalesConversion = async (vendedorId?: string | null, isAdmin?: boolean): Promise<SalesConversion[]> => {
  try {
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
    
    // Se não for admin, filtrar apenas o vendedor atual
    if (!isAdmin && vendedorId) {
      vendedoresQuery = vendedoresQuery.eq('id', vendedorId)
    }
    
    const { data: vendedores, error } = await vendedoresQuery

    if (error) {
      console.error('Erro ao buscar dados de conversão:', error)
      return []
    }

    const conversaoData = vendedores?.map(vendedor => {
      const propostas = vendedor.propostas || []
      const totalPropostas = propostas.length
      const propostasAprovadas = propostas.filter(p => p.status === 'aprovada').length
      const valorAprovado = propostas
        .filter(p => p.status === 'aprovada')
        .reduce((sum, p) => sum + (p.valor_total || 0), 0)
      
      const taxaConversao = totalPropostas > 0 ? (propostasAprovadas / totalPropostas) * 100 : 0

      return {
        vendedor_id: vendedor.id,
        vendedor_nome: vendedor.nome,
        total_propostas: totalPropostas,
        propostas_aprovadas: propostasAprovadas,
        taxa_conversao: taxaConversao,
        valor_aprovado: valorAprovado
      }
    }).filter(v => v.total_propostas > 0) // Só mostrar vendedores com propostas
    .sort((a, b) => b.taxa_conversao - a.taxa_conversao) || []

    return conversaoData

  } catch (error) {
    console.error('Erro ao buscar conversão por vendedor:', error)
    return []
  }
}

// Buscar pipeline de vendas
export const getSalesPipeline = async (vendedorId?: string | null, isAdmin?: boolean): Promise<PipelineStage[]> => {
  try {
    // Buscar propostas agrupadas por status
    let propostasQuery = supabase
      .from('propostas')
      .select('status, valor_total')
    
    // Se não for admin, filtrar por vendedor
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
      const propostasEtapa = propostas.filter(p => p.status === stage.status)
      const quantidade = propostasEtapa.length
      const valor_total = propostasEtapa.reduce((sum, p) => sum + (p.valor_total || 0), 0)

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
    propostas.forEach(proposta => {
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
