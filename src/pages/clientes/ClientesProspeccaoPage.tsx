import { useState, useEffect } from 'react'
import {
  Plus,
  Search,
  Mail,
  Building,
  User,
  Users,
  Loader2, 
  MapPin,
  Edit,
  Eye,
  Trash2,
  Phone,
  Bot,
  Globe,
  UserPlus,
  Plug,
  FileText,
  X,
  Tag,
  TrendingUp,
  Target
} from 'lucide-react'
import ClienteTimeline from '@/components/cliente/ClienteTimeline'
import AcaoModal from '@/components/cliente/AcaoModal'
import type { ClienteAcao } from '@/types/cliente-acao'
import { useClientes, useCreateCliente, useUpdateCliente, useDeleteCliente, useUpdatePipelineStage } from '@/hooks/useClientes'
import { usePropostas } from '@/hooks/usePropostas'
import { useVendedores } from '@/hooks/useVendedores'
import { useIsAdmin, useCurrentVendedorId } from '@/hooks/useAuth'
import { useIAConfig } from '@/hooks/useIAConfig'
import { VendedorSelector } from '@/components/VendedorSelector'
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
import { Badge } from '@/components/ui/badge'

// Opções de tags disponíveis
const TAGS_DISPONIVEIS = ['Atacado', 'Varejo', 'Pallet', 'Carga'] as const

// Cores para cada tag
const TAG_COLORS: Record<string, string> = {
  'Atacado': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  'Varejo': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  'Pallet': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  'Carga': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
}

// Validation schema - aligned with database structure
const clienteSchema = z.object({
  // Todos os campos são opcionais para permitir edição parcial
  nome_contato: z.string().nullable().optional().or(z.literal('')),
  ddd: z.string().nullable().optional().or(z.literal('')),
  telefone: z.string().nullable().optional().or(z.literal('')),
  
  // CAMPOS OPCIONAIS - Informações básicas
  email: z.string().nullable().optional().or(z.literal('')).refine(
    (val) => !val || val === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
    { message: 'Email deve ter um formato válido' }
  ),
  nome_empresa: z.string().nullable().optional().or(z.literal('')),
  segmento_cliente: z.string().nullable().optional().or(z.literal('')),
  razao_social: z.string().nullable().optional().or(z.literal('')),
  cargo: z.string().nullable().optional().or(z.literal('')),
  inscricao_estadual: z.string().nullable().optional().or(z.literal('')),
  
  // CAMPOS OPCIONAIS - Documentos (COMPLETAMENTE OPCIONAIS)
  documento_tipo: z.enum(['cpf', 'cnpj']).optional().nullable(),
  documento_numero: z.string().nullable().optional().or(z.literal('')),
  telefone_empresa: z.string().nullable().optional().or(z.literal('')),
  
  // CAMPOS OPCIONAIS - Endereço
  endereco: z.string().nullable().optional().or(z.literal('')),
  numero: z.string().nullable().optional().or(z.literal('')),
  cidade: z.string().nullable().optional().or(z.literal('')),
  estado: z.string().nullable().optional().or(z.literal('')),
  cep: z.string().nullable().optional().or(z.literal('')),
  
  // CAMPOS OPCIONAIS - Pipeline e negócio
  etapa_pipeline: z.string().default('novo'),
  classificacao: z.string().default('frio'),
  origem: z.string().default('manual'),
  vendedor_id: z.string().nullable().optional().or(z.literal('')),
  
  // CAMPOS OPCIONAIS - Observações e contexto
  observacoes: z.string().nullable().optional().or(z.literal('')),
  produtos_interesse: z.string().nullable().optional().or(z.literal('')),
  volume_mensal: z.string().nullable().optional().or(z.literal('')),
  analise_cliente: z.string().nullable().optional().or(z.literal('')),
  dores_atuais: z.string().nullable().optional().or(z.literal('')),
  motivacao: z.string().nullable().optional().or(z.literal('')),
  expectativa: z.string().nullable().optional().or(z.literal('')),
  
  // Tags/Marcadores
  tags: z.array(z.string()).optional().nullable(),
})

type ClienteFormData = z.infer<typeof clienteSchema>

