import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Download,
  FileText,
  TrendingUp,
  Calendar,
  Filter,
  BarChart3,
  PieChart,
  LineChart,
  Users,
  Package,
  DollarSign,
  ShoppingCart
} from 'lucide-react'

export function RelatoriosPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('mes')
  
  const relatoriosDisponiveis = [
    {
      id: 1,
      titulo: 'Relatório de Vendas',
      descricao: 'Análise completa das vendas realizadas',
      tipo: 'vendas',
      icon: ShoppingCart,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/20',
      ultimaAtualizacao: 'Hoje, 10:30'
    },
    {
      id: 2,
      titulo: 'Performance de Vendedores',
      descricao: 'Desempenho individual e metas atingidas',
      tipo: 'vendedores',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20',
      ultimaAtualizacao: 'Ontem, 18:45'
    },
    {
      id: 3,
      titulo: 'Análise de Produtos',
      descricao: 'Produtos mais vendidos e estoque',
      tipo: 'produtos',
      icon: Package,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20',
      ultimaAtualizacao: 'Hoje, 09:15'
    },
    {
      id: 4,
      titulo: 'Relatório Financeiro',
      descricao: 'Receitas, despesas e lucratividade',
      tipo: 'financeiro',
      icon: DollarSign,
      color: 'text-amber-600',
      bgColor: 'bg-amber-100 dark:bg-amber-900/20',
      ultimaAtualizacao: 'Hoje, 11:00'
    },
    {
      id: 5,
      titulo: 'Pipeline de Vendas',
      descricao: 'Status de oportunidades e conversão',
      tipo: 'pipeline',
      icon: TrendingUp,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100 dark:bg-indigo-900/20',
      ultimaAtualizacao: 'Hoje, 08:30'
    },
    {
      id: 6,
      titulo: 'Análise de Clientes',
      descricao: 'Segmentação e comportamento',
      tipo: 'clientes',
      icon: BarChart3,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-100 dark:bg-cyan-900/20',
      ultimaAtualizacao: 'Ontem, 16:20'
    },
  ]

  const metricas = [
    {
      titulo: 'Vendas do Mês',
      valor: 'R$ 485.320',
      variacao: '+12.5%',
      comparacao: 'vs. mês anterior',
      tendencia: 'up'
    },
    {
      titulo: 'Ticket Médio',
      valor: 'R$ 3.250',
      variacao: '+8.3%',
      comparacao: 'vs. média anual',
      tendencia: 'up'
    },
    {
      titulo: 'Taxa de Conversão',
      valor: '68%',
      variacao: '+5.2%',
      comparacao: 'vs. último trimestre',
      tendencia: 'up'
    },
    {
      titulo: 'Novos Clientes',
      valor: '42',
      variacao: '-3.1%',
      comparacao: 'vs. mês anterior',
      tendencia: 'down'
    },
  ]

  const periodos = [
    { value: 'hoje', label: 'Hoje' },
    { value: 'semana', label: 'Esta Semana' },
    { value: 'mes', label: 'Este Mês' },
    { value: 'trimestre', label: 'Trimestre' },
    { value: 'ano', label: 'Este Ano' },
    { value: 'personalizado', label: 'Personalizado' },
  ]

  return (
    <div className="w-full h-full space-y-6">
      {/* Header */}
      <div className="w-full flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Relatórios e Analytics
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Análises e insights do seu negócio
          </p>
        </div>
        <Button className="bg-primary-600 hover:bg-primary-700">
          <Download className="mr-2 h-4 w-4" />
          Exportar Dados
        </Button>
      </div>

      {/* Period Selector */}
      <div className="flex items-center space-x-2">
        <Calendar className="h-4 w-4 text-gray-500" />
        <div className="flex space-x-1">
          {periodos.map((periodo) => (
            <button
              key={periodo.value}
              onClick={() => setSelectedPeriod(periodo.value)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                selectedPeriod === periodo.value
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              {periodo.label}
            </button>
          ))}
        </div>
      </div>

      {/* Métricas Resumo */}
      <div className="w-full grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {metricas.map((metrica) => (
          <Card key={metrica.titulo}>
            <CardContent className="p-6">
              <div className="space-y-2">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {metrica.titulo}
                </p>
                <div className="flex items-baseline space-x-2">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {metrica.valor}
                  </p>
                  <span className={`text-sm font-medium ${
                    metrica.tendencia === 'up' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {metrica.variacao}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {metrica.comparacao}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Preview */}
      <div className="w-full grid gap-4 grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Vendas por Período</CardTitle>
            <CardDescription>
              Evolução das vendas nos últimos 12 meses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <LineChart className="h-12 w-12 text-gray-400" />
              <span className="ml-3 text-gray-500 dark:text-gray-400">
                Gráfico de Linhas
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Categoria</CardTitle>
            <CardDescription>
              Participação de cada categoria nas vendas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <PieChart className="h-12 w-12 text-gray-400" />
              <span className="ml-3 text-gray-500 dark:text-gray-400">
                Gráfico de Pizza
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Available Reports */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Relatórios Disponíveis</CardTitle>
              <CardDescription>
                Selecione um relatório para visualizar ou baixar
              </CardDescription>
            </div>
            <Button variant="outline" size="sm">
              <Filter className="mr-2 h-4 w-4" />
              Filtros
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {relatoriosDisponiveis.map((relatorio) => {
              const Icon = relatorio.icon
              return (
                <div
                  key={relatorio.id}
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex items-start space-x-3">
                    <div className={`p-2 rounded-lg ${relatorio.bgColor}`}>
                      <Icon className={`h-5 w-5 ${relatorio.color}`} />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                        {relatorio.titulo}
                      </h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {relatorio.descricao}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                        Atualizado: {relatorio.ultimaAtualizacao}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2 mt-3">
                    <Button size="sm" variant="outline" className="flex-1">
                      <FileText className="mr-1 h-3 w-3" />
                      Visualizar
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      <Download className="mr-1 h-3 w-3" />
                      Baixar
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Top Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Top 5 Produtos Mais Vendidos</CardTitle>
          <CardDescription>
            Produtos com melhor performance no período selecionado
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-2 py-3 text-left">#</th>
                  <th className="px-2 py-3 text-left">Produto</th>
                  <th className="px-2 py-3 text-left">Categoria</th>
                  <th className="px-2 py-3 text-right">Quantidade</th>
                  <th className="px-2 py-3 text-right">Receita</th>
                  <th className="px-2 py-3 text-right">Crescimento</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {[
                  { pos: 1, nome: 'Embalagem Premium A4', categoria: 'Embalagens', qtd: 1250, receita: 'R$ 56.250', crescimento: '+22%' },
                  { pos: 2, nome: 'Caixa Personalizada M', categoria: 'Caixas', qtd: 980, receita: 'R$ 31.850', crescimento: '+18%' },
                  { pos: 3, nome: 'Sacola Ecológica G', categoria: 'Sacolas', qtd: 756, receita: 'R$ 21.168', crescimento: '+35%' },
                  { pos: 4, nome: 'Display Counter PDV', categoria: 'Displays', qtd: 245, receita: 'R$ 30.625', crescimento: '+12%' },
                  { pos: 5, nome: 'Envelope Kraft 25x35', categoria: 'Envelopes', qtd: 2100, receita: 'R$ 25.200', crescimento: '+8%' },
                ].map((produto) => (
                  <tr key={produto.pos} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="px-2 py-3 font-medium text-gray-900 dark:text-white">
                      {produto.pos}
                    </td>
                    <td className="px-2 py-3 text-gray-900 dark:text-white">
                      {produto.nome}
                    </td>
                    <td className="px-2 py-3 text-gray-600 dark:text-gray-400">
                      {produto.categoria}
                    </td>
                    <td className="px-2 py-3 text-right text-gray-900 dark:text-white">
                      {produto.qtd}
                    </td>
                    <td className="px-2 py-3 text-right font-medium text-gray-900 dark:text-white">
                      {produto.receita}
                    </td>
                    <td className="px-2 py-3 text-right">
                      <span className={`text-sm font-medium ${
                        produto.crescimento.startsWith('+') ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {produto.crescimento}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
