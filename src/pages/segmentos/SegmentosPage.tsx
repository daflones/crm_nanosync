import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Plus, 
  Search,
  Target,
  Edit,
  Trash2,
  Eye,
  Package
} from 'lucide-react'
import { PlanoAtivoButton } from '@/components/PlanoAtivoGuard'
import { 
  Layers,
  Hash,
  Palette,
  Settings,
  Box,
  ShoppingBag,
  Gift,
  FileText,
  Monitor,
  Sticker,
  Shirt,
  Car,
  Home,
  Utensils,
  Gamepad2,
  Book,
  Heart,
  Star,
  Crown,
  Zap,
  Flame,
  Sparkles,
  Diamond,
  Coffee,
  Music,
  Camera,
  Headphones,
  Smartphone,
  Laptop
} from 'lucide-react'
import { useSegmentos, useCreateSegmento, useUpdateSegmento, useDeleteSegmento } from '@/hooks/useSegmentos'
import { useCategorias } from '@/hooks/useCategorias'
import { useProdutos } from '@/hooks/useProdutos'
import type { Segmento, SegmentoCreateData } from '@/services/api/segmentos'
import { toast } from 'sonner'
import { useNotifications } from '@/contexts/NotificationContext'

// Icon mapping for segments
const iconMap = {
  Package, Box, ShoppingBag, Gift,
  FileText, Sticker,
  Monitor, Smartphone, Laptop, Camera, Headphones,
  Shirt, Home, Car,
  Utensils, Coffee,
  Gamepad2, Music, Book,
  Heart, Star, Crown, Diamond, Sparkles, Zap, Flame,
  Layers, Hash, Palette, Settings, Target
}

const getIconComponent = (iconName: string) => {
  return iconMap[iconName as keyof typeof iconMap] || Layers
}

const initialSegmentoState = {
  categoria_id: '',
  nome: '',
  codigo: '',
  descricao: '',
  icone: 'Layers',
  cor: '#8B5CF6',
  status: 'ativo' as const,
  ordem: 0,
  configuracoes: {
    margem_padrao: 30,
    prazo_entrega_padrao: '15 dias',
    observacoes_padrao: ''
  }
}

