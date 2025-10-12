import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Calendar, Plus, Search, Filter, Eye, Edit, Trash2, List, CalendarDays, Users, Presentation, Phone, Wrench, GraduationCap, HeadphonesIcon, Heart, MapPin } from 'lucide-react'
import { useAgendamentos, useAgendamentosStatusStats } from '@/hooks/useAgendamentos'
import { useClientes } from '@/hooks/useClientes'
import { useVendedores } from '@/hooks/useVendedores'
import { type Agendamento, type AgendamentoCreateData, agendamentosService } from '@/services/api/agendamentos'
import { type Cliente } from '@/services/api/clientes'
import { type Vendedor } from '@/services/api/vendedores'
import { AgendamentoForm } from '@/components/agendamentos/AgendamentoForm'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { usePlanoAtivoAction } from '@/components/PlanoAtivoGuard'
import { validateAgendamentoDelete } from '@/middleware/agendamentosValidation'
import { filterAgendamentosByUser, canUserModifyAgendamento } from '@/utils/agendamentosFilters'

export function AgendamentosPage() {
  // Use current user hook for better user data management
  const { data: currentUser } = useCurrentUser()
  const { executeAction: executePlanoAtivoAction } = usePlanoAtivoAction()
  const [page, setPage] = useState(1)
  const [limit] = useState(50) // 50 agendamentos por página
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('todos')
  
  // Hooks com paginação
  const { data: agendamentos = [], count: totalAgendamentosFiltered = 0, isLoading: loading } = useAgendamentos({
    page,
    limit,
    status: statusFilter === 'todos' ? undefined : statusFilter
  })
  
  // Total geral (sempre fixo)
  const { count: totalAgendamentos = 0 } = useAgendamentos({ page: 1, limit: 1 })
  
  // Stats por status
  const { data: statusStats = {} } = useAgendamentosStatusStats()
  
  const { data: clientes = [] } = useClientes()
  const { data: vendedores = [] } = useVendedores()
  const [selectedAgendamento, setSelectedAgendamento] = useState<Agendamento | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [agendamentoToDelete, setAgendamentoToDelete] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list')
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [prefilledData, setPrefilledData] = useState<Partial<AgendamentoCreateData> | null>(null)

  // Paginação
  const totalPages = Math.ceil(totalAgendamentosFiltered / limit)
  const hasMore = page < totalPages
  const showingFrom = (page - 1) * limit + 1
  const showingTo = Math.min(page * limit, totalAgendamentosFiltered)

  // Reset page when filters change
  useEffect(() => {
    setPage(1)
  }, [searchTerm, statusFilter])

  const handleLoadMore = () => {
    setPage(prev => prev + 1)
  }

  // Filtro de busca local (apenas busca, status é no backend)
  const filteredAgendamentos = useMemo(() => {
    // First filter by user permissions
    const userFilteredAgendamentos = filterAgendamentosByUser(agendamentos, currentUser)
    
    // Then apply search filter
    if (!searchTerm) return userFilteredAgendamentos
    
    return userFilteredAgendamentos.filter(agendamento => {
      const searchLower = searchTerm.toLowerCase()
      return agendamento.titulo.toLowerCase().includes(searchLower) ||
             getClienteName(agendamento.cliente_id).toLowerCase().includes(searchLower)
    })
  }, [agendamentos, currentUser, searchTerm])

  // Helper functions
  const getClienteName = (clienteId: string) => {
    const cliente = clientes.find(c => c.id === clienteId)
    return cliente ? `${cliente.nome_contato}${cliente.nome_empresa ? ` - ${cliente.nome_empresa}` : ''}` : 'Cliente não encontrado'
  }

  const getVendedorName = (vendedorId: string) => {
    const vendedor = vendedores.find(v => v.id === vendedorId)
    return vendedor ? vendedor.nome : 'Vendedor não encontrado'
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'agendado': return 'default'
      case 'confirmado': return 'secondary'
      case 'realizado': return 'outline'
      case 'cancelado': return 'destructive'
      default: return 'default'
    }
  }

  const formatDateTime = (dateString: string) => {
    if (!dateString) return 'N/A'
    
    // Remove qualquer indicador de timezone para tratar como local
    let cleanDateString = dateString.replace('Z', '').replace(/[+-]\d{2}:\d{2}$/, '')
    
    // Se não tem 'T', adiciona para formar ISO string válida
    if (!cleanDateString.includes('T')) {
      cleanDateString += 'T00:00:00'
    }
    
    // Cria a data SEM adicionar horas - exatamente como está no banco
    const date = new Date(cleanDateString)
    
    if (isNaN(date.getTime())) return 'Data inválida'
    
    // Formata diretamente
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    
    return `${day}/${month}/${year}, ${hours}:${minutes}`
  }

  // CRUD operations
  const handleCreateAgendamento = async (data: any) => {
    
    try {
      
      // Validar campos obrigatórios
      if (!data.cliente_id || !data.vendedor_id || !data.titulo || !data.data_inicio || !data.data_fim) {
        toast.error('Por favor, preencha todos os campos obrigatórios')
        return
      }
      
      const agendamentoData = {
        ...data,
        user_id: currentUser?.id || null, // ID do usuário autenticado
        participantes: data.participantes || [],
        participantes_externos: data.participantes_externos || [],
        materiais_necessarios: data.materiais_necessarios || [],
        documentos_anexos: data.documentos_anexos || [],
        produtos_apresentar: data.produtos_apresentar || [],
        servicos_apresentar: data.servicos_apresentar || []
      }
      
      
      await agendamentosService.create(agendamentoData)
      setIsCreateModalOpen(false)
      setPrefilledData(null)
      loadData()
    } catch (error) {
      toast.error(`Erro ao criar agendamento: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    }
  }

  const handleUpdateAgendamento = async (data: any) => {
    if (!selectedAgendamento) return
    try {
      await agendamentosService.update(selectedAgendamento.id, data)
      setIsEditModalOpen(false)
      setSelectedAgendamento(null)
      loadData()
    } catch (error) {
      toast.error('Erro ao atualizar agendamento')
    }
  }

  const handleDeleteAgendamento = (id: string) => {
    setAgendamentoToDelete(id)
    setIsDeleteModalOpen(true)
  }

  const confirmDeleteAgendamento = async () => {
    if (!agendamentoToDelete) return
    
    
    try {
      // Find the agendamento to validate permissions
      const agendamento = agendamentos?.find(a => a.id === agendamentoToDelete)
      
      if (!agendamento) {
        toast.error('Agendamento não encontrado')
        return
      }

      // Validate user permissions using middleware
      const validation = validateAgendamentoDelete(agendamento, currentUser)
      
      if (!validation.isValid) {
        toast.error(validation.error || 'Sem permissão para excluir este agendamento')
        return
      }

      await agendamentosService.delete(agendamentoToDelete)
      loadData()
      
      // Close modal and reset state
      setIsDeleteModalOpen(false)
      setAgendamentoToDelete(null)
    } catch (error) {
      toast.error(`Erro ao excluir agendamento: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    }
  }

  const quickActionTemplates = [
    {
      id: 'primeira_reuniao',
      title: 'Primeira Reunião',
      icon: Users,
      color: 'bg-blue-500',
      data: {
        tipo: 'primeira_reuniao',
        categoria: 'comercial',
        prioridade: 'alta',
        duracao_minutos: 60,
        titulo: 'Primeira Reunião - Apresentação'
      }
    },
    {
      id: 'apresentacao',
      title: 'Apresentação',
      icon: Presentation,
      color: 'bg-green-500',
      data: {
        tipo: 'apresentacao',
        categoria: 'comercial',
        prioridade: 'media',
        duracao_minutos: 90,
        titulo: 'Apresentação de Produtos/Serviços'
      }
    },
    {
      id: 'negociacao',
      title: 'Negociação',
      icon: Heart,
      color: 'bg-purple-500',
      data: {
        tipo: 'negociacao',
        categoria: 'comercial',
        prioridade: 'alta',
        duracao_minutos: 120,
        titulo: 'Reunião de Negociação'
      }
    },
    {
      id: 'followup',
      title: 'Follow-up',
      icon: Phone,
      color: 'bg-orange-500',
      data: {
        tipo: 'followup',
        categoria: 'comercial',
        prioridade: 'media',
        duracao_minutos: 30,
        titulo: 'Follow-up - Acompanhamento'
      }
    },
    {
      id: 'tecnica',
      title: 'Técnica',
      icon: Wrench,
      color: 'bg-red-500',
      data: {
        tipo: 'tecnica',
        categoria: 'tecnica',
        prioridade: 'alta',
        duracao_minutos: 90,
        titulo: 'Reunião Técnica'
      }
    },
    {
      id: 'treinamento',
      title: 'Treinamento',
      icon: GraduationCap,
      color: 'bg-indigo-500',
      data: {
        tipo: 'treinamento',
        categoria: 'treinamento',
        prioridade: 'media',
        duracao_minutos: 180,
        titulo: 'Sessão de Treinamento'
      }
    },
    {
      id: 'suporte',
      title: 'Suporte',
      icon: HeadphonesIcon,
      color: 'bg-teal-500',
      data: {
        tipo: 'suporte',
        categoria: 'suporte',
        prioridade: 'alta',
        duracao_minutos: 45,
        titulo: 'Reunião de Suporte'
      }
    }
  ]

  const handleQuickAction = (template: any) => {
    // Set to current date but with a reasonable hour (9 AM if before 9 AM, otherwise current hour)
    const startTime = new Date()
    if (startTime.getHours() < 9) {
      startTime.setHours(9, 0, 0, 0)
    }
    
    const endTime = new Date(startTime.getTime() + (template.data.duracao_minutos || 60) * 60000)
    
    setPrefilledData({
      ...template.data,
      data_inicio: startTime.toISOString(),
      data_fim: endTime.toISOString()
    })
    setIsCreateModalOpen(true)
  }

  const formatTime = (dateString: string) => {
    if (!dateString) return 'N/A'
    
    // Remove qualquer indicador de timezone para tratar como local
    let cleanDateString = dateString.replace('Z', '').replace(/[+-]\d{2}:\d{2}$/, '')
    
    if (!cleanDateString.includes('T')) {
      cleanDateString += 'T00:00:00'
    }
    
    // Cria a data SEM adicionar horas - exatamente como está no banco
    const date = new Date(cleanDateString)
    
    if (isNaN(date.getTime())) return 'Hora inválida'
    
    // Formata diretamente
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    
    return `${hours}:${minutes}`
  }

  // Calendar helpers
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()
    
    const days = []
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }
    
    return days
  }

  const getAgendamentosForDate = (date: Date) => {
    if (!date) return []
    const dateStr = date.toISOString().split('T')[0]
    return agendamentos.filter(agendamento => {
      const agendamentoDate = new Date(agendamento.data_inicio).toISOString().split('T')[0]
      return agendamentoDate === dateStr
    })
  }

  const handleCalendarDayClick = (day: number) => {
    const clickedDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day, 9, 0) // 9 AM default
    const endDate = new Date(clickedDate.getTime() + 60 * 60000) // 1 hour default
    
    setPrefilledData({
      data_inicio: clickedDate.toISOString(),
      data_fim: endDate.toISOString(),
      duracao_minutos: 60,
      titulo: 'Nova Reunião',
      tipo: 'primeira_reuniao',
      categoria: 'comercial',
      prioridade: 'media',
      modalidade: 'presencial'
    })
    setIsCreateModalOpen(true)
  }

  return (
    <div className="w-full h-full space-y-6">
      {/* Header */}
      <div className="w-full">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Agendamentos</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Gerencie seus compromissos e reuniões
            </p>
          </div>
          
          {/* Mobile: New Appointment Button */}
          <div className="sm:hidden">
            <Button 
              className="w-full" 
              onClick={() => executePlanoAtivoAction(() => setIsCreateModalOpen(true))}
            >
              <Plus className="mr-2 h-4 w-4" />
              Novo Agendamento
            </Button>
          </div>
        </div>

        {/* Controls */}
        <div className="mt-4 flex flex-col sm:flex-row gap-3">
          {/* Desktop Controls */}
          <div className="hidden sm:flex items-center gap-4 ml-auto">
            {/* View Mode Toggle */}
            <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'list' | 'calendar')}>
              <TabsList>
                <TabsTrigger value="list" className="flex items-center gap-2">
                  <List className="h-4 w-4" />
                  <span className="hidden lg:inline">Lista</span>
                </TabsTrigger>
                <TabsTrigger value="calendar" className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" />
                  <span className="hidden lg:inline">Calendário</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
            
            {/* Desktop: New Appointment Button */}
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="flex items-center gap-2"
                  onClick={() => executePlanoAtivoAction(() => setIsCreateModalOpen(true))}
                >
                  <Plus className="h-4 w-4" />
                  Novo Agendamento
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Criar Novo Agendamento</DialogTitle>
                </DialogHeader>
                <AgendamentoForm
                  clientes={clientes}
                  vendedores={vendedores}
                  onSubmit={handleCreateAgendamento}
                  onCancel={() => {
                    setIsCreateModalOpen(false)
                    setPrefilledData(null)
                  }}
                  prefilledData={prefilledData || undefined}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3">Ações Rápidas</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {quickActionTemplates.map((template) => {
            const IconComponent = template.icon
            return (
              <Button
                key={template.id}
                variant="outline"
                className="h-20 flex flex-col items-center justify-center gap-2 hover:bg-blue-500 hover:text-white transition-colors border-2 hover:border-blue-500"
                onClick={() => handleQuickAction(template)}
              >
                <IconComponent className="h-6 w-6" />
                <span className="text-xs font-medium">{template.title}</span>
              </Button>
            )
          })}
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar agendamentos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os Status</SelectItem>
            <SelectItem value="agendado">Agendado</SelectItem>
            <SelectItem value="confirmado">Confirmado</SelectItem>
            <SelectItem value="realizado">Realizado</SelectItem>
            <SelectItem value="cancelado">Cancelado</SelectItem>
            <SelectItem value="reagendado">Reagendado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Content based on view mode */}
      {viewMode === 'list' ? (
        /* Lista de Agendamentos */
        <div className="grid gap-4">
          {loading ? (
            <div className="text-center py-8">
              <p>Carregando agendamentos...</p>
            </div>
          ) : filteredAgendamentos.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhum agendamento encontrado</p>
            </div>
          ) : (
            filteredAgendamentos.map((agendamento) => (
              <Card key={agendamento.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{agendamento.titulo}</h3>
                        <Badge variant={getStatusVariant(agendamento.status)}>
                          {agendamento.status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                        <div>
                          <p><strong>Cliente:</strong> {getClienteName(agendamento.cliente_id)}</p>
                          <p><strong>Vendedor:</strong> {getVendedorName(agendamento.vendedor_id)}</p>
                        </div>
                        <div>
                          <p><strong>Data:</strong> {formatDateTime(agendamento.data_inicio)}</p>
                          <p><strong>Duração:</strong> {agendamento.duracao_minutos} min</p>
                        </div>
                        <div>
                          <p><strong>Tipo:</strong> {agendamento.tipo}</p>
                          <p><strong>Modalidade:</strong> {agendamento.modalidade}</p>
                        </div>
                      </div>
                      {agendamento.descricao && (
                        <p className="mt-3 text-sm">{agendamento.descricao}</p>
                      )}
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedAgendamento(agendamento)
                          setIsViewModalOpen(true)
                        }}
                        title="Visualizar"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedAgendamento(agendamento)
                          setIsEditModalOpen(true)
                        }}
                        title="Editar"
                        disabled={!canUserModifyAgendamento(agendamento, currentUser)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          handleDeleteAgendamento(agendamento.id)
                        }}
                        title="Excluir"
                        disabled={!canUserModifyAgendamento(agendamento, currentUser)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      ) : (
        /* Calendar View */
        <div className="space-y-4">
          {/* Calendar Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              {selectedDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
            </h2>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  const newDate = new Date(selectedDate)
                  newDate.setMonth(newDate.getMonth() - 1)
                  setSelectedDate(newDate)
                }}
              >
                ←
              </Button>
              <Button
                variant="outline"
                onClick={() => setSelectedDate(new Date())}
              >
                Hoje
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  const newDate = new Date(selectedDate)
                  newDate.setMonth(newDate.getMonth() + 1)
                  setSelectedDate(newDate)
                }}
              >
                →
              </Button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700">
            {/* Days of week header */}
            <div className="grid grid-cols-7 border-b dark:border-gray-700">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
                <div key={day} className="p-3 text-center font-medium text-muted-foreground dark:text-gray-400 border-r dark:border-gray-700 last:border-r-0">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar days */}
            <div className="grid grid-cols-7">
              {getDaysInMonth(selectedDate).map((date, index) => {
                const dayAgendamentos = date ? getAgendamentosForDate(date) : []
                const isToday = date && date.toDateString() === new Date().toDateString()
                const isPastDate = date && date < new Date(new Date().setHours(0, 0, 0, 0))
                
                return (
                  <div
                    key={index}
                    className={`min-h-[120px] p-2 border-r border-b last:border-r-0 ${
                      date ? 'cursor-pointer hover:bg-gray-50' : ''
                    } ${
                      isToday ? 'bg-blue-50' : ''
                    } ${
                      isPastDate ? 'bg-gray-50' : ''
                    }`}
                    onClick={() => date && handleCalendarDayClick(date.getDate())}
                  >
                    {date && (
                      <>
                        <div className={`text-sm font-medium mb-1 ${
                          isToday ? 'text-blue-600' : isPastDate ? 'text-gray-400' : ''
                        }`}>
                          {date.getDate()}
                        </div>
                        <div className="space-y-1">
                          {dayAgendamentos.slice(0, 3).map((agendamento) => (
                            <div
                              key={agendamento.id}
                              className="text-xs p-1 bg-blue-100 text-blue-800 rounded cursor-pointer hover:bg-blue-200 group relative"
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedAgendamento(agendamento)
                                setIsViewModalOpen(true)
                              }}
                            >
                              <div className="font-medium truncate">{agendamento.titulo}</div>
                              <div className="text-blue-600">{formatTime(agendamento.data_inicio)}</div>
                              <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-4 w-4 p-0 text-blue-600 hover:text-blue-800"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setSelectedAgendamento(agendamento)
                                    setIsEditModalOpen(true)
                                  }}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                          {dayAgendamentos.length > 3 && (
                            <div className="text-xs text-muted-foreground">
                              +{dayAgendamentos.length - 3} mais
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edição */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Agendamento</DialogTitle>
          </DialogHeader>
          {selectedAgendamento && (
            <AgendamentoForm
              agendamento={selectedAgendamento}
              clientes={clientes}
              vendedores={vendedores}
              onSubmit={handleUpdateAgendamento}
              onCancel={() => {
                setIsEditModalOpen(false)
                setSelectedAgendamento(null)
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Visualização */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Agendamento</DialogTitle>
          </DialogHeader>
          {selectedAgendamento && (
            <div className="space-y-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold">{selectedAgendamento.titulo}</h3>
                  <div className="flex gap-2 mt-2">
                    <Badge variant={getStatusVariant(selectedAgendamento.status)}>{selectedAgendamento.status}</Badge>
                    <Badge variant="outline">{selectedAgendamento.tipo}</Badge>
                    <Badge variant="secondary">{selectedAgendamento.categoria}</Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsViewModalOpen(false)
                      setIsEditModalOpen(true)
                    }}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      setIsViewModalOpen(false)
                      handleDeleteAgendamento(selectedAgendamento.id)
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3 text-gray-900">Informações Básicas</h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Cliente:</span>
                      <span className="font-medium">{getClienteName(selectedAgendamento.cliente_id)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Vendedor:</span>
                      <span className="font-medium">{getVendedorName(selectedAgendamento.vendedor_id)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Prioridade:</span>
                      <Badge variant={selectedAgendamento.prioridade === 'alta' ? 'destructive' : selectedAgendamento.prioridade === 'media' ? 'default' : 'secondary'}>
                        {selectedAgendamento.prioridade}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-3 text-gray-900">Data e Horário</h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Início:</span>
                      <span className="font-medium">{formatDateTime(selectedAgendamento.data_inicio)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Fim:</span>
                      <span className="font-medium">{formatDateTime(selectedAgendamento.data_fim)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Duração:</span>
                      <span className="font-medium">{selectedAgendamento.duracao_minutos} minutos</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Modalidade:</span>
                      <span className="font-medium">{selectedAgendamento.modalidade}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                {selectedAgendamento?.descricao && (
                  <div>
                    <h4 className="font-medium mb-2 text-gray-900">Descrição</h4>
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">{selectedAgendamento.descricao}</p>
                  </div>
                )}
                
                {selectedAgendamento?.objetivo && (
                  <div>
                    <h4 className="font-medium mb-2 text-gray-900">Objetivo</h4>
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">{selectedAgendamento.objetivo}</p>
                  </div>
                )}
                
                {selectedAgendamento?.agenda && (
                  <div>
                    <h4 className="font-medium mb-2 text-gray-900">Agenda</h4>
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded whitespace-pre-wrap">{selectedAgendamento.agenda}</p>
                  </div>
                )}
                
                {selectedAgendamento?.resultado && (
                  <div>
                    <h4 className="font-medium mb-2 text-gray-900">Resultado</h4>
                    <p className="text-sm text-gray-600 bg-green-50 p-3 rounded">{selectedAgendamento.resultado}</p>
                  </div>
                )}
                
                {selectedAgendamento?.ata_reuniao && (
                  <div>
                    <h4 className="font-medium mb-2 text-gray-900">Ata da Reunião</h4>
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded whitespace-pre-wrap">{selectedAgendamento.ata_reuniao}</p>
                  </div>
                )}
                
                {selectedAgendamento?.proximos_passos && (
                  <div>
                    <h4 className="font-medium mb-2 text-gray-900">Próximos Passos</h4>
                    <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded">{selectedAgendamento.proximos_passos}</p>
                  </div>
                )}
              </div>


              {(selectedAgendamento?.link_online || selectedAgendamento?.endereco_reuniao) && (
                <div>
                  <h4 className="font-medium mb-3 text-gray-900">Local da Reunião</h4>
                  <div className="space-y-2">
                    {selectedAgendamento?.endereco_reuniao && (
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                        <div>
                          <div className="text-sm font-medium">Endereço</div>
                          <div className="text-sm text-gray-600">{selectedAgendamento.endereco_reuniao}</div>
                        </div>
                      </div>
                    )}
                    {selectedAgendamento?.link_online && (
                      <div className="flex items-start gap-2">
                        <Calendar className="h-4 w-4 text-gray-500 mt-0.5" />
                        <div>
                          <div className="text-sm font-medium">Link Online</div>
                          <a href={selectedAgendamento.link_online} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline break-all">
                            {selectedAgendamento.link_online}
                          </a>
                          {selectedAgendamento?.plataforma && (
                            <div className="text-xs text-gray-500 mt-1">Plataforma: {selectedAgendamento.plataforma}</div>
                          )}
                          {selectedAgendamento?.senha_reuniao && (
                            <div className="text-xs text-gray-500">Senha: {selectedAgendamento.senha_reuniao}</div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {(selectedAgendamento?.participantes && Array.isArray(selectedAgendamento.participantes) && selectedAgendamento.participantes.length > 0) || 
               (selectedAgendamento?.participantes_externos && Array.isArray(selectedAgendamento.participantes_externos) && selectedAgendamento.participantes_externos.length > 0) ? (
                <div>
                  <h4 className="font-medium mb-3 text-gray-900">Participantes</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedAgendamento?.participantes && Array.isArray(selectedAgendamento.participantes) && selectedAgendamento.participantes.length > 0 && (
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-2">Participantes Internos</h5>
                        <div className="space-y-2">
                          {selectedAgendamento.participantes.map((participante: any, index: number) => (
                            <div key={index} className="bg-gray-50 p-2 rounded text-sm">
                              <div className="font-medium">{participante.nome}</div>
                              <div className="text-gray-600">{participante.funcao}</div>
                              <div className="text-gray-500">{participante.email}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {selectedAgendamento?.participantes_externos && Array.isArray(selectedAgendamento.participantes_externos) && selectedAgendamento.participantes_externos.length > 0 && (
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-2">Participantes Externos</h5>
                        <div className="flex flex-wrap gap-2">
                          {selectedAgendamento.participantes_externos.map((participante: string, index: number) => (
                            <Badge key={index} variant="secondary">{participante}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação de Exclusão */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-600">
              Tem certeza que deseja excluir este agendamento? Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setIsDeleteModalOpen(false)
                  setAgendamentoToDelete(null)
                }}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDeleteAgendamento}
              >
                Excluir
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default AgendamentosPage
