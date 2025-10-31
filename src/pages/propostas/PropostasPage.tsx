import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { SimpleDateTime } from '@/components/ui/simple-datetime'
import { 
  Plus, 
  Search, 
  Filter,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Send,
  Eye,
  Edit,
  Trash2,
  Download,
  MessageCircle,
  Check
} from 'lucide-react'
import { usePropostas, usePropostasStatusStats, usePropostasValorStats, useCreateProposta, useUpdateProposta, useDeleteProposta } from '@/hooks/usePropostas'
import { useClientes } from '@/hooks/useClientes'
import { useVendedores } from '@/hooks/useVendedores'
import { useProdutos } from '@/hooks/useProdutos'
import { useProfile } from '@/hooks/useConfiguracoes'
import { PlanoAtivoButton } from '@/components/PlanoAtivoGuard'
import { type PropostaCreateData } from '@/services/api/propostas'
import { toast } from 'sonner'
import { useNotifications } from '@/contexts/NotificationContext'
import { downloadPropostaPDF, generatePropostaPDF, COLOR_THEMES, type ColorTheme } from '@/services/pdf/propostaGenerator'
import { whatsappService } from '@/services/api/whatsapp'

const initialPropostaState: PropostaCreateData = {
  cliente_id: '',
  vendedor_id: '',
  titulo: '',
  versao: 1,
  proposta_pai: '',
  descricao: '',
  valor_total: 0,
  valor_produtos: 0,
  valor_servicos: 0,
  valor_desconto: 0,
  percentual_desconto: 0,
  valor_frete: 0,
  valor_impostos: 0,
  status: 'enviada',
  forma_pagamento: '',
  condicoes_pagamento: '',
  prazo_entrega: '',
  local_entrega: '',
  responsavel_frete: 'cliente',
  condicoes_especiais: '',
  garantia: '',
  suporte_incluido: false,
  treinamento_incluido: false,
  validade_dias: 30,
  data_vencimento: '',
  feedback_cliente: '',
  objecoes: '',
  pontos_negociacao: '',
  motivo_rejeicao: '',
  template_usado: '',
  requer_aprovacao: false,
  motivo_aprovacao: '',
  recompra_ativada: false,
  data_recompra: '',
  observacoes: '',
  termos_condicoes: '',
  itens: []
}

