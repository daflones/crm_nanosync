import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Calendar, Plus, Search, Filter, Eye, Edit, Trash2, List, CalendarDays, Users, Presentation, Phone, Wrench, GraduationCap, HeadphonesIcon, Heart, MapPin } from 'lucide-react'
import { useAgendamentos, useAgendamentosStatusStats, useCreateAgendamento, useUpdateAgendamento, useDeleteAgendamento } from '@/hooks/useAgendamentos'
import { useClientes } from '@/hooks/useClientes'
import { useVendedores } from '@/hooks/useVendedores'
import { type Agendamento, type AgendamentoCreateData } from '@/services/api/agendamentos'
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
  
  // Mutations
  const createAgendamento = useCreateAgendamento()
  const updateAgendamento = useUpdateAgendamento()
  const deleteAgendamento = useDeleteAgendamento()
  
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

  const formatTipo = (tipo: string) => {
    if (!tipo) return ''
    
    // Converte underscores em espaços e capitaliza cada palavra
    return tipo
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
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
      
      
      await createAgendamento.mutateAsync(agendamentoData)
      setIsCreateModalOpen(false)
      setPrefilledData(null)
    } catch (error) {
      toast.error(`Erro ao criar agendamento: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    }
  }

  const handleUpdateAgendamento = async (data: any) => {
    if (!selectedAgendamento) return
    try {
      await updateAgendamento.mutateAsync({ id: selectedAgendamento.id, data })
      setIsEditModalOpen(false)
      setSelectedAgendamento(null)
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

      await deleteAgendamento.mutateAsync(agendamentoToDelete)
      
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
                          <p><strong>Tipo:</strong> {formatTipo(agendamento.tipo)}</p>
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
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="text-2xl font-bold">Detalhes do Agendamento</DialogTitle>
          </DialogHeader>
          {selectedAgendamento && (
            <div className="space-y-6 pt-2">
              {/* Header com título e ações */}
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                    {selectedAgendamento.titulo}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    <Badge 
                      variant={getStatusVariant(selectedAgendamento.status)}
                      className="px-3 py-1 text-sm font-medium"
                    >
                      {selectedAgendamento.status}
                    </Badge>
                    <Badge 
                      variant="outline" 
                      className="px-3 py-1 text-sm font-medium border-blue-300 text-blue-700 bg-blue-50 dark:bg-blue-900/20"
                    >
                      {formatTipo(selectedAgendamento.tipo)}
                    </Badge>
                    <Badge 
                      variant="secondary" 
                      className="px-3 py-1 text-sm font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/20"
                    >
                      {selectedAgendamento.categoria}
                    </Badge>
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
                    className="border-blue-300 text-blue-700 hover:bg-blue-50"
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
              
              {/* Cards de Informações */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Card Informações Básicas */}
                <Card className="border-l-4 border-l-blue-500 bg-gradient-to-br from-blue-50 to-white dark:from-blue-900/10 dark:to-gray-900">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                      Informações Básicas
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center p-2 bg-white dark:bg-gray-800 rounded-lg">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Cliente:</span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {getClienteName(selectedAgendamento.cliente_id)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-white dark:bg-gray-800 rounded-lg">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Vendedor:</span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {getVendedorName(selectedAgendamento.vendedor_id)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-white dark:bg-gray-800 rounded-lg">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Prioridade:</span>
                      <Badge 
                        variant={selectedAgendamento.prioridade === 'alta' ? 'destructive' : selectedAgendamento.prioridade === 'media' ? 'default' : 'secondary'}
                        className="font-semibold"
                      >
                        {selectedAgendamento.prioridade}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Card Data e Horário */}
                <Card className="border-l-4 border-l-green-500 bg-gradient-to-br from-green-50 to-white dark:from-green-900/10 dark:to-gray-900">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-semibold text-green-900 dark:text-green-100">
                      Data e Horário
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center p-2 bg-white dark:bg-gray-800 rounded-lg">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Início:</span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {formatDateTime(selectedAgendamento.data_inicio)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-white dark:bg-gray-800 rounded-lg">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Fim:</span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {formatDateTime(selectedAgendamento.data_fim)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-white dark:bg-gray-800 rounded-lg">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Duração:</span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {selectedAgendamento.duracao_minutos} minutos
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-white dark:bg-gray-800 rounded-lg">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Modalidade:</span>
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200 font-semibold">
                        {selectedAgendamento.modalidade}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Seções de Conteúdo */}
              <div className="space-y-4">
                {selectedAgendamento?.descricao && (
                  <Card className="border-l-4 border-l-gray-400 bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base font-semibold text-gray-900 dark:text-white">
                        Descrição
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                        {selectedAgendamento.descricao}
                      </p>
                    </CardContent>
                  </Card>
                )}
                
                {selectedAgendamento?.objetivo && (
                  <Card className="border-l-4 border-l-amber-500 bg-gradient-to-br from-amber-50 to-white dark:from-amber-900/10 dark:to-gray-900">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base font-semibold text-amber-900 dark:text-amber-100">
                        Objetivo
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                        {selectedAgendamento.objetivo}
                      </p>
                    </CardContent>
                  </Card>
                )}
                
                {selectedAgendamento?.agenda && (
                  <Card className="border-l-4 border-l-indigo-500 bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-900/10 dark:to-gray-900">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base font-semibold text-indigo-900 dark:text-indigo-100">
                        Agenda
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                        {selectedAgendamento.agenda}
                      </p>
                    </CardContent>
                  </Card>
                )}
                
                {selectedAgendamento?.resultado && (
                  <Card className="border-l-4 border-l-green-500 bg-gradient-to-br from-green-50 to-white dark:from-green-900/10 dark:to-gray-900">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base font-semibold text-green-900 dark:text-green-100">
                        Resultado
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                        {selectedAgendamento.resultado}
                      </p>
                    </CardContent>
                  </Card>
                )}
                
                {selectedAgendamento?.ata_reuniao && (
                  <Card className="border-l-4 border-l-slate-500 bg-gradient-to-br from-slate-50 to-white dark:from-slate-900/10 dark:to-gray-900">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-100">
                        Ata da Reunião
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                        {selectedAgendamento.ata_reuniao}
                      </p>
                    </CardContent>
                  </Card>
                )}
                
                {selectedAgendamento?.proximos_passos && (
                  <Card className="border-l-4 border-l-blue-500 bg-gradient-to-br from-blue-50 to-white dark:from-blue-900/10 dark:to-gray-900">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base font-semibold text-blue-900 dark:text-blue-100">
                        Próximos Passos
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                        {selectedAgendamento.proximos_passos}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>


              {(selectedAgendamento?.link_online || selectedAgendamento?.endereco_reuniao) && (
                <Card className="border-l-4 border-l-purple-500 bg-gradient-to-br from-purple-50 to-white dark:from-purple-900/10 dark:to-gray-900">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-semibold text-purple-900 dark:text-purple-100">
                      Local da Reunião
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {selectedAgendamento?.endereco_reuniao && (
                      <div className="flex items-start gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-purple-200 dark:border-purple-800">
                        <MapPin className="h-5 w-5 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <div className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Endereço</div>
                          <div className="text-sm text-gray-700 dark:text-gray-300">{selectedAgendamento.endereco_reuniao}</div>
                        </div>
                      </div>
                    )}
                    {selectedAgendamento?.link_online && (
                      <div className="flex items-start gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-purple-200 dark:border-purple-800">
                        <Calendar className="h-5 w-5 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <div className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Link Online</div>
                          <a 
                            href={selectedAgendamento.link_online} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-sm text-blue-600 dark:text-blue-400 hover:underline break-all"
                          >
                            {selectedAgendamento.link_online}
                          </a>
                          {selectedAgendamento?.plataforma && (
                            <div className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                              <span className="font-medium">Plataforma:</span> {selectedAgendamento.plataforma}
                            </div>
                          )}
                          {selectedAgendamento?.senha_reuniao && (
                            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                              <span className="font-medium">Senha:</span> {selectedAgendamento.senha_reuniao}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {(selectedAgendamento?.participantes && Array.isArray(selectedAgendamento.participantes) && selectedAgendamento.participantes.length > 0) || 
               (selectedAgendamento?.participantes_externos && Array.isArray(selectedAgendamento.participantes_externos) && selectedAgendamento.participantes_externos.length > 0) ? (
                <Card className="border-l-4 border-l-cyan-500 bg-gradient-to-br from-cyan-50 to-white dark:from-cyan-900/10 dark:to-gray-900">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-semibold text-cyan-900 dark:text-cyan-100">
                      Participantes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedAgendamento?.participantes && Array.isArray(selectedAgendamento.participantes) && selectedAgendamento.participantes.length > 0 && (
                        <div>
                          <h5 className="text-sm font-semibold text-cyan-800 dark:text-cyan-200 mb-3">Participantes Internos</h5>
                          <div className="space-y-2">
                            {selectedAgendamento.participantes.map((participante: any, index: number) => (
                              <div key={index} className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-cyan-200 dark:border-cyan-800">
                                <div className="font-semibold text-gray-900 dark:text-white">{participante.nome}</div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">{participante.funcao}</div>
                                <div className="text-xs text-gray-500 dark:text-gray-500">{participante.email}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {selectedAgendamento?.participantes_externos && Array.isArray(selectedAgendamento.participantes_externos) && selectedAgendamento.participantes_externos.length > 0 && (
                        <div>
                          <h5 className="text-sm font-semibold text-cyan-800 dark:text-cyan-200 mb-3">Participantes Externos</h5>
                          <div className="flex flex-wrap gap-2">
                            {selectedAgendamento.participantes_externos.map((participante: string, index: number) => (
                              <Badge 
                                key={index} 
                                className="bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-200 px-3 py-1"
                              >
                                {participante}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
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
