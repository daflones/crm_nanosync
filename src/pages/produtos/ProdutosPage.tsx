import { useState, useMemo, useEffect } from 'react'
import { Plus, Pencil, Trash, Eye, Package, X, Upload, Image } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Card,
  CardContent,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { useProdutos, useProdutosStatusStats, useCreateProduto, useUpdateProduto, useDeleteProduto } from '@/hooks/useProdutos'
import { useCategorias } from '@/hooks/useCategorias'
import { useSegmentos } from '@/hooks/useSegmentos'
import { useIsAdmin } from '@/hooks/useAuth'
import { PlanoAtivoButton } from '@/components/PlanoAtivoGuard'
import { storageService } from '@/services/storage'
import { toast } from 'sonner'
import { useNotifications } from '@/contexts/NotificationContext'
import type { Produto, ProdutoCreateData, ProdutoUpdateData } from '@/services/api/produtos'

export function ProdutosPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedProduto, setSelectedProduto] = useState<Produto | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [selectedImageName, setSelectedImageName] = useState<string>('')
  const [uploadingImage, setUploadingImage] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [limit] = useState(50) // 50 produtos por página
  const [productToDelete, setProductToDelete] = useState<string | null>(null)

  // Hooks com paginação
  const { data: produtos = [], count: totalProdutosFiltered = 0, isLoading } = useProdutos({
    page,
    limit,
    status: selectedStatus === 'all' ? undefined : selectedStatus
  })
  
  // Total geral (sempre fixo)
  const { count: totalProdutos = 0 } = useProdutos({ page: 1, limit: 1 })
  
  // Stats por status
  const { data: statusStats = {} } = useProdutosStatusStats()
  const { data: categorias = [] } = useCategorias()
  const { data: segmentos = [] } = useSegmentos()
  const createProduto = useCreateProduto()
  const updateProduto = useUpdateProduto()
  const deleteProduto = useDeleteProduto()
  const { createDatabaseNotification } = useNotifications()
  const isAdmin = useIsAdmin()

  // Initial form states
  const initialProductState: ProdutoCreateData = {
    nome: '',
    codigo: '',
    descricao: '',
    resumo: '',
    valor_unitario: 0,
    categoria_id: '',
    segmento_id: '',
    unidade: 'un',
    especificacoes: '',
    dimensoes: '',
    peso: '',
    material: '',
    cores_disponiveis: [],
    acabamento: '',
    embalagem: '',
    prazo_entrega: '15 dias',
    minimo_pedido: 1,
    multiplo_venda: 1,
    tabela_desconto: [],
    imagem_principal: '',
    galeria_imagens: [],
    video_url: '',
    catalogo_url: '',
    ficha_tecnica_url: '',
    status: 'ativo',
    destaque: false,
    mais_vendido: false,
    novidade: false,
    tags: [],
    palavras_chave: [],
    controla_estoque: false,
    estoque_atual: 0,
    estoque_minimo: 0
  }

  const [newProduct, setNewProduct] = useState<ProdutoCreateData>(initialProductState)
  const [editProduct, setEditProduct] = useState<ProdutoUpdateData>(initialProductState)

  // Filtro de busca local (apenas busca, status é no backend)
  const filteredProducts = searchTerm
    ? produtos.filter(product => {
        const searchLower = searchTerm.toLowerCase()
        return product.nome.toLowerCase().includes(searchLower) ||
               product.codigo?.toLowerCase().includes(searchLower) ||
               product.material?.toLowerCase().includes(searchLower)
      })
    : produtos

  // Calculate stats (usando dados do banco)
  const stats = useMemo(() => {
    const total = totalProdutos
    const ativos = statusStats['ativo'] || 0
    const baixo_estoque = produtos.filter(p => 
      p.controla_estoque && 
      (p.estoque_atual ?? 0) <= (p.estoque_minimo ?? 0)
    ).length
    const em_destaque = produtos.filter(p => p.destaque).length
    
    return {
      total,
      ativos,
      baixo_estoque,
      em_destaque
    }
  }, [produtos, totalProdutos, statusStats])

  // Paginação
  const totalPages = Math.ceil(totalProdutosFiltered / limit)
  const hasMore = page < totalPages
  const showingFrom = (page - 1) * limit + 1
  const showingTo = Math.min(page * limit, totalProdutosFiltered)

  // Reset page when filters change
  useEffect(() => {
    setPage(1)
  }, [searchTerm, selectedCategory, selectedStatus])

  const handleLoadMore = () => {
    setPage(prev => prev + 1)
  }

  // Handlers
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedImage(file)
      setSelectedImageName(file.name)
    }
  }

  const handleImageUpload = async (productId: string) => {
    if (!selectedImage) return ''
    
    setUploadingImage(true)
    try {
      const imageUrl = await storageService.uploadProductImage(selectedImage, productId)
      setSelectedImage(null)
      setSelectedImageName('')
      return imageUrl
    } catch (error) {
      toast.error('Erro ao fazer upload da imagem')
      return ''
    } finally {
      setUploadingImage(false)
    }
  }

  const handleCreateProduct = async () => {
    if (!isAdmin) {
      toast.error('Apenas administradores podem criar produtos')
      return
    }

    if (!newProduct.nome || !newProduct.codigo) {
      toast.error('Nome e código são obrigatórios')
      return
    }

    try {
      // First create the product without image
      const result = await createProduto.mutateAsync({
        ...newProduct,
        imagem_principal: ''
      })

      // Then upload image if selected and update the product
      let imageUrl = ''
      if (selectedImage) {
        imageUrl = await handleImageUpload(result.id)
        
        // Update product with image URL
        await updateProduto.mutateAsync({
          id: result.id,
          data: { imagem_principal: imageUrl }
        })
      }
      setIsCreateModalOpen(false)
      setNewProduct(initialProductState)
      setSelectedImage(null)
      setSelectedImageName('')
      
      // Criar notificação no banco
      await createDatabaseNotification({
        tipo: 'produto_criado',
        categoria: 'sistema',
        titulo: 'Produto Criado',
        descricao: `Produto "${newProduct.nome}" foi criado com sucesso`,
        referencia_id: result.id,
        referencia_tipo: 'produto',
        prioridade: 'normal'
      })
    } catch (error) {
      toast.error(`Erro ao criar produto: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    }
  }

  const handleUpdateProduct = async () => {
    if (!isAdmin) {
      toast.error('Apenas administradores podem editar produtos')
      return
    }

    if (!selectedProduto || !editProduct.nome || !editProduct.codigo) {
      toast.error('Nome e código são obrigatórios')
      return
    }

    try {
      let updatedProductData = { ...editProduct }
      
      // Upload image if selected
      if (selectedImage) {
        const imageUrl = await handleImageUpload(selectedProduto.id)
        updatedProductData.imagem_principal = imageUrl
      }
      
      await updateProduto.mutateAsync({
        id: selectedProduto.id,
        data: updatedProductData
      })
      setIsEditModalOpen(false)
      setSelectedProduto(null)
      setEditProduct(initialProductState)
      setSelectedImage(null)
      setSelectedImageName('')
      
      // Criar notificação no banco
      await createDatabaseNotification({
        tipo: 'produto_atualizado',
        categoria: 'sistema',
        titulo: 'Produto Atualizado',
        descricao: `Produto "${editProduct.nome}" foi atualizado com sucesso`,
        referencia_id: selectedProduto.id,
        referencia_tipo: 'produto',
        prioridade: 'normal'
      })
    } catch (error) {
      console.error('Erro ao atualizar produto:', error)
      toast.error(`Erro ao atualizar produto: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    }
  }

  const handleDeleteProduct = (id: string) => {
    setProductToDelete(id)
  }

  const confirmDelete = () => {
    if (!isAdmin) {
      toast.error('Apenas administradores podem excluir produtos')
      return
    }

    if (productToDelete) {
      deleteProduto.mutate(productToDelete, {
        onSuccess: () => {
          setProductToDelete(null)
        },
        onError: (error) => {
          console.error('Erro ao excluir produto:', error)
          setProductToDelete(null)
        }
      })
    }
  }

  const cancelDelete = () => {
    setProductToDelete(null)
  }

  const handleEditProduct = (product: Produto) => {
    setSelectedProduto(product)
    setEditProduct({
      nome: product.nome,
      codigo: product.codigo || '',
      descricao: product.descricao || '',
      resumo: product.resumo || '',
      valor_unitario: product.valor_unitario || 0,
      categoria_id: product.categoria_id || '',
      segmento_id: product.segmento_id || '',
      unidade: product.unidade || 'un',
      especificacoes: typeof product.especificacoes === 'string' 
        ? product.especificacoes 
        : (product.especificacoes ? JSON.stringify(product.especificacoes, null, 2) : ''),
      dimensoes: product.dimensoes || '',
      peso: product.peso || '',
      material: product.material || '',
      cores_disponiveis: product.cores_disponiveis || [],
      acabamento: product.acabamento || '',
      embalagem: product.embalagem || '',
      prazo_entrega: product.prazo_entrega || '15 dias',
      minimo_pedido: product.minimo_pedido || 1,
      multiplo_venda: product.multiplo_venda || 1,
      tabela_desconto: product.tabela_desconto || [],
      imagem_principal: product.imagem_principal || '',
      galeria_imagens: product.galeria_imagens || [],
      video_url: product.video_url || '',
      catalogo_url: product.catalogo_url || '',
      ficha_tecnica_url: product.ficha_tecnica_url || '',
      status: product.status || 'ativo',
      destaque: product.destaque || false,
      mais_vendido: product.mais_vendido || false,
      novidade: product.novidade || false,
      tags: product.tags || [],
      palavras_chave: product.palavras_chave || [],
      controla_estoque: product.controla_estoque || false,
      estoque_atual: product.estoque_atual || 0,
      estoque_minimo: product.estoque_minimo || 0
    })
    setIsEditModalOpen(true)
  }

  const handleViewProduct = (product: Produto) => {
    setSelectedProduto(product)
    setIsViewModalOpen(true)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Produtos</h1>
        {isAdmin && (
          <PlanoAtivoButton onClick={() => setIsCreateModalOpen(true)} variant="primary">
            <Plus className="w-4 h-4 mr-2" />
            Novo Produto
          </PlanoAtivoButton>
        )}
      </div>

      {/* Filters */}
      <Card className="dark:bg-gray-800">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              placeholder="Buscar produtos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Todas as categorias" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                {categorias.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="inativo">Inativo</SelectItem>
                <SelectItem value="descontinuado">Descontinuado</SelectItem>
                <SelectItem value="em_desenvolvimento">Em Desenvolvimento</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => {
              setSearchTerm('')
              setSelectedCategory('all')
              setSelectedStatus('all')
            }}>
              <X className="w-4 h-4 mr-2" />
              Limpar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      {stats && (
        <div className="w-full grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="dark:bg-gray-800">
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Total de Produtos</div>
            </CardContent>
          </Card>
          <Card className="dark:bg-gray-800">
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{stats.ativos}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Produtos Ativos</div>
            </CardContent>
          </Card>
          <Card className="dark:bg-gray-800">
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{stats.em_destaque}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Em Destaque</div>
            </CardContent>
          </Card>
          <Card className="dark:bg-gray-800">
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{stats.baixo_estoque}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Baixo Estoque</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Products List */}
      <div className="w-full space-y-4">
        {filteredProducts.map((product) => (
          <Card key={product.id} className="group hover:shadow-lg transition-shadow duration-200 dark:bg-gray-800">
            <CardContent className="p-0 flex flex-row">
              {/* Product Image */}
              <div className="relative w-48 h-48 flex-shrink-0 overflow-hidden rounded-l-lg">
                {product.imagem_principal ? (
                  <img
                    src={product.imagem_principal}
                    alt={product.nome}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center">
                    <Package className="w-16 h-16 text-gray-400 dark:text-gray-500" />
                  </div>
                )}
                
                {/* Status Badge */}
                <div className="absolute top-3 left-3">
                  <Badge 
                    variant={product.status === 'ativo' ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {product.status}
                  </Badge>
                </div>

                {/* Highlight Badges */}
                <div className="absolute top-3 right-3 flex flex-col gap-1">
                  {product.destaque && (
                    <Badge variant="destructive" className="text-xs">Destaque</Badge>
                  )}
                  {product.mais_vendido && (
                    <Badge variant="default" className="text-xs bg-green-600">Top</Badge>
                  )}
                  {product.novidade && (
                    <Badge variant="default" className="text-xs bg-blue-600">Novo</Badge>
                  )}
                </div>

                {/* Low Stock Warning */}
                {product.controla_estoque && (product.estoque_atual ?? 0) <= (product.estoque_minimo ?? 0) && (
                  <div className="absolute bottom-3 left-3">
                    <Badge variant="destructive" className="text-xs">Baixo Estoque</Badge>
                  </div>
                )}
              </div>

              {/* Product Info - Flex grow to push buttons to bottom */}
              <div className="p-3 flex flex-col flex-1">
                <div className="flex-1 space-y-2">
                  <div>
                    <h3 className="font-semibold text-base line-clamp-2 mb-1">{product.nome}</h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Código: {product.codigo}</p>
                    {product.resumo && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{product.resumo}</p>
                    )}
                  </div>

                  {/* Price and Category */}
                  <div className="flex items-center gap-6">
                    <div>
                      <p className="text-xl font-bold text-primary">
                        R$ {product.valor_unitario?.toFixed(2) || '0.00'}
                      </p>
                      <p className="text-xs text-gray-500">por {product.unidade}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-700">
                        {product.categoria?.nome || 'Sem categoria'}
                      </p>
                      {product.material && (
                        <p className="text-xs text-gray-500">{product.material}</p>
                      )}
                    </div>
                  </div>

                  {/* Stock Info */}
                  {product.controla_estoque && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Estoque:</span>
                      <span className={`font-medium ${
                        (product.estoque_atual ?? 0) <= (product.estoque_minimo ?? 0) 
                          ? 'text-red-600' 
                          : 'text-green-600'
                      }`}>
                        {product.estoque_atual ?? 0} {product.unidade}
                      </span>
                    </div>
                  )}

                  {/* Product Details */}
                  <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-3">
                      {product.prazo_entrega && (
                        <span className="text-gray-600">{product.prazo_entrega}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons - Centered */}
                <div className="flex justify-center gap-2 pt-3 mt-auto border-t border-gray-100">
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleViewProduct(product)
                    }}
                    className="text-xs h-8 px-4 bg-blue-200 hover:bg-blue-300 text-blue-800"
                  >
                    <Eye className="w-3 h-3 mr-1" />
                    Ver
                  </Button>
                  {isAdmin && (
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handleEditProduct(product)
                      }}
                      className="h-8 px-3 bg-green-200 hover:bg-green-300 text-green-800"
                    >
                      <Pencil className="w-3 h-3" />
                    </Button>
                  )}
                  {isAdmin && (
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handleDeleteProduct(product.id)
                      }}
                      className="h-8 px-3 bg-red-200 hover:bg-red-300 text-red-800"
                    >
                      <Trash className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {/* Load More Button */}
        {hasMore && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Mostrando <span className="font-semibold">{showingFrom}</span> a <span className="font-semibold">{showingTo}</span> de <span className="font-semibold">{totalProdutosFiltered}</span> produtos
                {selectedStatus !== 'all' && <span className="ml-1">({selectedStatus})</span>}
              </div>
              {hasMore && (
                <Button
                  variant="outline"
                  onClick={handleLoadMore}
                  className="w-full sm:w-auto"
                  disabled={isLoading}
                >
                  {isLoading ? 'Carregando...' : `Carregar mais (${totalProdutosFiltered - showingTo} restantes)`}
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Empty State */}
      {filteredProducts.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum produto encontrado</h3>
            <p className="text-gray-500 mb-6">
              {searchTerm || selectedCategory !== 'all' || selectedStatus !== 'all'
                ? 'Tente ajustar os filtros para encontrar produtos.'
                : 'Comece criando seu primeiro produto.'}
            </p>
            {isAdmin && (
              <PlanoAtivoButton onClick={() => setIsCreateModalOpen(true)} variant="primary">
                <Plus className="w-4 h-4 mr-2" />
                Novo Produto
              </PlanoAtivoButton>
            )}
          </CardContent>
        </Card>
      )}

      {/* Pagination */}

      {/* Create Product Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Produto</DialogTitle>
            <DialogDescription>
              Preencha as informações do produto. Campos marcados com * são obrigatórios.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Basic Info */}
            <div className="space-y-2">
              <Label htmlFor="nome">Nome do Produto <span className="text-red-500">*</span></Label>
              <Input
                id="nome"
                value={newProduct.nome}
                onChange={(e) => setNewProduct({...newProduct, nome: e.target.value})}
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="codigo">Código <span className="text-red-500">*</span></Label>
                <Input
                  id="codigo"
                  value={newProduct.codigo}
                  onChange={(e) => setNewProduct({...newProduct, codigo: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="valor">Valor Unitário</Label>
                <Input
                  id="valor"
                  type="number"
                  step="0.01"
                  value={newProduct.valor_unitario}
                  onChange={(e) => setNewProduct({...newProduct, valor_unitario: parseFloat(e.target.value) || 0})}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="categoria">Categoria</Label>
                <Select value={newProduct.categoria_id} onValueChange={(v) => setNewProduct({...newProduct, categoria_id: v})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {categorias.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="segmento">Segmento</Label>
                <Select value={newProduct.segmento_id} onValueChange={(v) => setNewProduct({...newProduct, segmento_id: v})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {segmentos.map((seg) => (
                      <SelectItem key={seg.id} value={seg.id}>{seg.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="resumo">Resumo</Label>
              <Input
                id="resumo"
                value={newProduct.resumo}
                onChange={(e) => setNewProduct({...newProduct, resumo: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={newProduct.descricao}
                onChange={(e) => setNewProduct({...newProduct, descricao: e.target.value})}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="especificacoes">Especificações</Label>
              <Textarea
                id="especificacoes"
                value={newProduct.especificacoes}
                onChange={(e) => setNewProduct({...newProduct, especificacoes: e.target.value})}
                rows={3}
                placeholder="Detalhes técnicos e especificações do produto..."
              />
            </div>

            {/* Product Details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="material">Material</Label>
                <Input
                  id="material"
                  value={newProduct.material}
                  onChange={(e) => setNewProduct({...newProduct, material: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prazo">Prazo de Entrega</Label>
                <Input
                  id="prazo"
                  value={newProduct.prazo_entrega}
                  onChange={(e) => setNewProduct({...newProduct, prazo_entrega: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dimensoes">Dimensões</Label>
                <Input
                  id="dimensoes"
                  value={newProduct.dimensoes}
                  onChange={(e) => setNewProduct({...newProduct, dimensoes: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="peso">Peso</Label>
                <Input
                  id="peso"
                  value={newProduct.peso}
                  onChange={(e) => setNewProduct({...newProduct, peso: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unidade">Unidade</Label>
                <Input
                  id="unidade"
                  value={newProduct.unidade}
                  onChange={(e) => setNewProduct({...newProduct, unidade: e.target.value})}
                />
              </div>
            </div>

            {/* Stock Control */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="controla_estoque"
                  checked={newProduct.controla_estoque}
                  onChange={(e) => setNewProduct({...newProduct, controla_estoque: e.target.checked})}
                  className="rounded"
                />
                <Label htmlFor="controla_estoque">Controla Estoque</Label>
              </div>
              {newProduct.controla_estoque && (
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div className="space-y-2">
                    <Label htmlFor="estoque_atual">Estoque Atual</Label>
                    <Input
                      id="estoque_atual"
                      type="number"
                      value={newProduct.estoque_atual}
                      onChange={(e) => setNewProduct({...newProduct, estoque_atual: parseInt(e.target.value) || 0})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="estoque_minimo">Estoque Mínimo</Label>
                    <Input
                      id="estoque_minimo"
                      type="number"
                      value={newProduct.estoque_minimo}
                      onChange={(e) => setNewProduct({...newProduct, estoque_minimo: parseInt(e.target.value) || 0})}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Image Upload */}
            <div className="space-y-3">
              <Label>Imagem Principal do Produto</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                <div className="flex flex-col items-center space-y-2">
                  <div className="p-3 bg-gray-100 rounded-full">
                    <Upload className="h-6 w-6 text-gray-600" />
                  </div>
                  <div>
                    <label
                      htmlFor="image"
                      className="cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-500"
                    >
                      Clique para selecionar uma imagem
                    </label>
                    <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF até 10MB</p>
                  </div>
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                </div>
                {selectedImageName && (
                  <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded flex items-center justify-center space-x-2">
                    <Image className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-700 font-medium">{selectedImageName}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Highlights */}
            <div className="flex gap-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="destaque"
                  checked={newProduct.destaque}
                  onChange={(e) => setNewProduct({...newProduct, destaque: e.target.checked})}
                  className="rounded"
                />
                <Label htmlFor="destaque">Destaque</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="mais_vendido"
                  checked={newProduct.mais_vendido}
                  onChange={(e) => setNewProduct({...newProduct, mais_vendido: e.target.checked})}
                  className="rounded"
                />
                <Label htmlFor="mais_vendido">Mais Vendido</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="novidade"
                  checked={newProduct.novidade}
                  onChange={(e) => setNewProduct({...newProduct, novidade: e.target.checked})}
                  className="rounded"
                />
                <Label htmlFor="novidade">Novidade</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateProduct} disabled={uploadingImage}>
              {uploadingImage ? 'Salvando...' : 'Criar Produto'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Product Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Produto</DialogTitle>
            <DialogDescription>
              Visualize todas as informações do produto selecionado.
            </DialogDescription>
          </DialogHeader>
          {selectedProduto && (
            <div className="space-y-6">
              <div className="flex gap-6">
                <div className="flex-shrink-0">
                  {selectedProduto.imagem_principal ? (
                    <img
                      src={selectedProduto.imagem_principal}
                      alt={selectedProduto.nome}
                      className="w-48 h-48 rounded object-cover"
                    />
                  ) : (
                    <div className="w-48 h-48 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                      <Package className="w-24 h-24 text-gray-400 dark:text-gray-500" />
                    </div>
                  )}
                </div>
                <div className="flex-1 space-y-4">
                  <div>
                    <h3 className="text-2xl font-bold">{selectedProduto.nome}</h3>
                    <p className="text-gray-600">{selectedProduto.resumo}</p>
                  </div>
                  <div className="flex gap-2">
                    {selectedProduto.destaque && <Badge>Destaque</Badge>}
                    {selectedProduto.mais_vendido && <Badge>Mais Vendido</Badge>}
                    {selectedProduto.novidade && <Badge>Novidade</Badge>}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="font-semibold">Código:</Label>
                      <p>{selectedProduto.codigo || '-'}</p>
                    </div>
                    <div>
                      <Label className="font-semibold">Preço:</Label>
                      <p>R$ {selectedProduto.valor_unitario?.toFixed(2) || '0.00'} / {selectedProduto.unidade}</p>
                    </div>
                    <div>
                      <Label className="font-semibold">Categoria:</Label>
                      <p>{categorias.find(c => c.id === selectedProduto.categoria_id)?.nome || '-'}</p>
                    </div>
                    <div>
                      <Label className="font-semibold">Status:</Label>
                      <Badge variant={selectedProduto.status === 'ativo' ? 'default' : 'secondary'}>
                        {selectedProduto.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
              
              {selectedProduto.descricao && (
                <div>
                  <Label className="font-semibold">Descrição:</Label>
                  <p className="mt-1">{selectedProduto.descricao}</p>
                </div>
              )}

              {(() => {
                const specs = selectedProduto.especificacoes
                const hasSpecs = specs && 
                  (typeof specs === 'string' ? (specs.trim() !== '' && specs !== '{}') : Object.keys(specs).length > 0)
                const hasMaterial = selectedProduto.material
                const hasDimensoes = selectedProduto.dimensoes
                const hasPeso = selectedProduto.peso
                const hasAnySpec = hasSpecs || hasMaterial || hasDimensoes || hasPeso
                
                return (
                  <div className={hasAnySpec ? "grid grid-cols-2 gap-6" : "flex justify-center"}>
                    {hasAnySpec && (
                      <div className="space-y-3">
                        <h4 className="font-semibold">Especificações</h4>
                        {hasSpecs && (
                          <div>
                            <Label className="text-sm font-medium">Especificações Técnicas:</Label>
                            <p className="text-sm whitespace-pre-wrap">
                              {typeof specs === 'string' 
                                ? specs 
                                : JSON.stringify(specs, null, 2)
                              }
                            </p>
                          </div>
                        )}
                        {hasMaterial && (
                          <div>
                            <Label className="text-sm font-medium">Material:</Label>
                            <p className="text-sm">{selectedProduto.material}</p>
                          </div>
                        )}
                        {hasDimensoes && (
                          <div>
                            <Label className="text-sm font-medium">Dimensões:</Label>
                            <p className="text-sm">{selectedProduto.dimensoes}</p>
                          </div>
                        )}
                        {hasPeso && (
                          <div>
                            <Label className="text-sm font-medium">Peso:</Label>
                            <p className="text-sm">{selectedProduto.peso}</p>
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="space-y-3">
                      <h4 className="font-semibold">Informações Comerciais</h4>
                      <div>
                        <Label className="text-sm font-medium">Prazo de Entrega:</Label>
                        <p className="text-sm">{selectedProduto.prazo_entrega || '-'}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Pedido Mínimo:</Label>
                        <p className="text-sm">{selectedProduto.minimo_pedido || 1} {selectedProduto.unidade}</p>
                      </div>
                      {selectedProduto.controla_estoque && (
                        <div>
                          <Label className="text-sm font-medium">Estoque:</Label>
                          <p className="text-sm">{selectedProduto.estoque_atual} unidades</p>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })()}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Product Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Produto</DialogTitle>
            <DialogDescription>
              Modifique as informações do produto. Campos marcados com * são obrigatórios.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Basic Info */}
            <div className="space-y-2">
              <Label htmlFor="edit-nome">Nome do Produto <span className="text-red-500">*</span></Label>
              <Input
                id="edit-nome"
                value={editProduct.nome}
                onChange={(e) => setEditProduct({...editProduct, nome: e.target.value})}
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-codigo">Código <span className="text-red-500">*</span></Label>
                <Input
                  id="edit-codigo"
                  value={editProduct.codigo}
                  onChange={(e) => setEditProduct({...editProduct, codigo: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-valor">Valor Unitário</Label>
                <Input
                  id="edit-valor"
                  type="number"
                  step="0.01"
                  value={editProduct.valor_unitario}
                  onChange={(e) => setEditProduct({...editProduct, valor_unitario: parseFloat(e.target.value) || 0})}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-categoria">Categoria</Label>
                <Select value={editProduct.categoria_id} onValueChange={(v) => setEditProduct({...editProduct, categoria_id: v})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {categorias.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-segmento">Segmento</Label>
                <Select value={editProduct.segmento_id} onValueChange={(v) => setEditProduct({...editProduct, segmento_id: v})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {segmentos.map((seg) => (
                      <SelectItem key={seg.id} value={seg.id}>{seg.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select value={editProduct.status} onValueChange={(v) => setEditProduct({...editProduct, status: v as any})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="inativo">Inativo</SelectItem>
                    <SelectItem value="descontinuado">Descontinuado</SelectItem>
                    <SelectItem value="em_desenvolvimento">Em Desenvolvimento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-resumo">Resumo</Label>
              <Input
                id="edit-resumo"
                value={editProduct.resumo}
                onChange={(e) => setEditProduct({...editProduct, resumo: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-descricao">Descrição</Label>
              <Textarea
                id="edit-descricao"
                value={editProduct.descricao}
                onChange={(e) => setEditProduct({...editProduct, descricao: e.target.value})}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-especificacoes">Especificações</Label>
              <Textarea
                id="edit-especificacoes"
                value={editProduct.especificacoes}
                onChange={(e) => setEditProduct({...editProduct, especificacoes: e.target.value})}
                rows={3}
                placeholder="Detalhes técnicos e especificações do produto..."
              />
            </div>

            {/* Product Details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-material">Material</Label>
                <Input
                  id="edit-material"
                  value={editProduct.material}
                  onChange={(e) => setEditProduct({...editProduct, material: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-prazo">Prazo de Entrega</Label>
                <Input
                  id="edit-prazo"
                  value={editProduct.prazo_entrega}
                  onChange={(e) => setEditProduct({...editProduct, prazo_entrega: e.target.value})}
                />
              </div>
            </div>

            {/* Stock Control */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit-controla_estoque"
                  checked={editProduct.controla_estoque}
                  onChange={(e) => setEditProduct({...editProduct, controla_estoque: e.target.checked})}
                  className="rounded"
                />
                <Label htmlFor="edit-controla_estoque">Controla Estoque</Label>
              </div>
              {editProduct.controla_estoque && (
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div className="space-y-2">
                    <Label htmlFor="edit-estoque_atual">Estoque Atual</Label>
                    <Input
                      id="edit-estoque_atual"
                      type="number"
                      value={editProduct.estoque_atual}
                      onChange={(e) => setEditProduct({...editProduct, estoque_atual: parseInt(e.target.value) || 0})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-estoque_minimo">Estoque Mínimo</Label>
                    <Input
                      id="edit-estoque_minimo"
                      type="number"
                      value={editProduct.estoque_minimo}
                      onChange={(e) => setEditProduct({...editProduct, estoque_minimo: parseInt(e.target.value) || 0})}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Image Upload */}
            <div className="space-y-3">
              <Label>Atualizar Imagem do Produto</Label>
              
              {/* Current Image Preview */}
              {selectedProduto?.imagem_principal && (
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">Imagem atual:</p>
                  <div className="relative inline-block">
                    <img
                      src={selectedProduto.imagem_principal}
                      alt="Imagem atual"
                      className="w-20 h-20 rounded object-cover"
                    />
                  </div>
                </div>
              )}
              
              {/* New Image Upload */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                <div className="flex flex-col items-center space-y-2">
                  <div className="p-3 bg-gray-100 rounded-full">
                    <Upload className="h-6 w-6 text-gray-600" />
                  </div>
                  <div>
                    <label
                      htmlFor="edit-image"
                      className="cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-500"
                    >
                      Clique para selecionar nova imagem
                    </label>
                    <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF até 10MB</p>
                  </div>
                  <Input
                    id="edit-image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                </div>
                {selectedImageName && (
                  <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded flex items-center justify-center space-x-2">
                    <Image className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-700 font-medium">{selectedImageName}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Highlights */}
            <div className="flex gap-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit-destaque"
                  checked={editProduct.destaque}
                  onChange={(e) => setEditProduct({...editProduct, destaque: e.target.checked})}
                  className="rounded"
                />
                <Label htmlFor="edit-destaque">Destaque</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit-mais_vendido"
                  checked={editProduct.mais_vendido}
                  onChange={(e) => setEditProduct({...editProduct, mais_vendido: e.target.checked})}
                  className="rounded"
                />
                <Label htmlFor="edit-mais_vendido">Mais Vendido</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit-novidade"
                  checked={editProduct.novidade}
                  onChange={(e) => setEditProduct({...editProduct, novidade: e.target.checked})}
                  className="rounded"
                />
                <Label htmlFor="edit-novidade">Novidade</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateProduct} disabled={uploadingImage}>
              {uploadingImage ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!productToDelete} onOpenChange={() => setProductToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita.
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
    </div>
  )
}