export function ClientesProspeccaoPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedCliente, setSelectedCliente] = useState<any>(null)
  const [page, setPage] = useState(1)
  const [limit] = useState(50) // 50 clientes por página
  const [selectedTags, setSelectedTags] = useState<string[]>([]) // Tags para criação/edição
  const [isPropostaModalOpen, setIsPropostaModalOpen] = useState(false)
  const [selectedProposta, setSelectedProposta] = useState<any>(null)
  const [isAcaoModalOpen, setIsAcaoModalOpen] = useState(false)
  const [selectedAcao, setSelectedAcao] = useState<ClienteAcao | null>(null)

  // Load clients with pagination - ONLY Prospecção
  const { data: clientes = [], count: totalClientesFiltered = 0, isLoading } = useClientes({ 
    page, 
    limit,
    origem: 'Prospecção'
  })
  
  // Total geral de clientes de prospecção
  const { data: allClientes = [], count: totalClientes = 0 } = useClientes({ 
    page: 1, 
    limit: 1,
    origem: 'Prospecção'
  })
  const { data: _vendedores = [] } = useVendedores()
  const createCliente = useCreateCliente()
  const updateCliente = useUpdateCliente()
  const deleteCliente = useDeleteCliente()
  const updatePipelineStage = useUpdatePipelineStage()
  const { addNotification: _addNotification } = useNotifications()
  const { data: iaConfigData } = useIAConfig()
  
  // Buscar propostas do cliente selecionado
  const { data: propostasCliente = [] } = usePropostas({ 
    cliente_id: selectedCliente?.id 
  })
  
  // Role-based access control
  const isAdmin = useIsAdmin()
  const currentVendedorId = useCurrentVendedorId()

  // React Hook Form
  const form = useForm<ClienteFormData>({
    resolver: zodResolver(clienteSchema),
    mode: 'onSubmit',
    defaultValues: {
      etapa_pipeline: 'novo',
      classificacao: 'frio',
      origem: 'manual'
    }
  })
  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = form
  
  // Log de erros de validação
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      console.log('❌ [Form] Erros de validação:', errors)
    }
  }, [errors])

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
    { value: 'site', label: 'Site' },
    { value: 'IA', label: 'IA' },
    { value: 'integracao', label: 'Integração' },
  ]

  // Helper function to format origem for display
  const formatOrigem = (origem: string) => {
    if (origem === 'integracao') return 'Integração'
    if (origem === 'IA') return 'IA'
    if (origem === 'site') return 'Site'
    if (origem === 'manual') return 'Manual'
    return origem
  }

  // Filtro de busca local (apenas para busca instantânea, stage filter é no backend)
  // IMPORTANTE: Esta página mostra APENAS clientes de Prospecção
  const filteredClientes = searchTerm 
    ? clientes.filter((cliente: any) => {
          const searchLower = searchTerm.toLowerCase()
          const searchNumbers = searchTerm.replace(/\D/g, '')
          
          const matchesName = (cliente.nome_contato || '').toLowerCase().includes(searchLower)
          const matchesCompany = (cliente.nome_empresa || '').toLowerCase().includes(searchLower)
          const matchesEmail = (cliente.email || '').toLowerCase().includes(searchLower)
          const matchesPhone = searchNumbers ? (cliente.whatsapp || '').replace(/\D/g, '').includes(searchNumbers) : false
          const matchesPhoneCompany = searchNumbers ? (cliente.telefone_empresa || '').replace(/\D/g, '').includes(searchNumbers) : false
          const matchesCPF = searchNumbers ? (cliente.cpf || '').replace(/\D/g, '').includes(searchNumbers) : false
          const matchesCNPJ = searchNumbers ? (cliente.cnpj || '').replace(/\D/g, '').includes(searchNumbers) : false
          
          // Busca por tags
          const matchesTags = cliente.tags && Array.isArray(cliente.tags)
            ? cliente.tags.some((tag: string) => tag.toLowerCase().includes(searchLower))
            : false
          
          return matchesName || matchesCompany || matchesEmail || matchesPhone || matchesPhoneCompany || matchesCPF || matchesCNPJ || matchesTags
        })
    : clientes // Já filtrado por origem='Prospecção' no hook

  // Pagination info (usa totalClientesFiltered para a categoria selecionada)
  const totalPages = Math.ceil(totalClientesFiltered / limit)
  const hasMore = page < totalPages
  const showingFrom = (page - 1) * limit + 1
  const showingTo = Math.min(page * limit, totalClientesFiltered)

  // Reset page when filters change
  useEffect(() => {
    setPage(1)
  }, [searchTerm])

  const handleLoadMore = () => {
    setPage(prev => prev + 1)
  }

  // Update form when editing a client
  useEffect(() => {
    if (isEditModalOpen && selectedCliente) {
      // Reset form with client data
      reset({
        ...selectedCliente,
        ddd: selectedCliente.whatsapp ? selectedCliente.whatsapp.replace(/\D/g, '').substring(0, 2) : '',
        telefone: selectedCliente.whatsapp ? selectedCliente.whatsapp.replace(/\D/g, '').substring(2) : '',
        produtos_interesse: Array.isArray(selectedCliente.produtos_interesse) 
          ? selectedCliente.produtos_interesse.join(', ') 
          : (selectedCliente.produtos_interesse || ''),
        analise_cliente: selectedCliente.analise_cliente || '',
        origem: selectedCliente.origem || 'manual',
        etapa_pipeline: selectedCliente.etapa_pipeline || 'novo',
        classificacao: selectedCliente.classificacao || 'frio'
      })
    }
  }, [isEditModalOpen, selectedCliente, reset])

  // CRUD handlers
  const { createDatabaseNotification } = useNotifications()

  const handleCreateCliente = async (data: ClienteFormData) => {
    try {
      // Preparar dados para o banco de dados
      const clienteData: any = {
        // Campos obrigatórios - validação já feita pelo Zod
        nome_contato: data.nome_contato,
        email: data.email,
        nome_empresa: data.nome_empresa,
        segmento_cliente: data.segmento_cliente,
        
        // Campos opcionais básicos
        razao_social: data.razao_social || null,
        cargo: data.cargo || null,
        inscricao_estadual: data.inscricao_estadual || null,
        
        // Telefones - IMPORTANTE: telefone do formulário vai para whatsapp no banco formatado
        whatsapp: data.ddd && data.telefone ? `(${data.ddd}) ${data.telefone.length === 9 ? data.telefone.replace(/(\d{5})(\d{4})/, '$1-$2') : data.telefone.replace(/(\d{4})(\d{4})/, '$1-$2')}` : null,
        telefone_empresa: data.telefone_empresa || null,
        
        // Endereço
        endereco: data.endereco || null,
        numero: data.numero || null,
        cidade: data.cidade || null,
        estado: data.estado || null,
        cep: data.cep || null,
        
        // Documentos - CPF ou CNPJ baseado no tipo selecionado
        cpf: data.documento_tipo === 'cpf' ? data.documento_numero : null,
        cnpj: data.documento_tipo === 'cnpj' ? data.documento_numero : null,
        
        // Pipeline e classificação
        etapa_pipeline: data.etapa_pipeline,
        classificacao: data.classificacao,
        origem: data.origem,
        
        // Campos de negócio
        vendedor_id: data.vendedor_id || null,
        
        // Observações e contexto
        observacoes: data.observacoes || null,
        produtos_interesse: data.produtos_interesse 
          ? data.produtos_interesse.split(',').map(p => p.trim()).filter(p => p.length > 0)
          : null,
        volume_mensal: data.volume_mensal || null,
        analise_cliente: data.analise_cliente || null,
        dores_atuais: data.dores_atuais || null,
        motivacao: data.motivacao || null,
        expectativa: data.expectativa || null,
        
        // Tags/Marcadores
        tags: selectedTags.length > 0 ? selectedTags : null,
      }

      console.log('📤 Enviando dados para criação:', clienteData)
      
      const result = await createCliente.mutateAsync(clienteData)
      
      setIsCreateModalOpen(false)
      reset()
      setSelectedTags([]) // Limpar tags
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
      console.error('❌ Erro ao criar cliente:', error)
      toast.error('Erro ao criar cliente')
    }
  }

  const handleUpdateCliente = async (data: ClienteFormData) => {
    console.log('🟡 [Cliente] handleUpdateCliente chamado', { data, selectedCliente })
    
    if (!selectedCliente) {
      console.error('❌ [Cliente] selectedCliente não encontrado')
      return
    }
    
    try {
      // Preparar dados para atualização no banco de dados
      const clienteData: any = {
        // Campos obrigatórios
        nome_contato: data.nome_contato,
        email: data.email || '',
        nome_empresa: data.nome_empresa || '',
        
        // Campos opcionais básicos
        razao_social: data.razao_social || null,
        cargo: data.cargo || null,
        inscricao_estadual: data.inscricao_estadual || null,
        
        // Telefones - IMPORTANTE: telefone do formulário vai para whatsapp no banco formatado
        whatsapp: data.ddd && data.telefone ? `(${data.ddd}) ${data.telefone.length === 9 ? data.telefone.replace(/(\d{5})(\d{4})/, '$1-$2') : data.telefone.replace(/(\d{4})(\d{4})/, '$1-$2')}` : null,
        telefone_empresa: data.telefone_empresa || null,
        
        // Endereço
        endereco: data.endereco || null,
        numero: data.numero || null,
        cidade: data.cidade || null,
        estado: data.estado || null,
        cep: data.cep || null,
        
        // Documentos - CPF ou CNPJ baseado no tipo selecionado
        cpf: data.documento_tipo === 'cpf' ? data.documento_numero : null,
        cnpj: data.documento_tipo === 'cnpj' ? data.documento_numero : null,
        
        // Pipeline e classificação
        etapa_pipeline: data.etapa_pipeline || 'novo',
        classificacao: data.classificacao || 'frio',
        origem: data.origem || 'manual',
        
        // Campos de negócio
        segmento_cliente: data.segmento_cliente || null,
        vendedor_id: data.vendedor_id || null,
        
        // Observações e contexto
        observacoes: data.observacoes || null,
        produtos_interesse: data.produtos_interesse 
          ? data.produtos_interesse.split(',').map(p => p.trim()).filter(p => p.length > 0)
          : null,
        volume_mensal: data.volume_mensal || null,
        analise_cliente: data.analise_cliente || null,
        dores_atuais: data.dores_atuais || null,
        motivacao: data.motivacao || null,
        expectativa: data.expectativa || null,
        
        // Tags/Marcadores
        tags: selectedTags.length > 0 ? selectedTags : null,
      }

      console.log('🔵 [Cliente] Iniciando atualização...', { id: selectedCliente.id, clienteData })
      
      await updateCliente.mutateAsync({
        id: selectedCliente.id,
        data: clienteData
      })
      
      console.log('✅ [Cliente] Atualização bem-sucedida')
      
      setIsEditModalOpen(false)
      setSelectedCliente(null)
      reset()
      setSelectedTags([]) // Limpar tags
      
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
      console.error('❌ [Cliente] Erro ao atualizar:', error)
      toast.error(`Erro ao atualizar cliente: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    }
  }

  const handleViewCliente = (cliente: any) => {
    setSelectedCliente(cliente)
    setIsDetailModalOpen(true)
  }

  const openDeleteDialog = (cliente: any) => {
    setSelectedCliente(cliente)
    setIsDeleteDialogOpen(true)
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
    setValue('produtos_interesse', Array.isArray(cliente.produtos_interesse) ? cliente.produtos_interesse.join(', ') : (cliente.produtos_interesse || ''))
    setValue('volume_mensal', cliente.volume_mensal || '')
    setValue('analise_cliente', cliente.analise_cliente || '')
    setValue('dores_atuais', cliente.dores_atuais || '')
    setValue('motivacao', cliente.motivacao || '')
    setValue('expectativa', cliente.expectativa || '')
    setValue('vendedor_id', cliente.vendedor_id || '')
    
    // Carregar tags
    setSelectedTags(cliente.tags || [])
    
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
    <div className="w-full h-full space-y-6 transition-all duration-300 ease-in-out">
      {/* Products List with smooth transition */}
      <div className="w-full space-y-6 transition-all duration-300 ease-in-out">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Target className="h-7 w-7 text-red-600" />
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Clientes de Prospecção</h1>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mt-1 transition-colors duration-300 ease-in-out">
              Clientes gerados através do sistema de prospecção automatizada
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="mt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Buscar por nome, empresa, telefone, email, CPF, CNPJ ou tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            />
          </div>
        </div>
      </div>

      {/* Lista de Clientes */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Clientes de Prospecção ({totalClientes})
            </h2>
          </div>

          {filteredClientes.length === 0 ? (
            <div className="text-center py-12">
              <User className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Nenhum cliente de prospecção encontrado</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Aguarde a prospecção automatizada adicionar novos clientes.
              </p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-gray-200 dark:divide-gray-700 discrete-scroll max-h-[600px] overflow-y-auto">
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
                            {cliente.origem === 'IA' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-semibold">
                                <Bot className="h-3.5 w-3.5" />
                                IA
                              </span>
                            )}
                            {cliente.origem === 'site' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
                                <Globe className="h-3.5 w-3.5" />
                                Site
                              </span>
                            )}
                            {cliente.origem === 'manual' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-semibold">
                                <UserPlus className="h-3.5 w-3.5" />
                                Manual
                              </span>
                            )}
                            {cliente.origem === 'integracao' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-semibold">
                                <Plug className="h-3.5 w-3.5" />
                                Integração
                              </span>
                            )}
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
                            <span className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-1">
                              <span className="font-medium">Origem:</span>
                              {cliente.origem === 'IA' ? (
                                <span className="inline-flex items-center gap-1 text-purple-700 font-semibold">
                                  <Bot className="h-3.5 w-3.5" />
                                  IA
                                </span>
                              ) : cliente.origem === 'site' ? (
                                <span className="inline-flex items-center gap-1 text-blue-700 font-semibold">
                                  <Globe className="h-3.5 w-3.5" />
                                  Site
                                </span>
                              ) : cliente.origem === 'manual' ? (
                                <span className="inline-flex items-center gap-1 text-gray-700 font-semibold">
                                  <UserPlus className="h-3.5 w-3.5" />
                                  Manual
                                </span>
                              ) : cliente.origem === 'integracao' ? (
                                <span className="inline-flex items-center gap-1 text-orange-700 font-semibold">
                                  <Plug className="h-3.5 w-3.5" />
                                  Integração
                                </span>
                              ) : (
                                formatOrigem(cliente.origem) || 'N/A'
                              )}
                            </span>
                          </div>
                        </div>
                        
                        {/* Tags/Marcadores */}
                        {cliente.tags && cliente.tags.length > 0 && (
                          <div className="flex items-center gap-2">
                            <Tag className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                            <div className="flex flex-wrap gap-1.5">
                              {cliente.tags.map((tag: string, index: number) => (
                                <Badge 
                                  key={index}
                                  className={`text-xs ${TAG_COLORS[tag] || 'bg-gray-100 text-gray-800'}`}
                                >
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

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
                            <button
                              onClick={() => openEditModal(cliente)}
                              className="p-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-600 rounded"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => openDeleteDialog(cliente)}
                              className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-600 rounded"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              </div>
              
              {/* Pagination Info and Load More Button */}
              <div className="p-6 border-t border-gray-200 dark:border-gray-700">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Mostrando <span className="font-semibold">{showingFrom}</span> a <span className="font-semibold">{showingTo}</span> de <span className="font-semibold">{totalClientesFiltered}</span> clientes de prospecção
                  </div>
                  {hasMore && (
                    <Button
                      variant="outline"
                      onClick={handleLoadMore}
                      className="w-full sm:w-auto"
                      disabled={isLoading}
                    >
                      {isLoading ? 'Carregando...' : `Carregar mais (${totalClientesFiltered - showingTo} restantes)`}
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

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
                      className={errors.nome_empresa ? 'border-red-500' : ''}
                    />
                    <p className="text-xs text-gray-500">Empresa onde o contato trabalha</p>
                    {errors.nome_empresa && (
                      <p className="text-xs text-red-500 mt-1">{errors.nome_empresa.message}</p>
                    )}
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
                      WhatsApp <span className="text-red-500">*</span>
                    </Label>
                    <div className="grid grid-cols-3 gap-2">
                      <Input 
                        id="ddd" 
                        {...register('ddd')} 
                        placeholder="11"
                        maxLength={2}
                        className={`text-center ${errors.ddd ? 'border-red-500' : ''}`}
                      />
                      <Input 
                        id="telefone" 
                        {...register('telefone')} 
                        placeholder="99999-9999"
                        maxLength={9}
                        className={`col-span-2 ${errors.telefone ? 'border-red-500' : ''}`}
                      />
                    </div>
                    <p className="text-xs text-gray-500">DDD + número do WhatsApp (9 dígitos)</p>
                    {(errors.ddd || errors.telefone) && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.ddd?.message || errors.telefone?.message}
                      </p>
                    )}
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
                  <Label htmlFor="segmento_cliente" className="text-sm font-medium text-gray-700">
                    Segmento <span className="text-red-500">*</span>
                  </Label>
                  <Input 
                    id="segmento_cliente" 
                    {...register('segmento_cliente')} 
                    placeholder="Ex: Tecnologia, Varejo, Saúde"
                    className={errors.segmento_cliente ? 'border-red-500' : ''}
                  />
                  {errors.segmento_cliente && (
                    <p className="text-xs text-red-500 mt-1">{errors.segmento_cliente.message}</p>
                  )}
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
              
              {/* Tags/Marcadores */}
              <div>
                <Label htmlFor="tags" className="flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Tags/Marcadores
                </Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {TAGS_DISPONIVEIS.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => {
                        setSelectedTags(prev => 
                          prev.includes(tag) 
                            ? prev.filter(t => t !== tag)
                            : [...prev, tag]
                        )
                      }}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                        selectedTags.includes(tag)
                          ? TAG_COLORS[tag] + ' ring-2 ring-offset-1 ring-current'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
                      }`}
                    >
                      {selectedTags.includes(tag) && <span className="mr-1">✓</span>}
                      {tag}
                    </button>
                  ))}
                </div>
                {selectedTags.length > 0 && (
                  <p className="text-xs text-gray-500 mt-2">
                    Selecionadas: {selectedTags.join(', ')}
                  </p>
                )}
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
                <Label htmlFor="volume_mensal">Volume Mensal</Label>
                <Input
                  id="volume_mensal"
                  {...register('volume_mensal')}
                  placeholder="Ex: 1000 unidades, 500kg, 10 toneladas"
                />
                <p className="text-xs text-gray-500 mt-1">Informe o volume mensal estimado (pode ser em números ou texto)</p>
              </div>

              <div>
                <Label htmlFor="analise_cliente">Análise do Cliente</Label>
                <Textarea
                  id="analise_cliente"
                  {...register('analise_cliente')}
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
                  <Label htmlFor="edit-nome_contato">Nome do Contato</Label>
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
                  <Label htmlFor="edit-nome_empresa">Nome da Empresa <span className="text-gray-400">(Opcional)</span></Label>
                  <Input 
                    id="edit-nome_empresa" 
                    {...register('nome_empresa')} 
                    className={errors.nome_empresa ? 'border-red-500' : ''}
                  />
                  {errors.nome_empresa && (
                    <p className="text-xs text-red-500 mt-1">{errors.nome_empresa.message}</p>
                  )}
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
                  <Label htmlFor="edit-email">Email <span className="text-gray-400">(Opcional)</span></Label>
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
                  <Label>WhatsApp</Label>
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
                <Input id="edit-endereco" {...register('endereco')} />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="edit-numero">Número</Label>
                  <Input id="edit-numero" {...register('numero')} />
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
                  <Input 
                    id="edit-segmento_cliente" 
                    {...register('segmento_cliente')} 
                    className={errors.segmento_cliente ? 'border-red-500' : ''}
                  />
                  {errors.segmento_cliente && (
                    <p className="text-xs text-red-500 mt-1">{errors.segmento_cliente.message}</p>
                  )}
                </div>
              </div>

              <VendedorSelector
                value={form.watch('vendedor_id')}
                onValueChange={(value) => setValue('vendedor_id', value)}
                required={false}
              />


              <div>
                <Label htmlFor="edit-observacoes">Observações</Label>
                <Textarea
                  id="edit-observacoes"
                  {...register('observacoes')}
                  rows={3}
                />
              </div>
              
              {/* Tags/Marcadores */}
              <div>
                <Label htmlFor="edit-tags" className="flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Tags/Marcadores
                </Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {TAGS_DISPONIVEIS.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => {
                        setSelectedTags(prev => 
                          prev.includes(tag) 
                            ? prev.filter(t => t !== tag)
                            : [...prev, tag]
                        )
                      }}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                        selectedTags.includes(tag)
                          ? TAG_COLORS[tag] + ' ring-2 ring-offset-1 ring-current'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
                      }`}
                    >
                      {selectedTags.includes(tag) && <span className="mr-1">✓</span>}
                      {tag}
                    </button>
                  ))}
                </div>
                {selectedTags.length > 0 && (
                  <p className="text-xs text-gray-500 mt-2">
                    Selecionadas: {selectedTags.join(', ')}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="edit-produtos_interesse">Produto de Interesse</Label>
                <Input id="edit-produtos_interesse" {...register('produtos_interesse')} placeholder="Ex: Software de gestão, Consultoria" />
              </div>

              <div>
                <Label htmlFor="edit-volume_mensal">Volume Mensal</Label>
                <Input id="edit-volume_mensal" {...register('volume_mensal')} placeholder="Ex: 1000 unidades, 500kg, 10 toneladas" />
                <p className="text-xs text-gray-500 mt-1">Informe o volume mensal estimado</p>
              </div>

              <div>
                <Label htmlFor="edit-analise_cliente">Análise do Cliente</Label>
                <Textarea
                  id="edit-analise_cliente"
                  {...register('analise_cliente')}
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

              <div>
                <Label htmlFor="edit-expectativa">Expectativa</Label>
                <Textarea
                  id="edit-expectativa"
                  {...register('expectativa')}
                  placeholder="Expectativas e resultados esperados pelo cliente..."
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
                    const regrasQualificacao = iaConfigData?.regras_qualificacao
                    
                    // Campos obrigatórios (sempre presentes)
                    const requiredFields = [
                      { key: 'nome_contato', label: 'Nome do Contato', value: cliente.nome_contato },
                      { key: 'whatsapp', label: 'WhatsApp', value: cliente.whatsapp },
                      { key: 'produtos_interesse', label: 'Produto de Interesse', value: cliente.produtos_interesse },
                      { key: 'motivacao', label: 'Motivação', value: cliente.motivacao },
                      { key: 'expectativa', label: 'Expectativa', value: cliente.expectativa },
                      { key: 'analise_cliente', label: 'Análise do Cliente', value: cliente.analise_cliente },
                    ]
                    
                    // Adicionar campos opcionais baseados nas regras de qualificação
                    if (regrasQualificacao?.nome_empresa) {
                      requiredFields.push({ key: 'nome_empresa', label: 'Nome da Empresa', value: cliente.nome_empresa })
                    }
                    
                    // CPF/CNPJ como campo único se pelo menos um estiver ativo
                    if (regrasQualificacao?.cpf || regrasQualificacao?.cnpj) {
                      requiredFields.push({ 
                        key: 'documento', 
                        label: 'CPF/CNPJ', 
                        value: cliente.cpf || cliente.cnpj 
                      })
                    }
                    
                    if (regrasQualificacao?.email) {
                      requiredFields.push({ key: 'email', label: 'E-mail', value: cliente.email })
                    }
                    
                    if (regrasQualificacao?.segmento) {
                      requiredFields.push({ key: 'segmento_cliente', label: 'Segmento', value: cliente.segmento_cliente })
                    }
                    
                    if (regrasQualificacao?.endereco?.ativo) {
                      const enderecoFields = []
                      if (regrasQualificacao.endereco.rua) enderecoFields.push(cliente.endereco)
                      if (regrasQualificacao.endereco.numero) enderecoFields.push(cliente.numero)
                      if (regrasQualificacao.endereco.cidade) enderecoFields.push(cliente.cidade)
                      if (regrasQualificacao.endereco.cep) enderecoFields.push(cliente.cep)
                      
                      const enderecoValue = enderecoFields.filter(Boolean).join(', ')
                      requiredFields.push({ key: 'endereco_completo', label: 'Endereço', value: enderecoValue })
                    }
                    
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

              {/* Tags/Marcadores */}
              {selectedCliente.tags && selectedCliente.tags.length > 0 && (
                <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/20 dark:to-slate-800/20 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                    <Tag className="h-5 w-5" />
                    Tags/Marcadores
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedCliente.tags.map((tag: string, index: number) => (
                      <Badge 
                        key={index}
                        className={TAG_COLORS[tag] || 'bg-gray-100 text-gray-800'}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Layout com Informações Básicas e Comerciais */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Informações Básicas */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-6 rounded-xl border border-blue-200 dark:border-blue-700 shadow-sm">
                  <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4 flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Informações Básicas
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <User className="h-4 w-4 text-blue-600" />
                      <div>
                        <p className="text-sm text-blue-600 dark:text-blue-300">Nome do Contato</p>
                        <p className="font-medium text-blue-800 dark:text-blue-200">{selectedCliente.nome_contato || 'N/A'}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-blue-600" />
                      <div>
                        <p className="text-sm text-blue-600 dark:text-blue-300">Email</p>
                        <p className="font-medium text-blue-800 dark:text-blue-200">{selectedCliente.email || 'N/A'}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-blue-600" />
                      <div>
                        <p className="text-sm text-blue-600 dark:text-blue-300">WhatsApp</p>
                        <p className="font-medium text-blue-800 dark:text-blue-200">{selectedCliente.whatsapp || 'N/A'}</p>
                      </div>
                    </div>
                    
                    {selectedCliente.telefone_empresa && (
                      <div className="flex items-center gap-3">
                        <Phone className="h-4 w-4 text-blue-600" />
                        <div>
                          <p className="text-sm text-blue-600 dark:text-blue-300">Telefone da Empresa</p>
                          <p className="font-medium text-blue-800 dark:text-blue-200">{selectedCliente.telefone_empresa}</p>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-3">
                      <MapPin className="h-4 w-4 text-blue-600" />
                      <div>
                        <p className="text-sm text-blue-600 dark:text-blue-300">Localização</p>
                        <p className="font-medium text-blue-800 dark:text-blue-200">
                          {[selectedCliente.cidade, selectedCliente.estado].filter(Boolean).join(', ') || 'N/A'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <User className="h-4 w-4 text-blue-600" />
                      <div>
                        <p className="text-sm text-blue-600 dark:text-blue-300">Vendedor Responsável</p>
                        <p className="font-medium text-blue-800 dark:text-blue-200">
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

                {/* Informações Comerciais */}
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 p-6 rounded-xl border border-orange-200 dark:border-orange-700 shadow-sm">
                  <h3 className="text-lg font-semibold text-orange-900 dark:text-orange-100 mb-4 flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    Informações Comerciais
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full ${
                        selectedCliente.classificacao === 'quente' ? 'bg-red-500' :
                        selectedCliente.classificacao === 'morno' ? 'bg-yellow-500' :
                        'bg-blue-500'
                      }`} />
                      <div>
                        <p className="text-sm text-orange-600 dark:text-orange-300">Classificação</p>
                        <p className="font-medium text-orange-800 dark:text-orange-200 capitalize">
                          {selectedCliente.classificacao || 'Frio'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full ${
                        pipelineStages.find(s => s.id === selectedCliente.etapa_pipeline)?.color || 'bg-gray-500'
                      }`} />
                      <div>
                        <p className="text-sm text-orange-600 dark:text-orange-300">Etapa do Pipeline</p>
                        <p className="font-medium text-orange-800 dark:text-orange-200">
                          {pipelineStages.find(s => s.id === selectedCliente.etapa_pipeline)?.name || 'Novo'}
                        </p>
                      </div>
                    </div>
                    
                    {selectedCliente.origem && (
                      <div className="flex items-center gap-3">
                        {selectedCliente.origem === 'IA' ? (
                          <Bot className="h-4 w-4 text-purple-600" />
                        ) : selectedCliente.origem === 'site' ? (
                          <Globe className="h-4 w-4 text-blue-600" />
                        ) : selectedCliente.origem === 'manual' ? (
                          <UserPlus className="h-4 w-4 text-gray-600" />
                        ) : (
                          <Building className="h-4 w-4 text-orange-600" />
                        )}
                        <div>
                          <p className="text-sm text-orange-600 dark:text-orange-300">Origem</p>
                          <p className={`font-medium capitalize flex items-center gap-2 ${
                            selectedCliente.origem === 'IA' ? 'text-purple-800 dark:text-purple-200' :
                            selectedCliente.origem === 'site' ? 'text-blue-800 dark:text-blue-200' :
                            selectedCliente.origem === 'manual' ? 'text-gray-800 dark:text-gray-200' :
                            'text-orange-800 dark:text-orange-200'
                          }`}>
                            {selectedCliente.origem === 'site' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
                                <Globe className="h-3 w-3" />
                                Site
                              </span>
                            )}
                            {selectedCliente.origem === 'IA' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-xs font-semibold">
                                <Bot className="h-3 w-3" />
                                IA
                              </span>
                            )}
                            {selectedCliente.origem === 'manual' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-xs font-semibold">
                                <UserPlus className="h-3 w-3" />
                                Manual
                              </span>
                            )}
                            {selectedCliente.origem !== 'site' && selectedCliente.origem !== 'IA' && selectedCliente.origem !== 'manual' && selectedCliente.origem}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {selectedCliente.segmento_cliente && (
                      <div className="flex items-center gap-3">
                        <Building className="h-4 w-4 text-orange-600" />
                        <div>
                          <p className="text-sm text-orange-600 dark:text-orange-300">Segmento</p>
                          <p className="font-medium text-orange-800 dark:text-orange-200">
                            {selectedCliente.segmento_cliente}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {selectedCliente.volume_mensal && (
                      <div className="flex items-center gap-3">
                        <TrendingUp className="h-4 w-4 text-orange-600" />
                        <div>
                          <p className="text-sm text-orange-600 dark:text-orange-300">Volume Mensal</p>
                          <p className="font-medium text-orange-800 dark:text-orange-200">
                            {selectedCliente.volume_mensal}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Informações da Empresa */}
              {(selectedCliente.nome_empresa || selectedCliente.razao_social || selectedCliente.cnpj || selectedCliente.cpf || selectedCliente.inscricao_estadual) && (
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-6 rounded-xl border border-purple-200 dark:border-purple-700 shadow-sm">
                  <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-100 mb-4 flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    Informações da Empresa
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedCliente.nome_empresa && (
                      <div>
                        <p className="text-sm text-purple-600 dark:text-purple-300">Nome da Empresa</p>
                        <p className="font-medium text-purple-800 dark:text-purple-200">{selectedCliente.nome_empresa}</p>
                      </div>
                    )}
                    
                    {selectedCliente.razao_social && (
                      <div>
                        <p className="text-sm text-purple-600 dark:text-purple-300">Razão Social</p>
                        <p className="font-medium text-purple-800 dark:text-purple-200">{selectedCliente.razao_social}</p>
                      </div>
                    )}
                    
                    {selectedCliente.cnpj && (
                      <div>
                        <p className="text-sm text-purple-600 dark:text-purple-300">CNPJ</p>
                        <p className="font-medium text-purple-800 dark:text-purple-200">{selectedCliente.cnpj}</p>
                      </div>
                    )}
                    
                    {selectedCliente.cpf && (
                      <div>
                        <p className="text-sm text-purple-600 dark:text-purple-300">CPF</p>
                        <p className="font-medium text-purple-800 dark:text-purple-200">{selectedCliente.cpf}</p>
                      </div>
                    )}
                    
                    {selectedCliente.inscricao_estadual && (
                      <div>
                        <p className="text-sm text-purple-600 dark:text-purple-300">Inscrição Estadual</p>
                        <p className="font-medium text-purple-800 dark:text-purple-200">{selectedCliente.inscricao_estadual}</p>
                      </div>
                    )}
                    
                    {selectedCliente.cargo && (
                      <div>
                        <p className="text-sm text-purple-600 dark:text-purple-300">Cargo</p>
                        <p className="font-medium text-purple-800 dark:text-purple-200">{selectedCliente.cargo}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Endereço Completo */}
              {(selectedCliente.endereco || selectedCliente.cidade || selectedCliente.estado || selectedCliente.cep) && (
                <div className="bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-900/20 dark:to-teal-800/20 p-6 rounded-xl border border-teal-200 dark:border-teal-700 shadow-sm">
                  <h3 className="text-lg font-semibold text-teal-900 dark:text-teal-100 mb-4 flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Endereço
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {selectedCliente.endereco && (
                      <div>
                        <p className="text-sm text-teal-600 dark:text-teal-300">Endereço</p>
                        <p className="font-medium text-teal-800 dark:text-teal-200">{selectedCliente.endereco}</p>
                      </div>
                    )}
                    
                    {selectedCliente.numero && (
                      <div>
                        <p className="text-sm text-teal-600 dark:text-teal-300">Número</p>
                        <p className="font-medium text-teal-800 dark:text-teal-200">{selectedCliente.numero}</p>
                      </div>
                    )}
                    
                    {selectedCliente.cidade && (
                      <div>
                        <p className="text-sm text-teal-600 dark:text-teal-300">Cidade</p>
                        <p className="font-medium text-teal-800 dark:text-teal-200">{selectedCliente.cidade}</p>
                      </div>
                    )}
                    
                    {selectedCliente.estado && (
                      <div>
                        <p className="text-sm text-teal-600 dark:text-teal-300">Estado</p>
                        <p className="font-medium text-teal-800 dark:text-teal-200">{selectedCliente.estado}</p>
                      </div>
                    )}
                    
                    {selectedCliente.cep && (
                      <div>
                        <p className="text-sm text-teal-600 dark:text-teal-300">CEP</p>
                        <p className="font-medium text-teal-800 dark:text-teal-200">{selectedCliente.cep}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Observações */}
              {selectedCliente.observacoes && (
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/20 dark:to-gray-800/20 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Observações
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                    {selectedCliente.observacoes}
                  </p>
                </div>
              )}

              {/* Produtos de Interesse */}
              {selectedCliente.produtos_interesse && (
                <div className="bg-gradient-to-br from-violet-50 to-violet-100 dark:from-violet-900/20 dark:to-violet-800/20 p-6 rounded-xl border border-violet-200 dark:border-violet-700 shadow-sm">
                  <h3 className="text-lg font-semibold text-violet-900 dark:text-violet-100 mb-4 flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    Produtos de Interesse
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {(Array.isArray(selectedCliente.produtos_interesse) 
                      ? selectedCliente.produtos_interesse 
                      : selectedCliente.produtos_interesse.split(',').map(p => p.trim())
                    ).map((produto, index) => (
                      <span key={index} className="px-3 py-1 bg-violet-200 dark:bg-violet-700 text-violet-800 dark:text-violet-200 text-sm rounded-full font-medium">
                        {produto}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Contexto, Dores e Motivação */}
              {(selectedCliente.analise_cliente || selectedCliente.dores_atuais || selectedCliente.motivacao || selectedCliente.expectativa) && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Contexto */}
                  {selectedCliente.analise_cliente && (
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-6 rounded-xl border border-blue-200 dark:border-blue-700 shadow-sm">
                      <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4">Contexto do Cliente</h3>
                      <div className="bg-white dark:bg-blue-900/30 p-4 rounded-lg border border-blue-200 dark:border-blue-600">
                        <p className="text-blue-800 dark:text-blue-200 text-sm whitespace-pre-wrap leading-relaxed">
                          {selectedCliente.analise_cliente}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Dores Atuais */}
                  {selectedCliente.dores_atuais && (
                    <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 p-6 rounded-xl border border-red-200 dark:border-red-700 shadow-sm">
                      <div className="bg-white dark:bg-red-900/30 p-4 rounded-lg border border-red-200 dark:border-red-600">
                        <p className="text-red-800 dark:text-red-200 text-sm whitespace-pre-wrap leading-relaxed">
                          {selectedCliente.dores_atuais}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Motivação */}
                  {selectedCliente.motivacao && (
                    <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-6 rounded-xl border border-green-200 dark:border-green-700 shadow-sm">
                      <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-4">Motivação</h3>
                      <div className="bg-white dark:bg-green-900/30 p-4 rounded-lg border border-green-200 dark:border-green-600">
                        <p className="text-green-800 dark:text-green-200 text-sm whitespace-pre-wrap leading-relaxed">
                          {selectedCliente.motivacao}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Expectativas */}
                  {selectedCliente.expectativa && (
                    <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 p-6 rounded-xl border border-yellow-200 dark:border-yellow-700 shadow-sm">
                      <h3 className="text-lg font-semibold text-yellow-900 dark:text-yellow-100 mb-4">Expectativas</h3>
                      <div className="bg-white dark:bg-yellow-900/30 p-4 rounded-lg border border-yellow-200 dark:border-yellow-600">
                        <p className="text-yellow-800 dark:text-yellow-200 text-sm whitespace-pre-wrap leading-relaxed">
                          {selectedCliente.expectativa}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Propostas do Cliente */}
              <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 p-6 rounded-xl border border-indigo-200 dark:border-indigo-700 shadow-sm">
                <h3 className="text-lg font-semibold text-indigo-900 dark:text-indigo-100 mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Propostas
                  <Badge variant="secondary" className="ml-auto">
                    {propostasCliente.length}
                  </Badge>
                </h3>
                
                {propostasCliente.length > 0 ? (
                  <div className="space-y-3">
                    {propostasCliente.slice(0, 5).map((proposta: any) => (
                      <div 
                        key={proposta.id}
                        className="bg-white dark:bg-indigo-900/30 p-4 rounded-lg border border-indigo-200 dark:border-indigo-600 hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => {
                          setSelectedProposta(proposta)
                          setIsPropostaModalOpen(true)
                        }}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <h4 className="font-semibold text-indigo-900 dark:text-indigo-100">
                                {proposta.titulo}
                              </h4>
                              <Badge 
                                variant="outline"
                                className={
                                  proposta.status === 'aprovada' ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300' :
                                  proposta.status === 'enviada' ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300' :
                                  proposta.status === 'rascunho' ? 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900/30 dark:text-gray-300' :
                                  proposta.status === 'rejeitada' ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300' :
                                  'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300'
                                }
                              >
                                {proposta.status}
                              </Badge>
                            </div>
                            
                            <p className="text-sm text-indigo-600 dark:text-indigo-300 mb-2">
                              #{proposta.numero_proposta}
                            </p>
                            
                            <div className="flex items-center gap-4 text-xs text-indigo-500 dark:text-indigo-400">
                              <span>
                                Valor: <strong className="text-indigo-700 dark:text-indigo-200">
                                  R$ {proposta.valor_total?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </strong>
                              </span>
                              <span>
                                {new Date(proposta.created_at).toLocaleDateString('pt-BR')}
                              </span>
                            </div>
                          </div>
                          
                          <Eye className="h-4 w-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                        </div>
                      </div>
                    ))}
                    
                    {propostasCliente.length > 5 && (
                      <Button
                        variant="ghost"
                        className="w-full text-indigo-600 hover:text-indigo-700 hover:bg-indigo-100"
                        onClick={() => window.open(`/app/propostas?cliente_id=${selectedCliente.id}`, '_blank')}
                      >
                        Ver todas ({propostasCliente.length}) propostas →
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-indigo-600 dark:text-indigo-400">
                    <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Nenhuma proposta cadastrada</p>
                    <Button
                      variant="link"
                      className="text-indigo-600 mt-2"
                      onClick={() => window.open('/app/propostas', '_blank')}
                    >
                      Criar primeira proposta
                    </Button>
                  </div>
                )}
              </div>

              {/* Linha do Tempo de Ações */}
              <div className="mt-6">
                <ClienteTimeline
                  clienteId={selectedCliente.id}
                  onNovaAcao={() => {
                    setSelectedAcao(null)
                    setIsAcaoModalOpen(true)
                  }}
                  onEditarAcao={(acao) => {
                    setSelectedAcao(acao)
                    setIsAcaoModalOpen(true)
                  }}
                />
              </div>
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
            <Button 
              onClick={() => {
                setIsDetailModalOpen(false)
                openEditModal(selectedCliente)
              }}
            >
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Ação */}
      {selectedCliente && (
        <AcaoModal
          clienteId={selectedCliente.id}
          acao={selectedAcao}
          aberto={isAcaoModalOpen}
          onFechar={() => {
            setIsAcaoModalOpen(false)
            setSelectedAcao(null)
          }}
        />
      )}

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

      {/* Modal de Visualização de Proposta */}
      <Dialog open={isPropostaModalOpen} onOpenChange={setIsPropostaModalOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Detalhes da Proposta</DialogTitle>
            <DialogDescription>
              Visualize todas as informações completas da proposta
            </DialogDescription>
          </DialogHeader>
          
          {selectedProposta && (
            <div className="space-y-6">
              {/* Header da Proposta */}
              <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 p-6 rounded-xl border border-indigo-200 dark:border-indigo-700 shadow-sm">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <h3 className="text-3xl font-bold text-indigo-900 dark:text-indigo-100 mb-2">
                      {selectedProposta.titulo}
                    </h3>
                    <p className="text-base text-indigo-600 dark:text-indigo-300 font-mono">
                      #{selectedProposta.numero_proposta}
                    </p>
                  </div>
                  <Badge 
                    variant="outline"
                    className={`text-base px-4 py-2 font-semibold ${
                      selectedProposta.status === 'aprovada' ? 'bg-green-50 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-300' :
                      selectedProposta.status === 'enviada' ? 'bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300' :
                      selectedProposta.status === 'rascunho' ? 'bg-gray-50 text-gray-700 border-gray-300 dark:bg-gray-900/30 dark:text-gray-300' :
                      selectedProposta.status === 'rejeitada' ? 'bg-red-50 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-300' :
                      'bg-yellow-50 text-yellow-700 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-300'
                    }`}
                  >
                    {selectedProposta.status}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div className="bg-white/50 dark:bg-indigo-950/30 p-4 rounded-lg">
                    <p className="text-xs text-indigo-600 dark:text-indigo-400 mb-1">Valor Total</p>
                    <p className="text-3xl font-bold text-indigo-900 dark:text-indigo-100">
                      R$ {selectedProposta.valor_total?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="bg-white/50 dark:bg-indigo-950/30 p-4 rounded-lg">
                    <p className="text-xs text-indigo-600 dark:text-indigo-400 mb-1">Data de Criação</p>
                    <p className="text-lg font-semibold text-indigo-900 dark:text-indigo-100">
                      {new Date(selectedProposta.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="bg-white/50 dark:bg-indigo-950/30 p-4 rounded-lg">
                    <p className="text-xs text-indigo-600 dark:text-indigo-400 mb-1">Validade</p>
                    <p className="text-lg font-semibold text-indigo-900 dark:text-indigo-100">
                      {selectedProposta.validade_dias} dias
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Itens da Proposta */}
              {selectedProposta.itens && selectedProposta.itens.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <div className="bg-gray-50 dark:bg-gray-900 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      Itens da Proposta ({selectedProposta.itens.length})
                    </h4>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-gray-900">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Item</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Qtd</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Unidade</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Valor Unit.</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Desconto</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {selectedProposta.itens.map((item: any, index: number) => (
                          <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {item.tipo === 'produto' ? '📦 Produto' : '⚙️ Serviço'}
                                </Badge>
                                <div>
                                  <p className="font-medium text-gray-900 dark:text-gray-100">{item.nome}</p>
                                  {item.descricao && (
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{item.descricao}</p>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center text-gray-900 dark:text-gray-100 font-medium">
                              {item.quantidade}
                            </td>
                            <td className="px-6 py-4 text-center text-gray-700 dark:text-gray-300">
                              {item.unidade}
                            </td>
                            <td className="px-6 py-4 text-right text-gray-900 dark:text-gray-100">
                              R$ {item.valor_unitario?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-6 py-4 text-right text-orange-600 dark:text-orange-400">
                              {item.percentual_desconto > 0 ? `${item.percentual_desconto}%` : '-'}
                            </td>
                            <td className="px-6 py-4 text-right font-semibold text-gray-900 dark:text-gray-100">
                              R$ {item.valor_total?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              
              {/* Resumo Financeiro */}
              <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl border border-green-200 dark:border-green-700 p-6">
                <h4 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-4">Resumo Financeiro</h4>
                <div className="space-y-3">
                  {selectedProposta.valor_produtos > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-green-700 dark:text-green-300">Subtotal Produtos:</span>
                      <span className="font-semibold text-green-900 dark:text-green-100">
                        R$ {selectedProposta.valor_produtos?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}
                  {selectedProposta.valor_servicos > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-green-700 dark:text-green-300">Subtotal Serviços:</span>
                      <span className="font-semibold text-green-900 dark:text-green-100">
                        R$ {selectedProposta.valor_servicos?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}
                  {selectedProposta.valor_desconto > 0 && (
                    <div className="flex justify-between items-center text-orange-600 dark:text-orange-400">
                      <span>Desconto ({selectedProposta.percentual_desconto}%):</span>
                      <span className="font-semibold">
                        - R$ {selectedProposta.valor_desconto?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}
                  {selectedProposta.valor_frete > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-green-700 dark:text-green-300">Frete:</span>
                      <span className="font-semibold text-green-900 dark:text-green-100">
                        R$ {selectedProposta.valor_frete?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}
                  {selectedProposta.valor_impostos > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-green-700 dark:text-green-300">Impostos:</span>
                      <span className="font-semibold text-green-900 dark:text-green-100">
                        R$ {selectedProposta.valor_impostos?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}
                  <div className="border-t-2 border-green-300 dark:border-green-700 pt-3 mt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-green-900 dark:text-green-100">Valor Total:</span>
                      <span className="text-2xl font-bold text-green-900 dark:text-green-100">
                        R$ {selectedProposta.valor_total?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Condições Comerciais */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedProposta.forma_pagamento && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-sm text-blue-600 dark:text-blue-400 mb-1 font-semibold">💳 Forma de Pagamento</p>
                    <p className="text-blue-900 dark:text-blue-100">
                      {selectedProposta.forma_pagamento}
                    </p>
                  </div>
                )}
                
                {selectedProposta.condicoes_pagamento && (
                  <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                    <p className="text-sm text-purple-600 dark:text-purple-400 mb-1 font-semibold">📋 Condições de Pagamento</p>
                    <p className="text-purple-900 dark:text-purple-100">
                      {selectedProposta.condicoes_pagamento}
                    </p>
                  </div>
                )}
                
                {selectedProposta.prazo_entrega && (
                  <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
                    <p className="text-sm text-orange-600 dark:text-orange-400 mb-1 font-semibold">🚚 Prazo de Entrega</p>
                    <p className="text-orange-900 dark:text-orange-100">
                      {selectedProposta.prazo_entrega}
                    </p>
                  </div>
                )}
                
                {selectedProposta.local_entrega && (
                  <div className="bg-teal-50 dark:bg-teal-900/20 p-4 rounded-lg border border-teal-200 dark:border-teal-800">
                    <p className="text-sm text-teal-600 dark:text-teal-400 mb-1 font-semibold">📍 Local de Entrega</p>
                    <p className="text-teal-900 dark:text-teal-100">
                      {selectedProposta.local_entrega}
                    </p>
                  </div>
                )}
                
                {selectedProposta.garantia && (
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                    <p className="text-sm text-green-600 dark:text-green-400 mb-1 font-semibold">✅ Garantia</p>
                    <p className="text-green-900 dark:text-green-100">
                      {selectedProposta.garantia}
                    </p>
                  </div>
                )}
                
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 font-semibold">Incluso</p>
                  <div className="space-y-1">
                    {selectedProposta.suporte_incluido && (
                      <p className="text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <span className="text-green-500">✓</span> Suporte Técnico
                      </p>
                    )}
                    {selectedProposta.treinamento_incluido && (
                      <p className="text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <span className="text-green-500">✓</span> Treinamento
                      </p>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Descrição */}
              {selectedProposta.descricao && (
                <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">📄 Descrição</h4>
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                    {selectedProposta.descricao}
                  </p>
                </div>
              )}
              
              {/* Termos e Condições */}
              {selectedProposta.termos_condicoes && (
                <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
                  <h4 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">📜 Termos e Condições</h4>
                  <p className="text-blue-800 dark:text-blue-200 whitespace-pre-wrap text-sm leading-relaxed">
                    {selectedProposta.termos_condicoes}
                  </p>
                </div>
              )}
              
              {/* Observações */}
              {selectedProposta.observacoes && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-6 rounded-lg border-l-4 border-yellow-400 dark:border-yellow-600">
                  <h4 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-3">⚠️ Observações Importantes</h4>
                  <p className="text-yellow-900 dark:text-yellow-100 whitespace-pre-wrap leading-relaxed">
                    {selectedProposta.observacoes}
                  </p>
                </div>
              )}
              
              {/* Condições Especiais */}
              {selectedProposta.condicoes_especiais && (
                <div className="bg-purple-50 dark:bg-purple-900/20 p-6 rounded-lg border border-purple-200 dark:border-purple-800">
                  <h4 className="text-lg font-semibold text-purple-900 dark:text-purple-100 mb-3">⭐ Condições Especiais</h4>
                  <p className="text-purple-800 dark:text-purple-200 whitespace-pre-wrap leading-relaxed">
                    {selectedProposta.condicoes_especiais}
                  </p>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsPropostaModalOpen(false)}
            >
              Fechar
            </Button>
            <Button
              onClick={() => {
                setIsPropostaModalOpen(false)
                window.open(`/app/propostas?id=${selectedProposta?.id}`, '_blank')
              }}
            >
              Abrir Proposta Completa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
