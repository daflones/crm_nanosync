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
  Tag,
  Edit,
  Trash2,
  Package,
  Eye
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
import { useCategorias, useCreateCategoria, useUpdateCategoria, useDeleteCategoria } from '@/hooks/useCategorias'
import { useProdutos } from '@/hooks/useProdutos'
import { toast } from 'sonner'
import { useNotifications } from '@/contexts/NotificationContext'
import type { Categoria, CategoriaCreateData } from '@/services/api/categorias'

// Icon mapping for better organization
const iconMap = {
  // Products & Packaging
  Package, Box, ShoppingBag, Gift,
  // Documents & Files  
  FileText, Sticker,
  // Technology
  Monitor, Smartphone, Laptop, Camera, Headphones,
  // Lifestyle & Fashion
  Shirt, Home, Car,
  // Food & Beverage
  Utensils, Coffee,
  // Entertainment
  Gamepad2, Music, Book,
  // Special & Premium
  Heart, Star, Crown, Diamond, Sparkles, Zap, Flame,
  // Basic
  Layers, Hash, Palette, Settings
}

const getIconComponent = (iconName: string) => {
  return iconMap[iconName as keyof typeof iconMap] || Package
}

const initialCategoriaState = {
  nome: '',
  codigo: '',
  descricao: '',
  icone: 'Package',
  cor: '#8B5CF6',
  status: 'ativo' as const,
  ordem: 0
}

