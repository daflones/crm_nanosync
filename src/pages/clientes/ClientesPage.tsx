import { useState } from 'react'
import {
  Plus,
  Search,
  Filter,
  Mail,
  Building,
  User,
  Users,
  Loader2, 
  MapPin,
  Edit,
  LayoutGrid,
  List,
  Eye,
  Trash2,
  Phone
} from 'lucide-react'
import { useClientes, useCreateCliente, useUpdateCliente, useDeleteCliente, useUpdatePipelineStage } from '@/hooks/useClientes'
import { useVendedores } from '@/hooks/useVendedores'
import { useIsAdmin, useCurrentVendedorId } from '@/hooks/useAuth'
import { VendedorSelector } from '@/components/VendedorSelector'
import { PlanoAtivoButton } from '@/components/PlanoAtivoGuard'
import { useForm, useWatch } from 'react-hook-form'
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
  nome_empresa: z.string().optional().or(z.literal('')),
  razao_social: z.string().optional().or(z.literal('')),
  cargo: z.string().optional().or(z.literal('')),
  documento_tipo: z.enum(['cpf', 'cnpj']).optional(),
  documento_numero: z.string().optional().or(z.literal('')),
  inscricao_estadual: z.string().optional().or(z.literal('')),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  ddd: z.string().optional().or(z.literal('')),
  telefone: z.string().optional().or(z.literal('')),
  telefone_empresa: z.string().optional().or(z.literal('')),
  endereco: z.string().optional().or(z.literal('')),
  numero: z.string().optional().or(z.literal('')),
  cidade: z.string().optional().or(z.literal('')),
  estado: z.string().optional().or(z.literal('')),
  cep: z.string().optional().or(z.literal('')),
  segmento_cliente: z.string().optional().or(z.literal('')),
  etapa_pipeline: z.string().default('novo'),
  classificacao: z.string().default('frio'),
  origem: z.string().default('manual'),
  observacoes: z.string().optional().or(z.literal('')),
  produtos_interesse: z.string().optional().or(z.literal('')),
  contexto_cliente: z.string().optional().or(z.literal('')),
  dores_atuais: z.string().optional().or(z.literal('')),
  motivacao: z.string().optional().or(z.literal('')),
  expectativa: z.string().optional().or(z.literal('')),
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
    defaultValues: {
      etapa_pipeline: 'novo',
      classificacao: 'frio',
      origem: 'manual'
    }
  })
  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = form

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
      // Combine DDD and telefone into whatsapp field
      const whatsapp = data.ddd && data.telefone ? `${data.ddd}${data.telefone}` : ''
      
      // Handle documento fields - map to cpf or cnpj based on tipo
      const documentoData: any = {}
      if (data.documento_tipo === 'cpf' && data.documento_numero) {
        documentoData.cpf = data.documento_numero
        documentoData.cnpj = null
      } else if (data.documento_tipo === 'cnpj' && data.documento_numero) {
        documentoData.cnpj = data.documento_numero
        documentoData.cpf = null
      }
      
      // Handle produtos_interesse - convert string to array
      const produtosInteresse = data.produtos_interesse 
        ? data.produtos_interesse.split(',').map(p => p.trim()).filter(p => p.length > 0)
        : null
      
      // Clean up empty string fields that should be null for UUID fields
      const cleanedData = {
        ...data,
        ...documentoData,
        whatsapp,
        produtos_interesse: produtosInteresse,
        vendedor_id: data.vendedor_id && data.vendedor_id.trim() !== '' ? data.vendedor_id : null,
        segmento_cliente: data.segmento_cliente && data.segmento_cliente.trim() !== '' ? data.segmento_cliente : null,
      }
      
      // Remove form-only fields that don't exist in database
      delete cleanedData.ddd
      delete cleanedData.telefone
      delete cleanedData.documento_tipo
      delete cleanedData.documento_numero
      
      const result = await createCliente.mutateAsync(cleanedData as any)
      setIsCreateModalOpen(false)
      reset()
      
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
      // Combine DDD and telefone into whatsapp field
      const whatsapp = data.ddd && data.telefone ? `${data.ddd}${data.telefone}` : ''
      
      // Handle documento fields - map to cpf or cnpj based on tipo
      const documentoData: any = {}
      if (data.documento_tipo === 'cpf' && data.documento_numero) {
        documentoData.cpf = data.documento_numero
        documentoData.cnpj = null
      } else if (data.documento_tipo === 'cnpj' && data.documento_numero) {
        documentoData.cnpj = data.documento_numero
        documentoData.cpf = null
      }
      
      // Handle produtos_interesse - convert string to array
      const produtosInteresse = data.produtos_interesse 
        ? data.produtos_interesse.split(',').map(p => p.trim()).filter(p => p.length > 0)
        : null
      
      // Clean up empty string fields that should be null for UUID fields
      const cleanedData = {
        ...data,
        ...documentoData,
        whatsapp,
        produtos_interesse: produtosInteresse,
        vendedor_id: data.vendedor_id && data.vendedor_id.trim() !== '' ? data.vendedor_id : null,
        segmento_cliente: data.segmento_cliente && data.segmento_cliente.trim() !== '' ? data.segmento_cliente : null,
      }
      
      // Remove form-only fields that don't exist in database
      delete cleanedData.ddd
      delete cleanedData.telefone
      delete cleanedData.documento_tipo
      delete cleanedData.documento_numero
      
      await updateCliente.mutateAsync({
        id: selectedCliente.id,
        data: cleanedData
      })
      setIsEditModalOpen(false)
      setSelectedCliente(null)
      reset()
      
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
    setValue('nome_empresa', cliente.nome_empresa || '')
    setValue('razao_social', cliente.razao_social || '')
    setValue('cargo', cliente.cargo || '')
    setValue('email', cliente.email || '')
    
    // Set documento fields based on existing data
    if (cliente.cpf) {
      setValue('documento_tipo', 'cpf')
      setValue('documento_numero', cliente.cpf)
    } else if (cliente.cnpj) {
      setValue('documento_tipo', 'cnpj')
      setValue('documento_numero', cliente.cnpj)
    }
    setValue('inscricao_estadual', cliente.inscricao_estadual || '')
    
    // Parse WhatsApp to DDD and telefone
    const whatsapp = cliente.whatsapp || ''
    if (whatsapp) {
      // Extract DDD and phone from whatsapp format like "(11) 99999-9999" or "11999999999"
      const cleanPhone = whatsapp.replace(/\D/g, '')
      if (cleanPhone.length >= 10) {
        setValue('ddd', cleanPhone.substring(0, 2))
        setValue('telefone', cleanPhone.substring(2))
      }
    }
    setValue('telefone_empresa', cliente.telefone_empresa || '')
    setValue('endereco', cliente.endereco || '')
    setValue('numero', cliente.numero || '')
    setValue('cidade', cliente.cidade || '')
    setValue('estado', cliente.estado || '')
    setValue('cep', cliente.cep || '')
    setValue('segmento_cliente', cliente.segmento_cliente || '')
    setValue('etapa_pipeline', cliente.etapa_pipeline || 'novo')
    setValue('classificacao', cliente.classificacao || 'frio')
    setValue('origem', cliente.origem || 'manual')
    setValue('observacoes', cliente.observacoes || '')
    setValue('produtos_interesse', cliente.produtos_interesse ? cliente.produtos_interesse.join(', ') : '')
    setValue('contexto_cliente', cliente.contexto_cliente || '')
    setValue('dores_atuais', cliente.dores_atuais || '')
    setValue('motivacao', cliente.motivacao || '')
    setValue('expectativa', cliente.expectativa || '')
    setValue('vendedor_id', cliente.vendedor_id || '')
    
    setIsEditModalOpen(true)
  }

  const handleDeleteCliente = async () => {
    if (!selectedCliente) return
    try {
      await deleteCliente.mutateAsync(selectedCliente.id)
      setIsDeleteDialogOpen(false)
      setSelectedCliente(null)
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
            clientes={clientes as any[]}
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
                <div key={cliente.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 border-l-4 border-l-transparent hover:border-l-primary-500 transition-all duration-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-md">
                            <User className="w-6 h-6 text-white" />
                          </div>
                          <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                            cliente.etapa_pipeline === 'fechado' ? 'bg-green-500' :
                            cliente.etapa_pipeline === 'perdido' ? 'bg-red-500' :
                            cliente.etapa_pipeline === 'negociacao' ? 'bg-orange-500' :
                            'bg-blue-500'
                          }`}></div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{cliente.nome_contato}</h3>
                            {cliente.classificacao && (
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                cliente.classificacao === 'quente' ? 'bg-red-100 text-red-700' :
                                cliente.classificacao === 'morno' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-blue-100 text-blue-700'
                              }`}>
                                {cliente.classificacao}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">{cliente.nome_empresa || 'Empresa não informada'}</p>
                        </div>
                      </div>
                      
                      <div className="mt-4 space-y-2 sm:space-y-0 sm:grid sm:grid-cols-1 lg:grid-cols-3 sm:gap-4">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                          <span className="text-sm text-gray-600 dark:text-gray-300 truncate">{cliente.email || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                          <span className="text-sm text-gray-600 dark:text-gray-300 truncate">{cliente.whatsapp || 'N/A'}</span>
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

                        {/* Segmento e Origem */}
                        <div className="flex flex-wrap items-center gap-4">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              <span className="font-medium">Segmento:</span> {cliente.segmento_cliente || 'N/A'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              <span className="font-medium">Origem:</span> {cliente.origem || 'N/A'}
                            </span>
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
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader className="space-y-3 pb-6 border-b">
            <DialogTitle className="text-2xl font-bold text-gray-900">Adicionar Novo Cliente</DialogTitle>
            <DialogDescription className="text-base text-gray-600">
              Preencha as informações do cliente para adicioná-lo ao sistema. Campos marcados com <span className="text-red-500 font-semibold">*</span> são obrigatórios.
            </DialogDescription>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">i</span>
                </div>
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Dica:</p>
                  <p>Quanto mais informações você fornecer, melhor será o acompanhamento e relacionamento com o cliente.</p>
                </div>
              </div>
            </div>
          </DialogHeader>
          <form onSubmit={handleSubmit(handleCreateCliente)}>
            <div className="grid gap-4 py-4">
              {/* Seção: Informações Básicas */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                  <User className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Informações Básicas</h3>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome_contato" className="text-sm font-medium text-gray-700">
                      Nome do Contato <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="nome_contato"
                      {...register('nome_contato')}
                      placeholder="Ex: João Silva"
                      className={errors.nome_contato ? 'border-red-500' : ''}
                    />
                    <p className="text-xs text-gray-500">Nome da pessoa responsável pelo contato</p>
                    {errors.nome_contato && (
                      <p className="text-xs text-red-500 mt-1">{errors.nome_contato.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="nome_empresa" className="text-sm font-medium text-gray-700">
                      Nome da Empresa <span className="text-gray-400">(Opcional)</span>
                    </Label>
                    <Input 
                      id="nome_empresa" 
                      {...register('nome_empresa')} 
                      placeholder="Ex: Empresa ABC Ltda"
                    />
                    <p className="text-xs text-gray-500">Empresa onde o contato trabalha</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="razao_social" className="text-sm font-medium text-gray-700">
                      Razão Social <span className="text-gray-400">(Opcional)</span>
                    </Label>
                    <Input 
                      id="razao_social" 
                      {...register('razao_social')} 
                      placeholder="Ex: Empresa ABC Sociedade Limitada"
                    />
                    <p className="text-xs text-gray-500">Razão social oficial da empresa</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="cargo" className="text-sm font-medium text-gray-700">
                      Cargo <span className="text-gray-400">(Opcional)</span>
                    </Label>
                    <Input 
                      id="cargo" 
                      {...register('cargo')} 
                      placeholder="Ex: Gerente de Vendas"
                    />
                    <p className="text-xs text-gray-500">Cargo do contato na empresa</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="text-sm font-medium text-gray-700">
                    Documento <span className="text-gray-400">(Opcional)</span>
                  </Label>
                  
                  <div className="space-y-3">
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          value="cpf"
                          {...register('documento_tipo')}
                          className="text-primary-600"
                        />
                        <span className="text-sm text-gray-700">CPF</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          value="cnpj"
                          {...register('documento_tipo')}
                          className="text-primary-600"
                        />
                        <span className="text-sm text-gray-700">CNPJ</span>
                      </label>
                    </div>
                    
                    {watch('documento_tipo') && (
                      <Input
                        {...register('documento_numero')}
                        placeholder={
                          watch('documento_tipo') === 'cpf' 
                            ? "Ex: 123.456.789-00" 
                            : "Ex: 12.345.678/0001-90"
                        }
                      />
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    Selecione o tipo de documento e preencha o número
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="inscricao_estadual" className="text-sm font-medium text-gray-700">
                    Inscrição Estadual <span className="text-gray-400">(Opcional)</span>
                  </Label>
                  <Input 
                    id="inscricao_estadual" 
                    {...register('inscricao_estadual')} 
                    placeholder="Ex: 123.456.789.123"
                  />
                  <p className="text-xs text-gray-500">Inscrição estadual da empresa</p>
                </div>
              </div>

              {/* Seção: Contato */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                  <Mail className="h-5 w-5 text-green-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Informações de Contato</h3>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                      Email <span className="text-gray-400">(Opcional)</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      {...register('email')}
                      placeholder="Ex: joao@empresa.com"
                      className={errors.email ? 'border-red-500' : ''}
                    />
                    <p className="text-xs text-gray-500">Email principal para comunicação</p>
                    {errors.email && (
                      <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">
                      Telefone/WhatsApp <span className="text-gray-400">(Opcional)</span>
                    </Label>
                    <div className="grid grid-cols-3 gap-2">
                      <Input 
                        id="ddd" 
                        {...register('ddd')} 
                        placeholder="11"
                        maxLength={2}
                        className="text-center"
                      />
                      <Input 
                        id="telefone" 
                        {...register('telefone')} 
                        placeholder="99999-9999"
                        maxLength={9}
                        className="col-span-2"
                      />
                    </div>
                    <p className="text-xs text-gray-500">DDD + número do telefone (9 dígitos)</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefone_empresa" className="text-sm font-medium text-gray-700">
                    Telefone da Empresa <span className="text-gray-400">(Opcional)</span>
                  </Label>
                  <Input 
                    id="telefone_empresa" 
                    {...register('telefone_empresa')} 
                    placeholder="Ex: (11) 3333-4444"
                  />
                  <p className="text-xs text-gray-500">Telefone fixo da empresa</p>
                </div>
              </div>

              {/* Seção: Endereço */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                  <MapPin className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Informações de Endereço</h3>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="endereco" className="text-sm font-medium text-gray-700">
                    Endereço <span className="text-gray-400">(Opcional)</span>
                  </Label>
                  <Input 
                    id="endereco" 
                    {...register('endereco')} 
                    placeholder="Ex: Rua das Flores, 123"
                  />
                  <p className="text-xs text-gray-500">Endereço completo</p>
                </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="numero">Número</Label>
                  <Input id="numero" {...register('numero')} />
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


              <div>
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  {...register('observacoes')}
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="produtos_interesse">Produto de Interesse</Label>
                <Input
                  id="produtos_interesse"
                  {...register('produtos_interesse')}
                  placeholder="Ex: Software de gestão, Consultoria, Sistema de vendas"
                />
                <p className="text-xs text-gray-500 mt-1">Separe múltiplos produtos por vírgula</p>
              </div>

              <div>
                <Label htmlFor="contexto_cliente">Contexto do Cliente</Label>
                <Textarea
                  id="contexto_cliente"
                  {...register('contexto_cliente')}
                  placeholder="Resumo completo do cliente, histórico, preferências, etc..."
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="dores_atuais">Dores Atuais</Label>
                <Textarea
                  id="dores_atuais"
                  {...register('dores_atuais')}
                  placeholder="Principais problemas e dificuldades que o cliente enfrenta..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="motivacao">Motivação</Label>
                <Textarea
                  id="motivacao"
                  {...register('motivacao')}
                  placeholder="O que motiva o cliente a buscar uma solução..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="expectativa">Expectativa</Label>
                <Textarea
                  id="expectativa"
                  {...register('expectativa')}
                  placeholder="Expectativas e resultados esperados pelo cliente..."
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
                  <Input id="edit-razao_social" {...register('razao_social')} placeholder="Ex: Empresa ABC Sociedade Limitada" />
                </div>
                <div>
                  <Label htmlFor="edit-cargo">Cargo</Label>
                  <Input id="edit-cargo" {...register('cargo')} placeholder="Ex: Gerente de Vendas" />
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-sm font-medium text-gray-700">Documento</Label>
                
                <div className="space-y-3">
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        value="cpf"
                        {...register('documento_tipo')}
                        className="text-primary-600"
                      />
                      <span className="text-sm text-gray-700">CPF</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        value="cnpj"
                        {...register('documento_tipo')}
                        className="text-primary-600"
                      />
                      <span className="text-sm text-gray-700">CNPJ</span>
                    </label>
                  </div>
                  
                  {watch('documento_tipo') && (
                    <Input
                      {...register('documento_numero')}
                      placeholder={
                        watch('documento_tipo') === 'cpf' 
                          ? "Ex: 123.456.789-00" 
                          : "Ex: 12.345.678/0001-90"
                      }
                    />
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="edit-inscricao_estadual">Inscrição Estadual</Label>
                <Input id="edit-inscricao_estadual" {...register('inscricao_estadual')} placeholder="Ex: 123.456.789.123" />
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                <div>
                  <Label>Telefone/WhatsApp</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <Input 
                      id="edit-ddd" 
                      {...register('ddd')} 
                      placeholder="11"
                      maxLength={2}
                      className="text-center"
                    />
                    <Input 
                      id="edit-telefone" 
                      {...register('telefone')} 
                      placeholder="99999-9999"
                      maxLength={9}
                      className="col-span-2"
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="edit-telefone_empresa">Telefone da Empresa</Label>
                <Input id="edit-telefone_empresa" {...register('telefone_empresa')} placeholder="Ex: (11) 3333-4444" />
              </div>

              <div>
                <Label htmlFor="edit-endereco">Endereço</Label>
                <Input id="edit-endereco" {...register('endereco')} placeholder="Ex: Rua das Flores, 123" />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="edit-numero">Número</Label>
                  <Input id="edit-numero" {...register('numero')} />
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

              <div>
                <Label htmlFor="edit-cep">CEP</Label>
                <Input id="edit-cep" {...register('cep')} />
              </div>

              <div>
                <Label htmlFor="edit-observacoes">Observações</Label>
                <Textarea id="edit-observacoes" {...register('observacoes')} rows={3} />
              </div>

              <div>
                <Label htmlFor="edit-produtos_interesse">Produto de Interesse</Label>
                <Input id="edit-produtos_interesse" {...register('produtos_interesse')} placeholder="Ex: Software de gestão, Consultoria" />
              </div>

              <div>
                <Label htmlFor="edit-contexto_cliente">Contexto do Cliente</Label>
                <Textarea id="edit-contexto_cliente" {...register('contexto_cliente')} rows={4} />
              </div>

              <div>
                <Label htmlFor="edit-dores_atuais">Dores Atuais</Label>
                <Textarea id="edit-dores_atuais" {...register('dores_atuais')} rows={3} />
              </div>

              <div>
                <Label htmlFor="edit-motivacao">Motivação</Label>
                <Textarea id="edit-motivacao" {...register('motivacao')} rows={3} />
              </div>

              <div>
                <Label htmlFor="edit-expectativa">Expectativa</Label>
                <Textarea id="edit-expectativa" {...register('expectativa')} rows={3} />
              </div>

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
                    value={form.watch('etapa_pipeline')}
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
                    value={form.watch('classificacao')}
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
                    value={form.watch('origem')}
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


              <div>
                <Label htmlFor="edit-observacoes">Observações</Label>
                <Textarea
                  id="edit-observacoes"
                  {...register('observacoes')}
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="edit-contexto_cliente">Contexto do Cliente</Label>
                <Textarea
                  id="edit-contexto_cliente"
                  {...register('contexto_cliente')}
                  placeholder="Resumo completo do cliente, histórico, preferências, etc..."
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="edit-dores_atuais">Dores Atuais</Label>
                <Textarea
                  id="edit-dores_atuais"
                  {...register('dores_atuais')}
                  placeholder="Principais problemas e dificuldades que o cliente enfrenta..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="edit-motivacao">Motivação</Label>
                <Textarea
                  id="edit-motivacao"
                  {...register('motivacao')}
                  placeholder="O que motiva o cliente a buscar uma solução..."
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
                      { key: 'nome_empresa', label: 'Nome da Empresa', value: cliente.nome_empresa },
                      { key: 'segmento_cliente', label: 'Segmento', value: cliente.segmento_cliente },
                      { key: 'endereco', label: 'Endereço', value: cliente.endereco },
                      { key: 'cidade', label: 'Cidade', value: cliente.cidade },
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
                    
                    {selectedCliente.nome_empresa && (
                      <div className="flex items-center gap-3">
                        <Building className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Nome da Empresa</p>
                          <p className="font-medium">{selectedCliente.nome_empresa}</p>
                        </div>
                      </div>
                    )}
                    
                    {selectedCliente.razao_social && (
                      <div className="flex items-center gap-3">
                        <Building className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Razão Social</p>
                          <p className="font-medium">{selectedCliente.razao_social}</p>
                        </div>
                      </div>
                    )}
                    
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
                        <p className="text-sm text-gray-500">WhatsApp</p>
                        <p className="font-medium">{selectedCliente.whatsapp || 'N/A'}</p>
                      </div>
                    </div>
                    
                    {selectedCliente.razao_social && (
                      <div className="flex items-center gap-3">
                        <Building className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Razão Social</p>
                          <p className="font-medium">{selectedCliente.razao_social}</p>
                        </div>
                      </div>
                    )}
                    
                    {selectedCliente.cpf && (
                      <div className="flex items-center gap-3">
                        <User className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">CPF</p>
                          <p className="font-medium">{selectedCliente.cpf}</p>
                        </div>
                      </div>
                    )}
                    
                    {selectedCliente.cnpj && (
                      <div className="flex items-center gap-3">
                        <Building className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">CNPJ</p>
                          <p className="font-medium">{selectedCliente.cnpj}</p>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-3">
                      <MapPin className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Localização</p>
                        <p className="font-medium">
                          {[selectedCliente.cidade, selectedCliente.estado].filter(Boolean).join(', ') || 'N/A'}
                        </p>
                      </div>
                    </div>
                    
                    {/* Vendedor Responsável */}
                    <div className="flex items-center gap-3">
                      <User className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Vendedor Responsável</p>
                        <p className="font-medium">
                          {(() => {
                            if (!selectedCliente.vendedor_id) return 'Não atribuído'
                            const vendedor = _vendedores.find(v => v.id === selectedCliente.vendedor_id)
                            return vendedor?.nome || 'Vendedor não encontrado'
                          })()} 
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Informações Comerciais</h3>
                  
                  <div className="space-y-3">
                    
                    
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

              {/* Contexto do Cliente */}
              {selectedCliente.contexto_cliente && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Contexto do Cliente</h3>
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-sm text-blue-900 dark:text-blue-100 whitespace-pre-wrap">{selectedCliente.contexto_cliente}</p>
                  </div>
                </div>
              )}

              {/* Dores Atuais */}
              {selectedCliente.dores_atuais && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Dores Atuais</h3>
                  <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                    <p className="text-sm text-red-900 dark:text-red-100 whitespace-pre-wrap">{selectedCliente.dores_atuais}</p>
                  </div>
                </div>
              )}

              {/* Motivação */}
              {selectedCliente.motivacao && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Motivação</h3>
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                    <p className="text-sm text-green-900 dark:text-green-100 whitespace-pre-wrap">{selectedCliente.motivacao}</p>
                  </div>
                </div>
              )}

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
