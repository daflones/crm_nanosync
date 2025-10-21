import { useState, useMemo, useRef, useEffect } from 'react'
import { 
  Plus, 
  Search, 
  Target, 
  User, 
  Phone, 
  Mail, 
  Calendar,
  Percent,
  Edit,
  Trash2,
  Eye,
  Users,
  X,
  Check
} from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useVendedores, useCreateVendedor, useUpdateVendedor, useDeleteVendedor } from '@/hooks/useVendedores'
import { useSegmentos } from '@/hooks/useSegmentos'
import { useNotifications } from '@/contexts/NotificationContext'
import { PlanoAtivoButton } from '@/components/PlanoAtivoGuard'
import type { Vendedor } from '@/services/api/vendedores'
import { toast } from 'sonner'

// Ordem correta dos dias da semana
const diasDaSemanaOrdem = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado']

// Função para ordenar os dias da semana
const ordenarDiasDaSemana = (horarios: any) => {
  if (!horarios) return []
  
  return Object.entries(horarios).sort(([diaA], [diaB]) => {
    const indexA = diasDaSemanaOrdem.indexOf(diaA.toLowerCase())
    const indexB = diasDaSemanaOrdem.indexOf(diaB.toLowerCase())
    return indexA - indexB
  })
}

interface VendedorFormData {
  nome: string
  email: string
  senha: string
  telefone: string
  cpf: string
  whatsapp: string
  meta_mensal: number
  comissao_percentual: number
  salario_base: number
  data_contratacao: string
  segmentos_principais: string[]
  segmentos_secundarios: string[]
  regioes_atendimento: string[]
  horarios_vendedor?: {
    [key: string]: {
      ativo: boolean
      periodos: Array<{
        inicio: string
        fim: string
      }>
    }
  }
}

// Estados do Brasil + opções especiais
const REGIOES_BRASIL = [
  'Acre (AC)',
  'Alagoas (AL)', 
  'Amapá (AP)',
  'Amazonas (AM)',
  'Bahia (BA)',
  'Ceará (CE)',
  'Distrito Federal (DF)',
  'Espírito Santo (ES)',
  'Goiás (GO)',
  'Maranhão (MA)',
  'Mato Grosso (MT)',
  'Mato Grosso do Sul (MS)',
  'Minas Gerais (MG)',
  'Pará (PA)',
  'Paraíba (PB)',
  'Paraná (PR)',
  'Pernambuco (PE)',
  'Piauí (PI)',
  'Rio de Janeiro (RJ)',
  'Rio Grande do Norte (RN)',
  'Rio Grande do Sul (RS)',
  'Rondônia (RO)',
  'Roraima (RR)',
  'Santa Catarina (SC)',
  'São Paulo (SP)',
  'Sergipe (SE)',
  'Tocantins (TO)',
  'Todo Brasil',
  'Internacional'
]

// Componente MultiSelect
interface MultiSelectProps {
  options: { id: string; nome: string }[] | string[]
  selected: string[]
  onChange: (selected: string[]) => void
  placeholder: string
  required?: boolean
}

