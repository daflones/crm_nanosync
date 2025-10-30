import { useState, useMemo } from 'react'
import { 
  Plus, 
  Search, 
  Building2, 
  Phone, 
  Mail, 
  User,
  Edit,
  Trash2,
  Eye
} from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useSetores, useCreateSetor, useUpdateSetor, useDeleteSetor } from '@/hooks/useSetores'
import { useNotifications } from '@/contexts/NotificationContext'
import { PlanoAtivoButton } from '@/components/PlanoAtivoGuard'
import type { Setor } from '@/services/api/setores'
import { toast } from 'sonner'

interface SetorFormData {
  nome: string
  descricao: string
  email: string
  telefone: string
  whatsapp: string
  responsavel: string
  cor_identificacao: string
  prioridade: 'baixa' | 'media' | 'alta' | 'urgente'
  ativo: boolean
  notificacoes_ativas: boolean
  // Novos campos para IA
  instrucoes_ia: string
  contexto_uso: string
  palavras_chave: string
  horario_funcionamento: {
    [key: string]: {
      ativo: boolean
      periodos: Array<{
        inicio: string
        fim: string
      }>
    }
  }
}

const CORES_SETORES = [
  { value: '#ef4444', label: 'Vermelho', color: 'bg-red-500' },
  { value: '#f97316', label: 'Laranja', color: 'bg-orange-500' },
  { value: '#eab308', label: 'Amarelo', color: 'bg-yellow-500' },
  { value: '#22c55e', label: 'Verde', color: 'bg-green-500' },
  { value: '#06b6d4', label: 'Ciano', color: 'bg-cyan-500' },
  { value: '#3b82f6', label: 'Azul', color: 'bg-blue-500' },
  { value: '#6366f1', label: 'Índigo', color: 'bg-indigo-500' },
  { value: '#8b5cf6', label: 'Violeta', color: 'bg-violet-500' },
  { value: '#ec4899', label: 'Rosa', color: 'bg-pink-500' },
  { value: '#6b7280', label: 'Cinza', color: 'bg-gray-500' }
]