export function SegmentosPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSegmento, setSelectedSegmento] = useState<Segmento | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [newSegmento, setNewSegmento] = useState<SegmentoCreateData>(initialSegmentoState)
  const [editSegmento, setEditSegmento] = useState<SegmentoCreateData>(initialSegmentoState)
  const [segmentoToDelete, setSegmentoToDelete] = useState<string | null>(null)

  // Hooks
  const { data: segmentos = [], isLoading } = useSegmentos()
  const { data: categorias = [] } = useCategorias()
  const { data: produtos = [] } = useProdutos()
  const createSegmento = useCreateSegmento()
  const updateSegmento = useUpdateSegmento()
  const deleteSegmento = useDeleteSegmento()
  const { createDatabaseNotification } = useNotifications()

  // Calculate product count per segment
  const getProductCount = (segmentoId: string) => {
    return produtos.filter(p => p.segmento_id === segmentoId).length
  }

  // Get category name
  const getCategoryName = (categoriaId: string) => {
    const categoria = categorias.find(c => c.id === categoriaId)
    return categoria?.nome || 'Sem categoria'
  }

  // Stats calculation
  const activeSegments = segmentos.filter(s => s.status === 'ativo')
  const totalProducts = produtos.filter(p => 
    p.segmento_id && segmentos.some(s => s.id === p.segmento_id)
  ).length
  const mostPopularSegment = segmentos.length > 0 ? segmentos.reduce((prev, current) => {
    const prevCount = getProductCount(prev.id)
    const currentCount = getProductCount(current.id)
    return currentCount > prevCount ? current : prev
  }, segmentos[0]) : null

  const stats = [
    {
      title: 'Total de Segmentos',
      value: segmentos.length.toString(),
      description: `${activeSegments.length} ativos`,
      icon: Target,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20'
    },
    {
      title: 'Total de Produtos',
      value: totalProducts.toString(),
      description: 'Em todos os segmentos',
      icon: Package,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/20'
    },
    {
      title: 'Segmento Popular',
      value: mostPopularSegment?.nome || 'N/A',
      description: `${mostPopularSegment ? getProductCount(mostPopularSegment.id) : 0} produtos`,
      icon: Layers,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20'
    },
  ]


  return (
    <div className="w-full h-full space-y-6">
      {/* Header */}
      <div className="w-full flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Segmentos
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gerencie os segmentos de mercado
          </p>
        </div>
        <PlanoAtivoButton
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-primary-600 hover:bg-primary-700"
          variant="primary"
        >
          <Plus className="mr-2 h-4 w-4" />
          Novo Segmento
        </PlanoAtivoButton>
      </div>

      {/* Stats */}
      <div className="w-full grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title} className="dark:bg-gray-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          type="search"
          placeholder="Buscar segmentos..."
          className="pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Segments Grid */}
      {isLoading ? (
        <div className="text-center py-8">
          <p className="text-gray-500">Carregando segmentos...</p>
        </div>
      ) : segmentos.length === 0 ? (
        <div className="w-full flex justify-center items-center py-16">
          <Card className="max-w-md w-full text-center border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-primary-400 dark:hover:border-primary-500 transition-colors duration-200">
            <CardHeader className="pb-4">
              <div className="mx-auto w-16 h-16 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center mb-4">
                <Layers className="h-8 w-8 text-primary-600 dark:text-primary-400" />
              </div>
              <CardTitle className="text-xl text-gray-900 dark:text-white">
                Nenhum segmento encontrado
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Crie seu primeiro segmento para categorizar melhor seus produtos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PlanoAtivoButton
                onClick={() => setIsCreateModalOpen(true)}
                className="w-full bg-primary-600 hover:bg-primary-700"
                variant="primary"
              >
                <Plus className="mr-2 h-4 w-4" />
                Criar primeiro segmento
              </PlanoAtivoButton>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="w-full flex flex-wrap gap-6">
          {segmentos
            .filter(seg => 
              seg.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
              (seg.descricao && seg.descricao.toLowerCase().includes(searchTerm.toLowerCase()))
            )
            .map((segmento) => {
              const Icon = getIconComponent(segmento.icone || 'Layers')
              const productCount = getProductCount(segmento.id)
              const categoryName = getCategoryName(segmento.categoria_id)
              
              return (
                <Card key={segmento.id} className="group relative overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-700/50 border-0 shadow-md dark:border-gray-700 flex-grow-0 flex-shrink-0 w-auto min-w-[280px] max-w-[350px]">
                  {/* Decorative gradient overlay */}
                  <div 
                    className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-300"
                    style={{ 
                      background: `linear-gradient(135deg, ${segmento.cor}20 0%, ${segmento.cor}10 100%)` 
                    }}
                  />
                  
                  <CardHeader className="pb-4 relative z-10">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="relative">
                          <div 
                            className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110"
                            style={{ 
                              background: `linear-gradient(135deg, ${segmento.cor}15 0%, ${segmento.cor}25 100%)`,
                              border: `2px solid ${segmento.cor}20`
                            }}
                          >
                            <Icon className="h-7 w-7 transition-all duration-300 group-hover:scale-110" style={{ color: segmento.cor }} />
                          </div>
                          {segmento.status === 'ativo' && (
                            <div 
                              className="absolute -top-1 -right-1 w-4 h-4 rounded-full shadow-sm"
                              style={{ backgroundColor: segmento.cor }}
                            >
                              <div className="w-full h-full rounded-full bg-white/30 dark:bg-gray-800/30 animate-pulse" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <CardTitle className="text-lg font-bold flex items-center gap-3 text-gray-900 dark:text-white">
                            <span className="truncate">
                              {segmento.nome}
                            </span>
                            {segmento.status === 'inativo' && (
                              <span className="px-3 py-1 text-xs bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400 rounded-full font-medium">
                                Inativo
                              </span>
                            )}
                          </CardTitle>
                          <CardDescription className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">
                            #{segmento.codigo} • {categoryName}
                          </CardDescription>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4 relative z-10">
                    {segmento.descricao && (
                      <div className="bg-gray-50/80 dark:bg-gray-800/50 rounded-lg p-3 border border-gray-100 dark:border-gray-700">
                        <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2 leading-relaxed">
                          {segmento.descricao}
                        </p>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                      <div className="flex items-center space-x-2">
                        <div 
                          className="p-2 rounded-lg"
                          style={{ backgroundColor: segmento.cor + '15' }}
                        >
                          <Package className="h-4 w-4" style={{ color: segmento.cor }} />
                        </div>
                        <div>
                          <span className="text-lg font-bold text-gray-900 dark:text-white">
                            {productCount}
                          </span>
                          <p className="text-xs text-gray-500 dark:text-gray-400">produtos</p>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => {
                            setSelectedSegmento(segmento)
                            setIsViewModalOpen(true)
                          }}
                          className="h-9 w-9 p-0 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 border border-blue-100 hover:border-blue-200 transition-all duration-200 hover:scale-105"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => {
                            setSelectedSegmento(segmento)
                            setEditSegmento({
                              categoria_id: segmento.categoria_id,
                              nome: segmento.nome,
                              codigo: segmento.codigo,
                              descricao: segmento.descricao || '',
                              icone: segmento.icone || 'Layers',
                              cor: segmento.cor || '#8B5CF6',
                              status: segmento.status,
                              ordem: segmento.ordem || 0,
                              configuracoes: segmento.configuracoes || {
                                margem_padrao: 30,
                                prazo_entrega_padrao: '15 dias',
                                observacoes_padrao: ''
                              }
                            })
                            setIsEditModalOpen(true)
                          }}
                          className="h-9 w-9 p-0 rounded-xl bg-green-50 hover:bg-green-100 text-green-600 hover:text-green-700 border border-green-100 hover:border-green-200 transition-all duration-200 hover:scale-105"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => setSegmentoToDelete(segmento.id)}
                          className="h-9 w-9 p-0 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 border border-red-100 hover:border-red-200 transition-all duration-200 hover:scale-105"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
        </div>
      )}

      {/* Create Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Criar Novo Segmento</DialogTitle>
            <DialogDescription>
              Preencha os dados do novo segmento
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="categoria">Categoria *</Label>
                <Select 
                  value={newSegmento.categoria_id} 
                  onValueChange={(value) => setNewSegmento(prev => ({ ...prev, categoria_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categorias.map((categoria) => (
                      <SelectItem key={categoria.id} value={categoria.id}>
                        {categoria.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={newSegmento.status} 
                  onValueChange={(value: 'ativo' | 'inativo') => setNewSegmento(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="inativo">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome *</Label>
                <Input
                  id="nome"
                  value={newSegmento.nome}
                  onChange={(e) => setNewSegmento(prev => ({ ...prev, nome: e.target.value }))}
                  placeholder="Nome do segmento"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="codigo">Código *</Label>
                <Input
                  id="codigo"
                  value={newSegmento.codigo}
                  onChange={(e) => setNewSegmento(prev => ({ ...prev, codigo: e.target.value.toUpperCase() }))}
                  placeholder="CÓDIGO"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={newSegmento.descricao}
                onChange={(e) => setNewSegmento(prev => ({ ...prev, descricao: e.target.value }))}
                placeholder="Descrição do segmento"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="icone">Ícone</Label>
                <Select 
                  value={newSegmento.icone} 
                  onValueChange={(value) => setNewSegmento(prev => ({ ...prev, icone: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {Object.keys(iconMap).map((iconName) => {
                      const IconComponent = iconMap[iconName as keyof typeof iconMap]
                      return (
                        <SelectItem key={iconName} value={iconName}>
                          <div className="flex items-center gap-2">
                            <IconComponent className="h-4 w-4" />
                            <span>{iconName}</span>
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="cor">Cor</Label>
                <div className="flex gap-2">
                  <Input
                    id="cor"
                    type="color"
                    value={newSegmento.cor}
                    onChange={(e) => setNewSegmento(prev => ({ ...prev, cor: e.target.value }))}
                    className="w-16 h-10 p-1 border rounded"
                  />
                  <Input
                    value={newSegmento.cor}
                    onChange={(e) => setNewSegmento(prev => ({ ...prev, cor: e.target.value }))}
                    placeholder="#8B5CF6"
                    className="flex-1"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <Label>Configurações</Label>
              <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
                <div className="space-y-2">
                  <Label htmlFor="margem">Margem Padrão (%)</Label>
                  <Input
                    id="margem"
                    type="number"
                    value={newSegmento.configuracoes?.margem_padrao || 30}
                    onChange={(e) => setNewSegmento(prev => ({ 
                      ...prev, 
                      configuracoes: { 
                        ...prev.configuracoes, 
                        margem_padrao: parseInt(e.target.value) || 30 
                      } 
                    }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="prazo">Prazo de Entrega</Label>
                  <Input
                    id="prazo"
                    value={newSegmento.configuracoes?.prazo_entrega_padrao || '15 dias'}
                    onChange={(e) => setNewSegmento(prev => ({ 
                      ...prev, 
                      configuracoes: { 
                        ...prev.configuracoes, 
                        prazo_entrega_padrao: e.target.value 
                      } 
                    }))}
                    placeholder="15 dias"
                  />
                </div>
                
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="observacoes">Observações Padrão</Label>
                  <Textarea
                    id="observacoes"
                    value={newSegmento.configuracoes?.observacoes_padrao || ''}
                    onChange={(e) => setNewSegmento(prev => ({ 
                      ...prev, 
                      configuracoes: { 
                        ...prev.configuracoes, 
                        observacoes_padrao: e.target.value 
                      } 
                    }))}
                    rows={2}
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsCreateModalOpen(false)
              setNewSegmento(initialSegmentoState)
            }}>
              Cancelar
            </Button>
            <Button 
              onClick={() => {
                createSegmento.mutate(newSegmento, {
                  onSuccess: async (result) => {
                    setIsCreateModalOpen(false)
                    setNewSegmento(initialSegmentoState)
                    
                    // Criar notificação no banco
                    await createDatabaseNotification({
                      tipo: 'segmento_criado',
                      categoria: 'sistema',
                      titulo: 'Segmento Criado',
                      descricao: `Segmento "${newSegmento.nome}" foi criado com sucesso`,
                      referencia_id: result.id,
                      referencia_tipo: 'segmento',
                      prioridade: 'normal'
                    })
                  },
                  onError: () => {
                    toast.error('Erro ao criar segmento')
                  }
                })
              }}
              disabled={!newSegmento.nome || !newSegmento.codigo || !newSegmento.categoria_id || createSegmento.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {createSegmento.isPending ? 'Criando...' : 'Criar Segmento'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {selectedSegmento && (
                <>
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ 
                      background: `linear-gradient(135deg, ${selectedSegmento.cor}15 0%, ${selectedSegmento.cor}25 100%)`,
                      border: `2px solid ${selectedSegmento.cor}20`
                    }}
                  >
                    {(() => {
                      const Icon = getIconComponent(selectedSegmento.icone || 'Layers')
                      return <Icon className="h-5 w-5" style={{ color: selectedSegmento.cor }} />
                    })()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      {selectedSegmento.nome}
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        selectedSegmento.status === 'ativo' 
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                      }`}>
                        {selectedSegmento.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 font-normal">#{selectedSegmento.codigo}</p>
                  </div>
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          
          {selectedSegmento && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Categoria</Label>
                  <p className="text-sm font-semibold">{getCategoryName(selectedSegmento.categoria_id)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Produtos</Label>
                  <p className="text-sm font-semibold">{getProductCount(selectedSegmento.id)} produtos</p>
                </div>
              </div>

              {selectedSegmento.descricao && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Descrição</Label>
                  <p className="text-sm mt-1 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    {selectedSegmento.descricao}
                  </p>
                </div>
              )}

              <div>
                <Label className="text-sm font-medium text-gray-500 mb-3 block">Configurações</Label>
                <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
                  <div>
                    <Label className="text-xs text-gray-500">Margem Padrão</Label>
                    <p className="text-sm font-semibold">{selectedSegmento.configuracoes?.margem_padrao || 30}%</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Prazo de Entrega</Label>
                    <p className="text-sm font-semibold">{selectedSegmento.configuracoes?.prazo_entrega_padrao || '15 dias'}</p>
                  </div>
                  {selectedSegmento.configuracoes?.observacoes_padrao && (
                    <div className="col-span-2">
                      <Label className="text-xs text-gray-500">Observações Padrão</Label>
                      <p className="text-sm mt-1">{selectedSegmento.configuracoes.observacoes_padrao}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
                <div>
                  <Label>Criado em</Label>
                  <p>{new Date(selectedSegmento.created_at).toLocaleDateString('pt-BR')}</p>
                </div>
                <div>
                  <Label>Atualizado em</Label>
                  <p>{new Date(selectedSegmento.updated_at).toLocaleDateString('pt-BR')}</p>
                </div>
              </div>
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
            <DialogTitle>Editar Segmento</DialogTitle>
            <DialogDescription>
              Modifique os dados do segmento
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-categoria">Categoria *</Label>
                <Select 
                  value={editSegmento.categoria_id} 
                  onValueChange={(value) => setEditSegmento(prev => ({ ...prev, categoria_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categorias.map((categoria) => (
                      <SelectItem key={categoria.id} value={categoria.id}>
                        {categoria.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select 
                  value={editSegmento.status} 
                  onValueChange={(value: 'ativo' | 'inativo') => setEditSegmento(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="inativo">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-nome">Nome *</Label>
                <Input
                  id="edit-nome"
                  value={editSegmento.nome}
                  onChange={(e) => setEditSegmento(prev => ({ ...prev, nome: e.target.value }))}
                  placeholder="Nome do segmento"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-codigo">Código *</Label>
                <Input
                  id="edit-codigo"
                  value={editSegmento.codigo}
                  onChange={(e) => setEditSegmento(prev => ({ ...prev, codigo: e.target.value.toUpperCase() }))}
                  placeholder="CÓDIGO"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-descricao">Descrição</Label>
              <Textarea
                id="edit-descricao"
                value={editSegmento.descricao}
                onChange={(e) => setEditSegmento(prev => ({ ...prev, descricao: e.target.value }))}
                placeholder="Descrição do segmento"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-icone">Ícone</Label>
                <Select 
                  value={editSegmento.icone} 
                  onValueChange={(value) => setEditSegmento(prev => ({ ...prev, icone: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {Object.keys(iconMap).map((iconName) => {
                      const IconComponent = iconMap[iconName as keyof typeof iconMap]
                      return (
                        <SelectItem key={iconName} value={iconName}>
                          <div className="flex items-center gap-2">
                            <IconComponent className="h-4 w-4" />
                            <span>{iconName}</span>
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-cor">Cor</Label>
                <div className="flex gap-2">
                  <Input
                    id="edit-cor"
                    type="color"
                    value={editSegmento.cor}
                    onChange={(e) => setEditSegmento(prev => ({ ...prev, cor: e.target.value }))}
                    className="w-16 h-10 p-1 border rounded"
                  />
                  <Input
                    value={editSegmento.cor}
                    onChange={(e) => setEditSegmento(prev => ({ ...prev, cor: e.target.value }))}
                    placeholder="#8B5CF6"
                    className="flex-1"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <Label>Configurações</Label>
              <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
                <div className="space-y-2">
                  <Label htmlFor="edit-margem">Margem Padrão (%)</Label>
                  <Input
                    id="edit-margem"
                    type="number"
                    value={editSegmento.configuracoes?.margem_padrao || 30}
                    onChange={(e) => setEditSegmento(prev => ({ 
                      ...prev, 
                      configuracoes: { 
                        ...prev.configuracoes, 
                        margem_padrao: parseInt(e.target.value) || 30 
                      } 
                    }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-prazo">Prazo de Entrega</Label>
                  <Input
                    id="edit-prazo"
                    value={editSegmento.configuracoes?.prazo_entrega_padrao || '15 dias'}
                    onChange={(e) => setEditSegmento(prev => ({ 
                      ...prev, 
                      configuracoes: { 
                        ...prev.configuracoes, 
                        prazo_entrega_padrao: e.target.value 
                      } 
                    }))}
                    placeholder="15 dias"
                  />
                </div>
                
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="edit-observacoes">Observações Padrão</Label>
                  <Textarea
                    id="edit-observacoes"
                    value={editSegmento.configuracoes?.observacoes_padrao || ''}
                    onChange={(e) => setEditSegmento(prev => ({ 
                      ...prev, 
                      configuracoes: { 
                        ...prev.configuracoes, 
                        observacoes_padrao: e.target.value 
                      } 
                    }))}
                    rows={2}
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsEditModalOpen(false)
              setEditSegmento(initialSegmentoState)
            }}>
              Cancelar
            </Button>
            <Button 
              onClick={() => {
                if (selectedSegmento) {
                  updateSegmento.mutate({ id: selectedSegmento.id, data: editSegmento }, {
                    onSuccess: async () => {
                      setIsEditModalOpen(false)
                      setEditSegmento(initialSegmentoState)
                      setSelectedSegmento(null)
                      
                      // Criar notificação no banco
                      await createDatabaseNotification({
                        tipo: 'segmento_atualizado',
                        categoria: 'sistema',
                        titulo: 'Segmento Atualizado',
                        descricao: `Segmento "${editSegmento.nome}" foi atualizado com sucesso`,
                        referencia_id: selectedSegmento.id,
                        referencia_tipo: 'segmento',
                        prioridade: 'normal'
                      })
                    },
                    onError: () => {
                      toast.error('Erro ao atualizar segmento')
                    }
                  })
                }
              }}
              disabled={!editSegmento.nome || !editSegmento.codigo || !editSegmento.categoria_id || updateSegmento.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {updateSegmento.isPending ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={!!segmentoToDelete} onOpenChange={() => setSegmentoToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir este segmento? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setSegmentoToDelete(null)}>
              Cancelar
            </Button>
            <Button 
              variant="destructive"
              onClick={() => {
                if (segmentoToDelete) {
                  deleteSegmento.mutate(segmentoToDelete, {
                    onSuccess: () => {
                      setSegmentoToDelete(null)
                    },
                    onError: () => {
                      toast.error('Erro ao excluir segmento')
                    }
                  })
                }
              }}
              disabled={deleteSegmento.isPending}
            >
              {deleteSegmento.isPending ? 'Excluindo...' : 'Excluir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
