import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Users, 
  Upload,
  Download,
  Edit,
  Trash2,
  Send,
  CheckCircle,
  Loader2,
  Search,
  Filter,
  RefreshCw,
  Activity,
  ChevronDown,
  ChevronRight,
  User,
  Clock,
  Eye
} from 'lucide-react'
import { useAtividades, type AtividadesFilters } from '@/hooks/useAtividades'
import { useVendedores } from '@/hooks/useVendedores'
import { useIsAdmin } from '@/hooks/useAuth'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'

const actionIcons = {
  criar: <Users className="h-4 w-4" />,
  editar: <Edit className="h-4 w-4" />,
  deletar: <Trash2 className="h-4 w-4" />,
  enviar: <Send className="h-4 w-4" />,
  aprovar: <CheckCircle className="h-4 w-4" />,
  upload: <Upload className="h-4 w-4" />,
  download: <Download className="h-4 w-4" />,
  login: <Users className="h-4 w-4" />,
  logout: <Users className="h-4 w-4" />,
  default: <Activity className="h-4 w-4" />
}

const actionColors = {
  criar: 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400',
  editar: 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
  deletar: 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400',
  enviar: 'bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400',
  aprovar: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400',
  upload: 'bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400',
  download: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/20 dark:text-cyan-400',
  login: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400',
  logout: 'bg-gray-100 text-gray-600 dark:bg-gray-900/20 dark:text-gray-400',
  default: 'bg-gray-100 text-gray-600 dark:bg-gray-900/20 dark:text-gray-400'
}

const entityTypeLabels = {
  cliente: 'Cliente',
  proposta: 'Proposta',
  produto: 'Produto',
  vendedor: 'Vendedor',
  arquivo: 'Arquivo',
  agendamento: 'Agendamento',
  auth: 'Autenticação',
  default: 'Sistema'
}