export default function SetoresAtendimentoPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [setorToDelete, setSetorToDelete] = useState<string | null>(null)
  const [selectedSetor, setSelectedSetor] = useState<Setor | null>(null)
  const [formData, setFormData] = useState<SetorFormData>({
    nome: '',
    descricao: '',
    email: '',
    telefone: '',
    whatsapp: '',
    responsavel: '',
    cor_identificacao: '#6366f1',
    prioridade: 'media',
    ativo: true,
    notificacoes_ativas: true,
    // Novos campos para IA
    instrucoes_ia: '',
    contexto_uso: '',
    palavras_chave: '',
    horario_funcionamento: {
      segunda: { ativo: true, periodos: [{ inicio: '08:00', fim: '18:00' }] },
      terca: { ativo: true, periodos: [{ inicio: '08:00', fim: '18:00' }] },
      quarta: { ativo: true, periodos: [{ inicio: '08:00', fim: '18:00' }] },
      quinta: { ativo: true, periodos: [{ inicio: '08:00', fim: '18:00' }] },
      sexta: { ativo: true, periodos: [{ inicio: '08:00', fim: '18:00' }] },
      sabado: { ativo: false, periodos: [{ inicio: '08:00', fim: '12:00' }] },
      domingo: { ativo: false, periodos: [{ inicio: '08:00', fim: '12:00' }] }
    }
  })

  const { data: setores = [], isLoading, error } = useSetores()
  const createSetor = useCreateSetor()
  const updateSetor = useUpdateSetor()
  const deleteSetor = useDeleteSetor()
  const { createDatabaseNotification } = useNotifications()

  const filteredSetores = useMemo(() => {
    return setores.filter(setor =>
      setor.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      setor.descricao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      setor.responsavel?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [setores, searchTerm])

  const resetForm = () => {
    setFormData({
      nome: '',
      descricao: '',
      email: '',
      telefone: '',
      whatsapp: '',
      responsavel: '',
      cor_identificacao: '#6366f1',
      prioridade: 'media',
      ativo: true,
      notificacoes_ativas: true,
      // Novos campos para IA
      instrucoes_ia: '',
      contexto_uso: '',
      palavras_chave: '',
      horario_funcionamento: {
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

  const handleCreateSetor = async () => {
    if (!formData.nome.trim()) {
      toast.error('Nome do setor é obrigatório')
      return
    }

    try {
      const newSetor = await createSetor.mutateAsync({
        nome: formData.nome.trim(),
        descricao: formData.descricao.trim() || undefined,
        email: formData.email.trim() || undefined,
        telefone: formData.telefone.trim() || undefined,
        whatsapp: formData.whatsapp.trim() || undefined,
        responsavel: formData.responsavel.trim() || undefined,
        cor_identificacao: formData.cor_identificacao,
        prioridade: formData.prioridade,
        ativo: formData.ativo,
        notificacoes_ativas: formData.notificacoes_ativas,
        // Novos campos para IA
        instrucoes_ia: formData.instrucoes_ia.trim() || undefined,
        contexto_uso: formData.contexto_uso.trim() || undefined,
        palavras_chave: formData.palavras_chave ? formData.palavras_chave.split(',').map(p => p.trim()).filter(p => p) : undefined,
        horario_funcionamento: formData.horario_funcionamento
      })

      try {
        await createDatabaseNotification({
          tipo: 'aviso',
          categoria: 'geral',
          titulo: 'Setor Criado',
          descricao: `Setor ${formData.nome} foi criado com sucesso`,
          referencia_id: newSetor.id,
          referencia_tipo: 'setor',
          prioridade: 'normal',
          dados_extras: {
            nome: formData.nome,
            responsavel: formData.responsavel
          }
        })
      } catch (notificationError) {
        console.warn('Erro ao criar notificação:', notificationError)
      }

      setIsCreateModalOpen(false)
      resetForm()
    } catch (error: any) {
      console.error('Erro ao criar setor:', error)
      toast.error(error?.message || 'Erro ao criar setor')
    }
  }

  const handleUpdateSetor = async () => {
    if (!selectedSetor || !formData.nome.trim()) {
      toast.error('Nome do setor é obrigatório')
      return
    }

    try {
      await updateSetor.mutateAsync({
        id: selectedSetor.id,
        data: {
          nome: formData.nome.trim(),
          descricao: formData.descricao.trim() || undefined,
          email: formData.email.trim() || undefined,
          telefone: formData.telefone.trim() || undefined,
          whatsapp: formData.whatsapp.trim() || undefined,
          responsavel: formData.responsavel.trim() || undefined,
          cor_identificacao: formData.cor_identificacao,
          prioridade: formData.prioridade,
          ativo: formData.ativo,
          notificacoes_ativas: formData.notificacoes_ativas,
          // Novos campos para IA
          instrucoes_ia: formData.instrucoes_ia.trim() || undefined,
          contexto_uso: formData.contexto_uso.trim() || undefined,
          palavras_chave: formData.palavras_chave ? formData.palavras_chave.split(',').map(p => p.trim()).filter(p => p) : undefined,
          horario_funcionamento: formData.horario_funcionamento
        }
      })

      setIsEditModalOpen(false)
      setSelectedSetor(null)
      resetForm()
    } catch (error: any) {
      console.error('Erro ao atualizar setor:', error)
      toast.error(error?.message || 'Erro ao atualizar setor')
    }
  }

  const handleDeleteSetor = async () => {
    if (!setorToDelete) return

    try {
      await deleteSetor.mutateAsync(setorToDelete)
      setIsDeleteModalOpen(false)
      setSetorToDelete(null)
    } catch (error: any) {
      console.error('Erro ao excluir setor:', error)
      toast.error(error?.message || 'Erro ao excluir setor')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Carregando setores...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="text-lg text-red-600">Erro ao carregar setores</div>
        <div className="text-sm text-gray-600 max-w-md text-center">
          A tabela 'setores_atendimento' precisa ser criada no banco de dados. 
          Execute o script SQL fornecido no Supabase.
        </div>
        <Button 
          onClick={() => window.location.reload()} 
          variant="outline"
          className="mt-4"
        >
          Tentar Novamente
        </Button>
      </div>
    )
  }

  return (
    <div className="w-full h-full space-y-6">
      {/* Header */}
      <div className="w-full">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Setores de Atendimento</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Gerencie os setores para direcionamento de atendimentos
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <PlanoAtivoButton 
              onClick={() => setIsCreateModalOpen(true)} 
              className="bg-primary-600 hover:bg-primary-700" 
              variant="primary"
            >
              <Plus className="mr-2 h-4 w-4" />
              Novo Setor
            </PlanoAtivoButton>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="w-full overflow-x-auto">
        <div className="flex gap-4 pb-2" style={{ minWidth: 'max-content' }}>
          <div className="flex-shrink-0 p-4 rounded-lg border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{setores.length}</p>
              </div>
              <Building2 className="h-8 w-8 text-gray-400 dark:text-gray-500" />
            </div>
          </div>

          <div className="flex-shrink-0 p-4 rounded-lg border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Ativos</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {setores.filter(s => s.ativo).length}
                </p>
              </div>
              <div className="w-3 h-3 rounded-full bg-green-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar setores..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Setores List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Todos os Setores</h2>
        </div>

        {filteredSetores.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Nenhum setor encontrado</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Comece adicionando um novo setor de atendimento.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700 max-h-[600px] overflow-y-auto">
            {filteredSetores.map((setor) => (
              <div key={setor.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div 
                          className="w-12 h-12 rounded-xl flex items-center justify-center shadow-md"
                          style={{ backgroundColor: setor.cor_identificacao }}
                        >
                          <Building2 className="w-6 h-6 text-white" />
                        </div>
                        <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${setor.ativo ? 'bg-green-500' : 'bg-gray-400'}`} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                            {setor.nome}
                          </h3>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            setor.ativo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {setor.ativo ? 'Ativo' : 'Inativo'}
                          </span>
                        </div>
                        
                        {setor.descricao && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{setor.descricao}</p>
                        )}
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-3">
                          {setor.email && (
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                              <Mail className="h-4 w-4" />
                              <span className="truncate">{setor.email}</span>
                            </div>
                          )}
                          
                          {setor.telefone && (
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                              <Phone className="h-4 w-4" />
                              <span>{setor.telefone}</span>
                            </div>
                          )}
                          
                          {setor.responsavel && (
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                              <User className="h-4 w-4" />
                              <span>{setor.responsavel}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedSetor(setor)
                        setIsViewModalOpen(true)
                      }}
                      className="text-gray-600 hover:text-gray-900"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedSetor(setor)
                        setFormData({
                          nome: setor.nome || '',
                          descricao: setor.descricao || '',
                          email: setor.email || '',
                          telefone: setor.telefone || '',
                          whatsapp: setor.whatsapp || '',
                          responsavel: setor.responsavel || '',
                          cor_identificacao: setor.cor_identificacao || '#6366f1',
                          prioridade: setor.prioridade || 'media',
                          ativo: setor.ativo,
                          notificacoes_ativas: setor.notificacoes_ativas,
                          // Novos campos para IA
                          instrucoes_ia: setor.instrucoes_ia || '',
                          contexto_uso: setor.contexto_uso || '',
                          palavras_chave: setor.palavras_chave ? setor.palavras_chave.join(', ') : '',
                          horario_funcionamento: setor.horario_funcionamento || formData.horario_funcionamento
                        })
                        setIsEditModalOpen(true)
                      }}
                      className="text-gray-600 hover:text-gray-900"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSetorToDelete(setor.id)
                        setIsDeleteModalOpen(true)
                      }}
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

      {/* View Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Visualizar Setor</DialogTitle>
            <DialogDescription>
              Informações detalhadas do setor de atendimento
            </DialogDescription>
          </DialogHeader>
          {selectedSetor && (
            <div className="py-4 space-y-6">
              <div className="flex items-center gap-4">
                <div 
                  className="w-16 h-16 rounded-xl flex items-center justify-center shadow-md"
                  style={{ backgroundColor: selectedSetor.cor_identificacao }}
                >
                  <Building2 className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">{selectedSetor.nome}</h3>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    selectedSetor.ativo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {selectedSetor.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
              </div>

              {selectedSetor.descricao && (
                <div>
                  <Label className="text-sm font-medium">Descrição</Label>
                  <p className="text-sm text-gray-600 mt-1">{selectedSetor.descricao}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedSetor.email && (
                  <div>
                    <Label className="text-sm font-medium">Email</Label>
                    <p className="text-sm text-gray-600">{selectedSetor.email}</p>
                  </div>
                )}
                
                {selectedSetor.telefone && (
                  <div>
                    <Label className="text-sm font-medium">Telefone</Label>
                    <p className="text-sm text-gray-600">{selectedSetor.telefone}</p>
                  </div>
                )}
                
                {selectedSetor.responsavel && (
                  <div>
                    <Label className="text-sm font-medium">Responsável</Label>
                    <p className="text-sm text-gray-600">{selectedSetor.responsavel}</p>
                  </div>
                )}
                
                <div>
                  <Label className="text-sm font-medium">Prioridade</Label>
                  <p className="text-sm text-gray-600 capitalize">{selectedSetor.prioridade}</p>
                </div>
              </div>

              {selectedSetor.instrucoes_ia && (
                <div>
                  <Label className="text-sm font-medium">Instruções para IA</Label>
                  <p className="text-sm text-gray-600 mt-1">{selectedSetor.instrucoes_ia}</p>
                </div>
              )}

              {selectedSetor.contexto_uso && (
                <div>
                  <Label className="text-sm font-medium">Contexto de Uso</Label>
                  <p className="text-sm text-gray-600 mt-1">{selectedSetor.contexto_uso}</p>
                </div>
              )}

              {selectedSetor.palavras_chave && selectedSetor.palavras_chave.length > 0 && (
                <div>
                  <Label className="text-sm font-medium">Palavras-chave</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedSetor.palavras_chave.map((palavra, index) => (
                      <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {palavra}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Setor</DialogTitle>
            <DialogDescription>
              Altere as informações do setor de atendimento
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-nome">
                  Nome do Setor <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="edit-nome"
                  placeholder="Ex: Suporte, RH, Financeiro..."
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-responsavel">Responsável</Label>
                <Input
                  id="edit-responsavel"
                  placeholder="Nome do responsável"
                  value={formData.responsavel}
                  onChange={(e) => setFormData({ ...formData, responsavel: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-descricao">Descrição</Label>
              <Textarea
                id="edit-descricao"
                placeholder="Descreva as responsabilidades do setor..."
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  placeholder="setor@empresa.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-telefone">Telefone</Label>
                <Input
                  id="edit-telefone"
                  placeholder="(11) 99999-9999"
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-prioridade">Prioridade</Label>
                <Select value={formData.prioridade} onValueChange={(value: any) => setFormData({ ...formData, prioridade: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baixa">Baixa</SelectItem>
                    <SelectItem value="media">Média</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="urgente">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-cor">Cor de Identificação</Label>
                <Select value={formData.cor_identificacao} onValueChange={(value) => setFormData({ ...formData, cor_identificacao: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CORES_SETORES.map((cor) => (
                      <SelectItem key={cor.value} value={cor.value}>
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded-full ${cor.color}`} />
                          {cor.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Seção de Configurações de IA */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white border-b pb-2">Configurações de IA</h4>
              
              <div className="space-y-2">
                <Label htmlFor="edit-instrucoes_ia">Instruções para IA</Label>
                <Textarea
                  id="edit-instrucoes_ia"
                  placeholder="Como a IA deve se comportar ao atender este setor?"
                  value={formData.instrucoes_ia}
                  onChange={(e) => setFormData({ ...formData, instrucoes_ia: e.target.value })}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-contexto_uso">Contexto de Uso</Label>
                <Textarea
                  id="edit-contexto_uso"
                  placeholder="Quando usar este setor?"
                  value={formData.contexto_uso}
                  onChange={(e) => setFormData({ ...formData, contexto_uso: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-palavras_chave">Palavras-chave (separadas por vírgula)</Label>
                <Input
                  id="edit-palavras_chave"
                  placeholder="suporte, técnico, problema..."
                  value={formData.palavras_chave}
                  onChange={(e) => setFormData({ ...formData, palavras_chave: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-ativo"
                  checked={formData.ativo}
                  onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
                />
                <Label htmlFor="edit-ativo">Setor ativo</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-notificacoes"
                  checked={formData.notificacoes_ativas}
                  onCheckedChange={(checked) => setFormData({ ...formData, notificacoes_ativas: checked })}
                />
                <Label htmlFor="edit-notificacoes">Receber notificações</Label>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateSetor} disabled={updateSetor.isPending}>
              {updateSetor.isPending ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Setor</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir este setor? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteSetor} disabled={deleteSetor.isPending}>
              {deleteSetor.isPending ? 'Excluindo...' : 'Excluir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Criar Setor de Atendimento</DialogTitle>
            <DialogDescription>
              Adicione um novo setor para direcionamento de atendimentos
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome">
                  Nome do Setor <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="nome"
                  placeholder="Ex: Suporte, RH, Financeiro..."
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="responsavel">Responsável</Label>
                <Input
                  id="responsavel"
                  placeholder="Nome do responsável"
                  value={formData.responsavel}
                  onChange={(e) => setFormData({ ...formData, responsavel: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                placeholder="Descreva as responsabilidades do setor..."
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="setor@empresa.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  placeholder="(11) 99999-9999"
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prioridade">Prioridade</Label>
                <Select value={formData.prioridade} onValueChange={(value: any) => setFormData({ ...formData, prioridade: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baixa">Baixa</SelectItem>
                    <SelectItem value="media">Média</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="urgente">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="cor">Cor de Identificação</Label>
                <Select value={formData.cor_identificacao} onValueChange={(value) => setFormData({ ...formData, cor_identificacao: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CORES_SETORES.map((cor) => (
                      <SelectItem key={cor.value} value={cor.value}>
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded-full ${cor.color}`} />
                          {cor.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Seção de Configurações de IA */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white border-b pb-2">Configurações de IA</h4>
              
              <div className="space-y-2">
                <Label htmlFor="instrucoes_ia">Instruções para IA</Label>
                <Textarea
                  id="instrucoes_ia"
                  placeholder="Como a IA deve se comportar ao atender este setor? Ex: Seja técnico e objetivo..."
                  value={formData.instrucoes_ia}
                  onChange={(e) => setFormData({ ...formData, instrucoes_ia: e.target.value })}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contexto_uso">Contexto de Uso</Label>
                <Textarea
                  id="contexto_uso"
                  placeholder="Quando usar este setor? Ex: Para resolver problemas técnicos, bugs..."
                  value={formData.contexto_uso}
                  onChange={(e) => setFormData({ ...formData, contexto_uso: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="palavras_chave">Palavras-chave (separadas por vírgula)</Label>
                <Input
                  id="palavras_chave"
                  placeholder="suporte, técnico, problema, erro, bug..."
                  value={formData.palavras_chave}
                  onChange={(e) => setFormData({ ...formData, palavras_chave: e.target.value })}
                />
                <p className="text-xs text-gray-500">Separe as palavras-chave com vírgulas</p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Switch
                  id="ativo"
                  checked={formData.ativo}
                  onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
                />
                <Label htmlFor="ativo">Setor ativo</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="notificacoes"
                  checked={formData.notificacoes_ativas}
                  onCheckedChange={(checked) => setFormData({ ...formData, notificacoes_ativas: checked })}
                />
                <Label htmlFor="notificacoes">Receber notificações</Label>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateSetor} disabled={createSetor.isPending}>
              {createSetor.isPending ? 'Criando...' : 'Criar Setor'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
