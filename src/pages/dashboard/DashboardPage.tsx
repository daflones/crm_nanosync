import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuthStore } from '@/stores/authStore'
import { useCurrentUser, useIsAdmin, useCurrentVendedorId } from '@/hooks/useCurrentUser'
import { 
  Users, 
  FileText, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Loader2
} from 'lucide-react'
import { 
  getDashboardStats, 
  getRecentProposals,
  getSalesConversion,
  getSalesPipeline,
  type DashboardStats,
  type RecentProposal,
  type SalesConversion,
  type PipelineStage
} from '@/services/api/dashboard'
import { formatCurrency } from '@/utils/format'

export function DashboardPage() {
  const { user } = useAuthStore()
  const { data: currentUser } = useCurrentUser()
  const isAdmin = useIsAdmin()
  const currentVendedorId = useCurrentVendedorId()
  
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null)
  const [recentProposals, setRecentProposals] = useState<RecentProposal[]>([])
  const [salesConversion, setSalesConversion] = useState<SalesConversion[]>([])
  const [pipeline, setPipeline] = useState<PipelineStage[]>([])
  const [loading, setLoading] = useState(true)

  // Carregar dados do dashboard
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true)
        const [statsData, proposalsData, conversionData, pipelineData] = await Promise.all([
          getDashboardStats(currentVendedorId, isAdmin),
          getRecentProposals(5, currentVendedorId, isAdmin),
          getSalesConversion(currentVendedorId, isAdmin),
          getSalesPipeline(currentVendedorId, isAdmin)
        ])
        
        setDashboardStats(statsData)
        setRecentProposals(proposalsData)
        setSalesConversion(conversionData)
        setPipeline(pipelineData)
      } catch (error) {
        console.error('Erro ao carregar dados do dashboard:', error)
      } finally {
        setLoading(false)
      }
    }

    if (currentUser) {
      loadDashboardData()
    }
  }, [currentUser, currentVendedorId, isAdmin])

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando dashboard...</p>
        </div>
      </div>
    )
  }


  return (
    <div className="w-full h-full space-y-6">
      {/* Header */}
      <div className="w-full">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Bem-vindo de volta, {user?.full_name}! Aqui está o resumo das suas atividades.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="w-full grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {dashboardStats && [
          {
            title: 'Total de Clientes',
            value: dashboardStats.totalClientes.toString(),
            description: `${dashboardStats.clientesNovos} novos este mês`,
            icon: Users,
            color: 'text-blue-600',
            bgColor: 'bg-blue-100 dark:bg-blue-900/20',
            trend: 'up'
          },
          {
            title: 'Propostas Ativas',
            value: dashboardStats.propostasAbertas.toString(),
            description: `${dashboardStats.propostasEnviadas} enviadas`,
            icon: FileText,
            color: 'text-amber-600',
            bgColor: 'bg-amber-100 dark:bg-amber-900/20',
            trend: 'up'
          },
          {
            title: 'Agendamentos Hoje',
            value: dashboardStats.agendamentosHoje.toString(),
            description: `${dashboardStats.agendamentosConfirmados} confirmados`,
            icon: Calendar,
            color: 'text-cyan-600',
            bgColor: 'bg-cyan-100 dark:bg-cyan-900/20',
            trend: 'same'
          },
          {
            title: 'Faturamento Mensal',
            value: formatCurrency(dashboardStats.faturamentoMensal),
            description: `Ticket médio: ${formatCurrency(dashboardStats.ticketMedio)}`,
            icon: DollarSign,
            color: 'text-green-600',
            bgColor: 'bg-green-100 dark:bg-green-900/20',
            trend: 'up'
          }
        ].map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                  {stat.trend === 'up' && (
                    <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
                  )}
                  {stat.trend === 'down' && (
                    <TrendingDown className="h-3 w-3 text-red-600 mr-1" />
                  )}
                  {stat.description}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Main Content Grid */}
      <div className="w-full grid gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Recent Proposals */}
        <Card>
          <CardHeader>
            <CardTitle>Propostas Recentes</CardTitle>
            <CardDescription>
              Últimas propostas criadas no sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentProposals.length > 0 ? recentProposals.map((proposta) => (
                <div key={proposta.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                    <FileText className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {proposta.numero_proposta}
                      </p>
                      <Badge variant={proposta.status === 'aprovada' ? 'default' : proposta.status === 'enviada' ? 'secondary' : 'outline'}>
                        {proposta.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Cliente: {proposta.cliente_nome}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Vendedor: {proposta.vendedor_nome}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-sm font-semibold text-green-600">
                        {formatCurrency(proposta.valor_total)}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {new Date(proposta.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                </div>
              )) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                  Nenhuma proposta recente encontrada
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Sales Conversion by Salesperson */}
        <Card>
          <CardHeader>
            <CardTitle>Conversão por Vendedor</CardTitle>
            <CardDescription>
              Taxa de conversão e valor de propostas aprovadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {salesConversion.length > 0 ? salesConversion.map((vendedor) => (
                <div key={vendedor.vendedor_id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                      <Users className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {vendedor.vendedor_nome}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {vendedor.propostas_aprovadas} de {vendedor.total_propostas} propostas
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-green-600">
                      {vendedor.taxa_conversao.toFixed(1)}%
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatCurrency(vendedor.valor_aprovado)}
                    </p>
                  </div>
                </div>
              )) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                  Nenhum dado de conversão encontrado
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>


      {/* Pipeline Overview */}
      <div className="w-full">
        <Card>
          <CardHeader>
            <CardTitle>Pipeline de Vendas</CardTitle>
            <CardDescription>
              Status atual das propostas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
              {pipeline.length > 0 ? pipeline.map((item) => (
                <div key={item.etapa} className="text-center">
                  <div className={`h-2 ${item.cor} rounded-full mb-2`} />
                  <p className="text-xs font-medium text-gray-900 dark:text-white">
                    {item.etapa}
                  </p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {item.quantidade}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatCurrency(item.valor_total)}
                  </p>
                </div>
              )) : (
                <div className="col-span-full text-center py-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Nenhuma proposta encontrada
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
