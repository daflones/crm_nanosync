import { useState } from 'react'
import { 
  Plus,
  Search, 
  Phone, 
  Mail, 
  TrendingUp, 
  User, 
  Users,
  Loader2, 
  MapPin,
  DollarSign,
  Edit,
  LayoutGrid,
  List,
  Eye,
  Trash2
} from 'lucide-react'
import { useClientes, useCreateCliente, useUpdateCliente, useDeleteCliente, useUpdatePipelineStage } from '@/hooks/useClientes'
import { useVendedores } from '@/hooks/useVendedores'
import { useIsAdmin, useCurrentVendedorId } from '@/hooks/useAuth'
import { VendedorSelector } from '@/components/VendedorSelector'
import { PlanoAtivoButton } from '@/components/PlanoAtivoGuard'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { useNotifications } from '@/contexts/NotificationContext'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { KanbanBoard } from '@/components/kanban/KanbanBoard'

// Validation schema - aligned with database structure
const clienteSchema = z.object({
  nome_contato: z.string().min(1, 'Nome é obrigatório'),
  cargo: z.string().optional().or(z.literal('')),
  nome_empresa: z.string().optional().or(z.literal('')),
  razao_social: z.string().optional().or(z.literal('')),
  cnpj: z.string().optional().or(z.literal('')),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  telefone: z.string().optional().or(z.literal('')),
  whatsapp: z.string().optional().or(z.literal('')),
  endereco: z.string().optional().or(z.literal('')),
  numero: z.string().optional().or(z.literal('')),
  complemento: z.string().optional().or(z.literal('')),
  bairro: z.string().optional().or(z.literal('')),
  cidade: z.string().optional().or(z.literal('')),
  estado: z.string().optional().or(z.literal('')),
  cep: z.string().optional().or(z.literal('')),
  segmento_cliente: z.string().optional().or(z.literal('')),
  etapa_pipeline: z.string().default('novo'),
  valor_estimado: z.coerce.number().min(0).default(0),
  probabilidade: z.coerce.number().min(0).max(100).default(50),
  classificacao: z.string().default('frio'),
  origem: z.string().default('manual'),
  observacoes: z.string().optional().or(z.literal('')),
  vendedor_id: z.string().optional().or(z.literal('')),
})

type ClienteFormData = z.infer<typeof clienteSchema>