export function AtividadesPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterAction, setFilterAction] = useState<string>('all')
  const [filterEntity, setFilterEntity] = useState<string>('all')
  const [filterVendedor, setFilterVendedor] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const itemsPerPage = 20

  // Hooks para dados e permissões
  const isAdmin = useIsAdmin()
  const { data: vendedores } = useVendedores()

  // Preparar filtros para o hook
  const filters: AtividadesFilters = {
    page: currentPage,
    limit: itemsPerPage,
    search: searchTerm || undefined,
    action: filterAction !== 'all' ? filterAction : undefined,
    entityType: filterEntity !== 'all' ? filterEntity : undefined,
    usuario_id: filterVendedor !== 'all' ? filterVendedor : undefined
  }

  // Usar o hook para buscar atividades com multi-tenant
  const { 
    data: atividadesData, 
    isLoading: loading, 
    error,
    refetch 
  } = useAtividades(filters)

  const atividades = atividadesData?.atividades || []
  const totalPages = atividadesData?.total ? Math.ceil(atividadesData.total / itemsPerPage) : 1

  // Buscar com delay para o searchTerm
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentPage !== 1) {
        setCurrentPage(1)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [searchTerm])

  // Mostrar erro se houver
  useEffect(() => {
    if (error) {
      console.error('Erro ao carregar atividades:', error)
      toast.error('Erro ao carregar atividades')
    }
  }, [error])

  const handleRefresh = () => {
    refetch()
  }

  const toggleExpanded = (id: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const getActionIcon = (action: string) => {
    return actionIcons[action as keyof typeof actionIcons] || actionIcons.default
  }

  const getActionColor = (action: string) => {
    return actionColors[action as keyof typeof actionColors] || actionColors.default
  }

  const getEntityLabel = (entityType: string) => {
    return entityTypeLabels[entityType as keyof typeof entityTypeLabels] || entityTypeLabels.default
  }

  const formatTimeAgo = (date: string) => {
    try {
      return formatDistanceToNow(new Date(date), { 
        addSuffix: true, 
        locale: ptBR 
      })
    } catch {
      return new Date(date).toLocaleString('pt-BR')
    }
  }

  const formatField = (key: string, value: any) => {
    // Campos de data
    if (key.includes('data') || key.includes('created_at') || key.includes('updated_at')) {
      if (value) {
        return new Date(value).toLocaleString('pt-BR')
      }
    }
    
    // Campos de valor monetário
    if (key.includes('valor') || key.includes('preco') || key.includes('salario')) {
      if (typeof value === 'number') {
        return new Intl.NumberFormat('pt-BR', { 
          style: 'currency', 
          currency: 'BRL' 
        }).format(value)
      }
    }
    
    // Arrays
    if (Array.isArray(value)) {
      return value.length > 0 ? value.join(', ') : 'Nenhum'
    }
    
    // Booleanos
    if (typeof value === 'boolean') {
      return value ? 'Sim' : 'Não'
    }
    
    // Valores nulos/undefined
    if (value === null || value === undefined || value === '') {
      return 'Não informado'
    }
    
    // Objetos (clientes, vendedores, etc)
    if (typeof value === 'object' && value !== null) {
      // Tentar extrair nome do objeto
      if (value.nome) return value.nome
      if (value.nome_contato) return value.nome_contato
      if (value.titulo) return value.titulo
      if (value.email) return value.email
      // Se for objeto complexo, converter para JSON
      return JSON.stringify(value)
    }
    
    return String(value)
  }

  const formatFieldName = (key: string) => {
    return key
      .replace(/_/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .toLowerCase()
      .replace(/^\w/, c => c.toUpperCase())
  }

  const getChangedFields = (oldData: any, newData: any) => {
    if (!oldData || !newData) return []
    
    try {
      if (typeof oldData === 'string') oldData = JSON.parse(oldData)
      if (typeof newData === 'string') newData = JSON.parse(newData)
      
      const changes: Array<{key: string, oldValue: any, newValue: any}> = []
      
      // Verificar campos que mudaram
      const allKeys = new Set([...Object.keys(oldData), ...Object.keys(newData)])
      
      for (const key of allKeys) {
        // Pular IDs e timestamps
        if (key.includes('id') && key !== 'id') continue
        if (key.includes('created_at') || key.includes('updated_at')) continue
        
        const oldValue = oldData[key]
        const newValue = newData[key]
        
        // Verificar se houve mudança
        if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
          changes.push({
            key,
            oldValue,
            newValue
          })
        }
      }
      
      return changes
    } catch (error) {
      return []
    }
  }

  const formatJsonData = (data: any) => {
    if (!data) return null
    try {
      if (typeof data === 'string') {
        data = JSON.parse(data)
      }
      
      const entries = Object.entries(data)
      if (entries.length === 0) return 'Nenhum dado disponível'
      
      return entries
        .filter(([key, value]) => 
          // Filtrar campos irrelevantes
          (!key.includes('id') || key === 'id') &&
          !key.includes('created_at') && 
          !key.includes('updated_at') &&
          value !== null && value !== undefined && value !== ''
        )
        .slice(0, 8)
        .map(([key, value]) => {
          const formattedKey = formatFieldName(key)
          const formattedValue = formatField(key, value)
          return `${formattedKey}: ${formattedValue}`
        })
        .join('\n')
        
    } catch (error) {
      return 'Erro ao formatar dados'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Resumo de Atividades
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Histórico completo de todas as ações do sistema
          </p>
        </div>
        <Button onClick={handleRefresh} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Action Filter */}
            <Select value={filterAction} onValueChange={setFilterAction}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por ação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as ações</SelectItem>
                <SelectItem value="criar">Criar</SelectItem>
                <SelectItem value="editar">Editar</SelectItem>
                <SelectItem value="deletar">Deletar</SelectItem>
                <SelectItem value="enviar">Enviar</SelectItem>
                <SelectItem value="aprovar">Aprovar</SelectItem>
                <SelectItem value="upload">Upload</SelectItem>
                <SelectItem value="download">Download</SelectItem>
                <SelectItem value="login">Login</SelectItem>
                <SelectItem value="logout">Logout</SelectItem>
              </SelectContent>
            </Select>

            {/* Entity Filter */}
            <Select value={filterEntity} onValueChange={setFilterEntity}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por entidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as entidades</SelectItem>
                <SelectItem value="cliente">Clientes</SelectItem>
                <SelectItem value="proposta">Propostas</SelectItem>
                <SelectItem value="produto">Produtos</SelectItem>
                <SelectItem value="vendedor">Vendedores</SelectItem>
                <SelectItem value="arquivo">Arquivos</SelectItem>
                <SelectItem value="agendamento">Agendamentos</SelectItem>
                <SelectItem value="categoria">Categorias</SelectItem>
                <SelectItem value="segmento">Segmentos</SelectItem>
                <SelectItem value="auth">Autenticação</SelectItem>
              </SelectContent>
            </Select>

            {/* Vendedor Filter - Only for Admins */}
            {isAdmin && (
              <Select value={filterVendedor} onValueChange={setFilterVendedor}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por vendedor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os vendedores</SelectItem>
                  {vendedores?.map((vendedor) => (
                    <SelectItem key={vendedor.id} value={vendedor.user_id || vendedor.id}>
                      {vendedor.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Activities List */}
      <Card>
        <CardHeader>
          <CardTitle>Atividades ({atividades.length})</CardTitle>
          <CardDescription>
            Histórico de ações realizadas no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-600 dark:text-gray-400">
                Carregando atividades...
              </span>
            </div>
          ) : atividades.length > 0 ? (
            <div className="space-y-4">
              {atividades.map((atividade) => {
                const isExpanded = expandedItems.has(atividade.id)
                const hasDetails = atividade.dados_anteriores || atividade.dados_novos || atividade.metadata
                
                return (
                  <div
                    key={atividade.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-all duration-200"
                  >
                    {/* Main Content */}
                    <div className="p-4">
                      <div className="flex items-start space-x-4">
                        {/* Action Icon */}
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${getActionColor(atividade.acao)}`}>
                          {getActionIcon(atividade.acao)}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="secondary" className="text-xs font-semibold">
                              {atividade.acao.toUpperCase()}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {getEntityLabel(atividade.entidade_tipo)}
                            </Badge>
                          </div>
                          
                          <p className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                            {atividade.descricao}
                          </p>
                          
                          {/* User and Entity Info */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                            <div className="flex items-center gap-2 text-sm">
                              <User className="h-4 w-4 text-blue-500" />
                              <span className="text-gray-600 dark:text-gray-400">Usuário:</span>
                              <span className="font-medium text-gray-900 dark:text-white">
                                {atividade.usuario_nome || 'Sistema'}
                              </span>
                            </div>
                            
                          </div>
                          
                          {/* Timestamp */}
                          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                            <Clock className="h-3 w-3" />
                            <span>{formatTimeAgo(atividade.created_at)}</span>
                            <span>•</span>
                            <span>{new Date(atividade.created_at).toLocaleString('pt-BR')}</span>
                          </div>
                        </div>

                        {/* Expand Button */}
                        {hasDetails && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleExpanded(atividade.id)}
                            className="flex-shrink-0"
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                            <Eye className="h-4 w-4 ml-1" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && hasDetails && (
                      <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4">
                        <div className="space-y-4">
                          {/* Always show comparison view when both data sets exist */}
                          {atividade.dados_anteriores && atividade.dados_novos ? (() => {
                            const changes = getChangedFields(atividade.dados_anteriores, atividade.dados_novos)
                            return (
                              <div>
                                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                                  {changes.length > 0 ? 'Campos Alterados:' : 'Comparação de Dados:'}
                                </h4>
                                <div className="space-y-3">
                                  {changes.length > 0 ? (
                                    changes.map((change, index) => (
                                      <div key={index} className="bg-white dark:bg-gray-800 p-3 rounded border dark:border-gray-700">
                                        <div className="font-medium text-sm text-gray-900 dark:text-white mb-2">
                                          {formatFieldName(change.key)}
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                                          <div>
                                            <span className="text-red-600 dark:text-red-400 font-medium">Anterior:</span>
                                            <div className="mt-1 p-2 bg-red-50 dark:bg-red-900/20 rounded text-red-800 dark:text-red-200">
                                              {formatField(change.key, change.oldValue)}
                                            </div>
                                          </div>
                                          <div>
                                            <span className="text-green-600 dark:text-green-400 font-medium">Novo:</span>
                                            <div className="mt-1 p-2 bg-green-50 dark:bg-green-900/20 rounded text-green-800 dark:text-green-200">
                                              {formatField(change.key, change.newValue)}
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    ))
                                  ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                      <div>
                                        <span className="text-red-600 dark:text-red-400 font-medium text-sm">Dados Anteriores:</span>
                                        <div className="mt-2 p-3 bg-red-50 dark:bg-red-900/20 rounded border text-xs text-red-800 dark:text-red-200">
                                          <pre className="whitespace-pre-wrap">{formatJsonData(atividade.dados_anteriores)}</pre>
                                        </div>
                                      </div>
                                      <div>
                                        <span className="text-green-600 dark:text-green-400 font-medium text-sm">Dados Novos:</span>
                                        <div className="mt-2 p-3 bg-green-50 dark:bg-green-900/20 rounded border text-xs text-green-800 dark:text-green-200">
                                          <pre className="whitespace-pre-wrap">{formatJsonData(atividade.dados_novos)}</pre>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )
                          })() : (
                            <>
                              {/* Single data sets with colors */}
                              {atividade.dados_anteriores && (
                                <div>
                                  <h4 className="text-sm font-semibold text-red-600 dark:text-red-400 mb-2">
                                    Dados Anteriores:
                                  </h4>
                                  <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded border text-xs text-red-800 dark:text-red-200">
                                    <pre className="whitespace-pre-wrap">{formatJsonData(atividade.dados_anteriores)}</pre>
                                  </div>
                                </div>
                              )}

                              {atividade.dados_novos && (
                                <div>
                                  <h4 className="text-sm font-semibold text-green-600 dark:text-green-400 mb-2">
                                    Dados Novos:
                                  </h4>
                                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded border text-xs text-green-800 dark:text-green-200">
                                    <pre className="whitespace-pre-wrap">{formatJsonData(atividade.dados_novos)}</pre>
                                  </div>
                                </div>
                              )}
                            </>
                          )}

                          {/* Metadata */}
                          {atividade.metadata && (
                            <div>
                              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                                Metadados:
                              </h4>
                              <pre className="text-xs bg-white dark:bg-gray-800 p-3 rounded border dark:border-gray-700 overflow-x-auto">
                                {formatJsonData(atividade.metadata)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                Nenhuma atividade encontrada
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                {searchTerm || filterAction !== 'all' || filterEntity !== 'all'
                  ? 'Tente ajustar os filtros para ver mais resultados'
                  : 'As atividades aparecerão aqui conforme as ações forem realizadas'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Anterior
          </Button>
          
          <span className="text-sm text-gray-600 dark:text-gray-400 px-4">
            Página {currentPage} de {totalPages}
          </span>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Próxima
          </Button>
        </div>
      )}
    </div>
  )
}