const MultiSelect = ({ options, selected, onChange, placeholder, required }: MultiSelectProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Fechar dropdown quando clicar fora ou pressionar Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  const handleToggle = (value: string) => {
    const newSelected = selected.includes(value)
      ? selected.filter(item => item !== value)
      : [...selected, value]
    onChange(newSelected)
    // Opcional: fechar dropdown após seleção (descomente se desejar)
    // setIsOpen(false)
  }

  const removeItem = (value: string) => {
    onChange(selected.filter(item => item !== value))
  }

  const getDisplayValue = (value: string) => {
    if (typeof options[0] === 'string') {
      return value
    } else {
      const option = (options as { id: string; nome: string }[]).find(opt => opt.id === value)
      return option?.nome || value
    }
  }

  const getOptionValue = (option: any) => {
    return typeof option === 'string' ? option : option.id
  }

  const getOptionLabel = (option: any) => {
    return typeof option === 'string' ? option : option.nome
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <div 
        className={`min-h-[40px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background cursor-pointer ${
          required && selected.length === 0 ? 'border-red-500' : ''
        }`}
        onClick={() => setIsOpen(!isOpen)}
      >
        {selected.length === 0 ? (
          <span className="text-muted-foreground">{placeholder}</span>
        ) : (
          <div className="flex flex-wrap gap-1">
            {selected.map(value => (
              <span
                key={value}
                className="inline-flex items-center gap-1 bg-primary-100 text-primary-800 px-2 py-1 rounded text-xs"
              >
                {getDisplayValue(value)}
                <X 
                  className="h-3 w-3 cursor-pointer hover:text-primary-600" 
                  onClick={(e) => {
                    e.stopPropagation()
                    removeItem(value)
                  }}
                />
              </span>
            ))}
          </div>
        )}
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-background border border-input rounded-md shadow-lg max-h-60 overflow-auto">
          {options.map((option) => {
            const value = getOptionValue(option)
            const label = getOptionLabel(option)
            const isSelected = selected.includes(value)
            
            return (
              <div
                key={value}
                className={`px-3 py-2 cursor-pointer hover:bg-accent flex items-center justify-between ${
                  isSelected ? 'bg-accent' : ''
                }`}
                onClick={() => handleToggle(value)}
              >
                <span className="text-sm">{label}</span>
                {isSelected && <Check className="h-4 w-4 text-primary-600" />}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function VendedoresPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [vendedorToDelete, setVendedorToDelete] = useState<string | null>(null)
  const [selectedVendedor, setSelectedVendedor] = useState<Vendedor | null>(null)
  const [formData, setFormData] = useState<VendedorFormData>({
    nome: '',
    email: '',
    senha: '',
    telefone: '',
    cpf: '',
    whatsapp: '',
    meta_mensal: 0,
    comissao_percentual: 5,
    salario_base: 0,
    data_contratacao: '',
    segmentos_principais: [],
    segmentos_secundarios: [],
    regioes_atendimento: [],
    horarios_vendedor: {
      segunda: { ativo: false, periodos: [{ inicio: '08:00', fim: '18:00' }] },
      terca: { ativo: false, periodos: [{ inicio: '08:00', fim: '18:00' }] },
      quarta: { ativo: false, periodos: [{ inicio: '08:00', fim: '18:00' }] },
      quinta: { ativo: false, periodos: [{ inicio: '08:00', fim: '18:00' }] },
      sexta: { ativo: false, periodos: [{ inicio: '08:00', fim: '18:00' }] },
      sabado: { ativo: false, periodos: [{ inicio: '08:00', fim: '12:00' }] },
      domingo: { ativo: false, periodos: [{ inicio: '08:00', fim: '12:00' }] }
    }
  })

  const { data: vendedores = [], isLoading, error } = useVendedores()
  const { data: segmentos = [] } = useSegmentos()
  const createVendedor = useCreateVendedor()
  const updateVendedor = useUpdateVendedor()
  const deleteVendedor = useDeleteVendedor()
  const { createDatabaseNotification } = useNotifications()

  const filteredVendedores = useMemo(() => {
    return vendedores.filter(vendedor =>
      vendedor.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendedor.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendedor.telefone?.includes(searchTerm)
    )
  }, [vendedores, searchTerm])

  const resetForm = () => {
    setFormData({
      nome: '',
      email: '',
      senha: '',
      telefone: '',
      cpf: '',
      whatsapp: '',
      meta_mensal: 0,
      comissao_percentual: 5,
      salario_base: 0,
      data_contratacao: '',
      segmentos_principais: [],
      segmentos_secundarios: [],
      regioes_atendimento: [],
      horarios_vendedor: {
        segunda: { ativo: true, periodos: [{ inicio: '08:00', fim: '18:00' }] },
        terca: { ativo: true, periodos: [{ inicio: '08:00', fim: '18:00' }] },
        quarta: { ativo: true, periodos: [{ inicio: '08:00', fim: '18:00' }] },
        quinta: { ativo: true, periodos: [{ inicio: '08:00', fim: '18:00' }] },
        sexta: { ativo: true, periodos: [{ inicio: '08:00', fim: '18:00' }] },
        sabado: { ativo: false, periodos: [{ inicio: '08:00', fim: '12:00' }] },
        domingo: { ativo: false, periodos: [{ inicio: '08:00', fim: '12:00' }] }
      }
    })
  }

  const handleCreateVendedor = async () => {
    // Validações básicas - apenas campos obrigatórios
    if (!formData.nome.trim()) {
      toast.error('Nome é obrigatório')
      return
    }
    
    if (!formData.whatsapp.trim()) {
      toast.error('WhatsApp é obrigatório')
      return
    }
    
    if (!formData.email.trim()) {
      toast.error('Email é obrigatório')
      return
    }
    
    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email.trim())) {
      toast.error('Email deve ter um formato válido')
      return
    }
    
    if (!formData.senha.trim()) {
      toast.error('Senha é obrigatória')
      return
    }
    
    if (formData.senha.length < 6) {
      toast.error('Senha deve ter pelo menos 6 caracteres')
      return
    }

    if (formData.segmentos_principais.length === 0) {
      toast.error('Selecione pelo menos um segmento principal')
      return
    }

    if (formData.regioes_atendimento.length === 0) {
      toast.error('Selecione pelo menos uma região de atendimento')
      return
    }

    // Verificar se email já existe
    const emailExists = vendedores.some(v => v.email?.toLowerCase() === formData.email.toLowerCase())
    if (emailExists) {
      toast.error('Este email já está sendo usado por outro vendedor')
      return
    }

    try {
      const vendedorData = {
        nome: formData.nome.trim(),
        email: formData.email.trim().toLowerCase(),
        senha: formData.senha,
        whatsapp: formData.whatsapp.trim(),
        telefone: formData.telefone.trim() || undefined,
        cpf: formData.cpf.trim() || undefined,
        meta_mensal: Number(formData.meta_mensal) || 0,
        comissao_percentual: Number(formData.comissao_percentual) || 5,
        salario_base: Number(formData.salario_base) || 0,
        data_contratacao: formData.data_contratacao || new Date().toISOString().split('T')[0],
        segmentos_principais: formData.segmentos_principais.map(id => {
          const segmento = segmentos.find(s => s.id === id)
          return segmento ? segmento.nome : id
        }),
        segmentos_secundarios: formData.segmentos_secundarios.map(id => {
          const segmento = segmentos.find(s => s.id === id)
          return segmento ? segmento.nome : id
        }),
        regioes_atendimento: formData.regioes_atendimento,
        horarios_vendedor: formData.horarios_vendedor
      }

      const newVendedor = await createVendedor.mutateAsync(vendedorData)

      // Create notification
      try {
        await createDatabaseNotification({
          tipo: 'vendedor_criado',
          categoria: 'geral',
          titulo: 'Vendedor Criado',
          descricao: `Vendedor ${formData.nome} foi criado com sucesso`,
          referencia_id: newVendedor.id,
          referencia_tipo: 'vendedor',
          prioridade: 'normal',
          dados_extras: {
            nome: formData.nome,
            email: formData.email,
            meta_mensal: formData.meta_mensal
          }
        })
      } catch (notificationError) {
        console.warn('Erro ao criar notificação:', notificationError)
        // Não bloqueia o processo se a notificação falhar
      }

      // Fechar modal e resetar form
      setIsCreateModalOpen(false)
      resetForm()
    } catch (error: any) {
      console.error('Erro completo ao criar vendedor:', error)
      
      // Tratamento mais específico de erros
      let errorMessage = 'Erro ao criar vendedor. Tente novamente.'
      
      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error?.message) {
        if (error.message.includes('email')) {
          errorMessage = 'Este email já está sendo usado'
        } else if (error.message.includes('duplicate') || error.message.includes('unique')) {
          errorMessage = 'Já existe um vendedor com essas informações'
        } else if (error.message.includes('validation')) {
          errorMessage = 'Dados inválidos. Verifique as informações'
        } else if (error.message.includes('Edge Function')) {
          errorMessage = 'Erro no servidor. Verifique os dados e tente novamente.'
        } else {
          errorMessage = error.message
        }
      }
      
      toast.error(errorMessage)
      // NÃO fechar o modal em caso de erro para permitir correção
    }
  }

  const handleEditVendedor = (vendedor: Vendedor) => {
    setSelectedVendedor(vendedor)
    setFormData({
      nome: vendedor.nome || '',
      email: vendedor.email || '',
      senha: '',
      telefone: vendedor.telefone || '',
      cpf: vendedor.cpf || '',
      whatsapp: vendedor.whatsapp || '',
      meta_mensal: vendedor.meta_mensal || 0,
      comissao_percentual: vendedor.comissao_percentual || 5,
      salario_base: vendedor.salario_base || 0,
      data_contratacao: vendedor.data_contratacao ? vendedor.data_contratacao.split('T')[0] : '',
      segmentos_principais: vendedor.segmentos_principais || [],
      segmentos_secundarios: vendedor.segmentos_secundarios || [],
      regioes_atendimento: vendedor.regioes_atendimento || [],
      horarios_vendedor: vendedor.horarios_vendedor || {
        segunda: { ativo: false, periodos: [{ inicio: '08:00', fim: '18:00' }] },
        terca: { ativo: false, periodos: [{ inicio: '08:00', fim: '18:00' }] },
        quarta: { ativo: false, periodos: [{ inicio: '08:00', fim: '18:00' }] },
        quinta: { ativo: false, periodos: [{ inicio: '08:00', fim: '18:00' }] },
        sexta: { ativo: false, periodos: [{ inicio: '08:00', fim: '18:00' }] },
        sabado: { ativo: false, periodos: [{ inicio: '08:00', fim: '12:00' }] },
        domingo: { ativo: false, periodos: [{ inicio: '08:00', fim: '12:00' }] }
      }
    })
    setIsEditModalOpen(true)
  }

  const handleUpdateVendedor = async () => {
    if (!selectedVendedor) return

    try {
      const updateData = {
        nome: formData.nome,
        email: formData.email,
        telefone: formData.telefone,
        cpf: formData.cpf,
        whatsapp: formData.whatsapp,
        meta_mensal: Number(formData.meta_mensal),
        comissao_percentual: Number(formData.comissao_percentual),
        salario_base: Number(formData.salario_base),
        data_contratacao: formData.data_contratacao,
        segmentos_principais: formData.segmentos_principais.map(id => {
          const segmento = segmentos.find(s => s.id === id)
          return segmento ? segmento.nome : id
        }),
        segmentos_secundarios: formData.segmentos_secundarios.map(id => {
          const segmento = segmentos.find(s => s.id === id)
          return segmento ? segmento.nome : id
        }),
        regioes_atendimento: formData.regioes_atendimento,
        horarios_vendedor: formData.horarios_vendedor
      }

      await updateVendedor.mutateAsync({
        id: selectedVendedor.id,
        data: updateData
      })

      // Create notification
      await createDatabaseNotification({
        tipo: 'vendedor_atualizado',
        categoria: 'geral',
        titulo: 'Vendedor Atualizado',
        descricao: `Vendedor ${formData.nome} foi atualizado com sucesso`,
        referencia_id: selectedVendedor.id,
        referencia_tipo: 'vendedor',
        prioridade: 'normal',
        dados_extras: {
          nome: formData.nome,
          email: formData.email,
          meta_mensal: formData.meta_mensal
        }
      })

      setIsEditModalOpen(false)
      setSelectedVendedor(null)
      resetForm()
    } catch (error) {
      console.error('Erro ao atualizar vendedor:', error)
    }
  }

  const handleDeleteVendedor = (id: string) => {
    setVendedorToDelete(id)
    setIsDeleteModalOpen(true)
  }

  const confirmDeleteVendedor = async () => {
    if (!vendedorToDelete) return
    
    try {
      await deleteVendedor.mutateAsync(vendedorToDelete)
      
      // Create notification
      const vendedor = vendedores.find(v => v.id === vendedorToDelete)
      if (vendedor) {
        await createDatabaseNotification({
          tipo: 'vendedor_atualizado',
          categoria: 'geral',
          titulo: 'Vendedor Excluído',
          descricao: `Vendedor ${vendedor.nome} foi removido completamente do sistema`,
          referencia_id: vendedorToDelete,
          referencia_tipo: 'vendedor',
          prioridade: 'alta',
          dados_extras: {
            vendedor_nome: vendedor.nome,
            vendedor_email: vendedor.email
          }
        })
      }
      
      setIsDeleteModalOpen(false)
      setVendedorToDelete(null)
    } catch (error) {
      console.error('Erro ao excluir vendedor:', error)
    }
  }

  const handleViewVendedor = (vendedor: Vendedor) => {
    setSelectedVendedor(vendedor)
    setIsViewModalOpen(true)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Carregando vendedores...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-red-600">Erro ao carregar vendedores</div>
      </div>
    )
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  return (
    <div className="w-full h-full space-y-6">
      {/* Header */}
      <div className="w-full">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Vendedores</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Gerencie sua equipe de vendas e acompanhe o desempenho
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <PlanoAtivoButton 
              onClick={() => setIsCreateModalOpen(true)} 
              className="bg-primary-600 hover:bg-primary-700" 
              variant="primary"
            >
              <Plus className="mr-2 h-4 w-4" />
              Novo Vendedor
            </PlanoAtivoButton>
          </div>
        </div>
      </div>

      {/* Statistics Cards - Horizontal Layout */}
      <div className="w-full overflow-x-auto">
        <div className="flex gap-4 pb-2" style={{ minWidth: 'max-content' }}>
          <div 
            className="flex-shrink-0 p-4 rounded-lg border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            style={{ minWidth: '140px' }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{vendedores.length}</p>
              </div>
              <Users className="h-8 w-8 text-gray-400 dark:text-gray-500" />
            </div>
          </div>

          <div 
            className="flex-shrink-0 p-4 rounded-lg border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            style={{ minWidth: '140px' }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Meta Total</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(vendedores.reduce((total, v) => total + (v.meta_mensal || 0), 0))}
                </p>
              </div>
              <div className="w-3 h-3 rounded-full bg-blue-500" />
            </div>
          </div>

          <div 
            className="flex-shrink-0 p-4 rounded-lg border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            style={{ minWidth: '140px' }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Realizado</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">R$ 0,00</p>
              </div>
              <div className="w-3 h-3 rounded-full bg-green-500" />
            </div>
          </div>

          <div 
            className="flex-shrink-0 p-4 rounded-lg border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            style={{ minWidth: '140px' }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Performance</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">0%</p>
              </div>
              <div className="w-3 h-3 rounded-full bg-orange-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar vendedores..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Vendedores List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Todos os Vendedores</h2>
        </div>

        {filteredVendedores.length === 0 ? (
          <div className="text-center py-12">
            <User className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Nenhum vendedor encontrado</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Comece adicionando um novo vendedor à sua equipe.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700 discrete-scroll max-h-[600px] overflow-y-auto">
            {filteredVendedores.map((vendedor) => (
              <div key={vendedor.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 border-l-4 border-l-transparent hover:border-l-primary-500 transition-all duration-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-md">
                          <User className="w-6 h-6 text-white" />
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white bg-green-500" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                            {vendedor.nome}
                          </h3>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Ativo
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-3">
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <Mail className="h-4 w-4" />
                            <span className="truncate">{vendedor.email}</span>
                          </div>
                          
                          {vendedor.telefone && (
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                              <Phone className="h-4 w-4" />
                              <span>{vendedor.telefone}</span>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <Target className="h-4 w-4" />
                            <span>Meta: {formatCurrency(vendedor.meta_mensal || 0)}</span>
                          </div>
                          
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <Percent className="h-4 w-4" />
                            <span>Comissão: {vendedor.comissao_percentual || 0}%</span>
                          </div>
                        </div>

                        {vendedor.data_contratacao && (
                          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mt-2">
                            <Calendar className="h-4 w-4" />
                            <span>Contratado em {formatDate(vendedor.data_contratacao)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewVendedor(vendedor)}
                      className="text-gray-600 hover:text-gray-900"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditVendedor(vendedor)}
                      className="text-gray-600 hover:text-gray-900"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteVendedor(vendedor.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Criar Vendedor</DialogTitle>
            <DialogDescription>
              Adicione um novo vendedor à sua equipe
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-6">
            {/* Informações Básicas - 2 colunas */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white border-b pb-2">Informações Básicas</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">
                    Nome <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="nome"
                    placeholder="Nome completo"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@exemplo.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="senha">
                    Senha <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="senha"
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={formData.senha}
                    onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                    required
                    minLength={6}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="whatsapp">
                    WhatsApp <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="whatsapp"
                    placeholder="(11) 99999-9999"
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Contato - 3 colunas */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white border-b pb-2">Informações de Contato</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    placeholder="(11) 99999-9999"
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF</Label>
                  <Input
                    id="cpf"
                    placeholder="000.000.000-00"
                    value={formData.cpf}
                    onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="data_contratacao">Data de Contratação</Label>
                  <Input
                    id="data_contratacao"
                    type="date"
                    value={formData.data_contratacao}
                    onChange={(e) => setFormData({ ...formData, data_contratacao: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Informações Comerciais - 3 colunas */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white border-b pb-2">Informações Comerciais</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="meta_mensal">Meta Mensal (R$)</Label>
                  <Input
                    id="meta_mensal"
                    type="number"
                    placeholder="0"
                    min="0"
                    step="0.01"
                    value={formData.meta_mensal}
                    onChange={(e) => setFormData({ ...formData, meta_mensal: Number(e.target.value) })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="comissao_percentual">Comissão (%)</Label>
                  <Input
                    id="comissao_percentual"
                    type="number"
                    placeholder="5"
                    min="0"
                    max="100"
                    step="0.1"
                    value={formData.comissao_percentual}
                    onChange={(e) => setFormData({ ...formData, comissao_percentual: Number(e.target.value) })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="salario_base">Salário Base (R$)</Label>
                  <Input
                    id="salario_base"
                    type="number"
                    placeholder="0"
                    min="0"
                    step="0.01"
                    value={formData.salario_base}
                    onChange={(e) => setFormData({ ...formData, salario_base: Number(e.target.value) })}
                  />
                </div>
              </div>
            </div>

            {/* Segmentos e Regiões - 2 colunas */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white border-b pb-2">Segmentos e Regiões de Atendimento</h4>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>
                      Segmentos Principais <span className="text-red-500">*</span>
                    </Label>
                    <MultiSelect
                      options={segmentos}
                      selected={formData.segmentos_principais}
                      onChange={(selected) => setFormData({ ...formData, segmentos_principais: selected })}
                      placeholder="Selecione os segmentos principais"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Segmentos Secundários</Label>
                    <MultiSelect
                      options={segmentos}
                      selected={formData.segmentos_secundarios}
                      onChange={(selected) => setFormData({ ...formData, segmentos_secundarios: selected })}
                      placeholder="Selecione os segmentos secundários (opcional)"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>
                    Regiões de Atendimento <span className="text-red-500">*</span>
                  </Label>
                  <MultiSelect
                    options={REGIOES_BRASIL}
                    selected={formData.regioes_atendimento}
                    onChange={(selected) => setFormData({ ...formData, regioes_atendimento: selected })}
                    placeholder="Selecione as regiões de atendimento"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Horários Disponíveis para Agendamento */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white border-b pb-2">Horários Disponíveis para Agendamento</h4>
              <div className="space-y-3">
                {ordenarDiasDaSemana(formData.horarios_vendedor).map(([dia, config]: [string, any]) => (
                  <div key={dia} className="p-3 border rounded-lg space-y-3">
                    <div className="flex items-center gap-4">
                      <div className="w-20">
                        <Label className="capitalize">{dia}</Label>
                      </div>
                      <Switch
                        checked={config?.ativo || false}
                        onCheckedChange={(checked) => {
                          const newHorarios = { ...formData.horarios_vendedor }
                          if (checked) {
                            newHorarios[dia] = { 
                              ativo: true, 
                              periodos: config?.periodos || [{ inicio: '08:00', fim: '18:00' }] 
                            }
                          } else {
                            newHorarios[dia] = { ...config, ativo: false }
                          }
                          setFormData({ ...formData, horarios_vendedor: newHorarios })
                        }}
                      />
                      {!config?.ativo && (
                        <span className="text-sm text-gray-400">Indisponível</span>
                      )}
                    </div>
                    
                    {config?.ativo && (
                      <div className="space-y-2 ml-24">
                        {(config?.periodos || []).map((periodo: any, index: number) => (
                          <div key={index} className="flex items-center gap-2">
                            <Input
                              type="time"
                              value={periodo.inicio || '08:00'}
                              onChange={(e) => {
                                const newHorarios = { ...formData.horarios_vendedor }
                                const newPeriodos = [...(config?.periodos || [])]
                                newPeriodos[index] = { ...periodo, inicio: e.target.value }
                                newHorarios[dia] = { ...config, periodos: newPeriodos }
                                setFormData({ ...formData, horarios_vendedor: newHorarios })
                              }}
                              className="w-24"
                            />
                            <span className="text-sm text-gray-500">às</span>
                            <Input
                              type="time"
                              value={periodo.fim || '18:00'}
                              onChange={(e) => {
                                const newHorarios = { ...formData.horarios_vendedor }
                                const newPeriodos = [...(config?.periodos || [])]
                                newPeriodos[index] = { ...periodo, fim: e.target.value }
                                newHorarios[dia] = { ...config, periodos: newPeriodos }
                                setFormData({ ...formData, horarios_vendedor: newHorarios })
                              }}
                              className="w-24"
                            />
                            {(config?.periodos || []).length > 1 && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const newHorarios = { ...formData.horarios_vendedor }
                                  const newPeriodos = (config?.periodos || []).filter((_: any, i: number) => i !== index)
                                  newHorarios[dia] = { ...config, periodos: newPeriodos }
                                  setFormData({ ...formData, horarios_vendedor: newHorarios })
                                }}
                                className="text-red-600 hover:text-red-700"
                              >
                                Remover
                              </Button>
                            )}
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newHorarios = { ...formData.horarios_vendedor }
                            const newPeriodos = [...(config?.periodos || []), { inicio: '14:00', fim: '18:00' }]
                            newHorarios[dia] = { ...config, periodos: newPeriodos }
                            setFormData({ ...formData, horarios_vendedor: newHorarios })
                          }}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          + Adicionar Período
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="flex flex-col gap-2">
            <p className="text-xs text-gray-500 text-left">
              * Campos obrigatórios
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsCreateModalOpen(false)
                  resetForm()
                }}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  handleCreateVendedor()
                }}
                disabled={
                  !formData.nome.trim() || 
                  !formData.whatsapp.trim() || 
                  !formData.email.trim() || 
                  !formData.senha.trim() || 
                  formData.segmentos_principais.length === 0 || 
                  formData.regioes_atendimento.length === 0 || 
                  createVendedor.isPending
                }
              >
                {createVendedor.isPending ? 'Criando...' : 'Criar Vendedor'}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Detalhes do Vendedor</DialogTitle>
            <DialogDescription>
              Informações completas do vendedor
            </DialogDescription>
          </DialogHeader>
          {selectedVendedor && (
            <div className="space-y-6 py-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-md">
                  <User className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{selectedVendedor.nome}</h3>
                  <p className="text-gray-600 dark:text-gray-400">{selectedVendedor.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white">Informações Pessoais</h4>
                  
                  {selectedVendedor.telefone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span>{selectedVendedor.telefone}</span>
                    </div>
                  )}
                  
                  {selectedVendedor.whatsapp && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-green-600" />
                      <span>{selectedVendedor.whatsapp}</span>
                    </div>
                  )}
                  
                  {selectedVendedor.cpf && (
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-gray-400" />
                      <span>CPF: {selectedVendedor.cpf}</span>
                    </div>
                  )}
                  
                  {selectedVendedor.data_contratacao && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span>Contratado em {formatDate(selectedVendedor.data_contratacao)}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white">Informações Comerciais</h4>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <Target className="h-4 w-4 text-blue-600" />
                    <span>Meta Mensal: {formatCurrency(selectedVendedor.meta_mensal || 0)}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <Percent className="h-4 w-4 text-green-600" />
                    <span>Comissão: {selectedVendedor.comissao_percentual || 0}%</span>
                  </div>
                  
                  {selectedVendedor.salario_base && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span>Salário Base: {formatCurrency(selectedVendedor.salario_base)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Segmentos e Regiões - Visualização */}
              <div className="border-t pt-4">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Segmentos e Regiões de Atendimento</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">Segmentos Principais</h5>
                    {selectedVendedor.segmentos_principais && selectedVendedor.segmentos_principais.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {selectedVendedor.segmentos_principais.map((segmentoNome, index) => (
                          <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {segmentoNome}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">Nenhum segmento principal definido</p>
                    )}

                    {selectedVendedor.segmentos_secundarios && selectedVendedor.segmentos_secundarios.length > 0 && (
                      <>
                        <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mt-4">Segmentos Secundários</h5>
                        <div className="flex flex-wrap gap-1">
                        {selectedVendedor.segmentos_secundarios.map((segmentoNome, index) => (
                            <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              {segmentoNome}
                            </span>
                          ))} 
                        </div>
                      </>
                    )}
                  </div>

                  <div className="space-y-3">
                    <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">Regiões de Atendimento</h5>
                    {selectedVendedor.regioes_atendimento && selectedVendedor.regioes_atendimento.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {selectedVendedor.regioes_atendimento.map((regiao) => (
                          <span key={regiao} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {regiao}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">Nenhuma região definida</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Performance</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <p className="text-sm text-blue-600 dark:text-blue-400">Meta Atual</p>
                    <p className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                      {formatCurrency(selectedVendedor.meta_mensal || 0)}
                    </p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                    <p className="text-sm text-green-600 dark:text-green-400">Realizado</p>
                    <p className="text-lg font-semibold text-green-900 dark:text-green-100">R$ 0,00</p>
                  </div>
                  <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                    <p className="text-sm text-orange-600 dark:text-orange-400">Performance</p>
                    <p className="text-lg font-semibold text-orange-900 dark:text-orange-100">0%</p>
                  </div>
                </div>
              </div>

              {/* Horários do Vendedor */}
              {selectedVendedor.horarios_vendedor && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Horários de Atendimento</h4>
                  <div className="space-y-2">
                    {ordenarDiasDaSemana(selectedVendedor.horarios_vendedor).map(([dia, horario]: [string, any]) => (
                      <div key={dia} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`w-3 h-3 rounded-full ${horario.ativo ? 'bg-green-500' : 'bg-gray-300'}`} />
                          <span className="font-medium text-gray-900 dark:text-white capitalize">{dia}</span>
                        </div>
                        {horario.ativo ? (
                          <div className="ml-6 space-y-1">
                            {/* Suporte para nova estrutura de múltiplos períodos */}
                            {horario.periodos && Array.isArray(horario.periodos) ? (
                              horario.periodos.map((periodo: any, index: number) => (
                                <div key={index} className="text-sm text-gray-600 dark:text-gray-300">
                                  {periodo.inicio} - {periodo.fim}
                                </div>
                              ))
                            ) : (
                              /* Compatibilidade com estrutura antiga */
                              horario.inicio && horario.fim && (
                                <div className="text-sm text-gray-600 dark:text-gray-300">
                                  {horario.inicio} - {horario.fim}
                                </div>
                              )
                            )}
                          </div>
                        ) : (
                          <div className="ml-6">
                            <span className="text-sm text-gray-400">Inativo</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Vendedor</DialogTitle>
            <DialogDescription>
              Atualize as informações do vendedor
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-6">
            {/* Informações Básicas - 2 colunas */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white border-b pb-2">Informações Básicas</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-nome">
                    Nome <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="edit-nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-email">
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-whatsapp">
                    WhatsApp <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="edit-whatsapp"
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-telefone">Telefone</Label>
                  <Input
                    id="edit-telefone"
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Informações Pessoais - 2 colunas */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white border-b pb-2">Informações Pessoais</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-cpf">CPF</Label>
                  <Input
                    id="edit-cpf"
                    value={formData.cpf}
                    onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-data_contratacao">Data de Contratação</Label>
                  <Input
                    id="edit-data_contratacao"
                    type="date"
                    value={formData.data_contratacao}
                    onChange={(e) => setFormData({ ...formData, data_contratacao: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Informações Comerciais - 3 colunas */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white border-b pb-2">Informações Comerciais</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-meta_mensal">Meta Mensal (R$)</Label>
                  <Input
                    id="edit-meta_mensal"
                    type="number"
                    value={formData.meta_mensal}
                    onChange={(e) => setFormData({ ...formData, meta_mensal: Number(e.target.value) })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-comissao_percentual">Comissão (%)</Label>
                  <Input
                    id="edit-comissao_percentual"
                    type="number"
                    step="0.1"
                    value={formData.comissao_percentual}
                    onChange={(e) => setFormData({ ...formData, comissao_percentual: Number(e.target.value) })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-salario_base">Salário Base (R$)</Label>
                  <Input
                    id="edit-salario_base"
                    type="number"
                    step="0.01"
                    value={formData.salario_base}
                    onChange={(e) => setFormData({ ...formData, salario_base: Number(e.target.value) })}
                  />
                </div>
              </div>
            </div>

            {/* Segmentos e Regiões - 2 colunas */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white border-b pb-2">Segmentos e Regiões de Atendimento</h4>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>
                      Segmentos Principais <span className="text-red-500">*</span>
                    </Label>
                    <MultiSelect
                      options={segmentos}
                      selected={formData.segmentos_principais}
                      onChange={(selected) => setFormData({ ...formData, segmentos_principais: selected })}
                      placeholder="Selecione os segmentos principais"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Segmentos Secundários</Label>
                    <MultiSelect
                      options={segmentos}
                      selected={formData.segmentos_secundarios}
                      onChange={(selected) => setFormData({ ...formData, segmentos_secundarios: selected })}
                      placeholder="Selecione os segmentos secundários (opcional)"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>
                    Regiões de Atendimento <span className="text-red-500">*</span>
                  </Label>
                  <MultiSelect
                    options={REGIOES_BRASIL}
                    selected={formData.regioes_atendimento}
                    onChange={(selected) => setFormData({ ...formData, regioes_atendimento: selected })}
                    placeholder="Selecione as regiões de atendimento"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Horários Disponíveis para Agendamento */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white border-b pb-2">Horários Disponíveis para Agendamento</h4>
              <div className="space-y-3">
                {ordenarDiasDaSemana(formData.horarios_vendedor).map(([dia, config]: [string, any]) => (
                  <div key={dia} className="p-3 border rounded-lg space-y-3">
                    <div className="flex items-center gap-4">
                      <div className="w-20">
                        <Label className="capitalize">{dia}</Label>
                      </div>
                      <Switch
                        checked={config?.ativo || false}
                        onCheckedChange={(checked) => {
                          const newHorarios = { ...formData.horarios_vendedor }
                          if (checked) {
                            newHorarios[dia] = { 
                              ativo: true, 
                              periodos: config?.periodos || [{ inicio: '08:00', fim: '18:00' }] 
                            }
                          } else {
                            newHorarios[dia] = { ...config, ativo: false }
                          }
                          setFormData({ ...formData, horarios_vendedor: newHorarios })
                        }}
                      />
                      {!config?.ativo && (
                        <span className="text-sm text-gray-400">Indisponível</span>
                      )}
                    </div>
                    
                    {config?.ativo && (
                      <div className="space-y-2 ml-24">
                        {(config?.periodos || []).map((periodo: any, index: number) => (
                          <div key={index} className="flex items-center gap-2">
                            <Input
                              type="time"
                              value={periodo.inicio || '08:00'}
                              onChange={(e) => {
                                const newHorarios = { ...formData.horarios_vendedor }
                                const newPeriodos = [...(config?.periodos || [])]
                                newPeriodos[index] = { ...periodo, inicio: e.target.value }
                                newHorarios[dia] = { ...config, periodos: newPeriodos }
                                setFormData({ ...formData, horarios_vendedor: newHorarios })
                              }}
                              className="w-24"
                            />
                            <span className="text-sm text-gray-500">às</span>
                            <Input
                              type="time"
                              value={periodo.fim || '18:00'}
                              onChange={(e) => {
                                const newHorarios = { ...formData.horarios_vendedor }
                                const newPeriodos = [...(config?.periodos || [])]
                                newPeriodos[index] = { ...periodo, fim: e.target.value }
                                newHorarios[dia] = { ...config, periodos: newPeriodos }
                                setFormData({ ...formData, horarios_vendedor: newHorarios })
                              }}
                              className="w-24"
                            />
                            {(config?.periodos || []).length > 1 && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const newHorarios = { ...formData.horarios_vendedor }
                                  const newPeriodos = (config?.periodos || []).filter((_: any, i: number) => i !== index)
                                  newHorarios[dia] = { ...config, periodos: newPeriodos }
                                  setFormData({ ...formData, horarios_vendedor: newHorarios })
                                }}
                                className="text-red-600 hover:text-red-700"
                              >
                                Remover
                              </Button>
                            )}
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newHorarios = { ...formData.horarios_vendedor }
                            const newPeriodos = [...(config?.periodos || []), { inicio: '14:00', fim: '18:00' }]
                            newHorarios[dia] = { ...config, periodos: newPeriodos }
                            setFormData({ ...formData, horarios_vendedor: newHorarios })
                          }}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          + Adicionar Período
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="submit"
              onClick={handleUpdateVendedor}
              disabled={
                !formData.nome.trim() || 
                !formData.whatsapp.trim() || 
                !formData.email.trim() || 
                formData.segmentos_principais.length === 0 || 
                formData.regioes_atendimento.length === 0 || 
                updateVendedor.isPending
              }
            >
              {updateVendedor.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
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
              Tem certeza que deseja excluir este vendedor? Esta ação irá:
            </p>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
              <li>Remover o vendedor da tabela de vendedores</li>
              <li>Excluir o perfil do usuário</li>
              <li>Remover a conta de autenticação</li>
              <li><strong>Esta ação não pode ser desfeita</strong></li>
            </ul>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setIsDeleteModalOpen(false)
                  setVendedorToDelete(null)
                }}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDeleteVendedor}
                disabled={deleteVendedor.isPending}
              >
                {deleteVendedor.isPending ? 'Excluindo...' : 'Excluir Completamente'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
