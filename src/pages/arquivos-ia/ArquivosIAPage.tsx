import React, { useState } from 'react'
import { Card, CardContent, CardHeader } from '../../components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../components/ui/dialog'
import { Input } from '../../components/ui/input'
import { Button } from '../../components/ui/button'
import { Label } from '../../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { Badge } from '../../components/ui/badge'
import { Textarea } from '../../components/ui/textarea'
// import { Checkbox } from '../../components/ui/checkbox'
import { 
  Search, Grid, List, Edit, Trash2, 
  FileText, Image, Video, File, Archive,
  Plus, Eye, Download, AlertTriangle
} from 'lucide-react'
import { toast } from 'sonner'
import { useNotifications } from '@/contexts/NotificationContext'
import { PlanoAtivoButton } from '@/components/PlanoAtivoGuard'
import { useQuery } from '@tanstack/react-query'
import { 
  useArquivosIA, 
  useUploadArquivoIA, 
  useUpdateArquivoIA, 
  useDeleteArquivoIA,
  useHardDeleteArquivoIA 
} from '@/hooks/useArquivosIA'
import { clientesService } from '@/services/api/clientes'
import { arquivosService, type CategoriaArquivo } from '@/services/api/arquivos'
import type { ArquivoIA, CategoriaArquivoIA, ArquivoIAFilters, CreateArquivoIAData } from '../../types/arquivos-ia'
import { CATEGORIA_CONFIG } from '../../types/arquivos-ia'
import { formatBytes, formatDate } from '../../utils/format'
import { cn } from '../../lib/utils'

