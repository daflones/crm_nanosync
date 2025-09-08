import { supabase } from '@/lib/supabase'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { AtividadeService } from './atividades'

export type CategoriaArquivo = 'propostas' | 'contratos' | 'marketing' | 'produtos' | 'relatorios' | 'sistema' | 'juridico' | 'vendas'

export interface Arquivo {
  id: string
  nome: string
  tipo: string
  tamanho: number
  url: string
  categoria: CategoriaArquivo
  bucket_name: string
  file_path?: string
  mime_type?: string
  is_public?: boolean
  tags?: string[]
  descricao?: string
  metadata?: Record<string, any>
  entity_type?: string
  entity_id?: string
  downloaded_times?: number
  downloaded_at?: string
  profile: string // Campo para filtro multi-tenant
  created_at: string
  updated_at: string
}

export interface ArquivoCreateData {
  nome: string
  tipo: string
  tamanho: number
  categoria: CategoriaArquivo
  entity_type?: string
  entity_id?: string
  descricao?: string
  uploaded_by?: string
  tags?: string[]
  metadata?: Record<string, any>
  is_public?: boolean
}

export interface ArquivoUpdateData {
  nome?: string
  descricao?: string
  categoria?: CategoriaArquivo
  tags?: string[]
  metadata?: Record<string, any>
  is_public?: boolean
}

// Helper function to determine bucket and path based on category
const getBucketInfo = (categoria: CategoriaArquivo, fileName: string) => {
  const timestamp = Date.now()
  const cleanFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
  
  // Map produtos category to existing product-images bucket
  const bucketName = categoria === 'produtos' ? 'product-images' : categoria
  const filePath = categoria === 'produtos' 
    ? `products/${timestamp}-${cleanFileName}` 
    : `${categoria}/${timestamp}-${cleanFileName}`
  
  return {
    bucket: bucketName,
    path: filePath
  }
}

// Helper function to get file icon based on mime type
const getFileIcon = (mimeType: string) => {
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('video/')) return 'video'
  if (mimeType.includes('pdf')) return 'pdf'
  if (mimeType.includes('word') || mimeType.includes('document')) return 'document'
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'spreadsheet'
  if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return 'presentation'
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar')) return 'archive'
  return 'file'
}

