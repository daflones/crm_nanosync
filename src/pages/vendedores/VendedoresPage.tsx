import { useState, useMemo } from 'react'
import { Plus, Search, Target, Award, UserCheck, DollarSign } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { VendedorCard } from '@/components/VendedorCard'
import { VendedorDetailedView } from '@/components/VendedorDetailedView'
import { useVendedores, useCreateVendedor, useUpdateVendedor, useDeleteVendedor } from '@/hooks/useVendedores'
import { useNotifications } from '@/contexts/NotificationContext'
import { PlanoAtivoButton } from '@/components/PlanoAtivoGuard'
import type { Vendedor } from '@/services/api/vendedores'
import { toast } from 'sonner'

interface VendedorFormData {
  nome: string
  email: string
  senha: string
  telefone: string
  cpf: string
  whatsapp: string
  meta_mensal: number
  comissao_percentual: number
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
    comissao_percentual: 5
  })

  const { data: vendedores = [], isLoading, error } = useVendedores()
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
      comissao_percentual: 5
    })
  }

  const handleCreateVendedor = async () => {
    try {
      const vendedorData = {
        ...formData,
        meta_mensal: Number(formData.meta_mensal),
        comissao_percentual: Number(formData.comissao_percentual)
      }

      const newVendedor = await createVendedor.mutateAsync(vendedorData)
      
      // Create notification
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

      toast.success('Vendedor criado com sucesso!')
      setIsCreateModalOpen(false)
      resetForm()
    } catch (error) {
      console.error('Erro ao criar vendedor:', error)
      toast.error('Erro ao criar vendedor')
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
      comissao_percentual: vendedor.comissao_percentual || 5
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
        comissao_percentual: Number(formData.comissao_percentual)
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

  return (
    <div className="w-full h-full space-y-6">
      {/* Header */}
      <div className="w-full flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Vendedores</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gerencie sua equipe de vendas e acompanhe o desempenho
          </p>
        </div>
        <PlanoAtivoButton onClick={() => setIsCreateModalOpen(true)} className="bg-primary-600 hover:bg-primary-700" variant="primary">
          <Plus className="mr-2 h-4 w-4" />
          Novo Vendedor
        </PlanoAtivoButton>
      </div>

      {/* Stats Cards */}
      <div className="w-full grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Vendedores</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vendedores.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Meta Total</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {vendedores.reduce((total, v) => total + (v.meta_mensal || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Realizado Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ 0,00
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Melhor Performance</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              0%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar vendedores..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {/* Vendedores List */}
      <div className="w-full grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6">
        {filteredVendedores.map((vendedor) => (
          <VendedorCard
            key={vendedor.id}
            vendedor={vendedor}
            onView={() => handleViewVendedor(vendedor)}
            onEdit={() => handleEditVendedor(vendedor)}
            onDelete={() => handleDeleteVendedor(vendedor.id)}
          />
        ))}
      </div>

      {filteredVendedores.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Nenhum vendedor encontrado</p>
        </div>
      )}

      {/* Create Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Criar Vendedor</DialogTitle>
            <DialogDescription>
              Adicione um novo vendedor à sua equipe
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="nome" className="text-right">
                Nome
              </Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="senha" className="text-right">
                Senha
              </Label>
              <Input
                id="senha"
                type="password"
                value={formData.senha}
                onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="telefone" className="text-right">
                Telefone
              </Label>
              <Input
                id="telefone"
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="cpf" className="text-right">
                CPF
              </Label>
              <Input
                id="cpf"
                value={formData.cpf}
                onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="whatsapp" className="text-right">
                WhatsApp
              </Label>
              <Input
                id="whatsapp"
                value={formData.whatsapp}
                onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="meta_mensal" className="text-right">
                Meta Mensal
              </Label>
              <Input
                id="meta_mensal"
                type="number"
                value={formData.meta_mensal}
                onChange={(e) => setFormData({ ...formData, meta_mensal: Number(e.target.value) })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="comissao_percentual" className="text-right">
                Comissão (%)
              </Label>
              <Input
                id="comissao_percentual"
                type="number"
                step="0.1"
                value={formData.comissao_percentual}
                onChange={(e) => setFormData({ ...formData, comissao_percentual: Number(e.target.value) })}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="submit"
              onClick={handleCreateVendedor}
              disabled={!formData.nome || !formData.email || createVendedor.isPending}
            >
              {createVendedor.isPending ? 'Criando...' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Performance do Vendedor</DialogTitle>
            <DialogDescription>
              Análise completa de desempenho e métricas
            </DialogDescription>
          </DialogHeader>
          {selectedVendedor && <VendedorDetailedView vendedor={selectedVendedor} />}
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Vendedor</DialogTitle>
            <DialogDescription>
              Atualize as informações do vendedor
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-nome" className="text-right">
                Nome
              </Label>
              <Input
                id="edit-nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-email" className="text-right">
                Email
              </Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-telefone" className="text-right">
                Telefone
              </Label>
              <Input
                id="edit-telefone"
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-cpf" className="text-right">
                CPF
              </Label>
              <Input
                id="edit-cpf"
                value={formData.cpf}
                onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-whatsapp" className="text-right">
                WhatsApp
              </Label>
              <Input
                id="edit-whatsapp"
                value={formData.whatsapp}
                onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-meta_mensal" className="text-right">
                Meta Mensal
              </Label>
              <Input
                id="edit-meta_mensal"
                type="number"
                value={formData.meta_mensal}
                onChange={(e) => setFormData({ ...formData, meta_mensal: Number(e.target.value) })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-comissao_percentual" className="text-right">
                Comissão (%)
              </Label>
              <Input
                id="edit-comissao_percentual"
                type="number"
                step="0.1"
                value={formData.comissao_percentual}
                onChange={(e) => setFormData({ ...formData, comissao_percentual: Number(e.target.value) })}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="submit"
              onClick={handleUpdateVendedor}
              disabled={!formData.nome || !formData.email || updateVendedor.isPending}
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