export default function ArquivosIAPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState<ArquivoIAFilters>({
    categoria: 'catalogo'
  })
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadMode, setUploadMode] = useState<'file' | 'existing'>('file')
  const [selectedCommonFile, setSelectedCommonFile] = useState<string | null>(null)

  // Auto-populate form when common file is selected
  const handleCommonFileSelection = (fileId: string) => {
    setSelectedCommonFile(fileId)
    
    if (fileId) {
      const commonFile = commonFiles.find(f => f.id === fileId)
      if (commonFile) {
        setUploadData(prev => ({
          ...prev,
          nome: commonFile.nome,
          descricao: commonFile.descricao || prev.descricao,
          // Keep the IA-specific fields as they were
          categoria: prev.categoria,
          subcategoria: prev.subcategoria,
          instrucoes_ia: prev.instrucoes_ia,
          contexto_uso: prev.contexto_uso,
          palavras_chave: prev.palavras_chave,
          prioridade: prev.prioridade,
          observacoes: prev.observacoes,
          cliente_id: prev.cliente_id,
          visibilidade: prev.visibilidade,
          disponivel_ia: prev.disponivel_ia
        }))
        
        // Show success message
        toast.success(`Informações do arquivo "${commonFile.nome}" carregadas automaticamente!`)
      }
    }
  }

  // Handle category change - reset common file selection
  const handleCategoryChange = (categoria: CategoriaArquivoIA) => {
    setUploadData(prev => ({ ...prev, categoria }))
    setSelectedCommonFile(null) // Reset selection when category changes
  }
  const [uploadData, setUploadData] = useState<Partial<CreateArquivoIAData>>({
    categoria: 'catalogo',
    prioridade: 5,
    disponivel_ia: true,
    visibilidade: 'privado'
  })
  
  // Edit form state
  const [editData, setEditData] = useState<Partial<CreateArquivoIAData>>({
    categoria: 'catalogo',
    prioridade: 5,
    disponivel_ia: true,
    visibilidade: 'privado'
  })
  const [selectedArquivo, setSelectedArquivo] = useState<ArquivoIA | null>(null)

  // Hooks with real-time updates
  const { data: arquivos = [], isLoading, refetch: refetchArquivos } = useArquivosIA(filters)
  const { data: clientes = [] } = useQuery({
    queryKey: ['clientes'],
    queryFn: () => clientesService.getAll(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true
  })

  // Fetch common files filtered by selected category
  const { data: commonFiles = [] } = useQuery({
    queryKey: ['common-files', uploadData.categoria],
    queryFn: () => arquivosService.getAll({ categoria: getCategoriaMapping(uploadData.categoria) }),
    enabled: uploadMode === 'existing' && !!uploadData.categoria,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: true
  })

  // Map IA categories to common file categories
  const getCategoriaMapping = (iaCategoria?: string): CategoriaArquivo => {
    const mapping: Record<string, CategoriaArquivo> = {
      'catalogo': 'produtos',
      'apresentacao': 'marketing',
      'promocoes': 'marketing',
      'marketing': 'marketing',
      'video': 'marketing',
      'propostas': 'propostas'
    }
    return mapping[iaCategoria || ''] || 'marketing'
  }

  const resetUploadForm = () => {
    setSelectedFile(null)
    setUploadMode('file')
    setSelectedCommonFile(null)
    setUploadData({
      categoria: 'catalogo',
      prioridade: 5,
      disponivel_ia: true,
      visibilidade: 'privado'
    })
  }

  const uploadMutation = useUploadArquivoIA()
  const updateMutation = useUpdateArquivoIA()
  const deleteMutation = useHardDeleteArquivoIA() // Hard delete removes from database AND storage

  // Override success handlers to close modals and reset forms
  const handleUploadSuccess = () => {
    setIsUploadModalOpen(false)
    resetUploadForm()
    // Force immediate refetch for instant UI update
    refetchArquivos()
  }

  const handleUpdateSuccess = () => {
    setIsEditModalOpen(false)
    setSelectedArquivo(null)
    // Force immediate refetch for instant UI update
    refetchArquivos()
  }


  const { createDatabaseNotification } = useNotifications()

  // Enhanced Filters
  const filteredArquivos = arquivos?.filter((arquivo: ArquivoIA) => {
    // Category filter
    if (filters.categoria && arquivo.categoria !== filters.categoria) return false
    
    // Client filter
    if (filters.cliente_id && arquivo.cliente_id !== filters.cliente_id) return false
    
    // AI availability filter
    if (filters.disponivel_ia !== undefined && arquivo.disponivel_ia !== filters.disponivel_ia) return false
    
    // Visibility filter
    if (filters.visibilidade && arquivo.visibilidade !== filters.visibilidade) return false
    
    // Processing status filter
    if (filters.processado_ia !== undefined && arquivo.processado_ia !== filters.processado_ia) return false
    
    // Advanced search - search in multiple fields
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      const searchFields = [
        arquivo.nome,
        arquivo.descricao,
        arquivo.subcategoria,
        arquivo.instrucoes_ia,
        arquivo.contexto_uso,
        arquivo.observacoes,
        ...(arquivo.palavras_chave || [])
      ].filter(Boolean).map(field => field?.toLowerCase() || '')
      
      const matchesSearch = searchFields.some(field => field.includes(searchLower))
      if (!matchesSearch) return false
    }
    
    return true
  }) || []

  const handleViewFile = (arquivo: ArquivoIA) => {
    setSelectedArquivo(arquivo)
    setIsViewModalOpen(true)
  }

  const handleEditFile = (arquivo: ArquivoIA) => {
    setSelectedArquivo(arquivo)
    setEditData({
      nome: arquivo.nome,
      descricao: arquivo.descricao,
      categoria: arquivo.categoria,
      subcategoria: arquivo.subcategoria,
      instrucoes_ia: arquivo.instrucoes_ia,
      contexto_uso: arquivo.contexto_uso,
      palavras_chave: arquivo.palavras_chave,
      prioridade: arquivo.prioridade,
      observacoes: arquivo.observacoes,
      cliente_id: arquivo.cliente_id,
      visibilidade: arquivo.visibilidade,
      disponivel_ia: arquivo.disponivel_ia
    })
    setIsEditModalOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!selectedArquivo || !editData.nome || !editData.categoria) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }

    try {
      await updateMutation.mutate(
        { id: selectedArquivo.id, data: editData },
        { onSuccess: handleUpdateSuccess }
      )
      
      // Criar notificação no banco
      await createDatabaseNotification({
        tipo: 'sistema',
        categoria: 'sistema',
        titulo: 'Arquivo IA Atualizado',
        descricao: 'Arquivo IA foi atualizado com sucesso',
        prioridade: 'normal'
      })
    } catch (error) {
      console.error('Erro na edição:', error)
      toast.error('Erro ao atualizar arquivo. Tente novamente.')
    }
  }

  const handleDeleteFile = (arquivo: ArquivoIA) => {
    setSelectedArquivo(arquivo)
    setIsDeleteModalOpen(true)
  }

  const confirmDelete = async () => {
    if (!selectedArquivo) return
    
    try {
      // Use the mutation with proper success callback
      deleteMutation.mutate(selectedArquivo.id, {
        onSuccess: () => {
          // Close modal and reset state immediately
          setIsDeleteModalOpen(false)
          setSelectedArquivo(null)
          // Force immediate refetch for instant UI update
          refetchArquivos()
        },
        onError: (error) => {
          console.error('Erro ao excluir arquivo:', error)
          toast.error('Erro ao excluir arquivo')
        }
      })
      
      // Criar notificação no banco
      await createDatabaseNotification({
        tipo: 'sistema',
        categoria: 'sistema',
        titulo: 'Arquivo IA Excluído',
        descricao: 'Arquivo IA foi excluído com sucesso',
        prioridade: 'normal'
      })
    } catch (error) {
      console.error('Erro ao excluir arquivo:', error)
      toast.error('Erro ao excluir arquivo')
    }
  }

  const handleDownload = async (arquivo: ArquivoIA) => {
    try {
      // Use nome_original if available, otherwise use nome with extension
      let fileName = arquivo.nome_original || arquivo.nome
      
      // If fileName doesn't have extension, add it from arquivo.extensao
      if (arquivo.extensao && !fileName.includes('.')) {
        fileName = `${fileName}.${arquivo.extensao}`
      }
      
      // Use URL field from database
      const downloadUrl = arquivo.url || arquivo.caminho_storage
      
      // Fetch the file as blob to ensure proper download
      const response = await fetch(downloadUrl)
      
      if (!response.ok) {
        throw new Error('Erro ao buscar arquivo')
      }
      
      const blob = await response.blob()
      
      // Create blob URL and download
      const blobUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      // Clean up blob URL
      setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl)
      }, 100)
      
      toast.success('Download iniciado com sucesso')
    } catch (error) {
      console.error('Erro ao fazer download:', error)
      toast.error('Erro ao fazer download do arquivo')
    }
  }

  const handleUpload = async () => {
    if (uploadMode === 'file') {
      if (!selectedFile || !uploadData.nome || !uploadData.categoria) {
        toast.error('Por favor, preencha todos os campos obrigatórios')
        return
      }

      const fileData: CreateArquivoIAData = {
        nome: uploadData.nome,
        nome_original: selectedFile.name,
        descricao: uploadData.descricao,
        tamanho: selectedFile.size,
        tipo_mime: selectedFile.type,
        categoria: uploadData.categoria,
        subcategoria: uploadData.subcategoria,
        instrucoes_ia: uploadData.instrucoes_ia,
        contexto_uso: uploadData.contexto_uso,
        palavras_chave: uploadData.palavras_chave,
        prioridade: uploadData.prioridade,
        observacoes: uploadData.observacoes,
        cliente_id: uploadData.cliente_id,
        visibilidade: uploadData.visibilidade,
        disponivel_ia: uploadData.disponivel_ia
      }

      uploadMutation.mutate(
        { file: selectedFile, data: fileData },
        { onSuccess: handleUploadSuccess }
      )
    } else {
      // Handle linking existing common file
      if (!selectedCommonFile || !uploadData.nome || !uploadData.categoria) {
        toast.error('Por favor, selecione um arquivo comum e preencha os campos obrigatórios')
        return
      }

      const commonFile = commonFiles.find(f => f.id === selectedCommonFile)
      if (!commonFile) {
        toast.error('Arquivo comum não encontrado')
        return
      }

      // Create IA file record that references the common file
      const fileData: CreateArquivoIAData = {
        nome: uploadData.nome,
        nome_original: commonFile.nome,
        descricao: uploadData.descricao || commonFile.descricao,
        tamanho: commonFile.tamanho,
        tipo_mime: commonFile.mime_type || 'application/octet-stream',
        categoria: uploadData.categoria,
        subcategoria: uploadData.subcategoria,
        instrucoes_ia: uploadData.instrucoes_ia,
        contexto_uso: uploadData.contexto_uso,
        palavras_chave: uploadData.palavras_chave,
        prioridade: uploadData.prioridade,
        observacoes: uploadData.observacoes,
        cliente_id: uploadData.cliente_id,
        visibilidade: uploadData.visibilidade,
        disponivel_ia: uploadData.disponivel_ia
      }

      // Create a virtual file object from the common file URL
      try {
        const response = await fetch(commonFile.url)
        if (!response.ok) {
          throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`)
        }
        
        const blob = await response.blob()
        
        // Create a proper File object using the File constructor with proper parameters
        let fileObject: File
        
        try {
          // Try to use the native File constructor
          fileObject = new (window as any).File([blob], commonFile.nome, {
            type: commonFile.mime_type || 'application/octet-stream',
            lastModified: Date.now()
          })
        } catch (fileConstructorError) {
          // Fallback: Create a Blob with File-like properties
          const blobWithName = new Blob([blob], { type: commonFile.mime_type || 'application/octet-stream' })
          
          // Add File properties to make it compatible
          Object.defineProperty(blobWithName, 'name', {
            value: commonFile.nome,
            writable: false,
            enumerable: true,
            configurable: false
          })
          
          Object.defineProperty(blobWithName, 'lastModified', {
            value: Date.now(),
            writable: false,
            enumerable: true,
            configurable: false
          })
          
          Object.defineProperty(blobWithName, 'webkitRelativePath', {
            value: '',
            writable: false,
            enumerable: true,
            configurable: false
          })
          
          fileObject = blobWithName as File
        }
        
        uploadMutation.mutate(
          { file: fileObject, data: fileData },
          { onSuccess: handleUploadSuccess }
        )
      } catch (error) {
        console.error('Error creating file from common file:', error)
        toast.error('Erro ao processar arquivo comum. Verifique se o arquivo ainda existe e tente novamente.')
      }
    }
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return Image
    if (mimeType.startsWith('video/')) return Video
    if (mimeType.includes('pdf') || mimeType.includes('document')) return FileText
    if (mimeType.includes('zip') || mimeType.includes('rar')) return Archive
    return File
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Arquivos IA</h1>
          <p className="text-muted-foreground">
            Gerencie arquivos específicos para uso da inteligência artificial
          </p>
        </div>
        <PlanoAtivoButton onClick={() => setIsUploadModalOpen(true)} variant="primary">
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Arquivo
        </PlanoAtivoButton>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-[300px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar em nome, descrição, instruções, contexto, palavras-chave..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Select value={filters.categoria || 'all'} onValueChange={(v) => setFilters({...filters, categoria: v === 'all' ? undefined : v as CategoriaArquivoIA})}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {Object.entries(CATEGORIA_CONFIG).map(([key, config]) => (
              <SelectItem key={key} value={key}>{config.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.cliente_id || 'all'} onValueChange={(v) => setFilters({...filters, cliente_id: v === 'all' ? undefined : v})}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Cliente" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {(clientes as any[]).map((cliente: any) => (
              <SelectItem key={cliente.id} value={cliente.id}>
                {cliente.nome_empresa || cliente.nome_contato || 'Cliente'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.visibilidade || 'all'} onValueChange={(v) => setFilters({...filters, visibilidade: v === 'all' ? undefined : v as any})}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Visibilidade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="publico">Público</SelectItem>
            <SelectItem value="privado">Privado</SelectItem>
            <SelectItem value="restrito">Restrito</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.disponivel_ia === undefined ? 'all' : filters.disponivel_ia ? 'true' : 'false'} onValueChange={(v) => setFilters({...filters, disponivel_ia: v === 'all' ? undefined : v === 'true'})}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status IA" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="true">Disponível</SelectItem>
            <SelectItem value="false">Indisponível</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex gap-2">
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
        </div>
      </div>

      {/* File Listing */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="text-muted-foreground">Carregando arquivos...</div>
        </div>
      ) : filteredArquivos.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-muted-foreground mb-2">Nenhum arquivo encontrado</div>
          <PlanoAtivoButton onClick={() => setIsUploadModalOpen(true)} variant="secondary">
            <Plus className="h-4 w-4 mr-2" />
            Adicionar primeiro arquivo
          </PlanoAtivoButton>
        </div>
      ) : (
        <div className={cn(
          viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' 
            : 'space-y-4'
        )}>
          {filteredArquivos.map((arquivo: ArquivoIA) => {
            return (
              <Card key={arquivo.id} className="group hover:shadow-xl transition-all duration-300 border-0 shadow-md bg-gradient-to-br from-white to-gray-50/50 hover:from-primary-50/30 hover:to-primary-100/30 relative overflow-hidden">
                <CardHeader className="pb-4">
                  {/* File Preview */}
                  {arquivo.tipo_mime?.startsWith('image/') && arquivo.url && (
                    <div className="mb-4 rounded-lg overflow-hidden bg-gray-100">
                      <img 
                        src={arquivo.url} 
                        alt={arquivo.nome}
                        className="w-full h-32 object-cover hover:scale-105 transition-transform duration-200"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    </div>
                  )}
                  
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-4 flex-1 min-w-0">
                      <div className="p-3 bg-gradient-to-br from-primary-100 to-primary-200 rounded-xl shadow-sm">
                        {React.createElement(getFileIcon(arquivo.tipo_mime), { className: "h-7 w-7 text-primary-700" })}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg text-gray-900 truncate group-hover:text-primary-700 transition-colors">
                          {arquivo.nome}
                        </h3>
                        {arquivo.descricao && (
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2 leading-relaxed">
                            {arquivo.descricao}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Action buttons positioned at bottom right with proper z-index */}
                  <div className="absolute bottom-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-all duration-200 z-10">
                    <Button size="sm" variant="ghost" className="hover:bg-blue-100 hover:text-blue-700 bg-white/90 backdrop-blur-sm shadow-sm" onClick={() => handleViewFile(arquivo)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="hover:bg-purple-100 hover:text-purple-700 bg-white/90 backdrop-blur-sm shadow-sm" 
                      onClick={() => handleDownload(arquivo)}
                      title="Download"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" className="hover:bg-green-100 hover:text-green-700 bg-white/90 backdrop-blur-sm shadow-sm" onClick={() => handleEditFile(arquivo)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" className="hover:bg-red-100 hover:text-red-700 bg-white/90 backdrop-blur-sm shadow-sm" onClick={() => handleDeleteFile(arquivo)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{formatBytes(arquivo.tamanho)}</span>
                    <span>{formatDate(arquivo.created_at)}</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="outline" className="text-xs">
                      {CATEGORIA_CONFIG[arquivo.categoria as CategoriaArquivoIA]?.label}
                    </Badge>
                    <Badge variant={arquivo.disponivel_ia ? 'default' : 'secondary'} className="text-xs">
                      {arquivo.disponivel_ia ? 'IA Ativo' : 'IA Inativo'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        arquivo.visibilidade === 'publico' ? 'bg-green-500' : 
                        arquivo.visibilidade === 'privado' ? 'bg-red-500' : 'bg-yellow-500'
                      }`} />
                      <span className="text-xs font-medium capitalize">{arquivo.visibilidade}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-xs text-muted-foreground">
                        Prioridade: <span className="font-medium">{arquivo.prioridade}/10</span>
                      </div>
                    </div>
                  </div>
                  {arquivo.palavras_chave && arquivo.palavras_chave.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {arquivo.palavras_chave.slice(0, 2).map((keyword: string, idx: number) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {keyword}
                        </Badge>
                      ))}
                      {arquivo.palavras_chave.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{arquivo.palavras_chave.length - 2}
                        </Badge>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Upload Modal */}
      <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Upload de Arquivo IA</DialogTitle>
            <DialogDescription>
              Faça upload de um novo arquivo para o sistema de IA
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Upload Mode Selection */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Modo de Adição</Label>
              <div className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="mode-file"
                    name="uploadMode"
                    value="file"
                    checked={uploadMode === 'file'}
                    onChange={(e) => setUploadMode(e.target.value as 'file' | 'existing')}
                  />
                  <Label htmlFor="mode-file" className="cursor-pointer">Fazer upload de novo arquivo</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="mode-existing"
                    name="uploadMode"
                    value="existing"
                    checked={uploadMode === 'existing'}
                    onChange={(e) => setUploadMode(e.target.value as 'file' | 'existing')}
                  />
                  <Label htmlFor="mode-existing" className="cursor-pointer">Vincular arquivo comum existente</Label>
                </div>
              </div>
            </div>

            {/* File Upload Section */}
            {uploadMode === 'file' && (
              <div>
                <Label htmlFor="file">Arquivo *</Label>
                <Input
                  id="file"
                  type="file"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  accept="*/*"
                />
              </div>
            )}

            {/* Common File Selection */}
            {uploadMode === 'existing' && (
              <div className="space-y-3">
                <Label htmlFor="common-file">Selecionar Arquivo Comum *</Label>
                <div className="text-sm text-gray-600 mb-2">
                  Primeiro selecione a categoria para filtrar os arquivos disponíveis
                </div>
                {uploadData.categoria && commonFiles.length > 0 ? (
                  <div className="space-y-2">
                    <Select value={selectedCommonFile || ''} onValueChange={handleCommonFileSelection}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um arquivo comum" />
                      </SelectTrigger>
                      <SelectContent>
                        {commonFiles.map((file) => (
                          <SelectItem key={file.id} value={file.id}>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{file.nome}</span>
                              <span className="text-xs text-gray-500">({formatBytes(file.tamanho)})</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedCommonFile && (
                      <div className="text-xs text-green-600 bg-green-50 p-2 rounded border border-green-200">
                        ✓ Informações do arquivo carregadas automaticamente nos campos abaixo
                      </div>
                    )}
                  </div>
                ) : uploadData.categoria ? (
                  <div className="text-sm text-gray-500 p-3 bg-gray-50 rounded border">
                    Nenhum arquivo comum encontrado para a categoria selecionada.
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 p-3 bg-gray-50 rounded border">
                    Selecione uma categoria primeiro para ver os arquivos disponíveis.
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nome">Nome *</Label>
                <Input
                  id="nome"
                  value={uploadData.nome || ''}
                  onChange={(e) => setUploadData({...uploadData, nome: e.target.value})}
                  placeholder="Nome do arquivo"
                  className={uploadMode === 'existing' && selectedCommonFile ? 'bg-green-50 border-green-200' : ''}
                />
                {uploadMode === 'existing' && selectedCommonFile && uploadData.nome && (
                  <div className="text-xs text-green-600 mt-1">
                    ✓ Preenchido automaticamente
                  </div>
                )}
              </div>
              
              <div>
                <Label htmlFor="categoria">Categoria *</Label>
                <Select value={uploadData.categoria} onValueChange={(value) => handleCategoryChange(value as CategoriaArquivoIA)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CATEGORIA_CONFIG).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={uploadData.descricao || ''}
                onChange={(e) => setUploadData({...uploadData, descricao: e.target.value})}
                placeholder="Descrição do arquivo"
                className={uploadMode === 'existing' && selectedCommonFile && uploadData.descricao ? 'bg-green-50 border-green-200' : ''}
              />
              {uploadMode === 'existing' && selectedCommonFile && uploadData.descricao && (
                <div className="text-xs text-green-600 mt-1">
                  ✓ Preenchido automaticamente
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="instrucoes_ia">Instruções para IA</Label>
                <Textarea
                  id="instrucoes_ia"
                  value={uploadData.instrucoes_ia || ''}
                  onChange={(e) => setUploadData({...uploadData, instrucoes_ia: e.target.value})}
                  placeholder="Como a IA deve usar este arquivo"
                />
              </div>
              
              <div>
                <Label htmlFor="contexto_uso">Contexto de Uso</Label>
                <Textarea
                  id="contexto_uso"
                  value={uploadData.contexto_uso || ''}
                  onChange={(e) => setUploadData({...uploadData, contexto_uso: e.target.value})}
                  placeholder="Quando e como usar este arquivo"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="palavras_chave">Palavras-chave</Label>
                <Input
                  id="palavras_chave"
                  value={uploadData.palavras_chave?.join(', ') || ''}
                  onChange={(e) => setUploadData({...uploadData, palavras_chave: e.target.value.split(',').map(k => k.trim()).filter(k => k)})}
                  placeholder="palavra1, palavra2, palavra3"
                />
              </div>
              
              <div>
                <Label htmlFor="prioridade">Prioridade (1-10)</Label>
                <Input
                  id="prioridade"
                  type="number"
                  min="1"
                  max="10"
                  value={uploadData.prioridade || 5}
                  onChange={(e) => setUploadData({...uploadData, prioridade: parseInt(e.target.value)})}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cliente_id">Cliente</Label>
                <Select value={uploadData.cliente_id || 'none'} onValueChange={(value) => setUploadData({...uploadData, cliente_id: value === 'none' ? undefined : value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum cliente</SelectItem>
                    {(clientes as any[]).map((cliente: any) => (
                      <SelectItem key={cliente.id} value={cliente.id}>
                        {cliente.nome_contato || cliente.nome_empresa}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="visibilidade">Visibilidade</Label>
                <Select value={uploadData.visibilidade} onValueChange={(value) => setUploadData({...uploadData, visibilidade: value as any})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="privado">Privado</SelectItem>
                    <SelectItem value="publico">Público</SelectItem>
                    <SelectItem value="restrito">Restrito</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={uploadData.observacoes || ''}
                onChange={(e) => setUploadData({...uploadData, observacoes: e.target.value})}
                placeholder="Observações adicionais"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="disponivel_ia"
                checked={uploadData.disponivel_ia || false}
                onChange={(e) => setUploadData({...uploadData, disponivel_ia: e.target.checked})}
              />
              <Label htmlFor="disponivel_ia">Disponível para IA</Label>
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={handleUpload} disabled={uploadMutation.isPending}>
                {uploadMutation.isPending ? 'Salvando...' : 'Salvar Arquivo'}
              </Button>
              <Button variant="outline" onClick={() => setIsUploadModalOpen(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Arquivo</DialogTitle>
            <DialogDescription>
              Visualize todas as informações e metadados do arquivo.
            </DialogDescription>
          </DialogHeader>
          
          {selectedArquivo && (
            <div className="space-y-6">
              {/* File Preview Section */}
              <div className="space-y-4">
                <Label className="font-semibold text-lg">Pré-visualização</Label>
                <div className="border rounded-lg p-4 bg-gray-50">
                  {selectedArquivo.tipo_mime?.startsWith('image/') && selectedArquivo.url ? (
                    <div className="flex justify-center">
                      <img 
                        src={selectedArquivo.url} 
                        alt={selectedArquivo.nome}
                        className="max-w-full max-h-96 object-contain rounded-lg shadow-md"
                        onError={(e) => {
                          e.currentTarget.parentElement!.innerHTML = '<div class="text-center text-gray-500 py-8"><p>Não foi possível carregar a pré-visualização da imagem</p></div>'
                        }}
                      />
                    </div>
                  ) : selectedArquivo.tipo_mime?.startsWith('video/') && selectedArquivo.url ? (
                    <div className="flex justify-center">
                      <video 
                        controls 
                        className="max-w-full max-h-96 rounded-lg shadow-md"
                        onError={(e) => {
                          e.currentTarget.parentElement!.innerHTML = '<div class="text-center text-gray-500 py-8"><p>Não foi possível carregar a pré-visualização do vídeo</p></div>'
                        }}
                      >
                        <source src={selectedArquivo.url} type={selectedArquivo.tipo_mime} />
                        Seu navegador não suporta a reprodução de vídeo.
                      </video>
                    </div>
                  ) : selectedArquivo.tipo_mime?.includes('pdf') && selectedArquivo.url ? (
                    <div className="space-y-4">
                      <div className="flex justify-center">
                        <iframe 
                          src={`${selectedArquivo.url}#toolbar=0`}
                          className="w-full h-96 border rounded-lg"
                          title={selectedArquivo.nome}
                          onError={(e) => {
                            e.currentTarget.parentElement!.innerHTML = '<div class="text-center text-gray-500 py-8"><p>Não foi possível carregar a pré-visualização do PDF</p><a href="' + selectedArquivo.url + '" target="_blank" class="text-blue-600 hover:underline">Abrir PDF em nova aba</a></div>'
                          }}
                        />
                      </div>
                      <div className="text-center">
                        <a 
                          href={selectedArquivo.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-sm"
                        >
                          Abrir PDF em nova aba
                        </a>
                      </div>
                    </div>
                  ) : selectedArquivo.tipo_mime?.startsWith('text/') && selectedArquivo.url ? (
                    <div className="text-center text-gray-500 py-8">
                      <p>Arquivo de texto</p>
                      <a 
                        href={selectedArquivo.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm"
                      >
                        Abrir arquivo
                      </a>
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 py-8">
                      <div className="flex flex-col items-center space-y-2">
                        {React.createElement(getFileIcon(selectedArquivo.tipo_mime), { className: "h-16 w-16 text-gray-400" })}
                        <p>Pré-visualização não disponível para este tipo de arquivo</p>
                        <p className="text-xs">Tipo: {selectedArquivo.tipo_mime}</p>
                        {selectedArquivo.url && (
                          <a 
                            href={selectedArquivo.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline text-sm"
                          >
                            Abrir arquivo
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-semibold">Nome do Arquivo</Label>
                  <p className="text-sm">{selectedArquivo.nome}</p>
                </div>
                <div className="space-y-2">
                  <Label className="font-semibold">Categoria</Label>
                  <Badge>{CATEGORIA_CONFIG[selectedArquivo.categoria]?.label}</Badge>
                </div>
                <div className="space-y-2">
                  <Label className="font-semibold">Tamanho</Label>
                  <p className="text-sm">{formatBytes(selectedArquivo.tamanho)}</p>
                </div>
                <div className="space-y-2">
                  <Label className="font-semibold">Criado em</Label>
                  <p className="text-sm">{formatDate(selectedArquivo.created_at)}</p>
                </div>
              </div>

              {selectedArquivo.descricao && (
                <div className="space-y-2">
                  <Label className="font-semibold">Descrição</Label>
                  <p className="text-sm">{selectedArquivo.descricao}</p>
                </div>
              )}

              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Metadados IA</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-semibold">Prioridade</Label>
                    <Badge variant="outline">{selectedArquivo.prioridade}/10</Badge>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-semibold">Status IA</Label>
                    <Badge variant={selectedArquivo.disponivel_ia ? 'default' : 'secondary'}>
                      {selectedArquivo.disponivel_ia ? 'Disponível' : 'Indisponível'}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-semibold">Visibilidade</Label>
                    <Badge variant="outline">{selectedArquivo.visibilidade}</Badge>
                  </div>
                </div>

                {selectedArquivo.instrucoes_ia && (
                  <div className="space-y-2">
                    <Label className="font-semibold">Instruções para IA</Label>
                    <p className="text-sm bg-muted p-3 rounded">{selectedArquivo.instrucoes_ia}</p>
                  </div>
                )}

                {selectedArquivo.contexto_uso && (
                  <div className="space-y-2">
                    <Label className="font-semibold">Contexto de Uso</Label>
                    <p className="text-sm bg-muted p-3 rounded">{selectedArquivo.contexto_uso}</p>
                  </div>
                )}

                {selectedArquivo.palavras_chave && selectedArquivo.palavras_chave.length > 0 && (
                  <div className="space-y-2">
                    <Label className="font-semibold">Palavras-chave</Label>
                    <div className="flex flex-wrap gap-2">
                      {selectedArquivo.palavras_chave.map((keyword, index) => (
                        <Badge key={index} variant="outline">{keyword}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {selectedArquivo.observacoes && (
                  <div className="space-y-2">
                    <Label className="font-semibold">Observações</Label>
                    <p className="text-sm bg-muted p-3 rounded">{selectedArquivo.observacoes}</p>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <Button onClick={() => handleDownload(selectedArquivo)} className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Download
                </Button>
                <Button variant="outline" onClick={() => {
                  setIsViewModalOpen(false)
                  handleEditFile(selectedArquivo)
                }} className="flex items-center gap-2">
                  <Edit className="h-4 w-4" />
                  Editar
                </Button>
                <Button variant="destructive" onClick={() => {
                  setIsViewModalOpen(false)
                  handleDeleteFile(selectedArquivo)
                }} className="flex items-center gap-2">
                  <Trash2 className="h-4 w-4" />
                  Excluir
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Arquivo IA</DialogTitle>
            <DialogDescription>
              Atualize as informações e metadados do arquivo.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome do Arquivo *</Label>
                <Input
                  value={editData.nome || ''}
                  onChange={(e) => setEditData({...editData, nome: e.target.value})}
                  placeholder="Nome do arquivo"
                />
              </div>
              <div className="space-y-2">
                <Label>Categoria *</Label>
                <Select 
                  value={editData.categoria || ''} 
                  onValueChange={(v) => setEditData({...editData, categoria: v as CategoriaArquivoIA})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CATEGORIA_CONFIG).map(([key, config]) => (
                      <SelectItem key={key} value={key}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                value={editData.descricao || ''}
                onChange={(e) => setEditData({...editData, descricao: e.target.value})}
                placeholder="Descrição do arquivo"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Prioridade (1-10)</Label>
                <Input
                  type="number"
                  min="1"
                  max="10"
                  value={editData.prioridade || 5}
                  onChange={(e) => setEditData({...editData, prioridade: parseInt(e.target.value)})}
                />
              </div>
              <div className="space-y-2">
                <Label>Visibilidade</Label>
                <Select 
                  value={editData.visibilidade || 'privado'} 
                  onValueChange={(v) => setEditData({...editData, visibilidade: v as any})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="publico">Público</SelectItem>
                    <SelectItem value="privado">Privado</SelectItem>
                    <SelectItem value="restrito">Restrito</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Instruções para IA</Label>
              <Textarea
                value={editData.instrucoes_ia || ''}
                onChange={(e) => setEditData({...editData, instrucoes_ia: e.target.value})}
                placeholder="Como a IA deve interpretar e usar este arquivo"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Contexto de Uso</Label>
              <Textarea
                value={editData.contexto_uso || ''}
                onChange={(e) => setEditData({...editData, contexto_uso: e.target.value})}
                placeholder="Quando e em que situações a IA deve referenciar este arquivo"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Palavras-chave (separadas por vírgula)</Label>
              <Input
                value={editData.palavras_chave?.join(', ') || ''}
                onChange={(e) => setEditData({...editData, palavras_chave: e.target.value.split(',').map(k => k.trim()).filter(k => k)})}
                placeholder="palavra1, palavra2, palavra3"
              />
            </div>

            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                value={editData.observacoes || ''}
                onChange={(e) => setEditData({...editData, observacoes: e.target.value})}
                placeholder="Notas adicionais sobre o tratamento especial do conteúdo"
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="edit_disponivel_ia"
                checked={editData.disponivel_ia || false}
                onChange={(e) => setEditData({...editData, disponivel_ia: e.target.checked})}
              />
              <Label htmlFor="edit_disponivel_ia">Disponível para IA</Label>
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={handleSaveEdit} disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
              <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir este arquivo? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          
          {selectedArquivo && (
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded">
                <p className="font-medium">{selectedArquivo.nome}</p>
                <p className="text-sm text-muted-foreground">{selectedArquivo.categoria}</p>
              </div>
              
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
                  Cancelar
                </Button>
                <Button variant="destructive" onClick={confirmDelete} className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Excluir Arquivo
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