export function CategoriasPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategoria, setSelectedCategoria] = useState<Categoria | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [newCategoria, setNewCategoria] = useState<CategoriaCreateData>(initialCategoriaState)
  const [editCategoria, setEditCategoria] = useState<CategoriaCreateData>(initialCategoriaState)
  const [categoriaToDelete, setCategoriaToDelete] = useState<string | null>(null)

  // Hooks
  const { data: categorias = [], isLoading } = useCategorias()
  const { data: produtos = [] } = useProdutos()
  const createCategoria = useCreateCategoria()
  const updateCategoria = useUpdateCategoria()
  const deleteCategoria = useDeleteCategoria()
  const { createDatabaseNotification } = useNotifications()

  // Calculate product count per category
  const getProductCount = (categoriaId: string) => {
    return produtos.filter(p => p.categoria_id === categoriaId).length
  }

  // Stats calculation
  const activeCategories = categorias.filter(c => c.status === 'ativo')
  
  // Only count products that have valid category_id (existing categories)
  const categoriaIds = new Set(categorias.map(c => c.id))
  const productsWithValidCategories = produtos.filter(p => 
    p.categoria_id && categoriaIds.has(p.categoria_id)
  )
  const totalProducts = productsWithValidCategories.length
  
  const mostPopularCategory = categorias.length > 0 ? categorias.reduce((prev, current) => {
    const prevCount = getProductCount(prev.id)
    const currentCount = getProductCount(current.id)
    return currentCount > prevCount ? current : prev
  }, categorias[0]) : null

  const stats = [
    {
      title: 'Total de Categorias',
      value: categorias.length.toString(),
      description: `${activeCategories.length} ativas`,
      icon: Tag,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20'
    },
    {
      title: 'Total de Produtos',
      value: totalProducts.toString(),
      description: 'Em todas as categorias',
      icon: Package,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/20'
    },
    {
      title: 'Categoria Popular',
      value: mostPopularCategory?.nome || 'N/A',
      description: `${mostPopularCategory ? getProductCount(mostPopularCategory.id) : 0} produtos`,
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
            Categorias
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Organize seus produtos em categorias
          </p>
        </div>
        <PlanoAtivoButton
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-primary-600 hover:bg-primary-700"
          variant="primary"
        >
          <Plus className="mr-2 h-4 w-4" />
          Nova Categoria
        </PlanoAtivoButton>
      </div>

      {/* Stats */}
      <div className="w-full flex flex-wrap gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title} className="dark:bg-gray-800 flex-1 min-w-[200px] max-w-[300px]">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium whitespace-nowrap">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground whitespace-nowrap">
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
          placeholder="Buscar categorias..."
          className="pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Categories Grid */}
      {isLoading ? (
        <div className="text-center py-8">
          <p className="text-gray-500">Carregando categorias...</p>
        </div>
      ) : categorias.length === 0 ? (
        <div className="w-full flex justify-center items-center py-16">
          <Card className="max-w-md w-full text-center border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-primary-400 dark:hover:border-primary-500 transition-colors duration-200">
            <CardHeader className="pb-4">
              <div className="mx-auto w-16 h-16 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center mb-4">
                <Tag className="h-8 w-8 text-primary-600 dark:text-primary-400" />
              </div>
              <CardTitle className="text-xl text-gray-900 dark:text-white">
                Nenhuma categoria encontrada
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Crie sua primeira categoria para organizar seus produtos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PlanoAtivoButton
                onClick={() => setIsCreateModalOpen(true)}
                className="w-full bg-primary-600 hover:bg-primary-700"
                variant="primary"
              >
                <Plus className="mr-2 h-4 w-4" />
                Criar primeira categoria
              </PlanoAtivoButton>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="w-full flex flex-wrap gap-4">
          {categorias
            .filter(cat => 
              cat.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
              (cat.descricao && cat.descricao.toLowerCase().includes(searchTerm.toLowerCase()))
            )
            .map((categoria) => {
              const Icon = getIconComponent(categoria.icone || 'Package')
              const productCount = getProductCount(categoria.id)
              
              return (
                <Card key={categoria.id} className="group relative overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-700/50 border-0 shadow-md dark:border-gray-700 flex-grow-0 flex-shrink-0 w-auto min-w-[280px] max-w-[350px]">
                  {/* Decorative gradient overlay */}
                  <div 
                    className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-300"
                    style={{ 
                      background: `linear-gradient(135deg, ${categoria.cor}20 0%, ${categoria.cor}10 100%)` 
                    }}
                  />
                  
                  <CardHeader className="pb-4 relative z-10">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="relative">
                          <div 
                            className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110"
                            style={{ 
                              background: `linear-gradient(135deg, ${categoria.cor}15 0%, ${categoria.cor}25 100%)`,
                              border: `2px solid ${categoria.cor}20`
                            }}
                          >
                            <Icon className="h-7 w-7 transition-all duration-300 group-hover:scale-110" style={{ color: categoria.cor }} />
                          </div>
                          {categoria.status === 'ativo' && (
                            <div 
                              className="absolute -top-1 -right-1 w-4 h-4 rounded-full shadow-sm"
                              style={{ backgroundColor: categoria.cor }}
                            >
                              <div className="w-full h-full rounded-full bg-white/30 dark:bg-gray-800/30 animate-pulse" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <CardTitle className="text-lg font-bold flex items-center gap-3 text-gray-900 dark:text-white">
                            <span className="truncate">
                              {categoria.nome}
                            </span>
                            {categoria.status === 'inativo' && (
                              <span className="px-3 py-1 text-xs bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400 rounded-full font-medium">
                                Inativo
                              </span>
                            )}
                          </CardTitle>
                          <CardDescription className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">
                            #{categoria.codigo}
                          </CardDescription>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4 relative z-10">
                    {categoria.descricao && (
                      <div className="bg-gray-50/80 dark:bg-gray-800/50 rounded-lg p-3 border border-gray-100 dark:border-gray-700">
                        <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2 leading-relaxed">
                          {categoria.descricao}
                        </p>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                      <div className="flex items-center space-x-2">
                        <div 
                          className="p-2 rounded-lg"
                          style={{ backgroundColor: categoria.cor + '15' }}
                        >
                          <Package className="h-4 w-4" style={{ color: categoria.cor }} />
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
                            setSelectedCategoria(categoria)
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
                            setSelectedCategoria(categoria)
                            setEditCategoria({
                              nome: categoria.nome,
                              codigo: categoria.codigo,
                              descricao: categoria.descricao || '',
                              icone: categoria.icone || 'Package',
                              cor: categoria.cor || '#8B5CF6',
                              status: categoria.status,
                              ordem: categoria.ordem || 0
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
                          onClick={() => setCategoriaToDelete(categoria.id)}
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

      {/* CRUD Handlers */}
      {(() => {
        const handleCreateCategoria = async () => {
          try {
            const result = await createCategoria.mutateAsync(newCategoria)
            setIsCreateModalOpen(false)
            setNewCategoria(initialCategoriaState)
            
            // Criar notificação no banco
            await createDatabaseNotification({
              tipo: 'categoria_criada',
              categoria: 'sistema',
              titulo: 'Categoria Criada',
              descricao: `Categoria "${newCategoria.nome}" foi criada com sucesso`,
              referencia_id: result.id,
              referencia_tipo: 'categoria',
              prioridade: 'normal'
            })
          } catch (error) {
            toast.error('Erro ao criar categoria')
          }
        }

        const handleUpdateCategoria = async () => {
          if (!selectedCategoria) return
          try {
            await updateCategoria.mutateAsync({ 
              id: selectedCategoria.id, 
              data: editCategoria 
            })
            setIsEditModalOpen(false)
            setSelectedCategoria(null)
            setEditCategoria(initialCategoriaState)
            
            // Criar notificação no banco
            await createDatabaseNotification({
              tipo: 'categoria_atualizada',
              categoria: 'sistema',
              titulo: 'Categoria Atualizada',
              descricao: `Categoria "${editCategoria.nome}" foi atualizada com sucesso`,
              referencia_id: selectedCategoria.id,
              referencia_tipo: 'categoria',
              prioridade: 'normal'
            })
          } catch (error) {
            toast.error('Erro ao atualizar categoria')
          }
        }

        const confirmDelete = () => {
          if (categoriaToDelete) {
            deleteCategoria.mutate(categoriaToDelete, {
              onSuccess: () => {
                setCategoriaToDelete(null)
              },
              onError: () => {
                toast.error('Erro ao excluir categoria')
              }
            })
          }
        }

        const cancelDelete = () => {
          setCategoriaToDelete(null)
        }

        return (
          <>
            {/* Create Modal */}
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Nova Categoria</DialogTitle>
                  <DialogDescription>
                    Adicione uma nova categoria para organizar seus produtos.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="nome">Nome *</Label>
                    <Input
                      id="nome"
                      value={newCategoria.nome}
                      onChange={(e) => setNewCategoria({...newCategoria, nome: e.target.value})}
                      placeholder="Nome da categoria"
                    />
                  </div>
                  <div>
                    <Label htmlFor="codigo">Código *</Label>
                    <Input
                      id="codigo"
                      value={newCategoria.codigo}
                      onChange={(e) => setNewCategoria({...newCategoria, codigo: e.target.value})}
                      placeholder="Código único"
                    />
                  </div>
                  <div>
                    <Label htmlFor="descricao">Descrição</Label>
                    <Textarea
                      id="descricao"
                      value={newCategoria.descricao}
                      onChange={(e) => setNewCategoria({...newCategoria, descricao: e.target.value})}
                      placeholder="Descrição da categoria"
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="icone">Ícone</Label>
                      <Select value={newCategoria.icone} onValueChange={(value) => setNewCategoria({...newCategoria, icone: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Package">📦 Package</SelectItem>
                          <SelectItem value="Box">📦 Box</SelectItem>
                          <SelectItem value="ShoppingBag">🛍️ Shopping Bag</SelectItem>
                          <SelectItem value="Gift">🎁 Gift</SelectItem>
                          <SelectItem value="FileText">📄 File Text</SelectItem>
                          <SelectItem value="Sticker">🏷️ Sticker</SelectItem>
                          <SelectItem value="Monitor">🖥️ Monitor</SelectItem>
                          <SelectItem value="Smartphone">📱 Smartphone</SelectItem>
                          <SelectItem value="Laptop">💻 Laptop</SelectItem>
                          <SelectItem value="Camera">📷 Camera</SelectItem>
                          <SelectItem value="Headphones">🎧 Headphones</SelectItem>
                          <SelectItem value="Shirt">👕 Shirt</SelectItem>
                          <SelectItem value="Home">🏠 Home</SelectItem>
                          <SelectItem value="Car">🚗 Car</SelectItem>
                          <SelectItem value="Utensils">🍴 Utensils</SelectItem>
                          <SelectItem value="Coffee">☕ Coffee</SelectItem>
                          <SelectItem value="Gamepad2">🎮 Gamepad</SelectItem>
                          <SelectItem value="Music">🎵 Music</SelectItem>
                          <SelectItem value="Book">📚 Book</SelectItem>
                          <SelectItem value="Heart">❤️ Heart</SelectItem>
                          <SelectItem value="Star">⭐ Star</SelectItem>
                          <SelectItem value="Crown">👑 Crown</SelectItem>
                          <SelectItem value="Diamond">💎 Diamond</SelectItem>
                          <SelectItem value="Sparkles">✨ Sparkles</SelectItem>
                          <SelectItem value="Zap">⚡ Zap</SelectItem>
                          <SelectItem value="Flame">🔥 Flame</SelectItem>
                          <SelectItem value="Layers">📚 Layers</SelectItem>
                          <SelectItem value="Hash"># Hash</SelectItem>
                          <SelectItem value="Palette">🎨 Palette</SelectItem>
                          <SelectItem value="Settings">⚙️ Settings</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="cor">Cor</Label>
                      <Input
                        id="cor"
                        type="color"
                        value={newCategoria.cor}
                        onChange={(e) => setNewCategoria({...newCategoria, cor: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="status">Status</Label>
                      <Select value={newCategoria.status} onValueChange={(value: 'ativo' | 'inativo') => setNewCategoria({...newCategoria, status: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ativo">Ativo</SelectItem>
                          <SelectItem value="inativo">Inativo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="ordem">Ordem</Label>
                      <Input
                        id="ordem"
                        type="number"
                        value={newCategoria.ordem}
                        onChange={(e) => setNewCategoria({...newCategoria, ordem: parseInt(e.target.value) || 0})}
                        min="0"
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCreateCategoria} disabled={!newCategoria.nome || !newCategoria.codigo}>
                    Criar Categoria
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* View Modal */}
            <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Detalhes da Categoria</DialogTitle>
                </DialogHeader>
                {selectedCategoria && (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-12 h-12 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: selectedCategoria.cor + '20' }}
                      >
                        {(() => {
                          const Icon = getIconComponent(selectedCategoria.icone || 'Package')
                          return <Icon className="h-6 w-6" style={{ color: selectedCategoria.cor }} />
                        })()}
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{selectedCategoria.nome}</h3>
                        <p className="text-sm text-gray-500">Código: {selectedCategoria.codigo}</p>
                      </div>
                    </div>
                    
                    {selectedCategoria.descricao && (
                      <div>
                        <Label>Descrição</Label>
                        <p className="text-sm text-gray-600 mt-1">{selectedCategoria.descricao}</p>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <Label>Status</Label>
                        <p className={`mt-1 ${selectedCategoria.status === 'ativo' ? 'text-green-600' : 'text-red-600'}`}>
                          {selectedCategoria.status === 'ativo' ? 'Ativo' : 'Inativo'}
                        </p>
                      </div>
                      <div>
                        <Label>Produtos</Label>
                        <p className="mt-1">{getProductCount(selectedCategoria.id)} produtos</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <Label>Ordem</Label>
                        <p className="mt-1">{selectedCategoria.ordem}</p>
                      </div>
                      <div>
                        <Label>Criado em</Label>
                        <p className="mt-1">{new Date(selectedCategoria.created_at).toLocaleDateString('pt-BR')}</p>
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
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Editar Categoria</DialogTitle>
                  <DialogDescription>
                    Modifique as informações da categoria.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="edit-nome">Nome *</Label>
                    <Input
                      id="edit-nome"
                      value={editCategoria.nome}
                      onChange={(e) => setEditCategoria({...editCategoria, nome: e.target.value})}
                      placeholder="Nome da categoria"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-codigo">Código *</Label>
                    <Input
                      id="edit-codigo"
                      value={editCategoria.codigo}
                      onChange={(e) => setEditCategoria({...editCategoria, codigo: e.target.value})}
                      placeholder="Código único"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-descricao">Descrição</Label>
                    <Textarea
                      id="edit-descricao"
                      value={editCategoria.descricao}
                      onChange={(e) => setEditCategoria({...editCategoria, descricao: e.target.value})}
                      placeholder="Descrição da categoria"
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-icone">Ícone</Label>
                      <Select value={editCategoria.icone} onValueChange={(value) => setEditCategoria({...editCategoria, icone: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Package">📦 Package</SelectItem>
                          <SelectItem value="Box">📦 Box</SelectItem>
                          <SelectItem value="ShoppingBag">🛍️ Shopping Bag</SelectItem>
                          <SelectItem value="Gift">🎁 Gift</SelectItem>
                          <SelectItem value="FileText">📄 File Text</SelectItem>
                          <SelectItem value="Sticker">🏷️ Sticker</SelectItem>
                          <SelectItem value="Monitor">🖥️ Monitor</SelectItem>
                          <SelectItem value="Smartphone">📱 Smartphone</SelectItem>
                          <SelectItem value="Laptop">💻 Laptop</SelectItem>
                          <SelectItem value="Camera">📷 Camera</SelectItem>
                          <SelectItem value="Headphones">🎧 Headphones</SelectItem>
                          <SelectItem value="Shirt">👕 Shirt</SelectItem>
                          <SelectItem value="Home">🏠 Home</SelectItem>
                          <SelectItem value="Car">🚗 Car</SelectItem>
                          <SelectItem value="Utensils">🍴 Utensils</SelectItem>
                          <SelectItem value="Coffee">☕ Coffee</SelectItem>
                          <SelectItem value="Gamepad2">🎮 Gamepad</SelectItem>
                          <SelectItem value="Music">🎵 Music</SelectItem>
                          <SelectItem value="Book">📚 Book</SelectItem>
                          <SelectItem value="Heart">❤️ Heart</SelectItem>
                          <SelectItem value="Star">⭐ Star</SelectItem>
                          <SelectItem value="Crown">👑 Crown</SelectItem>
                          <SelectItem value="Diamond">💎 Diamond</SelectItem>
                          <SelectItem value="Sparkles">✨ Sparkles</SelectItem>
                          <SelectItem value="Zap">⚡ Zap</SelectItem>
                          <SelectItem value="Flame">🔥 Flame</SelectItem>
                          <SelectItem value="Layers">📚 Layers</SelectItem>
                          <SelectItem value="Hash"># Hash</SelectItem>
                          <SelectItem value="Palette">🎨 Palette</SelectItem>
                          <SelectItem value="Settings">⚙️ Settings</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="edit-cor">Cor</Label>
                      <Input
                        id="edit-cor"
                        type="color"
                        value={editCategoria.cor}
                        onChange={(e) => setEditCategoria({...editCategoria, cor: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-status">Status</Label>
                      <Select value={editCategoria.status} onValueChange={(value: 'ativo' | 'inativo') => setEditCategoria({...editCategoria, status: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ativo">Ativo</SelectItem>
                          <SelectItem value="inativo">Inativo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="edit-ordem">Ordem</Label>
                      <Input
                        id="edit-ordem"
                        type="number"
                        value={editCategoria.ordem}
                        onChange={(e) => setEditCategoria({...editCategoria, ordem: parseInt(e.target.value) || 0})}
                        min="0"
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleUpdateCategoria} disabled={!editCategoria.nome || !editCategoria.codigo}>
                    Salvar Alterações
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={!!categoriaToDelete} onOpenChange={() => setCategoriaToDelete(null)}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Confirmar Exclusão</DialogTitle>
                  <DialogDescription>
                    Tem certeza que deseja excluir esta categoria? Esta ação não pode ser desfeita.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={cancelDelete}>
                    Cancelar
                  </Button>
                  <Button variant="destructive" onClick={confirmDelete}>
                    Excluir
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        )
      })()}
    </div>
  )
}