export const arquivosService = {
  async getAll(filters?: {
    categoria?: CategoriaArquivo
    entity_type?: string
    entity_id?: string
    tags?: string[]
  }): Promise<Arquivo[]> {
    // Obter usuário atual e perfil para filtro multi-tenant
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    if (!currentUser) {
      throw new Error('Usuário não autenticado')
    }

    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('id, role, admin_profile_id')
      .eq('id', currentUser.id)
      .single()

    if (!currentProfile) {
      throw new Error('Perfil não encontrado')
    }

    // Determinar o ID da empresa (admin_profile_id ou próprio ID se for admin)
    const adminId = currentProfile.admin_profile_id || currentProfile.id

    // Special handling for produtos category to include existing product images
    if (filters?.categoria === 'produtos') {
      return this.getProdutosFiles(adminId)
    }

    let query = supabase
      .from('arquivos')
      .select('*')
      .eq('profile', adminId)
      .order('created_at', { ascending: false })

    if (filters?.categoria) {
      query = query.eq('categoria', filters.categoria)
    }
    if (filters?.entity_type) {
      query = query.eq('entity_type', filters.entity_type)
    }
    if (filters?.entity_id) {
      query = query.eq('entity_id', filters.entity_id)
    }
    if (filters?.tags && filters.tags.length > 0) {
      query = query.overlaps('tags', filters.tags)
    }

    const { data, error } = await query

    if (error) {
      console.error('Erro ao buscar arquivos:', error)
      throw new Error(`Erro ao buscar arquivos: ${error.message}`)
    }

    // Return only files from arquivos table - no more mixing with storage bucket files

    return data || []
  },

  async getProdutosFiles(adminId: string): Promise<Arquivo[]> {
    // Get files from arquivos table with categoria 'produtos' only
    const { data: arquivosData, error: arquivosError } = await supabase
      .from('arquivos')
      .select('*')
      .eq('categoria', 'produtos')
      .eq('profile', adminId)
      .order('created_at', { ascending: false })

    if (arquivosError) {
      console.error('Erro ao buscar arquivos de produtos:', arquivosError)
      return []
    }

    // Return only files from arquivos table - no more bucket mixing
    return arquivosData || []
  },

  async getById(id: string): Promise<Arquivo | null> {
    // Obter usuário atual e perfil para filtro multi-tenant
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    if (!currentUser) {
      throw new Error('Usuário não autenticado')
    }

    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('id, role, admin_profile_id')
      .eq('id', currentUser.id)
      .single()

    if (!currentProfile) {
      throw new Error('Perfil não encontrado')
    }

    // Determinar o ID da empresa (admin_profile_id ou próprio ID se for admin)
    const adminId = currentProfile.admin_profile_id || currentProfile.id

    const { data, error } = await supabase
      .from('arquivos')
      .select('*')
      .eq('id', id)
      .eq('profile', adminId)
      .single()

    if (error) {
      console.error('Erro ao buscar arquivo:', error)
      throw new Error(`Erro ao buscar arquivo: ${error.message}`)
    }

    return data
  },

  async getStats(): Promise<{
    totalFiles: number
    totalSize: number
    categoryCounts: Record<CategoriaArquivo, number>
    recentFiles: number
  }> {
    const { data: files, error } = await supabaseAdmin
      .from('arquivos')
      .select('categoria, tamanho, created_at')

    if (error) {
      console.error('Erro ao buscar estatísticas:', error)
      throw new Error(`Erro ao buscar estatísticas: ${error.message}`)
    }

    const totalFiles = files?.length || 0
    const totalSize = files?.reduce((sum: number, file: any) => sum + (file.tamanho || 0), 0) || 0
    
    const categoryCounts = files?.reduce((acc: any, file: any) => {
      acc[file.categoria as CategoriaArquivo] = (acc[file.categoria as CategoriaArquivo] || 0) + 1
      return acc
    }, {} as Record<CategoriaArquivo, number>) || {} as Record<CategoriaArquivo, number>

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const recentFiles = files?.filter((file: any) => file.created_at > oneDayAgo).length || 0

    return {
      totalFiles,
      totalSize,
      categoryCounts,
      recentFiles
    }
  },

  async upload(file: File, data: ArquivoCreateData): Promise<Arquivo> {
    // Obter usuário atual e perfil para multi-tenant
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    if (!currentUser) {
      throw new Error('Usuário não autenticado')
    }

    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('id, role, admin_profile_id')
      .eq('id', currentUser.id)
      .single()

    if (!currentProfile) {
      throw new Error('Perfil não encontrado')
    }

    // Determinar o ID da empresa (admin_profile_id ou próprio ID se for admin)
    const adminId = currentProfile.admin_profile_id || currentProfile.id

    const { bucket, path } = getBucketInfo(data.categoria, file.name)
    
    // Validate file type and size
    const maxSize = 50 * 1024 * 1024 // 50MB
    if (file.size > maxSize) {
      throw new Error('Arquivo muito grande. Tamanho máximo: 50MB')
    }

    // Check for potentially problematic file types
    const allowedTypes = [
      // Images
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
      // Documents
      'application/pdf', 'text/plain', 'text/csv',
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      // Archives
      'application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed',
      // Videos
      'video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/webm',
      // Audio
      'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/mpeg'
    ]

    if (file.type && !allowedTypes.includes(file.type)) {
      console.warn(`File type ${file.type} may not be supported by Supabase storage`)
    }

    // Upload do arquivo para o bucket específico da categoria
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('Erro ao fazer upload:', uploadError)
      throw new Error(`Erro ao fazer upload: ${uploadError.message}`)
    }

    // Obter URL pública do arquivo
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(path)

    // For product images with specific product selected, also update the product's image field
    if (data.categoria === 'produtos' && data.entity_id && data.entity_id !== 'none') {
      
      // Update product's imagem_principal field
      const { error: productError } = await supabase
        .from('produtos')
        .update({ imagem_principal: urlData.publicUrl })
        .eq('id', data.entity_id)

      if (productError) {
        console.error('Erro ao atualizar imagem do produto:', productError)
        // Don't throw error, just log it
      }
    }

    // Save all files to arquivos table
    const { data: savedFile, error } = await supabaseAdmin
      .from('arquivos')
      .insert({
        nome: data.nome || file.name,
        tipo: data.tipo || getFileIcon(file.type),
        mime_type: file.type,
        tamanho: data.tamanho || file.size,
        url: urlData.publicUrl,
        categoria: data.categoria,
        bucket_name: bucket,
        file_path: path,
        is_public: data.is_public !== undefined ? data.is_public : !['sistema', 'juridico'].includes(data.categoria),
        entity_type: data.entity_type,
        entity_id: data.entity_id && data.entity_id !== 'none' ? data.entity_id : undefined,
        descricao: data.descricao,
        tags: data.tags || [],
        metadata: data.metadata || {},
        profile: adminId
      })
      .select()
      .single()

    if (error) {
      // Se falhar, deletar o arquivo do storage
      await supabase.storage.from(bucket).remove([path])
      console.error('Erro ao salvar arquivo no banco:', error)
      throw new Error(`Erro ao salvar arquivo: ${error.message}`)
    }

    // Registrar atividade de upload
    await AtividadeService.upload(
      'arquivo',
      savedFile.id,
      savedFile,
      `Arquivo enviado: ${savedFile.nome} (${data.categoria})`
    )

    return savedFile
  },

  async update(id: string, data: ArquivoUpdateData): Promise<Arquivo> {
    // Handle product images differently since they don't exist in arquivos table
    if (id.startsWith('product-image-')) {
      const fileName = id.replace('product-image-', '')
      
      // Try to rename the file in storage if name changed
      if (data.nome && data.nome !== fileName) {
        const newFileName = `${data.nome.replace(/[^a-zA-Z0-9.-]/g, '_')}`
        const oldPath = `products/${fileName}`
        const newPath = `products/${newFileName}`
        
        try {
          // Copy file to new location
          const { data: fileData } = await supabase.storage
            .from('product-images')
            .download(oldPath)
          
          if (fileData) {
            await supabase.storage
              .from('product-images')
              .upload(newPath, fileData, { upsert: true })
            
            // Delete old file
            await supabase.storage
              .from('product-images')
              .remove([oldPath])
          }
        } catch (error) {
          console.warn('Could not rename file in storage:', error)
        }
      }

      const { data: urlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(`products/${fileName}`)

      return {
        id,
        nome: data.nome || fileName.replace(/\.[^/.]+$/, '').replace(/_/g, ' '),
        tipo: getFileIcon('image/jpeg'),
        mime_type: 'image/jpeg',
        tamanho: 0,
        url: urlData.publicUrl,
        categoria: 'produtos',
        bucket_name: 'product-images',
        file_path: `products/${fileName}`,
        is_public: true,
        entity_type: 'produto',
        entity_id: undefined,
        descricao: data.descricao || 'Imagem de produto',
        tags: data.tags || [],
        metadata: data.metadata || {},
        profile: 'legacy', // Para arquivos legados
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    }

    const { data: updatedFile, error } = await supabaseAdmin
      .from('arquivos')
      .update({
        nome: data.nome,
        descricao: data.descricao,
        categoria: data.categoria,
        tags: data.tags,
        metadata: data.metadata,
        is_public: data.is_public,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar arquivo:', error)
      throw new Error(`Erro ao atualizar arquivo: ${error.message}`)
    }

    return updatedFile
  },

  async delete(id: string): Promise<void> {
    // Buscar dados completos do arquivo antes de deletar
    const arquivoCompleto = await this.getById(id)
    
    // Buscar arquivo para obter informações do storage e produto associado
    const { data: arquivo } = await supabaseAdmin
      .from('arquivos')
      .select('bucket_name, file_path, entity_type, entity_id, url')
      .eq('id', id)
      .single()

    // Se for uma imagem de produto específico, limpar a URL do produto
    if (arquivo?.entity_type === 'produto' && arquivo?.entity_id) {
      
      // Verificar se esta URL é a imagem principal do produto
      const { data: produto } = await supabase
        .from('produtos')
        .select('imagem_principal')
        .eq('id', arquivo.entity_id)
        .single()

      // Se a URL do arquivo corresponde à imagem principal, limpar
      if (produto?.imagem_principal === arquivo.url) {
        await supabase
          .from('produtos')
          .update({ imagem_principal: null })
          .eq('id', arquivo.entity_id)
      }
    }

    // Deletar do banco
    const { error } = await supabaseAdmin
      .from('arquivos')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Erro ao deletar arquivo:', error)
      throw new Error(`Erro ao deletar arquivo: ${error.message}`)
    }

    // Registrar atividade de exclusão
    if (arquivoCompleto) {
      await AtividadeService.deletar(
        'arquivo',
        id,
        arquivoCompleto,
        `Arquivo deletado: ${arquivoCompleto.nome} (${arquivoCompleto.categoria})`
      )
    }

    // Deletar do storage se existir
    if (arquivo?.bucket_name && arquivo?.file_path) {
      await supabase.storage
        .from(arquivo.bucket_name)
        .remove([arquivo.file_path])
    }
  },

  async downloadFile(id: string): Promise<Blob> {
    const arquivo = await this.getById(id)
    if (!arquivo) {
      throw new Error('Arquivo não encontrado')
    }

    // Always try to download via URL first since that's what's working
    try {
      const response = await fetch(arquivo.url)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const blob = await response.blob()
      
      // Update download tracking
      try {
        const currentTimes = arquivo.downloaded_times || 0
        await supabaseAdmin
          .from('arquivos')
          .update({
            downloaded_times: currentTimes + 1,
            downloaded_at: new Date().toISOString()
          })
          .eq('id', id)
        
        // Registrar atividade de download
        await AtividadeService.download(
          'arquivo',
          arquivo.id,
          arquivo,
          `Arquivo baixado: ${arquivo.nome} (${arquivo.categoria})`
        )
        // Download tracking updated successfully
      } catch (updateError) {
        console.error('Erro ao atualizar estatísticas de download:', updateError)
      }
      
      return blob
    } catch (fetchError) {
      console.error('Erro ao baixar via URL:', fetchError)
      throw new Error(`Erro ao baixar arquivo: ${fetchError}`)
    }
  }
}
