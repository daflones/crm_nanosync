import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { useNotifications } from '@/contexts/NotificationContext'
import { PlanoAtivoButton } from '@/components/PlanoAtivoGuard'
import { 
  Upload, 
  Search,
  File,
  FileText,
  Image,
  Video,
  Archive,
  Download,
  Eye,
  Edit,
  Trash2,
  Grid,
  List,
  X,
  Plus,
  Tag,
  Share2,
  Folder
} from 'lucide-react'
import { useArquivos, useArquivosStats, useUploadArquivo, useDeleteArquivo, useUpdateArquivo } from '@/hooks/useArquivos'
import { type CategoriaArquivo, type Arquivo, arquivosService } from '@/services/api/arquivos'
import { supabase } from '@/lib/supabase'
import { useProdutos } from '@/hooks/useProdutos'

export function ArquivosPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedCategory, setSelectedCategory] = useState<CategoriaArquivo | 'todos'>('todos')
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<Arquivo | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [isViewerModalOpen, setIsViewerModalOpen] = useState(false)
  const [viewerFile, setViewerFile] = useState<Arquivo | null>(null)
  const [uploadData, setUploadData] = useState({
    categoria: 'sistema' as CategoriaArquivo,
    nome: '',
    descricao: '',
    tags: [] as string[],
    tagInput: '',
    selectedProductId: 'none',
    is_public: false
  })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const categoryContainerRef = useRef<HTMLDivElement>(null)
  
  const { data: arquivos = [], isLoading } = useArquivos({
    categoria: selectedCategory === 'todos' ? undefined : selectedCategory
  })
  const { data: statsData } = useArquivosStats()
  
  const { data: produtos = [] } = useProdutos({ status: 'ativo' })
  const uploadMutation = useUploadArquivo()
  const deleteMutation = useDeleteArquivo()
  const updateMutation = useUpdateArquivo()
  const { createDatabaseNotification } = useNotifications()

  
  // Filter arquivos based on search term
  const filteredArquivos = arquivos.filter(arquivo =>
    arquivo.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    arquivo.descricao?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Categories configuration
  const categorias = [
    { nome: 'propostas', label: 'Propostas', icone: FileText, cor: 'bg-red-100 text-red-700' },
    { nome: 'contratos', label: 'Contratos', icone: File, cor: 'bg-blue-100 text-blue-700' },
    { nome: 'marketing', label: 'Marketing', icone: Share2, cor: 'bg-green-100 text-green-700' },
    { nome: 'produtos', label: 'Produtos', icone: Image, cor: 'bg-purple-100 text-purple-700' },
    { nome: 'relatorios', label: 'Relatórios', icone: FileText, cor: 'bg-yellow-100 text-yellow-700' },
    { nome: 'sistema', label: 'Sistema', icone: Folder, cor: 'bg-gray-100 text-gray-700' },
    { nome: 'juridico', label: 'Jurídico', icone: File, cor: 'bg-indigo-100 text-indigo-700' },
    { nome: 'vendas', label: 'Vendas', icone: FileText, cor: 'bg-pink-100 text-pink-700' }
  ] as const

  // Get file icon based on mime type
  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return Image
    if (mimeType.startsWith('video/')) return Video
    if (mimeType.startsWith('audio/')) return Video // Using Video icon for audio
    if (mimeType.includes('pdf')) return FileText
    if (mimeType.includes('word') || mimeType.includes('document')) return FileText
    if (mimeType.includes('sheet') || mimeType.includes('excel')) return FileText
    if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return FileText
    if (mimeType.includes('text/')) return FileText
    if (mimeType.includes('json') || mimeType.includes('xml') || mimeType.includes('csv')) return FileText
    if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar') || mimeType.includes('gzip') || mimeType.includes('archive')) return Archive
    return File
  }

  // Check if file can be viewed in browser
  const canViewFile = (mimeType: string) => {
    const viewableTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'text/csv',
      'application/json',
      'application/xml',
      'application/zip',
      'application/x-rar-compressed',
      'application/x-tar',
      'application/gzip',
      'application/octet-stream',
      'application/x-binary',
      'application/binary',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      'image/bmp',
      'image/tiff',
      'video/mp4',
      'video/avi',
      'video/mov',
      'video/mkv',
      'video/webm',
      'audio/mp3',
      'audio/wav',
      'audio/ogg',
      'audio/m4a',
      'audio/flac'
    ]
    return viewableTypes.includes(mimeType)
  }

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Handle file upload
  const handleFileUpload = async (files: FileList) => {
    const fileArray = Array.from(files)
    let successCount = 0
    let errorCount = 0

    for (const file of fileArray) {
      try {
        // Get product name if selected
        const selectedProduct = uploadData.selectedProductId && uploadData.selectedProductId !== 'none' ? 
          produtos.find(p => p.id === uploadData.selectedProductId) : null

        // Create descriptive name
        let displayName = uploadData.nome || file.name
        if (!uploadData.nome && uploadData.categoria === 'produtos' && selectedProduct) {
          displayName = selectedProduct.nome
        }

        await uploadMutation.mutateAsync({
          file,
          data: {
            nome: displayName,
            tipo: file.type.split('/')[0] || 'file',
            tamanho: file.size,
            categoria: uploadData.categoria,
            descricao: uploadData.descricao || (selectedProduct ? `Imagem do produto ${selectedProduct.nome}` : ''),
            tags: uploadData.tags,
            entity_type: uploadData.categoria === 'produtos' && selectedProduct ? 'produto' : 'arquivo',
            entity_id: uploadData.selectedProductId && uploadData.selectedProductId !== 'none' ? uploadData.selectedProductId : undefined,
            is_public: uploadData.is_public
          }
        })
        successCount++
      } catch (error) {
        console.error('Erro ao fazer upload do arquivo:', file.name, error)
        errorCount++
        toast.error(`Erro ao enviar ${file.name}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
      }
    }

    if (successCount > 0) {
      
      // Criar notificação no banco
      await createDatabaseNotification({
        tipo: 'sistema',
        categoria: 'sistema',
        titulo: 'Arquivos Enviados',
        descricao: `${successCount} arquivo(s) enviado(s) com sucesso`,
        prioridade: 'normal'
      })
    }
    
    setIsUploadModalOpen(false)
    setUploadData({ categoria: 'sistema', nome: '', descricao: '', tags: [], tagInput: '', selectedProductId: 'none', is_public: false })
    setSelectedFiles([])
  }

  // Handle file selection
  const handleFileSelection = (files: FileList | null) => {
    if (files) {
      setSelectedFiles(Array.from(files))
    }
  }

  // Handle upload submission
  const handleUploadSubmit = async () => {
    if (selectedFiles.length === 0) {
      toast.error('Selecione pelo menos um arquivo')
      return
    }

    const fileList = new DataTransfer()
    selectedFiles.forEach((file: File) => fileList.items.add(file))
    await handleFileUpload(fileList.files)
  }

  // Handle file delete
  const handleDeleteFile = async (arquivo: Arquivo) => {
    // Show confirmation toast
    toast.error(`Deseja excluir "${arquivo.nome}"?`, {
      action: {
        label: 'Excluir',
        onClick: async () => {
          await performDelete(arquivo)
        }
      },
      cancel: {
        label: 'Cancelar',
        onClick: () => {}
      }
    })
  }

  const performDelete = async (arquivo: Arquivo) => {
      try {
        // For product images, we need to handle deletion differently
        if (arquivo.id.startsWith('product-image-')) {
          // Delete from storage bucket directly
          const fileName = arquivo.id.replace('product-image-', '')
          const { error } = await supabase.storage
            .from('product-images')
            .remove([`products/${fileName}`])
          
          if (error) throw error
          
          // Criar notificação no banco
          await createDatabaseNotification({
            tipo: 'sistema',
            categoria: 'sistema',
            titulo: 'Arquivo Excluído',
            descricao: 'Arquivo foi excluído com sucesso',
            prioridade: 'normal'
          })
          
          // Refresh the data
          window.location.reload()
        } else {
          await deleteMutation.mutateAsync(arquivo.id)
          
          // Criar notificação no banco
          await createDatabaseNotification({
            tipo: 'sistema',
            categoria: 'sistema',
            titulo: 'Arquivo Excluído',
            descricao: 'Arquivo foi excluído com sucesso',
            prioridade: 'normal'
          })
        }
      } catch (error) {
        console.error('Erro ao excluir:', error)
        toast.error('Erro ao excluir arquivo')
      }
  }

  // Handle file edit
  const handleEditFile = (arquivo: Arquivo) => {
    // For product images, we need to handle them differently since they don't exist in arquivos table
    if (arquivo.id.startsWith('product-image-')) {
      // Create a temporary arquivo object for editing
      const editableFile: Arquivo = {
        ...arquivo,
        // Extract the actual filename from the ID
        nome: arquivo.id.replace('product-image-', ''),
        descricao: arquivo.descricao || `Imagem do produto - ${arquivo.nome}`
      }
      setSelectedFile(editableFile)
    } else {
      setSelectedFile(arquivo)
    }
    setIsEditModalOpen(true)
  }

  // Open upload modal with category pre-selected
  const openUploadModal = () => {
    // Set the category based on current selection
    if (selectedCategory !== 'todos') {
      setUploadData(prev => ({ ...prev, categoria: selectedCategory }))
    }
    setIsUploadModalOpen(true)
  }

  // Handle file update
  const handleUpdateFile = async (fileData: Arquivo) => {
    if (!selectedFile) return
    
    try {
      await updateMutation.mutateAsync({
        id: selectedFile.id,
        data: {
          nome: fileData.nome,
          descricao: fileData.descricao,
          categoria: fileData.categoria,
          is_public: fileData.is_public
        }
      })
      
      // Criar notificação no banco
      await createDatabaseNotification({
        tipo: 'sistema',
        categoria: 'sistema',
        titulo: 'Arquivo Atualizado',
        descricao: 'Arquivo foi atualizado com sucesso',
        prioridade: 'normal'
      })
      setIsEditModalOpen(false)
      setSelectedFile(null)
    } catch (error) {
      toast.error('Erro ao atualizar arquivo')
    }
  }

  // Add tag to upload data
  const addTag = () => {
    if (uploadData.tagInput.trim() && !uploadData.tags.includes(uploadData.tagInput.trim())) {
      setUploadData(prev => ({
        ...prev,
        tags: [...prev.tags, prev.tagInput.trim()],
        tagInput: ''
      }))
    }
  }

  // Remove tag from upload data
  const removeTag = (tagToRemove: string) => {
    setUploadData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  // Handle file view
  const handleViewFile = (arquivo: Arquivo) => {
    // Check if file type is viewable
    if (!canViewFile(arquivo.mime_type || arquivo.tipo)) {
      toast.error('Tipo de arquivo não suportado para visualização')
      return
    }
    setViewerFile(arquivo)
    setIsViewerModalOpen(true)
  }

  // Handle download file
  const handleDownloadFile = async (arquivo: Arquivo) => {
    try {
      // Use the arquivos service to download and track the download
      const blob = await arquivosService.downloadFile(arquivo.id)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = arquivo.nome
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Erro ao fazer download:', error)
      toast.error('Erro ao fazer download do arquivo')
    }
  }

  // Helper function to format bytes
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const stats = [
    {
      title: 'Total de Arquivos',
      value: statsData?.totalFiles?.toLocaleString() || '0',
      description: `${formatBytes(statsData?.totalSize || 0)} utilizados`,
      icon: File,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20'
    },
    {
      title: 'Compartilhados',
      value: statsData?.sharedFiles?.toLocaleString() || '0',
      description: 'Com sua equipe',
      icon: Share2,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/20'
    },
    {
      title: 'Espaço Disponível',
      value: formatBytes(statsData?.availableSpace || (500 * 1024 * 1024 * 1024)),
      description: 'De 500 GB total',
      icon: Archive,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20'
    },
    {
      title: 'Downloads Hoje',
      value: statsData?.todayDownloads?.toLocaleString() || '0',
      description: 'Transferências realizadas',
      icon: Download,
      color: 'text-amber-600',
      bgColor: 'bg-amber-100 dark:bg-amber-900/20'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Arquivos
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gerencie documentos e arquivos da empresa
          </p>
        </div>
        <PlanoAtivoButton 
          onClick={openUploadModal}
          className="bg-primary-600 hover:bg-primary-700"
          variant="primary"
        >
          <Upload className="mr-2 h-4 w-4" />
          Upload
        </PlanoAtivoButton>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title}>
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

      {/* Quick Access Folders */}
      <Card>
        <CardHeader>
          <CardTitle>Acesso Rápido</CardTitle>
          <CardDescription>
            Pastas e categorias mais utilizadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div ref={categoryContainerRef} className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {categorias.map((categoria) => (
              <button
                key={categoria.nome}
                className={`p-3 text-center border rounded-lg transition-colors ${
                  selectedCategory === categoria.nome 
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' 
                    : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
                onClick={() => setSelectedCategory(categoria.nome as CategoriaArquivo)}
              >
                <div className="flex items-center justify-center mb-2">
                  <div className={`w-8 h-8 ${categoria.cor} rounded-lg flex items-center justify-center`}>
                    <categoria.icone className="h-4 w-4 text-white" />
                  </div>
                </div>
                <p className="text-xs font-medium text-gray-900 dark:text-white">{categoria.label}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {statsData?.categories?.find(c => c.categoria === categoria.nome)?.count || 0} arquivos
                </p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar arquivos..."
              className="pl-10 w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as CategoriaArquivo | 'todos')}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas as categorias</SelectItem>
              {categorias.map((categoria) => (
                <SelectItem key={categoria.nome} value={categoria.nome}>
                  <div className="flex items-center gap-2">
                    <categoria.icone className="h-4 w-4" />
                    {categoria.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
          {selectedCategory !== 'todos' && (
            <PlanoAtivoButton 
              onClick={openUploadModal}
              className="bg-primary-600 hover:bg-primary-700"
              variant="primary"
            >
              <Plus className="mr-2 h-4 w-4" />
              Upload
            </PlanoAtivoButton>
          )}
        </div>
      </div>

      {/* Files Grid/List */}
      <Card>
        <CardHeader>
          <CardTitle>Arquivos</CardTitle>
          <CardDescription>
            {filteredArquivos.length} arquivos encontrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-500">Carregando arquivos...</div>
            </div>
          ) : filteredArquivos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <File className="h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500 text-center">
                Nenhum arquivo encontrado
              </p>
              {selectedCategory !== 'todos' && (
                <PlanoAtivoButton 
                  onClick={openUploadModal}
                  className="mt-4"
                  variant="secondary"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Fazer upload do primeiro arquivo
                </PlanoAtivoButton>
              )}
            </div>
          ) : null}

          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredArquivos.map((arquivo) => {
                const Icon = getFileIcon(arquivo.mime_type || arquivo.tipo)
                return (
                  <div
                    key={arquivo.id}
                    className="group relative p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-all duration-200 hover:border-primary-300"
                  >
                    <div className="flex flex-col space-y-3">
                      {/* Header with icon and sharing indicator */}
                      <div className="flex items-center justify-between">
                        {arquivo.tipo === 'image' && arquivo.url ? (
                          <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                            <img
                              src={arquivo.url}
                              alt={arquivo.nome}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const parent = target.parentElement;
                                if (parent) {
                                  parent.innerHTML = `<div class="w-full h-full flex items-center justify-center"><svg class="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></div>`;
                                }
                              }}
                            />
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                            <Icon className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                          </div>
                        )}
                        <div className="flex items-center space-x-1 text-xs">
                          {arquivo.is_public ? (
                            <div className="flex items-center space-x-1 text-green-600 dark:text-green-400">
                              <Share2 className="h-3 w-3" />
                              <span>Público</span>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-1 text-red-600 dark:text-red-400">
                              <div className="w-3 h-3 rounded-full bg-red-500" />
                              <span>Privado</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* File info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate mb-1">
                          {arquivo.nome}
                        </p>
                        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-2">
                          <span>{formatFileSize(arquivo.tamanho)}</span>
                          <span className="capitalize">{arquivo.categoria}</span>
                        </div>
                        {arquivo.descricao && (
                          <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 mb-2">
                            {arquivo.descricao}
                          </p>
                        )}
                      </div>

                      {/* Tags */}
                      {arquivo.tags && arquivo.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {arquivo.tags.slice(0, 3).map((tag, index) => (
                            <Badge
                              key={index}
                              variant="secondary"
                              className="text-xs px-2 py-0.5"
                            >
                              {tag}
                            </Badge>
                          ))}
                          {arquivo.tags.length > 3 && (
                            <Badge variant="outline" className="text-xs px-2 py-0.5">
                              +{arquivo.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center justify-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity pt-2 border-t border-gray-100 dark:border-gray-700">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0"
                          onClick={() => handleViewFile(arquivo)}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0"
                          onClick={() => handleDownloadFile(arquivo)}
                        >
                          <Download className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0"
                          onClick={() => handleEditFile(arquivo)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
                          onClick={() => handleDeleteFile(arquivo)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredArquivos.map((arquivo) => {
                const Icon = getFileIcon(arquivo.mime_type || arquivo.tipo)
                return (
                  <div
                    key={arquivo.id}
                    className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 bg-gray-100 dark:bg-gray-800">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-sm text-gray-900 dark:text-white">
                          {arquivo.nome}
                        </h3>
                        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                          <span>{formatFileSize(arquivo.tamanho)}</span>
                          <span>{new Date(arquivo.updated_at).toLocaleDateString('pt-BR')}</span>
                          <Badge variant="outline" className="text-xs">
                            {arquivo.categoria}
                          </Badge>
                          {arquivo.is_public ? (
                            <div className="flex items-center space-x-1 text-green-600 dark:text-green-400">
                              <Share2 className="h-3 w-3" />
                              <span>Público</span>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-1 text-red-600 dark:text-red-400">
                              <div className="w-3 h-3 rounded-full bg-red-500" />
                              <span>Privado</span>
                            </div>
                          )}
                        </div>
                        {arquivo.tags && arquivo.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {arquivo.tags.slice(0, 2).map((tag, index) => (
                              <Badge
                                key={index}
                                variant="secondary"
                                className="text-xs px-2 py-0.5"
                              >
                                {tag}
                              </Badge>
                            ))}
                            {arquivo.tags.length > 2 && (
                              <Badge variant="outline" className="text-xs px-2 py-0.5">
                                +{arquivo.tags.length - 2}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleViewFile(arquivo)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDownloadFile(arquivo)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEditFile(arquivo)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-500 hover:text-red-700"
                        onClick={() => handleDeleteFile(arquivo)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Modal */}
      <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload de Arquivo</DialogTitle>
            <DialogDescription>
              Selecione os arquivos para fazer upload
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="categoria">Categoria</Label>
              <Select 
                value={uploadData.categoria} 
                onValueChange={(value) => setUploadData(prev => ({ ...prev, categoria: value as CategoriaArquivo }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categorias.map((categoria) => (
                    <SelectItem key={categoria.nome} value={categoria.nome}>
                      <div className="flex items-center gap-2">
                        <categoria.icone className="h-4 w-4" />
                        {categoria.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="nome">Nome do Arquivo</Label>
              <Input
                id="nome"
                placeholder="Digite o nome do arquivo..."
                value={uploadData.nome}
                onChange={(e) => setUploadData(prev => ({ ...prev, nome: e.target.value }))}
              />
            </div>

            {/* Product selector for product images */}
            {uploadData.categoria === 'produtos' && (
              <div>
                <Label htmlFor="produto">Produto (Opcional)</Label>
                <Select 
                  value={uploadData.selectedProductId} 
                  onValueChange={(value) => {
                    const selectedProduct = produtos.find(p => p.id === value)
                    setUploadData(prev => ({ 
                      ...prev, 
                      selectedProductId: value,
                      nome: selectedProduct ? selectedProduct.nome : prev.nome
                    }))
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um produto (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum produto específico</SelectItem>
                    {produtos.map((produto) => (
                      <SelectItem key={produto.id} value={produto.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{produto.nome}</span>
                          <span className="text-xs text-gray-500">{produto.codigo}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div>
              <Label htmlFor="descricao">Descrição (opcional)</Label>
              <Textarea
                id="descricao"
                placeholder="Descreva o arquivo..."
                value={uploadData.descricao}
                onChange={(e) => setUploadData(prev => ({ ...prev, descricao: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="tags">Tags (opcional)</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  placeholder="Adicionar tag..."
                  value={uploadData.tagInput}
                  onChange={(e) => setUploadData(prev => ({ ...prev, tagInput: e.target.value }))}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addTag()
                    }
                  }}
                />
                <Button type="button" onClick={addTag} size="sm">
                  <Tag className="h-4 w-4" />
                </Button>
              </div>
              {uploadData.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {uploadData.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="ml-1 hover:text-red-500"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="is_public">Visibilidade</Label>
              <Select 
                value={uploadData.is_public ? 'public' : 'private'} 
                onValueChange={(value) => setUploadData(prev => ({ ...prev, is_public: value === 'public' }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a visibilidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="private">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-red-500"></div>
                      Privado
                    </div>
                  </SelectItem>
                  <SelectItem value="public">
                    <div className="flex items-center gap-2">
                      <Share2 className="h-4 w-4" />
                      Público
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                {uploadData.is_public ? 'Arquivo será visível para todos os usuários' : 'Arquivo será visível apenas para usuários autorizados'}
              </p>
            </div>

            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="*/*"
                className="hidden"
                onChange={(e) => handleFileSelection(e.target.files)}
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="w-full"
                variant="outline"
              >
                <Upload className="mr-2 h-4 w-4" />
                Selecionar Arquivos
              </Button>
              
              {selectedFiles.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedFiles.length} arquivo(s) selecionado(s):
                  </p>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {selectedFiles.map((file: File, index: number) => (
                      <div key={index} className="text-xs bg-gray-50 dark:bg-gray-800 p-2 rounded">
                        {file.name} ({formatFileSize(file.size)})
                      </div>
                    ))}
                  </div>
                  <Button
                    onClick={handleUploadSubmit}
                    className="w-full bg-primary-600 hover:bg-primary-700"
                    disabled={uploadMutation.isPending}
                  >
                    {uploadMutation.isPending ? (
                      <>Enviando...</>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Enviar Arquivos
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* File Viewer Modal */}
      <Dialog open={isViewerModalOpen} onOpenChange={setIsViewerModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>{viewerFile?.nome}</DialogTitle>
            <DialogDescription>
              {viewerFile?.descricao || 'Visualização do arquivo'}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-auto">
            {viewerFile && (
              <div className="w-full h-full min-h-[400px] flex items-center justify-center">
                {viewerFile.tipo === 'image' || viewerFile.mime_type?.startsWith('image/') ? (
                  <img
                    src={viewerFile.url}
                    alt={viewerFile.nome}
                    className="max-w-full max-h-full object-contain"
                  />
                ) : viewerFile.mime_type?.includes('pdf') ? (
                  <iframe
                    src={viewerFile.url}
                    className="w-full h-[500px] border-0"
                    title={viewerFile.nome}
                  />
                ) : viewerFile.tipo === 'video' || viewerFile.mime_type?.startsWith('video/') ? (
                  <video
                    src={viewerFile.url}
                    controls
                    className="max-w-full max-h-full"
                  >
                    Seu navegador não suporta o elemento de vídeo.
                  </video>
                ) : viewerFile.mime_type?.startsWith('audio/') ? (
                  <div className="text-center p-8">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      <Video className="h-8 w-8 text-gray-500" />
                    </div>
                    <audio
                      src={viewerFile.url}
                      controls
                      className="w-full max-w-md"
                    >
                      Seu navegador não suporta o elemento de áudio.
                    </audio>
                  </div>
                ) : viewerFile.mime_type?.includes('text/') || viewerFile.mime_type?.includes('json') || viewerFile.mime_type?.includes('xml') || viewerFile.mime_type?.includes('csv') ? (
                  <iframe
                    src={viewerFile.url}
                    className="w-full h-[500px] border border-gray-200 dark:border-gray-700 rounded"
                    title={viewerFile.nome}
                  />
                ) : viewerFile.mime_type?.includes('word') || viewerFile.mime_type?.includes('document') || 
                     viewerFile.mime_type?.includes('sheet') || viewerFile.mime_type?.includes('excel') ||
                     viewerFile.mime_type?.includes('presentation') || viewerFile.mime_type?.includes('powerpoint') ? (
                  <div className="text-center p-8">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      <FileText className="h-8 w-8 text-gray-500" />
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Documento do Office - {viewerFile.nome}
                    </p>
                    <div className="space-y-2">
                      <Button
                        onClick={() => window.open(`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(viewerFile.url)}`, '_blank')}
                        className="mr-2"
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Visualizar Online
                      </Button>
                      <Button
                        onClick={() => window.open(viewerFile.url, '_blank')}
                        variant="outline"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Baixar Arquivo
                      </Button>
                    </div>
                  </div>
                ) : viewerFile.mime_type?.includes('zip') || viewerFile.mime_type?.includes('rar') || 
                     viewerFile.mime_type?.includes('tar') || viewerFile.mime_type?.includes('gzip') ? (
                  <div className="text-center p-8">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      <Archive className="h-8 w-8 text-gray-500" />
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Arquivo compactado - {viewerFile.nome}
                    </p>
                    <Button
                      onClick={() => window.open(viewerFile.url, '_blank')}
                      variant="outline"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Baixar Arquivo
                    </Button>
                  </div>
                ) : (
                  <div className="text-center p-8">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      <File className="h-8 w-8 text-gray-500" />
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Arquivo binário - {viewerFile.nome}
                    </p>
                    <Button
                      onClick={() => window.open(viewerFile.url, '_blank')}
                      variant="outline"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Baixar Arquivo
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Arquivo</DialogTitle>
            <DialogDescription>
              Altere as informações do arquivo
            </DialogDescription>
          </DialogHeader>
          {selectedFile && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-nome">Nome</Label>
                <Input
                  id="edit-nome"
                  defaultValue={selectedFile.nome}
                  onChange={(e) => setSelectedFile(prev => prev ? { ...prev, nome: e.target.value } : null)}
                />
              </div>
              
              <div>
                <Label htmlFor="edit-descricao">Descrição</Label>
                <Textarea
                  id="edit-descricao"
                  defaultValue={selectedFile.descricao || ''}
                  onChange={(e) => setSelectedFile(prev => prev ? { ...prev, descricao: e.target.value } : null)}
                />
              </div>

              <div>
                <Label htmlFor="edit-categoria">Categoria</Label>
                <Select 
                  value={selectedFile.categoria} 
                  onValueChange={(value) => setSelectedFile(prev => prev ? { ...prev, categoria: value as CategoriaArquivo } : null)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categorias.map((categoria) => (
                      <SelectItem key={categoria.nome} value={categoria.nome}>
                        <div className="flex items-center gap-2">
                          <categoria.icone className="h-4 w-4" />
                          {categoria.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="edit-is_public">Visibilidade</Label>
                <Select 
                  value={selectedFile.is_public ? 'public' : 'private'} 
                  onValueChange={(value) => setSelectedFile(prev => prev ? { ...prev, is_public: value === 'public' } : null)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="private">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                        Privado
                      </div>
                    </SelectItem>
                    <SelectItem value="public">
                      <div className="flex items-center gap-2">
                        <Share2 className="h-4 w-4" />
                        Público
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  {selectedFile.is_public ? 'Arquivo visível para todos os usuários' : 'Arquivo visível apenas para usuários autorizados'}
                </p>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={() => handleUpdateFile(selectedFile)}>
                  Salvar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