export function ClientesPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStage, setSelectedStage] = useState('todos')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedCliente, setSelectedCliente] = useState<any>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'kanban'>('grid')

  const { data: clientes = [], isLoading } = useClientes()
  const { data: _vendedores = [] } = useVendedores()
  const createCliente = useCreateCliente()
  const updateCliente = useUpdateCliente()
  const deleteCliente = useDeleteCliente()
  const updatePipelineStage = useUpdatePipelineStage()
  const { addNotification: _addNotification } = useNotifications()
  
  // Role-based access control
  const isAdmin = useIsAdmin()
  const currentVendedorId = useCurrentVendedorId()

  // React Hook Form
  const form = useForm<ClienteFormData>({
    resolver: zodResolver(clienteSchema),
  })
  const { register, handleSubmit, reset, setValue, formState: { errors } } = form

  const pipelineStages = [
    { id: 'novo', name: 'Novo', color: 'bg-gray-500' },
    { id: 'contactado', name: 'Contactado', color: 'bg-blue-500' },
    { id: 'qualificado', name: 'Qualificado', color: 'bg-indigo-500' },
    { id: 'proposta', name: 'Proposta', color: 'bg-purple-500' },
    { id: 'negociacao', name: 'Negociação', color: 'bg-orange-500' },
    { id: 'fechado', name: 'Fechado', color: 'bg-green-500' },
    { id: 'perdido', name: 'Perdido', color: 'bg-red-500' },
  ]

  const classificacoes = [
    { value: 'quente', label: 'Quente', color: 'text-red-500' },
    { value: 'morno', label: 'Morno', color: 'text-yellow-500' },
    { value: 'frio', label: 'Frio', color: 'text-blue-500' },
  ]

  const origens = [
    { value: 'manual', label: 'Manual' },
    { value: 'whatsapp', label: 'WhatsApp' },
    { value: 'site', label: 'Site' },
    { value: 'indicacao', label: 'Indicação' },
    { value: 'feira', label: 'Feira' },
    { value: 'cold_call', label: 'Cold Call' },
    { value: 'email', label: 'Email' },
    { value: 'redes_sociais', label: 'Redes Sociais' },
  ]

  const getStageCount = (stageId: string) => {
    return clientes.filter((cliente: any) => cliente.etapa_pipeline === stageId).length
  }

  const filteredClientes = clientes.filter((cliente: any) => {
    const matchesStage = selectedStage === 'todos' || cliente.etapa_pipeline === selectedStage
    const matchesSearch = !searchTerm || 
      cliente.nome_contato?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliente.nome_empresa?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliente.email?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesStage && matchesSearch
  })

  // CRUD handlers
  const { createDatabaseNotification } = useNotifications()

  const handleCreateCliente = async (data: ClienteFormData) => {
    try {
      // Clean up empty string fields that should be null for UUID fields
      const cleanedData = {
        ...data,
        vendedor_id: data.vendedor_id && data.vendedor_id.trim() !== '' ? data.vendedor_id : null,
        segmento_cliente: data.segmento_cliente && data.segmento_cliente.trim() !== '' ? data.segmento_cliente : null,
      }
      const result = await createCliente.mutateAsync(cleanedData as any)
      setIsCreateModalOpen(false)
      reset()
      toast.success('Cliente criado com sucesso!')
      
      // Criar notificação no banco
      await createDatabaseNotification({
        tipo: 'cliente_criado',
        categoria: 'cliente',
        titulo: 'Cliente Criado',
        descricao: `Cliente "${data.nome_contato || data.nome_empresa}" foi criado com sucesso`,
        referencia_id: result.id,
        referencia_tipo: 'cliente',
        prioridade: 'normal'
      })
    } catch (error) {
      console.error('Erro ao criar cliente:', error)
      toast.error('Erro ao criar cliente')
    }
  }

  const handleUpdateCliente = async (data: ClienteFormData) => {
    if (!selectedCliente) return
    
    try {
      // Clean up empty string fields that should be null for UUID fields
      const cleanedData = {
        ...data,
        vendedor_id: data.vendedor_id && data.vendedor_id.trim() !== '' ? data.vendedor_id : null,
        segmento_cliente: data.segmento_cliente && data.segmento_cliente.trim() !== '' ? data.segmento_cliente : null,
      }
      await updateCliente.mutateAsync({
        id: selectedCliente.id,
        data: cleanedData
      })
      setIsEditModalOpen(false)
      setSelectedCliente(null)
      reset()
      toast.success('Cliente atualizado com sucesso!')
      
      // Criar notificação no banco
      await createDatabaseNotification({
        tipo: 'cliente_atualizado',
        categoria: 'cliente',
        titulo: 'Cliente Atualizado',
        descricao: `Cliente "${data.nome_contato || data.nome_empresa}" foi atualizado com sucesso`,
        referencia_id: selectedCliente.id,
        referencia_tipo: 'cliente',
        prioridade: 'normal'
      })
    } catch (error) {
      console.error('Erro ao atualizar cliente:', error)
      toast.error('Erro ao atualizar cliente')
    }
  }

  const handleViewCliente = (cliente: any) => {
    setSelectedCliente(cliente)
    setIsDetailModalOpen(true)
  }

  const handleUpdateStage = async (clienteId: string, newStage: string) => {
    try {
      await updatePipelineStage.mutateAsync({ id: clienteId, etapa: newStage })
    } catch (error) {
      console.error('Erro ao atualizar etapa:', error)
    }
  }

  // const handleDeleteCliente = async () => {
  //   if (!selectedCliente) return
  //   try {
  //     await deleteCliente.mutateAsync(selectedCliente.id)
  //     setIsDeleteDialogOpen(false)
  //     setSelectedCliente(null)
  //   } catch (error) {
  //     console.error('Erro ao deletar cliente:', error)
  //   }
  // }

  const handleMovePipeline = async (clienteId: string, novaEtapa: string) => {
    try {
      await updatePipelineStage.mutateAsync({ id: clienteId, etapa: novaEtapa })
    } catch (error) {
      console.error('Erro ao mover no pipeline:', error)
    }
  }

  const openEditModal = (cliente: any) => {
    setSelectedCliente(cliente)
    
    // Reset form first
    reset()
    
    // Set form values with proper type conversion - aligned with database schema
    setValue('nome_contato', cliente.nome_contato || '')
    setValue('cargo', cliente.cargo || '')
    setValue('nome_empresa', cliente.nome_empresa || '')
    setValue('razao_social', cliente.razao_social || '')
    setValue('cnpj', cliente.cnpj || '')
    setValue('email', cliente.email || '')
    setValue('telefone', cliente.telefone || '')
    setValue('whatsapp', cliente.whatsapp || '')
    setValue('endereco', cliente.endereco || '')
    setValue('numero', cliente.numero || '')
    setValue('complemento', cliente.complemento || '')
    setValue('bairro', cliente.bairro || '')
    setValue('cidade', cliente.cidade || '')
    setValue('estado', cliente.estado || '')
    setValue('cep', cliente.cep || '')
    setValue('segmento_cliente', cliente.segmento_cliente || '')
    setValue('etapa_pipeline', cliente.etapa_pipeline || 'novo')
    setValue('valor_estimado', Number(cliente.valor_estimado) || 0)
    setValue('probabilidade', Number(cliente.probabilidade) || 50)
    setValue('classificacao', cliente.classificacao || 'frio')
    setValue('origem', cliente.origem || 'manual')
    setValue('observacoes', cliente.observacoes || '')
    setValue('vendedor_id', cliente.vendedor_id || '')
    
    setIsEditModalOpen(true)
  }

  const openDeleteDialog = (cliente: any) => {
    setSelectedCliente(cliente)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteCliente = async () => {
    if (!selectedCliente) return
    try {
      await deleteCliente.mutateAsync(selectedCliente.id)
      setIsDeleteDialogOpen(false)
      setSelectedCliente(null)
      toast.success('Cliente excluído com sucesso!')
    } catch (error) {
      console.error('Erro ao deletar cliente:', error)
      toast.error('Erro ao excluir cliente')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="w-full h-full space-y-6">
      {/* Header */}
      <div className="w-full">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Clientes</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Gerencie seus clientes e oportunidades de vendas
            </p>
          </div>
          
          {/* Mobile: New Client Button */}
          <div className="sm:hidden">
            <button 
              onClick={() => {
                reset()
                if (!isAdmin && currentVendedorId) {
                  setValue('vendedor_id', currentVendedorId)
                }
                setIsCreateModalOpen(true)
              }}
              className="w-full px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-primary-600 rounded-md hover:bg-primary-700 flex items-center justify-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Novo Cliente
            </button>
          </div>
        </div>

        {/* Search and Controls */}
        <div className="mt-4 flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Buscar clientes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            />
          </div>
          
          {/* Desktop Controls */}
          <div className="hidden sm:flex items-center gap-3">
            {/* View Toggle */}
            <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-md">
              <button
                onClick={() => setViewMode('kanban')}
                className={`px-3 py-2 text-sm font-medium flex items-center gap-2 ${
                  viewMode === 'kanban' 
                    ? 'bg-primary-600 text-white' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <LayoutGrid className="h-4 w-4" />
                <span className="hidden lg:inline">Kanban</span>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 text-sm font-medium flex items-center gap-2 ${
                  viewMode === 'list' 
                    ? 'bg-primary-600 text-white' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <List className="h-4 w-4" />
                <span className="hidden lg:inline">Lista</span>
              </button>
            </div>
            
            {/* New Client Button */}
            <PlanoAtivoButton
              onClick={() => {
                reset()
                if (!isAdmin && currentVendedorId) {
                  setValue('vendedor_id', currentVendedorId)
                }
                setIsCreateModalOpen(true)
              }}
              className="flex items-center gap-2"
              variant="primary"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden lg:inline">Novo Cliente</span>
            </PlanoAtivoButton>
          </div>

          {/* Mobile View Toggle */}
          <div className="sm:hidden flex items-center border border-gray-300 dark:border-gray-600 rounded-md">
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex-1 px-3 py-2 text-sm font-medium flex items-center justify-center gap-2 ${
                viewMode === 'kanban' 
                  ? 'bg-primary-600 text-white' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
              Kanban
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex-1 px-3 py-2 text-sm font-medium flex items-center justify-center gap-2 ${
                viewMode === 'list' 
                  ? 'bg-primary-600 text-white' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <List className="h-4 w-4" />
              Lista
            </button>
          </div>
        </div>
      </div>

      <div className="w-full grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-8">
        <div 
          className={`p-4 rounded-lg border cursor-pointer transition-colors ${
            selectedStage === 'todos' ? 'bg-primary-50 border-primary-200 dark:bg-primary-900/20 dark:border-primary-700' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
          onClick={() => setSelectedStage('todos')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Todos</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{clientes.length}</p>
            </div>
            <Users className="h-8 w-8 text-gray-400 dark:text-gray-500" />
          </div>
        </div>

        {pipelineStages.map((stage) => (
          <div
            key={stage.id}
            className={`p-4 rounded-lg border cursor-pointer transition-colors ${
              selectedStage === stage.id ? 'bg-primary-50 border-primary-200 dark:bg-primary-900/20 dark:border-primary-700' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
            onClick={() => setSelectedStage(stage.id)}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{stage.name}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{getStageCount(stage.id)}</p>
              </div>
              <div className={`w-3 h-3 rounded-full ${stage.color}`} />
            </div>
          </div>
        ))}
      </div>

      {/* Conditional View Rendering */}
      {viewMode === 'kanban' ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Pipeline de Vendas</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">Gerencie seus leads através do funil de vendas</p>
          </div>
          <KanbanBoard
            clientes={clientes}
            onEdit={openEditModal}
            onDelete={openDeleteDialog}
            onView={handleViewCliente}
            onUpdateStage={handleUpdateStage}
          />
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900">
              {selectedStage === 'todos' ? 'Todos os Clientes' : 
               pipelineStages.find(s => s.id === selectedStage)?.name || 'Clientes'}
            </h2>
          </div>

          {filteredClientes.length === 0 ? (
            <div className="text-center py-12">
              <User className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Nenhum cliente encontrado</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Comece adicionando um novo cliente ao seu pipeline.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredClientes.map((cliente: any) => (
                <div key={cliente.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-primary-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{cliente.nome_contato}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{cliente.nome_empresa}</p>
                        </div>
                      </div>
                      
                      <div className="mt-4 space-y-2 sm:space-y-0 sm:grid sm:grid-cols-1 lg:grid-cols-3 sm:gap-4">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                          <span className="text-sm text-gray-600 dark:text-gray-300 truncate">{cliente.email || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                          <span className="text-sm text-gray-600 dark:text-gray-300 truncate">{cliente.telefone || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                          <span className="text-sm text-gray-600 dark:text-gray-300 truncate">{cliente.cidade || 'N/A'}, {cliente.estado || 'N/A'}</span>
                        </div>
                      </div>
                      
                      <div className="mt-4 space-y-3">
                        {/* Status and Classification */}
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            cliente.etapa_pipeline === 'fechado' ? 'bg-green-100 text-green-800' :
                            cliente.etapa_pipeline === 'perdido' ? 'bg-red-100 text-red-800' :
                            cliente.etapa_pipeline === 'negociacao' ? 'bg-orange-100 text-orange-800' :
                            cliente.etapa_pipeline === 'proposta' ? 'bg-purple-100 text-purple-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {pipelineStages.find(s => s.id === cliente.etapa_pipeline)?.name}
                          </span>
                          {cliente.classificacao && (
                            <span className={`text-xs font-medium ${classificacoes.find(c => c.value === cliente.classificacao)?.color}`}>
                              {cliente.classificacao}
                            </span>
                          )}
                        </div>

                        {/* Value and Probability */}
                        <div className="flex flex-wrap items-center gap-4">
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              R$ {(cliente.valor_estimado || 0).toLocaleString('pt-BR')}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <TrendingUp className="w-4 h-4 text-blue-600" />
                            <span className="text-sm text-gray-600 dark:text-gray-300">{cliente.probabilidade || 0}%</span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          {/* Pipeline Selector - Mobile Full Width */}
                          {cliente.etapa_pipeline !== 'fechado' && cliente.etapa_pipeline !== 'perdido' && (
                            <div className="sm:order-2">
                              <select
                                value={cliente.etapa_pipeline}
                                onChange={(e) => handleMovePipeline(cliente.id, e.target.value)}
                                className="w-full sm:w-auto text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                              >
                                {pipelineStages.map((stage) => (
                                  <option key={stage.id} value={stage.id}>
                                    {stage.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                          
                          {/* Action Buttons */}
                          <div className="flex items-center gap-2 sm:order-1">
                            <button
                              onClick={() => handleViewCliente(cliente)}
                              className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-600 rounded"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <PlanoAtivoButton
                              onClick={() => openEditModal(cliente)}
                              className="p-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-600 rounded"
                              variant="secondary"
                              size="sm"
                            >
                              <Edit className="h-4 w-4" />
                            </PlanoAtivoButton>
                            <PlanoAtivoButton
                              onClick={() => openDeleteDialog(cliente)}
                              className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-600 rounded"
                              variant="danger"
                              size="sm"
                            >
                              <Trash2 className="h-4 w-4" />
                            </PlanoAtivoButton>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Cliente</DialogTitle>
            <DialogDescription>
              Adicione um novo cliente ao seu pipeline de vendas
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(handleCreateCliente)}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nome_contato">Nome do Contato *</Label>
                  <Input
                    id="nome_contato"
                    {...register('nome_contato')}
                    className={errors.nome_contato ? 'border-red-500' : ''}
                  />
                  {errors.nome_contato && (
                    <p className="text-xs text-red-500 mt-1">{errors.nome_contato.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="nome_empresa">Empresa</Label>
                  <Input id="nome_empresa" {...register('nome_empresa')} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    {...register('email')}
                    className={errors.email ? 'border-red-500' : ''}
                  />
                  {errors.email && (
                    <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input id="telefone" {...register('telefone')} />
                </div>
              </div>

              <div>
                <Label htmlFor="endereco">Endereço</Label>
                <Input id="endereco" {...register('endereco')} />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="numero">Número</Label>
                  <Input id="numero" {...register('numero')} />
                </div>
                <div>
                  <Label htmlFor="complemento">Complemento</Label>
                  <Input id="complemento" {...register('complemento')} />
                </div>
                <div>
                  <Label htmlFor="bairro">Bairro</Label>
                  <Input id="bairro" {...register('bairro')} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="cep">CEP</Label>
                  <Input id="cep" {...register('cep')} />
                </div>
                <div>
                  <Label htmlFor="cidade">Cidade</Label>
                  <Input id="cidade" {...register('cidade')} />
                </div>
                <div>
                  <Label htmlFor="estado">Estado</Label>
                  <Input id="estado" {...register('estado')} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="etapa_pipeline">Etapa do Pipeline</Label>
                  <Select
                    defaultValue="novo"
                    onValueChange={(value: string) => setValue('etapa_pipeline', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma etapa" />
                    </SelectTrigger>
                    <SelectContent>
                      {pipelineStages.map((stage) => (
                        <SelectItem key={stage.id} value={stage.id}>
                          {stage.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="classificacao">Classificação</Label>
                  <Select
                    defaultValue="morno"
                    onValueChange={(value: string) => setValue('classificacao', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {classificacoes.map((cls) => (
                        <SelectItem key={cls.value} value={cls.value}>
                          {cls.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="origem">Origem</Label>
                  <Select
                    defaultValue="manual"
                    onValueChange={(value: string) => setValue('origem', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {origens.map((origem) => (
                        <SelectItem key={origem.value} value={origem.value}>
                          {origem.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="segmento_cliente">Segmento</Label>
                  <Input id="segmento_cliente" {...register('segmento_cliente')} />
                </div>
              </div>

              <VendedorSelector
                value={form.watch('vendedor_id')}
                onValueChange={(value) => setValue('vendedor_id', value)}
                required={true}
              />

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="valor_estimado">Valor Estimado (R$)</Label>
                  <Input
                    id="valor_estimado"
                    type="number"
                    {...register('valor_estimado', { valueAsNumber: true })}
                  />
                </div>
                <div>
                  <Label htmlFor="probabilidade">Probabilidade (%)</Label>
                  <Input
                    id="probabilidade"
                    type="number"
                    min="0"
                    max="100"
                    {...register('probabilidade', { valueAsNumber: true })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  {...register('observacoes')}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createCliente.isPending}>
                {createCliente.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Criar Cliente
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Cliente</DialogTitle>
            <DialogDescription>
              Atualize as informações do cliente
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(handleUpdateCliente)}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-nome_contato">Nome do Contato *</Label>
                  <Input
                    id="edit-nome_contato"
                    {...register('nome_contato')}
                    className={errors.nome_contato ? 'border-red-500' : ''}
                  />
                  {errors.nome_contato && (
                    <p className="text-xs text-red-500 mt-1">{errors.nome_contato.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="edit-nome_empresa">Nome da Empresa</Label>
                  <Input id="edit-nome_empresa" {...register('nome_empresa')} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-razao_social">Razão Social</Label>
                  <Input id="edit-razao_social" {...register('razao_social')} />
                </div>
                <div>
                  <Label htmlFor="edit-email">Email</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    {...register('email')}
                    className={errors.email ? 'border-red-500' : ''}
                  />
                  {errors.email && (
                    <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-cargo">Cargo</Label>
                  <Input id="edit-cargo" {...register('cargo')} />
                </div>
                <div>
                  <Label htmlFor="edit-telefone">Telefone</Label>
                  <Input id="edit-telefone" {...register('telefone')} />
                </div>
              </div>

              <div>
                <Label htmlFor="edit-endereco">Endereço</Label>
                <Input id="edit-endereco" {...register('endereco')} />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="edit-numero">Número</Label>
                  <Input id="edit-numero" {...register('numero')} />
                </div>
                <div>
                  <Label htmlFor="edit-complemento">Complemento</Label>
                  <Input id="edit-complemento" {...register('complemento')} />
                </div>
                <div>
                  <Label htmlFor="edit-bairro">Bairro</Label>
                  <Input id="edit-bairro" {...register('bairro')} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="edit-cep">CEP</Label>
                  <Input id="edit-cep" {...register('cep')} />
                </div>
                <div>
                  <Label htmlFor="edit-cidade">Cidade</Label>
                  <Input id="edit-cidade" {...register('cidade')} />
                </div>
                <div>
                  <Label htmlFor="edit-estado">Estado</Label>
                  <Input id="edit-estado" {...register('estado')} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-etapa_pipeline">Etapa do Pipeline</Label>
                  <Select
                    value={selectedCliente?.etapa_pipeline}
                    onValueChange={(value: string) => setValue('etapa_pipeline', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma etapa" />
                    </SelectTrigger>
                    <SelectContent>
                      {pipelineStages.map((stage) => (
                        <SelectItem key={stage.id} value={stage.id}>
                          {stage.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-classificacao">Classificação</Label>
                  <Select
                    value={selectedCliente?.classificacao}
                    onValueChange={(value: string) => setValue('classificacao', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {classificacoes.map((cls) => (
                        <SelectItem key={cls.value} value={cls.value}>
                          {cls.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-origem">Origem</Label>
                  <Select
                    value={selectedCliente?.origem}
                    onValueChange={(value: string) => setValue('origem', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {origens.map((origem) => (
                        <SelectItem key={origem.value} value={origem.value}>
                          {origem.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-segmento_cliente">Segmento</Label>
                  <Input id="edit-segmento_cliente" {...register('segmento_cliente')} />
                </div>
              </div>

              <VendedorSelector
                value={form.watch('vendedor_id')}
                onValueChange={(value) => setValue('vendedor_id', value)}
                required={true}
              />

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="edit-valor_estimado">Valor Estimado (R$)</Label>
                  <Input
                    id="edit-valor_estimado"
                    type="number"
                    {...register('valor_estimado', { valueAsNumber: true })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-probabilidade">Probabilidade (%)</Label>
                  <Input
                    id="edit-probabilidade"
                    type="number"
                    min="0"
                    max="100"
                    {...register('probabilidade', { valueAsNumber: true })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="edit-observacoes">Observações</Label>
                <Textarea
                  id="edit-observacoes"
                  {...register('observacoes')}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={updateCliente.isPending}>
                {updateCliente.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar Alterações
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Client Detail Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Cliente</DialogTitle>
            <DialogDescription>
              Visualize informações completas e progresso de qualificação
            </DialogDescription>
          </DialogHeader>
          
          {selectedCliente && (
            <div className="space-y-6">
              {/* Qualification Progress */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-3">Progresso de Qualificação</h3>
                {(() => {
                  const getQualificationScore = (cliente: any) => {
                    const requiredFields = [
                      { key: 'nome_contato', label: 'Nome do Contato', value: cliente.nome_contato },
                      { key: 'email', label: 'Email', value: cliente.email },
                      { key: 'telefone', label: 'Telefone', value: cliente.telefone },
                      { key: 'nome_empresa', label: 'Nome da Empresa', value: cliente.nome_empresa },
                      { key: 'segmento_cliente', label: 'Segmento', value: cliente.segmento_cliente },
                      { key: 'endereco', label: 'Endereço', value: cliente.endereco },
                      { key: 'cidade', label: 'Cidade', value: cliente.cidade },
                      { key: 'valor_estimado', label: 'Valor Estimado', value: cliente.valor_estimado },
                    ]
                    
                    const completed = requiredFields.filter(field => field.value && field.value !== '' && field.value !== 0)
                    const missing = requiredFields.filter(field => !field.value || field.value === '' || field.value === 0)
                    
                    return { completed, missing, total: requiredFields.length }
                  }
                  
                  const { completed, missing, total } = getQualificationScore(selectedCliente)
                  const percentage = (completed.length / total) * 100
                  
                  return (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-medium">
                          {completed.length}/{total} campos preenchidos
                        </span>
                        <span className={`text-sm font-medium ${
                          percentage >= 100 ? 'text-green-600' :
                          percentage >= 75 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {Math.round(percentage)}%
                        </span>
                      </div>
                      
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                        <div 
                          className={`h-2 rounded-full ${
                            percentage >= 100 ? 'bg-green-500' :
                            percentage >= 75 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      
                      {missing.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-red-600 mb-2">Campos em falta:</h4>
                          <div className="flex flex-wrap gap-2">
                            {missing.map((field, index) => (
                              <span key={index} className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                                {field.label}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })()}
              </div>

              {/* Client Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Informações Básicas</h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <User className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Nome do Contato</p>
                        <p className="font-medium">{selectedCliente.nome_contato || 'N/A'}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="font-medium">{selectedCliente.email || 'N/A'}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Telefone</p>
                        <p className="font-medium">{selectedCliente.telefone || 'N/A'}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <MapPin className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Localização</p>
                        <p className="font-medium">
                          {[selectedCliente.cidade, selectedCliente.estado].filter(Boolean).join(', ') || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Informações Comerciais</h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <DollarSign className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Valor Estimado</p>
                        <p className="font-medium">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL'
                          }).format(selectedCliente.valor_estimado || 0)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <TrendingUp className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Probabilidade</p>
                        <p className="font-medium">{selectedCliente.probabilidade || 0}%</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="h-5 w-5 flex items-center justify-center">
                        <div className={`w-3 h-3 rounded-full ${
                          selectedCliente.classificacao === 'quente' ? 'bg-red-500' :
                          selectedCliente.classificacao === 'morno' ? 'bg-yellow-500' :
                          'bg-blue-500'
                        }`} />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Classificação</p>
                        <p className="font-medium capitalize">{selectedCliente.classificacao || 'N/A'}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        pipelineStages.find(s => s.id === selectedCliente.etapa_pipeline)?.color || 'bg-gray-500'
                      }`} />
                      <div>
                        <p className="text-sm text-gray-500">Etapa do Pipeline</p>
                        <p className="font-medium">
                          {pipelineStages.find(s => s.id === selectedCliente.etapa_pipeline)?.name || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              {(selectedCliente.nome_empresa || selectedCliente.segmento_cliente || selectedCliente.observacoes) && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Informações Adicionais</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedCliente.nome_empresa && (
                      <div>
                        <p className="text-sm text-gray-500">Empresa</p>
                        <p className="font-medium">{selectedCliente.nome_empresa}</p>
                      </div>
                    )}
                    
                    {selectedCliente.segmento_cliente && (
                      <div>
                        <p className="text-sm text-gray-500">Segmento</p>
                        <p className="font-medium">{selectedCliente.segmento_cliente}</p>
                      </div>
                    )}
                  </div>
                  
                  {selectedCliente.observacoes && (
                    <div>
                      <p className="text-sm text-gray-500">Observações</p>
                      <p className="font-medium mt-1">{selectedCliente.observacoes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsDetailModalOpen(false)}
            >
              Fechar
            </Button>
            <PlanoAtivoButton 
              onClick={() => {
                setIsDetailModalOpen(false)
                openEditModal(selectedCliente)
              }}
              variant="primary"
            >
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </PlanoAtivoButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o cliente <strong>{selectedCliente?.nome_contato}</strong>?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCliente}
              disabled={deleteCliente.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteCliente.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
