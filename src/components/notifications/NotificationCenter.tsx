import { useState } from 'react'
import { 
  Bell, 
  Search, 
  Check, 
  CheckCheck, 
  Trash2, 
  Calendar,
  FileText,
  User,
  Settings,
  AlertCircle,
  Info
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { format, formatDistanceToNow, subHours } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { 
  useNotificacoes,
  useEstatisticasNotificacoes,
  useMarcarComoLida,
  useMarcarTodasComoLidas,
  useApagarNotificacao,
  useApagarTodasNotificacoes
} from '@/hooks/useNotificacoes'
import { type Notificacao, type NotificacaoFilters } from '@/services/api/notificacoes'
import { cn } from '@/lib/utils'

interface NotificationCenterProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function NotificationCenter({ open, onOpenChange }: NotificationCenterProps) {
  const [filtros, setFiltros] = useState<NotificacaoFilters>({})
  const [busca, setBusca] = useState('')
  const [paginaAtual, setPaginaAtual] = useState(1)
  const [abaAtiva, setAbaAtiva] = useState('todas')

  const { data: notificacoesData, isLoading } = useNotificacoes(
    {
      ...filtros,
      lida: abaAtiva === 'lidas' ? true : abaAtiva === 'nao-lidas' ? false : undefined
    },
    paginaAtual,
    20
  )

  const { data: estatisticas } = useEstatisticasNotificacoes()
  const marcarComoLida = useMarcarComoLida()
  const marcarTodasComoLidas = useMarcarTodasComoLidas()
  const apagarNotificacao = useApagarNotificacao()
  const apagarTodas = useApagarTodasNotificacoes()

  const notificacoes = notificacoesData?.data || []
  const totalPaginas = notificacoesData?.totalPages || 0

  // Filtrar por busca local
  const notificacoesFiltradas = notificacoes.filter(notificacao =>
    !busca || 
    notificacao.titulo.toLowerCase().includes(busca.toLowerCase()) ||
    notificacao.descricao?.toLowerCase().includes(busca.toLowerCase())
  )

  const handleFiltroChange = (key: keyof NotificacaoFilters, value: string | undefined) => {
    setFiltros(prev => ({
      ...prev,
      [key]: value === 'all' ? undefined : value
    }))
    setPaginaAtual(1)
  }

  const handleMarcarComoLida = (notificacao: Notificacao) => {
    if (!notificacao.lida) {
      marcarComoLida.mutate(notificacao.id)
    }
  }

  const handleApagarNotificacao = (notificacaoId: string) => {
    apagarNotificacao.mutate(notificacaoId)
  }

  const getPriorityIcon = (prioridade: Notificacao['prioridade']) => {
    const icons = {
      'baixa': <Info className="h-4 w-4 text-gray-500" />,
      'normal': <Bell className="h-4 w-4 text-blue-500" />,
      'alta': <AlertCircle className="h-4 w-4 text-orange-500" />,
      'urgente': <AlertCircle className="h-4 w-4 text-red-500" />
    }
    return icons[prioridade] || icons.normal
  }

  const getCategoryIcon = (categoria: Notificacao['categoria']) => {
    const icons = {
      'agendamento': <Calendar className="h-4 w-4" />,
      'proposta': <FileText className="h-4 w-4" />,
      'cliente': <User className="h-4 w-4" />,
      'sistema': <Settings className="h-4 w-4" />,
      'geral': <Bell className="h-4 w-4" />
    }
    return icons[categoria] || icons.geral
  }

  const getTypeColor = (tipo: Notificacao['tipo']) => {
    const colors = {
      'agendamento_criado': 'bg-green-100 text-green-800',
      'agendamento_hoje': 'bg-blue-100 text-blue-800',
      'agendamento_expirado': 'bg-red-100 text-red-800',
      'agendamento_atualizado': 'bg-blue-100 text-blue-800',
      'proposta_criada': 'bg-green-100 text-green-800',
      'proposta_mudou_categoria': 'bg-blue-100 text-blue-800',
      'proposta_aprovada': 'bg-green-100 text-green-800',
      'proposta_recusada': 'bg-red-100 text-red-800',
      'proposta_negociacao': 'bg-yellow-100 text-yellow-800',
      'proposta_expirada': 'bg-red-100 text-red-800',
      'proposta_atualizada': 'bg-blue-100 text-blue-800',
      'cliente_criado': 'bg-green-100 text-green-800',
      'cliente_atualizado': 'bg-blue-100 text-blue-800',
      'vendedor_criado': 'bg-green-100 text-green-800',
      'vendedor_atualizado': 'bg-blue-100 text-blue-800',
      'categoria_criada': 'bg-green-100 text-green-800',
      'categoria_atualizada': 'bg-blue-100 text-blue-800',
      'segmento_criado': 'bg-green-100 text-green-800',
      'segmento_atualizado': 'bg-blue-100 text-blue-800',
      'produto_criado': 'bg-green-100 text-green-800',
      'produto_atualizado': 'bg-blue-100 text-blue-800',
      'sistema': 'bg-gray-100 text-gray-800',
      'erro': 'bg-red-100 text-red-800',
      'sucesso': 'bg-green-100 text-green-800',
      'aviso': 'bg-yellow-100 text-yellow-800'
    }
    return colors[tipo] || colors.sistema
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Central de Notificações
          </DialogTitle>
        </DialogHeader>

        {/* Estatísticas */}
        {estatisticas && (
          <div className="grid grid-cols-4 gap-4 mb-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{estatisticas.total}</div>
                <p className="text-xs text-muted-foreground">Total</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-blue-600">{estatisticas.naoLidas}</div>
                <p className="text-xs text-muted-foreground">Não Lidas</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-green-600">{estatisticas.lidas}</div>
                <p className="text-xs text-muted-foreground">Lidas</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-orange-600">
                  {estatisticas.porPrioridade?.alta || 0}
                </div>
                <p className="text-xs text-muted-foreground">Alta Prioridade</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filtros e Busca */}
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Buscar notificações..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full pl-10"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Select
              value={filtros.categoria || 'all'}
              onValueChange={(value) => handleFiltroChange('categoria', value)}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="agendamento">Agendamentos</SelectItem>
                <SelectItem value="proposta">Propostas</SelectItem>
                <SelectItem value="cliente">Clientes</SelectItem>
                <SelectItem value="sistema">Sistema</SelectItem>
                <SelectItem value="geral">Geral</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filtros.prioridade || 'all'}
              onValueChange={(value) => handleFiltroChange('prioridade', value)}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Prioridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="urgente">Urgente</SelectItem>
                <SelectItem value="alta">Alta</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="baixa">Baixa</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Ações em Lote */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => marcarTodasComoLidas.mutate()}
              disabled={marcarTodasComoLidas.isPending}
            >
              <CheckCheck className="h-4 w-4 mr-2" />
              Marcar Todas como Lidas
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => apagarTodas.mutate()}
              disabled={apagarTodas.isPending}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Apagar Todas
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={abaAtiva} onValueChange={setAbaAtiva} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="todas">
              Todas ({estatisticas?.total || 0})
            </TabsTrigger>
            <TabsTrigger value="nao-lidas">
              Não Lidas ({estatisticas?.naoLidas || 0})
            </TabsTrigger>
            <TabsTrigger value="lidas">
              Lidas ({estatisticas?.lidas || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={abaAtiva} className="flex-1 mt-4">
            <ScrollArea className="h-96">
              {isLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="text-muted-foreground">Carregando...</div>
                </div>
              ) : notificacoesFiltradas.length === 0 ? (
                <div className="flex items-center justify-center h-32">
                  <div className="text-muted-foreground">Nenhuma notificação encontrada</div>
                </div>
              ) : (
                <div className="space-y-2">
                  {notificacoesFiltradas.map((notificacao) => (
                    <Card 
                      key={notificacao.id}
                      className={cn(
                        "transition-all hover:shadow-md cursor-pointer",
                        !notificacao.lida && "border-l-4 border-l-blue-500 bg-muted/30"
                      )}
                      onClick={() => handleMarcarComoLida(notificacao)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            <div className="flex items-center gap-2">
                              {getCategoryIcon(notificacao.categoria)}
                              {getPriorityIcon(notificacao.prioridade)}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium text-sm">{notificacao.titulo}</h4>
                                {!notificacao.lida && (
                                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                                )}
                                <Badge 
                                  variant="secondary" 
                                  className={cn("text-xs", getTypeColor(notificacao.tipo))}
                                >
                                  {notificacao.tipo.replace(/_/g, ' ')}
                                </Badge>
                              </div>
                              
                              {notificacao.descricao && (
                                <p className="text-sm text-muted-foreground mb-2">
                                  {notificacao.descricao}
                                </p>
                              )}
                              
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span>
                                  {notificacao.created_at ? format(subHours(new Date(notificacao.created_at), 3), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : 'Data desconhecida'}
                                </span>
                                <span>
                                  {notificacao.created_at ? formatDistanceToNow(subHours(new Date(notificacao.created_at), 3), {
                                    addSuffix: true,
                                    locale: ptBR
                                  }) : 'Data desconhecida'}
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  {notificacao.categoria}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            {!notificacao.lida && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleMarcarComoLida(notificacao)
                                }}
                                className="h-8 w-8 p-0"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleApagarNotificacao(notificacao.id)
                              }}
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {/* Paginação */}
        {totalPaginas > 1 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Página {paginaAtual} de {totalPaginas}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPaginaAtual(prev => Math.max(1, prev - 1))}
                disabled={paginaAtual === 1}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPaginaAtual(prev => Math.min(totalPaginas, prev + 1))}
                disabled={paginaAtual === totalPaginas}
              >
                Próxima
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