export function PropostasPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('todos')
  const [page, setPage] = useState(1)
  const [limit] = useState(30) // 30 propostas por página
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [selectedProposta, setSelectedProposta] = useState<any>(null)
  const [newProposta, setNewProposta] = useState<PropostaCreateData>(initialPropostaState)
  const [editProposta, setEditProposta] = useState<PropostaCreateData>(initialPropostaState)
  const [propostaToDelete, setPropostaToDelete] = useState<string | null>(null)
  const [isDownloadingPDF, setIsDownloadingPDF] = useState<string | null>(null)
  const [isSendWhatsAppModalOpen, setIsSendWhatsAppModalOpen] = useState(false)
  const [selectedPropostaForWhatsApp, setSelectedPropostaForWhatsApp] = useState<any>(null)
  const [whatsappMessage, setWhatsappMessage] = useState('')
  const [pdfColorTheme, setPdfColorTheme] = useState<ColorTheme>('purple')

  // Hooks com paginação e filtro
  const { data: propostas = [], count: totalPropostasFiltered = 0, isLoading } = usePropostas({
    page,
    limit,
    status: filterStatus === 'todos' ? undefined : filterStatus
  })
  
  // Total geral (sempre fixo)
  const { count: totalPropostas = 0 } = usePropostas({ page: 1, limit: 1 })
  
  // Buscar perfil para nome da empresa
  const { data: profile } = useProfile()
  
  // Stats por status
  const { data: statusStats = {} } = usePropostasStatusStats()
  
  // Stats de valores
  const { data: valorStats } = usePropostasValorStats()
  
  const { data: clientes = [] } = useClientes()
  const { data: vendedores = [] } = useVendedores()
  const { data: produtos = [] } = useProdutos()
  const createProposta = useCreateProposta()
  const updateProposta = useUpdateProposta()
  const deleteProposta = useDeleteProposta()
  const { createDatabaseNotification } = useNotifications()

  // Helper functions
  const getClienteName = (clienteId: string) => {
    const cliente = clientes.find(c => c.id === clienteId)
    return cliente ? cliente.nome_empresa || cliente.nome_contato : 'Cliente não encontrado'
  }

  const getVendedorName = (vendedorId: string) => {
    const vendedor = vendedores.find(v => v.id === vendedorId)
    return vendedor ? (vendedor.nome || vendedor.email) : 'Vendedor não encontrado'
  }

  // Calcular valores sugeridos baseados nos itens
  const calcularValoresSugeridos = (itens: any[]) => {
    const valorProdutos = itens
      .filter(item => item.tipo === 'produto')
      .reduce((total, item) => total + (Number(item.valor_total) || 0), 0)
    
    const valorServicos = itens
      .filter(item => item.tipo === 'servico')
      .reduce((total, item) => total + (Number(item.valor_total) || 0), 0)
    
    return { valorProdutos, valorServicos }
  }

  // Filtro de busca local (apenas busca, status é no backend)
  const filteredPropostas = searchTerm
    ? propostas.filter(proposta => {
        const searchLower = searchTerm.toLowerCase()
        return proposta.titulo.toLowerCase().includes(searchLower) ||
               proposta.numero_proposta.toLowerCase().includes(searchLower) ||
               getClienteName(proposta.cliente_id).toLowerCase().includes(searchLower)
      })
    : propostas

  // Paginação
  const totalPages = Math.ceil(totalPropostasFiltered / limit)
  const hasMore = page < totalPages
  const showingFrom = (page - 1) * limit + 1
  const showingTo = Math.min(page * limit, totalPropostasFiltered)

  // Reset page when filters change
  useEffect(() => {
    setPage(1)
  }, [searchTerm, filterStatus])

  const handleLoadMore = () => {
    setPage(prev => prev + 1)
  }

  const statusOptions = [
    { value: 'todos', label: 'Todos', count: totalPropostas },
    { value: 'enviada', label: 'Enviada', count: statusStats['enviada'] || 0, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' },
    { value: 'aprovada', label: 'Aprovada', count: statusStats['aprovada'] || 0, color: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' },
    { value: 'rejeitada', label: 'Rejeitada', count: statusStats['rejeitada'] || 0, color: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400' },
    { value: 'vencida', label: 'Vencida', count: statusStats['vencida'] || 0, color: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500' },
  ]

  // Stats do banco (valores reais)
  const valorTotalAbertas = valorStats?.valorTotalAbertas || 0
  const valorTotalAprovadas = valorStats?.valorTotalAprovadas || 0
  const totalAprovadas = valorStats?.totalAprovadas || 0
  const totalFinalizadas = valorStats?.totalFinalizadas || 0
  const taxaConversao = totalFinalizadas > 0 ? Math.round((totalAprovadas / totalFinalizadas) * 100) : 0
  
  // Stats locais (apenas para exibição)
  const propostasAtivas = propostas.filter(p => ['enviada', 'em_negociacao', 'visualizada', 'aprovada_interna'].includes(p.status))
  

  const stats = [
    {
      title: 'Propostas Ativas',
      value: propostasAtivas.length.toString(),
      description: `${propostas.filter(p => p.status === 'enviada').length} aguardando resposta`,
      icon: FileText,
      trend: propostasAtivas.length > 0 ? `${propostasAtivas.length} em andamento` : 'Nenhuma ativa',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20'
    },
    {
      title: 'Taxa de Conversão',
      value: `${taxaConversao}%`,
      description: `${totalAprovadas} aprovadas de ${totalFinalizadas} finalizadas`,
      icon: CheckCircle,
      trend: totalAprovadas > 0 ? `${totalAprovadas} aprovadas` : 'Nenhuma aprovada',
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/20'
    },
    {
      title: 'Valor Total Pendente',
      value: `R$ ${valorTotalAbertas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      description: `R$ ${valorTotalAbertas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} aprovado Em 0 propostas abertas`,
      icon: FileText,
      trend: valorTotalAprovadas > 0 ? `R$ ${valorTotalAprovadas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} aprovado` : 'R$ 0 aprovado',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20'
    },
    {
      title: 'Valor Total Aprovado',
      value: `R$ ${valorTotalAprovadas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      description: `Em ${totalAprovadas} propostas aprovadas`,
      icon: CheckCircle,
      trend: '',
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/20'
    },
  ]

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'enviada':
        return <Send className="h-4 w-4 text-blue-600" />
      case 'aprovada':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'rejeitada':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'vencida':
        return <AlertCircle className="h-4 w-4 text-gray-500" />
      default:
        return <FileText className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusStyle = (status: string) => {
    const option = statusOptions.find(opt => opt.value === status)
    return option?.color || 'bg-gray-100 text-gray-700'
  }

  return (
    <div className="w-full h-full space-y-6">
      {/* Header */}
      <div className="w-full flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Propostas Comerciais
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gerencie suas propostas e negociações
          </p>
        </div>
        <PlanoAtivoButton
          className="bg-primary-600 hover:bg-primary-700"
          variant="primary"
          onClick={() => {
            setIsCreateModalOpen(true)
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Nova Proposta
        </PlanoAtivoButton>
      </div>

      {/* Stats */}
      <div className="w-full grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title} className="dark:bg-gray-800">
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
                <div className="flex items-center text-xs text-muted-foreground">
                  <span className={stat.trend.startsWith('+') ? 'text-green-600' : 'text-blue-600'}>
                    {stat.trend}
                  </span>
                  <span className="ml-1">{stat.description}</span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Status Filters */}
      <div className="flex flex-wrap gap-2">
        {statusOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => setFilterStatus(option.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterStatus === option.value
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {option.label}
            {option.count > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-white/20 dark:bg-gray-800/20 rounded-full text-xs">
                {option.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            type="search"
            placeholder="Buscar propostas..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline">
          <Filter className="mr-2 h-4 w-4" />
          Filtros Avançados
        </Button>
      </div>

      {/* Propostas List */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {isLoading ? (
          <div className="col-span-full text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
            <p className="text-gray-500 text-lg">Carregando propostas...</p>
          </div>
        ) : filteredPropostas.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <FileText className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-gray-500 text-lg">Nenhuma proposta encontrada</p>
            <p className="text-gray-400 text-sm mt-1">Tente ajustar os filtros ou criar uma nova proposta</p>
          </div>
        ) : (
          <>
          {filteredPropostas.map((proposta) => (
            <Card key={proposta.id} className="group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-900/50 overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400"></div>
              
              <CardContent className="p-6">
                {/* Header Section */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">
                        {proposta.titulo}
                      </h3>
                      <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full dark:bg-gray-700 dark:text-gray-300">
                        v{proposta.versao}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-medium">{getClienteName(proposta.cliente_id)}</span>
                      <span>•</span>
                      <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded dark:bg-gray-700">
                        {proposta.numero_proposta}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(proposta.status)}
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusStyle(proposta.status)}`}>
                      {statusOptions.find(s => s.value === proposta.status)?.label}
                    </span>
                  </div>
                </div>

                {/* Value Section */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4 mb-4 border border-blue-100 dark:border-blue-800">
                  <div className="text-center">
                    <p className="text-sm text-blue-600 dark:text-blue-400 mb-1 font-medium">Valor Total</p>
                    <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                      R$ {proposta.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    {proposta.percentual_desconto > 0 && (
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
                        {proposta.percentual_desconto}% de desconto aplicado
                      </p>
                    )}
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-3 border border-indigo-100 dark:border-indigo-800">
                    <div className="flex items-center space-x-2 mb-1">
                      <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                      <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">ITENS</p>
                    </div>
                    <p className="text-lg font-bold text-indigo-900 dark:text-indigo-100">
                      {proposta.itens?.length || 0}
                    </p>
                  </div>
                  
                  <div className="bg-violet-50 dark:bg-violet-900/20 rounded-lg p-3 border border-violet-100 dark:border-violet-800">
                    <div className="flex items-center space-x-2 mb-1">
                      <div className="w-2 h-2 bg-violet-500 rounded-full"></div>
                      <p className="text-xs font-semibold text-violet-700 dark:text-violet-300">VALIDADE</p>
                    </div>
                    <p className="text-sm font-bold text-violet-900 dark:text-violet-100">
                      {proposta.data_vencimento ? new Date(proposta.data_vencimento).toLocaleDateString('pt-BR') : 'N/A'}
                    </p>
                  </div>
                </div>

                {/* Recompra Info */}
                {proposta.recompra_ativada && (
                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 mb-6 border border-purple-100 dark:border-purple-800">
                    <div className="flex items-center space-x-2 mb-1">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <p className="text-xs font-semibold text-purple-700 dark:text-purple-300">RECOMPRA ATIVA</p>
                    </div>
                    <p className="text-sm font-bold text-purple-900 dark:text-purple-100">
                      {proposta.data_recompra ? new Date(proposta.data_recompra).toLocaleDateString('pt-BR') : 'Data não definida'}
                    </p>
                  </div>
                )}

                {/* Vendedor Info */}
                <div className="flex items-center space-x-2 mb-6 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">
                      {getVendedorName(proposta.vendedor_id)?.charAt(0) || 'V'}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Vendedor</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {getVendedorName(proposta.vendedor_id)}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  <div className="flex space-x-2">
                    <Button 
                      size="sm" 
                      className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 dark:border-blue-700 transition-all duration-200 hover:scale-105"
                      onClick={() => {
                        setSelectedProposta(proposta)
                        setIsViewModalOpen(true)
                      }}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Ver
                    </Button>
                    <Button 
                      size="sm" 
                      className="flex-1 bg-violet-50 hover:bg-violet-100 text-violet-700 border border-violet-200 dark:border-violet-700 transition-all duration-200 hover:scale-105"
                      onClick={() => {
                        setEditProposta({
                          cliente_id: proposta.cliente_id,
                          vendedor_id: proposta.vendedor_id,
                          titulo: proposta.titulo,
                          versao: proposta.versao || 1,
                          proposta_pai: proposta.proposta_pai || '',
                          descricao: proposta.descricao || '',
                          valor_total: proposta.valor_total || 0,
                          valor_produtos: proposta.valor_produtos || 0,
                          valor_servicos: proposta.valor_servicos || 0,
                          valor_desconto: proposta.valor_desconto || 0,
                          percentual_desconto: proposta.percentual_desconto || 0,
                          valor_frete: proposta.valor_frete || 0,
                          valor_impostos: proposta.valor_impostos || 0,
                          status: proposta.status,
                          forma_pagamento: proposta.forma_pagamento || '',
                          condicoes_pagamento: proposta.condicoes_pagamento || '',
                          prazo_entrega: proposta.prazo_entrega || '',
                          local_entrega: proposta.local_entrega || '',
                          responsavel_frete: proposta.responsavel_frete || 'cliente',
                          condicoes_especiais: proposta.condicoes_especiais || '',
                          garantia: proposta.garantia || '',
                          suporte_incluido: proposta.suporte_incluido || false,
                          treinamento_incluido: proposta.treinamento_incluido || false,
                          validade_dias: proposta.validade_dias || 30,
                          data_vencimento: proposta.data_vencimento ? new Date(proposta.data_vencimento).toISOString().split('T')[0] : '',
                          feedback_cliente: proposta.feedback_cliente || '',
                          objecoes: proposta.objecoes || '',
                          pontos_negociacao: proposta.pontos_negociacao || '',
                          motivo_rejeicao: proposta.motivo_rejeicao || '',
                          template_usado: proposta.template_usado || '',
                          requer_aprovacao: proposta.requer_aprovacao || false,
                          motivo_aprovacao: proposta.motivo_aprovacao || '',
                          recompra_ativada: proposta.recompra_ativada || false,
                          data_recompra: proposta.data_recompra ? new Date(proposta.data_recompra).toISOString().split('T')[0] : '',
                          observacoes: proposta.observacoes || '',
                          termos_condicoes: proposta.termos_condicoes || '',
                          itens: proposta.itens || []
                        })
                        setSelectedProposta(proposta)
                        setIsEditModalOpen(true)
                      }}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Editar
                    </Button>
                    <Button 
                      size="sm" 
                      className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 dark:border-rose-700 transition-all duration-200 hover:scale-105"
                      onClick={() => setPropostaToDelete(proposta.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button 
                      size="sm" 
                      className="flex-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 dark:border-emerald-700 transition-all duration-200 hover:scale-105"
                      onClick={async () => {
                        try {
                          setIsDownloadingPDF(proposta.id)
                          toast.loading('Gerando PDF...', { id: 'pdf-download' })
                          
                          // Buscar dados completos do cliente
                          const cliente = clientes.find(c => c.id === proposta.cliente_id)
                          const vendedor = vendedores.find(v => v.id === proposta.vendedor_id)
                          
                          const propostaComDados = {
                            ...proposta,
                            cliente: cliente ? {
                              nome_contato: cliente.nome_contato,
                              nome_empresa: cliente.nome_empresa,
                              email: cliente.email,
                              whatsapp: cliente.whatsapp,
                              cnpj: cliente.cnpj,
                              endereco: cliente.endereco,
                              cidade: cliente.cidade,
                              estado: cliente.estado
                            } : undefined,
                            vendedor: vendedor ? {
                              nome: vendedor.nome,
                              email: vendedor.email
                            } : undefined
                          }
                          
                          await downloadPropostaPDF(propostaComDados)
                          toast.success('PDF baixado com sucesso!', { id: 'pdf-download' })
                        } catch (error) {
                          console.error('Erro ao gerar PDF:', error)
                          toast.error('Erro ao gerar PDF', { id: 'pdf-download' })
                        } finally {
                          setIsDownloadingPDF(null)
                        }
                      }}
                      disabled={isDownloadingPDF === proposta.id}
                    >
                      {isDownloadingPDF === proposta.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-700 mr-2" />
                      ) : (
                        <Download className="mr-2 h-4 w-4" />
                      )}
                      Baixar PDF
                    </Button>
                    <Button 
                      size="sm" 
                      className="flex-1 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 dark:border-green-700 transition-all duration-200 hover:scale-105"
                      onClick={() => {
                        const cliente = clientes.find(c => c.id === proposta.cliente_id)
                        const vendedor = vendedores.find(v => v.id === proposta.vendedor_id)
                        
                        const propostaComDados = {
                          ...proposta,
                          cliente: cliente ? {
                            nome_contato: cliente.nome_contato,
                            nome_empresa: cliente.nome_empresa,
                            email: cliente.email,
                            whatsapp: cliente.whatsapp,
                            cnpj: cliente.cnpj,
                            endereco: cliente.endereco,
                            cidade: cliente.cidade,
                            estado: cliente.estado
                          } : undefined,
                          vendedor: vendedor ? {
                            nome: vendedor.nome,
                            email: vendedor.email
                          } : undefined
                        }
                        
                        setSelectedPropostaForWhatsApp(propostaComDados)
                        setWhatsappMessage(`Olá! Segue em anexo a proposta comercial *${proposta.titulo}*.\n\nValor: R$ ${proposta.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n\nQualquer dúvida, estou à disposição!`)
                        setIsSendWhatsAppModalOpen(true)
                      }}
                    >
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Enviar WhatsApp
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {/* Pagination Info and Load More */}
          <div className="col-span-full border-t border-gray-200 dark:border-gray-700 pt-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Mostrando <span className="font-semibold">{showingFrom}</span> a <span className="font-semibold">{showingTo}</span> de <span className="font-semibold">{totalPropostasFiltered}</span> propostas
                {filterStatus !== 'todos' && <span className="ml-1">({statusOptions.find(s => s.value === filterStatus)?.label})</span>}
              </div>
              {hasMore && (
                <Button
                  variant="outline"
                  onClick={handleLoadMore}
                  className="w-full sm:w-auto"
                  disabled={isLoading}
                >
                  {isLoading ? 'Carregando...' : `Carregar mais (${totalPropostasFiltered - showingTo} restantes)`}
                </Button>
              )}
            </div>
          </div>
          </>
        )}
      </div>

      {/* Create Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-6xl h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Nova Proposta</DialogTitle>
            <DialogDescription>
              Crie uma nova proposta comercial
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto pr-2">
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cliente_id">Cliente <span className="text-red-500">*</span></Label>
                  <Select
                    value={newProposta.cliente_id}
                    onValueChange={(value) => setNewProposta(prev => ({ ...prev, cliente_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clientes.map((cliente) => (
                        <SelectItem key={cliente.id} value={cliente.id}>
                          {cliente.nome_empresa || cliente.nome_contato}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="vendedor_id">Vendedor <span className="text-red-500">*</span></Label>
                  <Select
                    value={newProposta.vendedor_id}
                    onValueChange={(value) => setNewProposta(prev => ({ ...prev, vendedor_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um vendedor" />
                    </SelectTrigger>
                    <SelectContent>
                      {vendedores.map((vendedor) => (
                        <SelectItem key={vendedor.id} value={vendedor.id}>
                          {vendedor.nome || vendedor.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="titulo">Título da Proposta <span className="text-red-500">*</span></Label>
                <Input
                  id="titulo"
                  value={newProposta.titulo}
                  onChange={(e) => setNewProposta(prev => ({ ...prev, titulo: e.target.value }))}
                  placeholder="Ex: Fornecimento de Embalagens 2024"
                />
              </div>
            <div>
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={newProposta.descricao || ''}
                onChange={(e) => setNewProposta(prev => ({ ...prev, descricao: e.target.value }))}
                placeholder="Descrição detalhada da proposta"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="versao">Versão</Label>
                <Input
                  id="versao"
                  type="number"
                  value={newProposta.versao || 1}
                  onChange={(e) => setNewProposta(prev => ({ ...prev, versao: parseInt(e.target.value) || 1 }))}
                  placeholder="1"
                />
              </div>
              <div>
                <Label htmlFor="template_usado">Template Usado</Label>
                <Input
                  id="template_usado"
                  value={newProposta.template_usado || ''}
                  onChange={(e) => setNewProposta(prev => ({ ...prev, template_usado: e.target.value }))}
                  placeholder="Nome do template"
                />
              </div>
              <div>
                <Label htmlFor="data_vencimento">Data de Vencimento</Label>
                <SimpleDateTime
                  value={newProposta.data_vencimento}
                  onChange={(value) => setNewProposta(prev => ({ ...prev, data_vencimento: value }))}
                  showTime={false}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="valor_produtos">Valor Produtos <span className="text-red-500">*</span></Label>
                <div className="flex gap-2">
                  <Input
                    id="valor_produtos"
                    type="number"
                    step="0.01"
                    value={newProposta.valor_produtos || ''}
                    onChange={(e) => {
                      const valor = parseFloat(e.target.value) || 0
                      setNewProposta(prev => {
                        const novoTotal = valor + (prev.valor_servicos || 0) + (prev.valor_frete || 0) + (prev.valor_impostos || 0) - (prev.valor_desconto || 0)
                        return { ...prev, valor_produtos: valor, valor_total: novoTotal }
                      })
                    }}
                    placeholder="0.00"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const { valorProdutos } = calcularValoresSugeridos(newProposta.itens || [])
                      setNewProposta(prev => {
                        const novoTotal = valorProdutos + (prev.valor_servicos || 0) + (prev.valor_frete || 0) + (prev.valor_impostos || 0) - (prev.valor_desconto || 0)
                        return { ...prev, valor_produtos: valorProdutos, valor_total: novoTotal }
                      })
                    }}
                    title="Calcular automaticamente baseado nos itens"
                  >
                    ∑
                  </Button>
                </div>
                {(() => {
                  const { valorProdutos } = calcularValoresSugeridos(newProposta.itens || [])
                  return valorProdutos > 0 && valorProdutos !== (newProposta.valor_produtos || 0) ? (
                    <p className="text-xs text-blue-600 mt-1">
                      Sugestão: R$ {valorProdutos.toFixed(2)} (baseado nos itens)
                    </p>
                  ) : null
                })()}
              </div>
              <div>
                <Label htmlFor="valor_servicos">Valor Serviços</Label>
                <div className="flex gap-2">
                  <Input
                    id="valor_servicos"
                    type="number"
                    step="0.01"
                    value={newProposta.valor_servicos || ''}
                    onChange={(e) => {
                      const valor = parseFloat(e.target.value) || 0
                      setNewProposta(prev => {
                        const novoTotal = (prev.valor_produtos || 0) + valor + (prev.valor_frete || 0) + (prev.valor_impostos || 0) - (prev.valor_desconto || 0)
                        return { ...prev, valor_servicos: valor, valor_total: novoTotal }
                      })
                    }}
                    placeholder="0.00"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const { valorServicos } = calcularValoresSugeridos(newProposta.itens || [])
                      setNewProposta(prev => {
                        const novoTotal = (prev.valor_produtos || 0) + valorServicos + (prev.valor_frete || 0) + (prev.valor_impostos || 0) - (prev.valor_desconto || 0)
                        return { ...prev, valor_servicos: valorServicos, valor_total: novoTotal }
                      })
                    }}
                    title="Calcular automaticamente baseado nos itens"
                  >
                    ∑
                  </Button>
                </div>
                {(() => {
                  const { valorServicos } = calcularValoresSugeridos(newProposta.itens || [])
                  return valorServicos > 0 && valorServicos !== (newProposta.valor_servicos || 0) ? (
                    <p className="text-xs text-blue-600 mt-1">
                      Sugestão: R$ {valorServicos.toFixed(2)} (baseado nos itens)
                    </p>
                  ) : null
                })()}
              </div>
              <div>
                <Label htmlFor="valor_total">Valor Total *</Label>
                <Input
                  id="valor_total"
                  type="number"
                  step="0.01"
                  value={newProposta.valor_total || ''}
                  onChange={(e) => setNewProposta(prev => ({ ...prev, valor_total: parseFloat(e.target.value) || 0 }))}
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="valor_frete">Valor Frete</Label>
                <Input
                  id="valor_frete"
                  type="number"
                  step="0.01"
                  value={newProposta.valor_frete || ''}
                  onChange={(e) => {
                    const valor = parseFloat(e.target.value) || 0
                    setNewProposta(prev => {
                      const novoTotal = (prev.valor_produtos || 0) + (prev.valor_servicos || 0) + valor + (prev.valor_impostos || 0) - (prev.valor_desconto || 0)
                      return { ...prev, valor_frete: valor, valor_total: novoTotal }
                    })
                  }}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="percentual_desconto">Desconto (%)</Label>
                <Input
                  id="percentual_desconto"
                  type="number"
                  step="0.01"
                  max="100"
                  value={newProposta.percentual_desconto || ''}
                  onChange={(e) => {
                    const perc = parseFloat(e.target.value) || 0
                    const subtotal = (newProposta.valor_produtos || 0) + (newProposta.valor_servicos || 0)
                    const valorDesc = (subtotal * perc) / 100
                    setNewProposta(prev => {
                      const novoTotal = subtotal + (prev.valor_frete || 0) + (prev.valor_impostos || 0) - valorDesc
                      return { ...prev, percentual_desconto: perc, valor_desconto: valorDesc, valor_total: novoTotal }
                    })
                  }}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="validade_dias">Validade (dias)</Label>
                <Input
                  id="validade_dias"
                  type="number"
                  value={newProposta.validade_dias || 30}
                  onChange={(e) => setNewProposta(prev => ({ ...prev, validade_dias: parseInt(e.target.value) || 30 }))}
                  placeholder="30"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="recompra_ativada"
                  checked={newProposta.recompra_ativada || false}
                  onChange={(e) => setNewProposta(prev => ({ ...prev, recompra_ativada: e.target.checked }))}
                  className="rounded"
                />
                <Label htmlFor="recompra_ativada" className="cursor-pointer">Ativar Recompra</Label>
              </div>
              {newProposta.recompra_ativada && (
                <div>
                  <Label htmlFor="data_recompra">Data de Recompra</Label>
                  <SimpleDateTime
                    value={newProposta.data_recompra}
                    onChange={(value) => setNewProposta(prev => ({ ...prev, data_recompra: value }))}
                    showTime={false}
                  />
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="forma_pagamento">Forma de Pagamento</Label>
                <Select
                  value={newProposta.forma_pagamento || ''}
                  onValueChange={(value) => setNewProposta(prev => ({ ...prev, forma_pagamento: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a forma" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dinheiro">Dinheiro</SelectItem>
                    <SelectItem value="pix">PIX</SelectItem>
                    <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
                    <SelectItem value="cartao_debito">Cartão de Débito</SelectItem>
                    <SelectItem value="boleto">Boleto</SelectItem>
                    <SelectItem value="transferencia">Transferência</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="responsavel_frete">Responsável pelo Frete</Label>
                <Select
                  value={newProposta.responsavel_frete || 'cliente'}
                  onValueChange={(value) => setNewProposta(prev => ({ ...prev, responsavel_frete: value as any }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cliente">Cliente</SelectItem>
                    <SelectItem value="fornecedor">Fornecedor</SelectItem>
                    <SelectItem value="compartilhado">Compartilhado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="condicoes_pagamento">Condições de Pagamento</Label>
                <Input
                  id="condicoes_pagamento"
                  value={newProposta.condicoes_pagamento || ''}
                  onChange={(e) => setNewProposta(prev => ({ ...prev, condicoes_pagamento: e.target.value }))}
                  placeholder="Ex: 30 dias após entrega"
                />
              </div>
              <div>
                <Label htmlFor="prazo_entrega">Prazo de Entrega</Label>
                <Input
                  id="prazo_entrega"
                  value={newProposta.prazo_entrega || ''}
                  onChange={(e) => setNewProposta(prev => ({ ...prev, prazo_entrega: e.target.value }))}
                  placeholder="Ex: 15 dias úteis"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="local_entrega">Local de Entrega</Label>
              <Input
                id="local_entrega"
                value={newProposta.local_entrega || ''}
                onChange={(e) => setNewProposta(prev => ({ ...prev, local_entrega: e.target.value }))}
                placeholder="Endereço de entrega"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="suporte_incluido"
                  checked={newProposta.suporte_incluido || false}
                  onChange={(e) => setNewProposta(prev => ({ ...prev, suporte_incluido: e.target.checked }))}
                />
                <Label htmlFor="suporte_incluido">Suporte Incluído</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="treinamento_incluido"
                  checked={newProposta.treinamento_incluido || false}
                  onChange={(e) => setNewProposta(prev => ({ ...prev, treinamento_incluido: e.target.checked }))}
                />
                <Label htmlFor="treinamento_incluido">Treinamento Incluído</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="requer_aprovacao"
                  checked={newProposta.requer_aprovacao || false}
                  onChange={(e) => setNewProposta(prev => ({ ...prev, requer_aprovacao: e.target.checked }))}
                />
                <Label htmlFor="requer_aprovacao">Requer Aprovação</Label>
              </div>
            </div>
            <div>
              <Label htmlFor="garantia">Garantia</Label>
              <Input
                id="garantia"
                value={newProposta.garantia || ''}
                onChange={(e) => setNewProposta(prev => ({ ...prev, garantia: e.target.value }))}
                placeholder="Ex: 12 meses"
              />
            </div>
            <div>
              <Label htmlFor="condicoes_especiais">Condições Especiais</Label>
              <Textarea
                id="condicoes_especiais"
                value={newProposta.condicoes_especiais || ''}
                onChange={(e) => setNewProposta(prev => ({ ...prev, condicoes_especiais: e.target.value }))}
                placeholder="Condições especiais da proposta"
                rows={2}
              />
            </div>
            <div>
              <Label htmlFor="status">Status <span className="text-red-500">*</span></Label>
              <Select
                value={newProposta.status}
                onValueChange={(value) => setNewProposta(prev => ({ ...prev, status: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="enviada">Enviada</SelectItem>
                  <SelectItem value="aprovada">Aprovada</SelectItem>
                  <SelectItem value="rejeitada">Rejeitada</SelectItem>
                  <SelectItem value="vencida">Vencida</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="termos_condicoes">Termos e Condições</Label>
              <Textarea
                id="termos_condicoes"
                value={newProposta.termos_condicoes || ''}
                onChange={(e) => setNewProposta(prev => ({ ...prev, termos_condicoes: e.target.value }))}
                placeholder="Termos e condições gerais"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="feedback_cliente">Feedback do Cliente</Label>
                <Textarea
                  id="feedback_cliente"
                  value={newProposta.feedback_cliente || ''}
                  onChange={(e) => setNewProposta(prev => ({ ...prev, feedback_cliente: e.target.value }))}
                  placeholder="Feedback recebido do cliente"
                  rows={2}
                />
              </div>
              <div>
                <Label htmlFor="objecoes">Objeções</Label>
                <Textarea
                  id="objecoes"
                  value={newProposta.objecoes || ''}
                  onChange={(e) => setNewProposta(prev => ({ ...prev, objecoes: e.target.value }))}
                  placeholder="Objeções levantadas pelo cliente"
                  rows={2}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="pontos_negociacao">Pontos de Negociação</Label>
                <Textarea
                  id="pontos_negociacao"
                  value={newProposta.pontos_negociacao || ''}
                  onChange={(e) => setNewProposta(prev => ({ ...prev, pontos_negociacao: e.target.value }))}
                  placeholder="Pontos em negociação"
                  rows={2}
                />
              </div>
              <div>
                <Label htmlFor="motivo_rejeicao">Motivo da Rejeição</Label>
                <Textarea
                  id="motivo_rejeicao"
                  value={newProposta.motivo_rejeicao || ''}
                  onChange={(e) => setNewProposta(prev => ({ ...prev, motivo_rejeicao: e.target.value }))}
                  placeholder="Motivo caso seja rejeitada"
                  rows={2}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="motivo_aprovacao">Motivo da Aprovação</Label>
              <Textarea
                id="motivo_aprovacao"
                value={newProposta.motivo_aprovacao || ''}
                onChange={(e) => setNewProposta(prev => ({ ...prev, motivo_aprovacao: e.target.value }))}
                placeholder="Motivo/justificativa da aprovação"
                rows={2}
              />
            </div>
            <div>
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={newProposta.observacoes || ''}
                onChange={(e) => setNewProposta(prev => ({ ...prev, observacoes: e.target.value }))}
                placeholder="Informações adicionais sobre a proposta"
                rows={3}
              />
            </div>
            
            {/* Seção de Itens da Proposta */}
            <div className="border-t pt-4 mt-4">
              <div className="flex justify-between items-center mb-3">
                <Label className="text-base font-semibold">Itens da Proposta</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const novoItem = {
                      tipo: 'produto' as const,
                      nome: '',
                      descricao: '',
                      quantidade: 1,
                      unidade: 'un',
                      valor_unitario: 0,
                      percentual_desconto: 0,
                      valor_desconto: 0,
                      valor_total: 0,
                      observacoes: '',
                      ordem: (newProposta.itens?.length || 0) + 1
                    }
                    setNewProposta(prev => ({
                      ...prev,
                      itens: [...(prev.itens || []), novoItem]
                    }))
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar Item
                </Button>
              </div>
              
              {newProposta.itens && newProposta.itens.length > 0 ? (
                <div className="space-y-4">
                  {newProposta.itens.map((item, index) => (
                    <div key={index} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="font-medium">Item {index + 1}</h4>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setNewProposta(prev => ({
                              ...prev,
                              itens: prev.itens?.filter((_, i) => i !== index) || []
                            }))
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                          <Label>Tipo *</Label>
                          <Select
                            value={item.tipo}
                            onValueChange={(value) => {
                              const novosItens = [...(newProposta.itens || [])]
                              novosItens[index] = { ...item, tipo: value as 'produto' | 'servico' }
                              setNewProposta(prev => ({ ...prev, itens: novosItens }))
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="produto">Produto</SelectItem>
                              <SelectItem value="servico">Serviço</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Produto/Serviço *</Label>
                          {item.tipo === 'produto' ? (
                            <Select
                              value={item.produto_id || ''}
                              onValueChange={(produtoId) => {
                                const produto = produtos.find(p => p.id === produtoId)
                                if (produto) {
                                  const novosItens = [...(newProposta.itens || [])]
                                  novosItens[index] = {
                                    ...item,
                                    produto_id: produtoId,
                                    nome: produto.nome,
                                    valor_unitario: produto.valor_unitario,
                                    unidade: produto.unidade || 'un',
                                    valor_total: item.quantidade * produto.valor_unitario - item.valor_desconto
                                  }
                                  setNewProposta(prev => ({ ...prev, itens: novosItens }))
                                }
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione um produto" />
                              </SelectTrigger>
                              <SelectContent>
                                {produtos.map((produto) => (
                                  <SelectItem key={produto.id} value={produto.id}>
                                    {produto.nome} - R$ {produto.valor_unitario.toFixed(2)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Input
                              value={item.nome}
                              onChange={(e) => {
                                const novosItens = [...(newProposta.itens || [])]
                                novosItens[index] = { ...item, nome: e.target.value }
                                setNewProposta(prev => ({ ...prev, itens: novosItens }))
                              }}
                              placeholder="Nome do serviço"
                            />
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-4 gap-3 mb-3">
                        <div>
                          <Label>Quantidade</Label>
                          <Input
                            type="number"
                            step="1"
                            value={item.quantidade || ''}
                            onChange={(e) => {
                              const quantidade = parseFloat(e.target.value) || 0
                              const valorTotal = quantidade * item.valor_unitario - item.valor_desconto
                              const novosItens = [...(newProposta.itens || [])]
                              novosItens[index] = { ...item, quantidade, valor_total: valorTotal }
                              setNewProposta(prev => ({ ...prev, itens: novosItens }))
                            }}
                          />
                        </div>
                        <div>
                          <Label>Unidade</Label>
                          <Input
                            value={item.unidade}
                            onChange={(e) => {
                              const novosItens = [...(newProposta.itens || [])]
                              novosItens[index] = { ...item, unidade: e.target.value }
                              setNewProposta(prev => ({ ...prev, itens: novosItens }))
                            }}
                            placeholder="un"
                          />
                        </div>
                        <div>
                          <Label>Valor Unitário</Label>
                          <Input
                            type="number"
                            step="1"
                            value={item.valor_unitario || ''}
                            onChange={(e) => {
                              const valorUnitario = parseFloat(e.target.value) || 0
                              const valorTotal = item.quantidade * valorUnitario - item.valor_desconto
                              const novosItens = [...(newProposta.itens || [])]
                              novosItens[index] = { ...item, valor_unitario: valorUnitario, valor_total: valorTotal }
                              setNewProposta(prev => ({ ...prev, itens: novosItens }))
                            }}
                          />
                        </div>
                        <div>
                          <Label>Valor Total</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={item.valor_total}
                            readOnly
                            className="bg-gray-100"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label>Descrição</Label>
                        <Textarea
                          value={item.descricao || ''}
                          onChange={(e) => {
                            const novosItens = [...(newProposta.itens || [])]
                            novosItens[index] = { ...item, descricao: e.target.value }
                            setNewProposta(prev => ({ ...prev, itens: novosItens }))
                          }}
                          placeholder="Descrição do item"
                          rows={2}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">Nenhum item adicionado</p>
              )}
            </div>
          </div>
        </div>
          <DialogFooter className="flex-shrink-0">
            <Button
              variant="outline"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={() => {
                const dataToCreate = {
                  ...newProposta,
                  data_vencimento: newProposta.data_vencimento ? new Date(newProposta.data_vencimento).toISOString() : undefined,
                  data_recompra: newProposta.data_recompra ? new Date(newProposta.data_recompra).toISOString() : undefined
                }
                createProposta.mutate(dataToCreate, {
                  onSuccess: async (result) => {
                    setIsCreateModalOpen(false)
                    setNewProposta(initialPropostaState)
                    
                    // Criar notificação no banco
                    await createDatabaseNotification({
                      tipo: 'proposta_criada',
                      categoria: 'proposta',
                      titulo: 'Proposta Criada',
                      descricao: `Proposta "${newProposta.titulo}" foi criada com sucesso`,
                      referencia_id: result.id,
                      referencia_tipo: 'proposta',
                      prioridade: 'normal'
                    })
                  },
                  onError: () => {
                    toast.error('Erro ao criar proposta')
                  }
                })
              }}
              disabled={
                !newProposta.cliente_id || 
                !newProposta.vendedor_id || 
                !newProposta.titulo || 
                !newProposta.valor_produtos ||
                !newProposta.status ||
                createProposta.isPending
              }
            >
              {createProposta.isPending ? 'Criando...' : 'Criar Proposta'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Visualizar Proposta</DialogTitle>
            <DialogDescription>
              Detalhes completos da proposta
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto pr-2">
            {selectedProposta && (
              <div className="space-y-6 py-4">
                {/* Informações Básicas */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Cliente</Label>
                    <p className="text-sm">{getClienteName(selectedProposta.cliente_id)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Vendedor</Label>
                    <p className="text-sm">{getVendedorName(selectedProposta.vendedor_id)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Título</Label>
                    <p className="text-sm">{selectedProposta.titulo}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Número</Label>
                    <p className="text-sm">{selectedProposta.numero_proposta}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Status</Label>
                    <p className="text-sm">{statusOptions.find(s => s.value === selectedProposta.status)?.label}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Versão</Label>
                    <p className="text-sm">{selectedProposta.versao}</p>
                  </div>
                </div>

                {/* Descrição */}
                {selectedProposta.descricao && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Descrição</Label>
                    <p className="text-sm mt-1">{selectedProposta.descricao}</p>
                  </div>
                )}

                {/* Valores Financeiros */}
                <div>
                  <h3 className="text-lg font-medium mb-3">Valores Financeiros</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Valor Produtos</Label>
                      <p className="text-sm">R$ {(selectedProposta.valor_produtos || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Valor Serviços</Label>
                      <p className="text-sm">R$ {(selectedProposta.valor_servicos || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Valor Desconto</Label>
                      <p className="text-sm">R$ {(selectedProposta.valor_desconto || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Valor Frete</Label>
                      <p className="text-sm">R$ {(selectedProposta.valor_frete || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Valor Impostos</Label>
                      <p className="text-sm">R$ {(selectedProposta.valor_impostos || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Valor Total</Label>
                      <p className="text-lg font-bold text-green-600">R$ {selectedProposta.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                  </div>
                </div>

                {/* Condições Comerciais */}
                <div>
                  <h3 className="text-lg font-medium mb-3">Condições Comerciais</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Forma de Pagamento</Label>
                      <p className="text-sm">{selectedProposta.forma_pagamento || 'Não informado'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Condições de Pagamento</Label>
                      <p className="text-sm">{selectedProposta.condicoes_pagamento || 'Não informado'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Prazo de Entrega</Label>
                      <p className="text-sm">{selectedProposta.prazo_entrega || 'Não informado'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Local de Entrega</Label>
                      <p className="text-sm">{selectedProposta.local_entrega || 'Não informado'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Responsável pelo Frete</Label>
                      <p className="text-sm">{selectedProposta.responsavel_frete === 'cliente' ? 'Cliente' : 'Fornecedor'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Validade</Label>
                      <p className="text-sm">{selectedProposta.data_vencimento ? new Date(selectedProposta.data_vencimento).toLocaleDateString('pt-BR') : 'Não informado'}</p>
                    </div>
                  </div>
                </div>

                {/* Itens da Proposta */}
                {selectedProposta.itens && selectedProposta.itens.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium mb-3">Itens da Proposta</h3>
                    <div className="space-y-3">
                      {selectedProposta.itens.map((item: any, index: number) => (
                        <div key={index} className="border rounded-lg p-4 bg-gray-50">
                          <div className="grid grid-cols-4 gap-4">
                            <div>
                              <Label className="text-sm font-medium text-gray-500">Nome</Label>
                              <p className="text-sm">{item.nome}</p>
                            </div>
                            <div>
                              <Label className="text-sm font-medium text-gray-500">Quantidade</Label>
                              <p className="text-sm">{item.quantidade} {item.unidade}</p>
                            </div>
                            <div>
                              <Label className="text-sm font-medium text-gray-500">Valor Unitário</Label>
                              <p className="text-sm">R$ {(item.valor_unitario || 0).toFixed(2)}</p>
                            </div>
                            <div>
                              <Label className="text-sm font-medium text-gray-500">Valor Total</Label>
                              <p className="text-sm font-bold">R$ {(item.valor_total || 0).toFixed(2)}</p>
                            </div>
                          </div>
                          {item.descricao && (
                            <div className="mt-2">
                              <Label className="text-sm font-medium text-gray-500">Descrição</Label>
                              <p className="text-sm">{item.descricao}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Observações */}
                {selectedProposta.observacoes && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Observações</Label>
                    <p className="text-sm mt-1">{selectedProposta.observacoes}</p>
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter className="flex-shrink-0">
            <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-6xl h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Editar Proposta</DialogTitle>
            <DialogDescription>
              Edite os dados da proposta
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto pr-2">
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit_cliente_id">Cliente <span className="text-red-500">*</span></Label>
                  <Select
                    value={editProposta.cliente_id}
                    onValueChange={(value) => setEditProposta(prev => ({ ...prev, cliente_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clientes.map((cliente) => (
                        <SelectItem key={cliente.id} value={cliente.id}>
                          {cliente.nome_empresa || cliente.nome_contato}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit_vendedor_id">Vendedor <span className="text-red-500">*</span></Label>
                  <Select
                    value={editProposta.vendedor_id}
                    onValueChange={(value) => setEditProposta(prev => ({ ...prev, vendedor_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um vendedor" />
                    </SelectTrigger>
                    <SelectContent>
                      {vendedores.map((vendedor) => (
                        <SelectItem key={vendedor.id} value={vendedor.id}>
                          {vendedor.nome || vendedor.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="edit_titulo">Título da Proposta <span className="text-red-500">*</span></Label>
                <Input
                  id="edit_titulo"
                  value={editProposta.titulo}
                  onChange={(e) => setEditProposta(prev => ({ ...prev, titulo: e.target.value }))}
                  placeholder="Ex: Fornecimento de Embalagens 2024"
                />
              </div>
              <div>
                <Label htmlFor="edit_descricao">Descrição</Label>
                <Textarea
                  id="edit_descricao"
                  value={editProposta.descricao || ''}
                  onChange={(e) => setEditProposta(prev => ({ ...prev, descricao: e.target.value }))}
                  placeholder="Descrição detalhada da proposta"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="edit_versao">Versão</Label>
                  <Input
                    id="edit_versao"
                    type="number"
                    value={editProposta.versao || 1}
                    onChange={(e) => setEditProposta(prev => ({ ...prev, versao: parseInt(e.target.value) || 1 }))}
                    placeholder="1"
                  />
                </div>
                <div>
                  <Label htmlFor="edit_template_usado">Template Usado</Label>
                  <Input
                    id="edit_template_usado"
                    value={editProposta.template_usado || ''}
                    onChange={(e) => setEditProposta(prev => ({ ...prev, template_usado: e.target.value }))}
                    placeholder="Nome do template"
                  />
                </div>
                <div>
                  <Label htmlFor="edit_data_vencimento">Data de Vencimento</Label>
                  <SimpleDateTime
                    value={editProposta.data_vencimento}
                    onChange={(value) => setEditProposta(prev => ({ ...prev, data_vencimento: value }))}
                    showTime={false}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="edit_valor_produtos">Valor Produtos <span className="text-red-500">*</span></Label>
                  <div className="flex gap-2">
                    <Input
                      id="edit_valor_produtos"
                      type="number"
                      step="0.01"
                      value={editProposta.valor_produtos || ''}
                      onChange={(e) => {
                        const valor = parseFloat(e.target.value) || 0
                        setEditProposta(prev => ({ 
                          ...prev, 
                          valor_produtos: valor,
                          valor_total: valor + (prev.valor_servicos || 0) + (prev.valor_frete || 0) + (prev.valor_impostos || 0) - (prev.valor_desconto || 0)
                        }))
                      }}
                      placeholder="0.00"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const { valorProdutos } = calcularValoresSugeridos(editProposta.itens || [])
                        setEditProposta(prev => ({
                          ...prev,
                          valor_produtos: valorProdutos,
                          valor_total: valorProdutos + (prev.valor_servicos || 0) + (prev.valor_frete || 0) + (prev.valor_impostos || 0) - (prev.valor_desconto || 0)
                        }))
                      }}
                      title="Calcular automaticamente baseado nos itens"
                    >
                      ∑
                    </Button>
                  </div>
                  {(() => {
                    const { valorProdutos } = calcularValoresSugeridos(editProposta.itens || [])
                    return valorProdutos > 0 && valorProdutos !== (editProposta.valor_produtos || 0) ? (
                      <p className="text-xs text-blue-600 mt-1">
                        Sugestão: R$ {valorProdutos.toFixed(2)} (baseado nos itens)
                      </p>
                    ) : null
                  })()}
                </div>
                <div>
                  <Label htmlFor="edit_valor_servicos">Valor Serviços</Label>
                  <div className="flex gap-2">
                    <Input
                      id="edit_valor_servicos"
                      type="number"
                      step="0.01"
                      value={editProposta.valor_servicos || ''}
                      onChange={(e) => {
                        const valor = parseFloat(e.target.value) || 0
                        setEditProposta(prev => ({ 
                          ...prev, 
                          valor_servicos: valor,
                          valor_total: (prev.valor_produtos || 0) + valor + (prev.valor_frete || 0) + (prev.valor_impostos || 0) - (prev.valor_desconto || 0)
                        }))
                      }}
                      placeholder="0.00"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const { valorServicos } = calcularValoresSugeridos(editProposta.itens || [])
                        setEditProposta(prev => ({
                          ...prev,
                          valor_servicos: valorServicos,
                          valor_total: (prev.valor_produtos || 0) + valorServicos + (prev.valor_frete || 0) + (prev.valor_impostos || 0) - (prev.valor_desconto || 0)
                        }))
                      }}
                      title="Calcular automaticamente baseado nos itens"
                    >
                      ∑
                    </Button>
                  </div>
                  {(() => {
                    const { valorServicos } = calcularValoresSugeridos(editProposta.itens || [])
                    return valorServicos > 0 && valorServicos !== (editProposta.valor_servicos || 0) ? (
                      <p className="text-xs text-blue-600 mt-1">
                        Sugestão: R$ {valorServicos.toFixed(2)} (baseado nos itens)
                      </p>
                    ) : null
                  })()}
                </div>
                <div>
                  <Label htmlFor="edit_valor_desconto">Valor Desconto</Label>
                  <Input
                    id="edit_valor_desconto"
                    type="number"
                    step="0.01"
                    value={editProposta.valor_desconto || 0}
                    onChange={(e) => {
                      const valor = parseFloat(e.target.value) || 0
                      setEditProposta(prev => ({ 
                        ...prev, 
                        valor_desconto: valor,
                        valor_total: (prev.valor_produtos || 0) + (prev.valor_servicos || 0) + (prev.valor_frete || 0) + (prev.valor_impostos || 0) - valor
                      }))
                    }}
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="edit_valor_frete">Valor Frete</Label>
                  <Input
                    id="edit_valor_frete"
                    type="number"
                    step="0.01"
                    value={editProposta.valor_frete || ''}
                    onChange={(e) => {
                      const valor = parseFloat(e.target.value) || 0
                      setEditProposta(prev => ({ 
                        ...prev, 
                        valor_frete: valor,
                        valor_total: (prev.valor_produtos || 0) + (prev.valor_servicos || 0) + valor + (prev.valor_impostos || 0) - (prev.valor_desconto || 0)
                      }))
                    }}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="edit_percentual_desconto">Desconto (%)</Label>
                  <Input
                    id="edit_percentual_desconto"
                    type="number"
                    step="0.01"
                    max="100"
                    value={editProposta.percentual_desconto || ''}
                    onChange={(e) => {
                      const perc = parseFloat(e.target.value) || 0
                      const subtotal = (editProposta.valor_produtos || 0) + (editProposta.valor_servicos || 0)
                      const valorDesc = (subtotal * perc) / 100
                      setEditProposta(prev => ({
                        ...prev,
                        percentual_desconto: perc,
                        valor_desconto: valorDesc,
                        valor_total: subtotal + (prev.valor_frete || 0) + (prev.valor_impostos || 0) - valorDesc
                      }))
                    }}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="edit_valor_impostos">Valor Impostos</Label>
                  <Input
                    id="edit_valor_impostos"
                    type="number"
                    step="0.01"
                    value={editProposta.valor_impostos || 0}
                    onChange={(e) => {
                      const valor = parseFloat(e.target.value) || 0
                      setEditProposta(prev => ({ 
                        ...prev, 
                        valor_impostos: valor,
                        valor_total: (prev.valor_produtos || 0) + (prev.valor_servicos || 0) + (prev.valor_frete || 0) + valor - (prev.valor_desconto || 0)
                      }))
                    }}
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit_forma_pagamento">Forma de Pagamento</Label>
                  <Select
                    value={editProposta.forma_pagamento || ''}
                    onValueChange={(value) => setEditProposta(prev => ({ ...prev, forma_pagamento: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a forma" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dinheiro">Dinheiro</SelectItem>
                      <SelectItem value="pix">PIX</SelectItem>
                      <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
                      <SelectItem value="cartao_debito">Cartão de Débito</SelectItem>
                      <SelectItem value="boleto">Boleto</SelectItem>
                      <SelectItem value="transferencia">Transferência</SelectItem>
                      <SelectItem value="cheque">Cheque</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit_responsavel_frete">Responsável pelo Frete</Label>
                  <Select
                    value={editProposta.responsavel_frete || 'cliente'}
                    onValueChange={(value) => setEditProposta(prev => ({ ...prev, responsavel_frete: value as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cliente">Cliente</SelectItem>
                      <SelectItem value="fornecedor">Fornecedor</SelectItem>
                      <SelectItem value="compartilhado">Compartilhado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit_condicoes_pagamento">Condições de Pagamento</Label>
                  <Input
                    id="edit_condicoes_pagamento"
                    value={editProposta.condicoes_pagamento || ''}
                    onChange={(e) => setEditProposta(prev => ({ ...prev, condicoes_pagamento: e.target.value }))}
                    placeholder="Ex: 30 dias após entrega"
                  />
                </div>
                <div>
                  <Label htmlFor="edit_prazo_entrega">Prazo de Entrega</Label>
                  <Input
                    id="edit_prazo_entrega"
                    value={editProposta.prazo_entrega || ''}
                    onChange={(e) => setEditProposta(prev => ({ ...prev, prazo_entrega: e.target.value }))}
                    placeholder="Ex: 15 dias úteis"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit_local_entrega">Local de Entrega</Label>
                  <Input
                    id="edit_local_entrega"
                    value={editProposta.local_entrega || ''}
                    onChange={(e) => setEditProposta(prev => ({ ...prev, local_entrega: e.target.value }))}
                    placeholder="Endereço de entrega"
                  />
                </div>
                <div>
                  <Label htmlFor="edit_validade_dias">Validade (dias)</Label>
                  <Input
                    id="edit_validade_dias"
                    type="number"
                    value={editProposta.validade_dias || 30}
                    onChange={(e) => setEditProposta(prev => ({ ...prev, validade_dias: parseInt(e.target.value) || 30 }))}
                    placeholder="30"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="edit_recompra_ativada"
                    checked={editProposta.recompra_ativada || false}
                    onChange={(e) => setEditProposta(prev => ({ ...prev, recompra_ativada: e.target.checked }))}
                    className="rounded"
                  />
                  <Label htmlFor="edit_recompra_ativada" className="cursor-pointer">Ativar Recompra</Label>
                </div>
                {editProposta.recompra_ativada && (
                  <div>
                    <Label htmlFor="edit_data_recompra">Data de Recompra</Label>
                    <SimpleDateTime
                      value={editProposta.data_recompra}
                      onChange={(value) => setEditProposta(prev => ({ ...prev, data_recompra: value }))}
                      showTime={false}
                    />
                  </div>
                )}
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="edit_suporte_incluido"
                    checked={editProposta.suporte_incluido || false}
                    onChange={(e) => setEditProposta(prev => ({ ...prev, suporte_incluido: e.target.checked }))}
                  />
                  <Label htmlFor="edit_suporte_incluido">Suporte Incluído</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="edit_treinamento_incluido"
                    checked={editProposta.treinamento_incluido || false}
                    onChange={(e) => setEditProposta(prev => ({ ...prev, treinamento_incluido: e.target.checked }))}
                  />
                  <Label htmlFor="edit_treinamento_incluido">Treinamento Incluído</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="edit_requer_aprovacao"
                    checked={editProposta.requer_aprovacao || false}
                    onChange={(e) => setEditProposta(prev => ({ ...prev, requer_aprovacao: e.target.checked }))}
                  />
                  <Label htmlFor="edit_requer_aprovacao">Requer Aprovação</Label>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit_garantia">Garantia</Label>
                  <Input
                    id="edit_garantia"
                    value={editProposta.garantia || ''}
                    onChange={(e) => setEditProposta(prev => ({ ...prev, garantia: e.target.value }))}
                    placeholder="Ex: 12 meses"
                  />
                </div>
                <div>
                  <Label htmlFor="edit_condicoes_especiais">Condições Especiais</Label>
                  <Input
                    id="edit_condicoes_especiais"
                    value={editProposta.condicoes_especiais || ''}
                    onChange={(e) => setEditProposta(prev => ({ ...prev, condicoes_especiais: e.target.value }))}
                    placeholder="Condições especiais"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="edit_termos_condicoes">Termos e Condições</Label>
                <Textarea
                  id="edit_termos_condicoes"
                  value={editProposta.termos_condicoes || ''}
                  onChange={(e) => setEditProposta(prev => ({ ...prev, termos_condicoes: e.target.value }))}
                  placeholder="Termos e condições da proposta"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="edit_status">Status <span className="text-red-500">*</span></Label>
                <Select
                  value={editProposta.status}
                  onValueChange={(value) => setEditProposta(prev => ({ ...prev, status: value as any }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="enviada">Enviada</SelectItem>
                    <SelectItem value="aprovada">Aprovada</SelectItem>
                    <SelectItem value="rejeitada">Rejeitada</SelectItem>
                    <SelectItem value="vencida">Vencida</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit_observacoes">Observações</Label>
                <Textarea
                  id="edit_observacoes"
                  value={editProposta.observacoes || ''}
                  onChange={(e) => setEditProposta(prev => ({ ...prev, observacoes: e.target.value }))}
                  placeholder="Informações adicionais sobre a proposta"
                  rows={3}
                />
              </div>
              
              {/* Itens da Proposta - Edit */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <Label className="text-base font-medium">Itens da Proposta</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const novoItem = {
                        tipo: 'produto' as const,
                        nome: '',
                        descricao: '',
                        quantidade: 1,
                        unidade: 'un',
                        valor_unitario: 0,
                        percentual_desconto: 0,
                        valor_desconto: 0,
                        valor_total: 0,
                        observacoes: '',
                        ordem: (editProposta.itens?.length || 0) + 1
                      }
                      setEditProposta(prev => ({
                        ...prev,
                        itens: [...(prev.itens || []), novoItem]
                      }))
                    }}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Adicionar Item
                  </Button>
                </div>
                
                {editProposta.itens && editProposta.itens.length > 0 ? (
                  <div className="space-y-4">
                    {editProposta.itens.map((item, index) => (
                      <div key={index} className="border rounded-lg p-4 bg-gray-50">
                        <div className="flex justify-between items-start mb-3">
                          <h4 className="font-medium">Item {index + 1}</h4>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditProposta(prev => ({
                                ...prev,
                                itens: prev.itens?.filter((_, i) => i !== index) || []
                              }))
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div>
                            <Label>Tipo *</Label>
                            <Select
                              value={item.tipo}
                              onValueChange={(value) => {
                                const novosItens = [...(editProposta.itens || [])]
                                novosItens[index] = { ...item, tipo: value as 'produto' | 'servico' }
                                setEditProposta(prev => ({ ...prev, itens: novosItens }))
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="produto">Produto</SelectItem>
                                <SelectItem value="servico">Serviço</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Produto/Serviço *</Label>
                            {item.tipo === 'produto' ? (
                              <Select
                                value={item.produto_id || ''}
                                onValueChange={(produtoId) => {
                                  const produto = produtos.find(p => p.id === produtoId)
                                  if (produto) {
                                    const novosItens = [...(editProposta.itens || [])]
                                    novosItens[index] = {
                                      ...item,
                                      produto_id: produtoId,
                                      nome: produto.nome,
                                      valor_unitario: produto.valor_unitario,
                                      unidade: produto.unidade || 'un',
                                      valor_total: item.quantidade * produto.valor_unitario - item.valor_desconto
                                    }
                                    setEditProposta(prev => ({ ...prev, itens: novosItens }))
                                  }
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione um produto" />
                                </SelectTrigger>
                                <SelectContent>
                                  {produtos.map((produto) => (
                                    <SelectItem key={produto.id} value={produto.id}>
                                      {produto.nome} - R$ {produto.valor_unitario.toFixed(2)}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <Input
                                value={item.nome}
                                onChange={(e) => {
                                  const novosItens = [...(editProposta.itens || [])]
                                  novosItens[index] = { ...item, nome: e.target.value }
                                  setEditProposta(prev => ({ ...prev, itens: novosItens }))
                                }}
                                placeholder="Nome do serviço"
                              />
                            )}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-4 gap-3 mb-3">
                          <div>
                            <Label>Quantidade</Label>
                            <Input
                              type="number"
                              step="1"
                              value={item.quantidade || ''}
                              onChange={(e) => {
                                const quantidade = parseFloat(e.target.value) || 0
                                const valorTotal = quantidade * item.valor_unitario - item.valor_desconto
                                const novosItens = [...(editProposta.itens || [])]
                                novosItens[index] = { ...item, quantidade, valor_total: valorTotal }
                                setEditProposta(prev => ({ ...prev, itens: novosItens }))
                              }}
                            />
                          </div>
                          <div>
                            <Label>Unidade</Label>
                            <Input
                              value={item.unidade}
                              onChange={(e) => {
                                const novosItens = [...(editProposta.itens || [])]
                                novosItens[index] = { ...item, unidade: e.target.value }
                                setEditProposta(prev => ({ ...prev, itens: novosItens }))
                              }}
                              placeholder="un"
                            />
                          </div>
                          <div>
                            <Label>Valor Unitário</Label>
                            <Input
                              type="number"
                              step="1"
                              value={item.valor_unitario || ''}
                              onChange={(e) => {
                                const valorUnitario = parseFloat(e.target.value) || 0
                                const valorTotal = item.quantidade * valorUnitario - item.valor_desconto
                                const novosItens = [...(editProposta.itens || [])]
                                novosItens[index] = { ...item, valor_unitario: valorUnitario, valor_total: valorTotal }
                                setEditProposta(prev => ({ ...prev, itens: novosItens }))
                              }}
                              placeholder="0.00"
                            />
                          </div>
                          <div>
                            <Label>Valor Total</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={item.valor_total}
                              readOnly
                              className="bg-gray-100"
                            />
                          </div>
                        </div>
                        
                        <div>
                          <Label>Descrição</Label>
                          <Textarea
                            value={item.descricao || ''}
                            onChange={(e) => {
                              const novosItens = [...(editProposta.itens || [])]
                              novosItens[index] = { ...item, descricao: e.target.value }
                              setEditProposta(prev => ({ ...prev, itens: novosItens }))
                            }}
                            placeholder="Descrição do item"
                            rows={2}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">Nenhum item adicionado</p>
                )}
              </div>
          </div>
        </div>
          <DialogFooter className="flex-shrink-0">
            <Button
              variant="outline"
              onClick={() => setIsEditModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (!editProposta.cliente_id || !editProposta.vendedor_id || !editProposta.titulo || !editProposta.valor_produtos || !editProposta.status) {
                  toast.error('Preencha todos os campos obrigatórios')
                  return
                }
                
                // Validar e limpar dados antes de enviar
                const dataToUpdate = {
                  cliente_id: editProposta.cliente_id,
                  vendedor_id: editProposta.vendedor_id,
                  numero_proposta: editProposta.numero_proposta || selectedProposta?.numero_proposta,
                  titulo: editProposta.titulo,
                  versao: editProposta.versao || 1,
                  descricao: editProposta.descricao || '',
                  valor_total: Number(editProposta.valor_total) || 0,
                  valor_produtos: Number(editProposta.valor_produtos) || 0,
                  valor_servicos: Number(editProposta.valor_servicos) || 0,
                  valor_desconto: Number(editProposta.valor_desconto) || 0,
                  percentual_desconto: Number(editProposta.percentual_desconto) || 0,
                  valor_frete: Number(editProposta.valor_frete) || 0,
                  valor_impostos: Number(editProposta.valor_impostos) || 0,
                  status: editProposta.status,
                  forma_pagamento: editProposta.forma_pagamento || '',
                  condicoes_pagamento: editProposta.condicoes_pagamento || '',
                  prazo_entrega: editProposta.prazo_entrega || '',
                  local_entrega: editProposta.local_entrega || '',
                  responsavel_frete: editProposta.responsavel_frete || 'cliente',
                  condicoes_especiais: editProposta.condicoes_especiais || '',
                  garantia: editProposta.garantia || '',
                  suporte_incluido: Boolean(editProposta.suporte_incluido),
                  treinamento_incluido: Boolean(editProposta.treinamento_incluido),
                  validade_dias: Number(editProposta.validade_dias) || 30,
                  data_vencimento: editProposta.data_vencimento ? new Date(editProposta.data_vencimento).toISOString() : undefined,
                  feedback_cliente: editProposta.feedback_cliente || '',
                  objecoes: editProposta.objecoes || '',
                  pontos_negociacao: editProposta.pontos_negociacao || '',
                  motivo_rejeicao: editProposta.motivo_rejeicao || '',
                  template_usado: editProposta.template_usado || '',
                  requer_aprovacao: Boolean(editProposta.requer_aprovacao),
                  motivo_aprovacao: editProposta.motivo_aprovacao || '',
                  recompra_ativada: Boolean(editProposta.recompra_ativada),
                  data_recompra: editProposta.data_recompra ? new Date(editProposta.data_recompra).toISOString() : undefined,
                  observacoes: editProposta.observacoes || '',
                  termos_condicoes: editProposta.termos_condicoes || '',
                  itens: editProposta.itens || []
                }
                
                updateProposta.mutate({
                  id: selectedProposta?.id || '',
                  data: dataToUpdate
                }, {
                  onSuccess: async () => {
                    setIsEditModalOpen(false)
                    setSelectedProposta(null)
                    setEditProposta(initialPropostaState)
                    
                    // Criar notificação no banco
                    await createDatabaseNotification({
                      tipo: 'proposta_atualizada',
                      categoria: 'proposta',
                      titulo: 'Proposta Atualizada',
                      descricao: `Proposta "${editProposta.titulo}" foi atualizada com sucesso`,
                      referencia_id: selectedProposta?.id || '',
                      referencia_tipo: 'proposta',
                      prioridade: 'normal'
                    })
                  },
                  onError: () => {
                    toast.error('Erro ao atualizar proposta')
                  }
                })
              }}
              disabled={updateProposta.isPending}
            >
              {updateProposta.isPending ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={!!propostaToDelete} onOpenChange={() => setPropostaToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir esta proposta? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPropostaToDelete(null)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (propostaToDelete) {
                  deleteProposta.mutate(propostaToDelete, {
                    onSuccess: () => {
                      setPropostaToDelete(null)
                    },
                    onError: () => {
                      toast.error('Erro ao excluir proposta')
                    }
                  })
                }
              }}
              disabled={deleteProposta.isPending}
            >
              {deleteProposta.isPending ? 'Excluindo...' : 'Excluir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Envio via WhatsApp */}
      <Dialog open={isSendWhatsAppModalOpen} onOpenChange={setIsSendWhatsAppModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Enviar Proposta via WhatsApp</DialogTitle>
            <DialogDescription>
              Envie a proposta em PDF para o cliente via WhatsApp
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {selectedPropostaForWhatsApp && (
              <>
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                        {selectedPropostaForWhatsApp.titulo}
                      </p>
                      <p className="text-xs text-blue-700 dark:text-blue-300">
                        {selectedPropostaForWhatsApp.numero_proposta}
                      </p>
                    </div>
                    
                    <div className="pt-2 border-t border-blue-200 dark:border-blue-700">
                      <p className="text-xs text-blue-600 dark:text-blue-400">Cliente</p>
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                        {selectedPropostaForWhatsApp.cliente?.nome_empresa || selectedPropostaForWhatsApp.cliente?.nome_contato}
                      </p>
                      {(selectedPropostaForWhatsApp.cliente?.remotejid || selectedPropostaForWhatsApp.cliente?.whatsapp) && (
                        <p className="text-xs text-blue-700 dark:text-blue-300 flex items-center gap-1 mt-1">
                          <MessageCircle className="h-3 w-3" />
                          {selectedPropostaForWhatsApp.cliente.remotejid 
                            ? selectedPropostaForWhatsApp.cliente.remotejid.replace('@s.whatsapp.net', '')
                            : selectedPropostaForWhatsApp.cliente.whatsapp}
                          {selectedPropostaForWhatsApp.cliente.remotejid && (
                            <span className="text-[10px] bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-1 rounded">✓ Validado</span>
                          )}
                        </p>
                      )}
                    </div>
                    
                    <div className="pt-2 border-t border-blue-200 dark:border-blue-700">
                      <p className="text-xs text-blue-600 dark:text-blue-400">Valor Total</p>
                      <p className="text-lg font-bold text-blue-900 dark:text-blue-100">
                        R$ {selectedPropostaForWhatsApp.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </div>

                {!selectedPropostaForWhatsApp.cliente?.remotejid && !selectedPropostaForWhatsApp.cliente?.whatsapp && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      ⚠️ O cliente não possui WhatsApp cadastrado. Por favor, cadastre um número antes de enviar.
                    </p>
                  </div>
                )}
                
                {selectedPropostaForWhatsApp.cliente?.remotejid && (
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border border-green-200 dark:border-green-800">
                    <p className="text-xs text-green-800 dark:text-green-200">
                      ✓ WhatsApp validado pela Evolution API. Envio otimizado.
                    </p>
                  </div>
                )}
                
                {/* Seletor de Cor do PDF */}
                <div>
                  <Label htmlFor="pdf-color" className="flex items-center gap-2">
                    🎨 Cor do PDF
                  </Label>
                  <p className="text-xs text-gray-500 mb-3">
                    Escolha a cor principal do documento
                  </p>
                  <div className="grid grid-cols-5 gap-2">
                    {(Object.keys(COLOR_THEMES) as ColorTheme[]).map((theme) => (
                      <button
                        key={theme}
                        type="button"
                        onClick={() => setPdfColorTheme(theme)}
                        className={`relative p-3 rounded-lg border-2 transition-all hover:scale-105 ${
                          pdfColorTheme === theme 
                            ? 'border-gray-900 dark:border-white ring-2 ring-offset-2 ring-gray-400' 
                            : 'border-gray-200 dark:border-gray-700'
                        }`}
                        style={{ backgroundColor: COLOR_THEMES[theme].primary }}
                      >
                        {pdfColorTheme === theme && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="bg-white dark:bg-gray-900 rounded-full p-1">
                              <Check className="h-4 w-4 text-gray-900 dark:text-white" />
                            </div>
                          </div>
                        )}
                        <div className="text-[10px] text-white font-semibold text-center mt-1 opacity-0 hover:opacity-100 transition-opacity">
                          {COLOR_THEMES[theme].name}
                        </div>
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 text-center">
                    {COLOR_THEMES[pdfColorTheme].name}
                  </p>
                </div>

                <div>
                  <Label htmlFor="whatsapp-message">Mensagem (opcional)</Label>
                  <Textarea
                    id="whatsapp-message"
                    value={whatsappMessage}
                    onChange={(e) => setWhatsappMessage(e.target.value)}
                    placeholder="Digite uma mensagem para acompanhar o PDF..."
                    rows={6}
                    className="mt-2"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    💡 Você pode personalizar a mensagem ou enviar apenas o PDF
                  </p>
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsSendWhatsAppModalOpen(false)
                setSelectedPropostaForWhatsApp(null)
                setWhatsappMessage('')
              }}
            >
              Cancelar
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={async () => {
                // Verificar se tem remotejid ou whatsapp
                const cliente = selectedPropostaForWhatsApp?.cliente
                const whatsappContact = cliente?.remotejid || cliente?.whatsapp
                
                if (!whatsappContact) {
                  toast.error('Cliente não possui WhatsApp cadastrado')
                  return
                }

                try {
                  toast.loading('Gerando PDF e enviando...', { id: 'whatsapp-send' })
                  
                  // Gerar PDF com cor e nome da empresa selecionados
                  const pdfBlob = await generatePropostaPDF(
                    selectedPropostaForWhatsApp,
                    pdfColorTheme,
                    profile?.nome_empresa || 'NanoSync CRM' // Nome da empresa do perfil
                  )
                  
                  // Converter Blob para Base64
                  const reader = new FileReader()
                  reader.readAsDataURL(pdfBlob)
                  
                  reader.onloadend = async () => {
                    try {
                      const base64 = reader.result as string
                      const base64Data = base64.split(',')[1] // Remover "data:application/pdf;base64,"
                      
                      console.log('📤 Enviando para:', whatsappContact)
                      console.log('📄 Arquivo:', `Proposta_${selectedPropostaForWhatsApp.numero_proposta}.pdf`)
                      console.log('💬 Mensagem:', whatsappMessage || '(sem mensagem)')
                      
                      // Enviar via WhatsApp (usa remotejid se disponível, senão formata whatsapp)
                      await whatsappService.sendDocument(
                        whatsappContact,
                        base64Data,
                        `Proposta_${selectedPropostaForWhatsApp.numero_proposta}.pdf`,
                        whatsappMessage || undefined
                      )
                      
                      toast.success('Proposta enviada via WhatsApp com sucesso!', { id: 'whatsapp-send' })
                      setIsSendWhatsAppModalOpen(false)
                      setSelectedPropostaForWhatsApp(null)
                      setWhatsappMessage('')
                    } catch (error) {
                      console.error('Erro ao enviar via WhatsApp:', error)
                      toast.error('Erro ao enviar via WhatsApp. Verifique se a instância está conectada.', { id: 'whatsapp-send' })
                    }
                  }
                } catch (error) {
                  console.error('Erro ao processar envio:', error)
                  toast.error('Erro ao processar o envio', { id: 'whatsapp-send' })
                }
              }}
              disabled={!selectedPropostaForWhatsApp?.cliente?.remotejid && !selectedPropostaForWhatsApp?.cliente?.whatsapp}
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              Enviar via WhatsApp
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default PropostasPage
