import { supabase } from '@/lib/supabase'
import { arquivosService } from './api/arquivos'

export const storageService = {
  async uploadProductImage(file: File, productId: string): Promise<string> {
    try {
      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('Usuário não autenticado')
      }

      // Get product data for naming
      const { data: produto } = await supabase
        .from('produtos')
        .select('nome, codigo')
        .eq('id', productId)
        .single()

      if (!produto) {
        throw new Error('Produto não encontrado')
      }

      const fileExt = file.name.split('.').pop()?.toLowerCase()
      const fileName = `${productId}.${fileExt}`
      const filePath = `products/${fileName}`

      // Validate file type
      const allowedTypes = ['jpg', 'jpeg', 'png', 'webp', 'gif']
      if (!fileExt || !allowedTypes.includes(fileExt)) {
        throw new Error('Tipo de arquivo não suportado. Use JPG, PNG, WebP ou GIF.')
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Arquivo muito grande. Máximo 5MB.')
      }

      // Try to delete existing image (ignore errors)
      try {
        await supabase.storage
          .from('product-images')
          .remove([filePath])
      } catch (e) {
        // Ignore deletion errors
      }

      // Upload new image
      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type
        })

      if (error) {
        console.error('Erro detalhado do upload:', error)
        
        // Handle specific RLS errors
        if (error.message.includes('row-level security policy')) {
          throw new Error('Erro de permissão. Verifique se o bucket está configurado corretamente.')
        }
        
        throw new Error(`Erro ao fazer upload: ${error.message}`)
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(data.path)

      // Create entry in arquivos table
      try {
        await arquivosService.upload(file, {
          nome: produto.nome,
          tipo: 'image',
          tamanho: file.size,
          categoria: 'produtos',
          descricao: `Imagem do produto ${produto.nome}`,
          tags: [produto.codigo],
          entity_type: 'produto',
          entity_id: productId,
          is_public: true
        })
      } catch (arquivoError) {
        console.error('Erro ao salvar no arquivos:', arquivoError)
        // Don't throw error, just log it since the main upload succeeded
      }

      return publicUrl
    } catch (error) {
      console.error('Erro no uploadProductImage:', error)
      throw error
    }
  },

  async deleteProductImage(imagePath: string): Promise<void> {
    // Extract path from URL if it's a full URL
    const path = imagePath.includes('/product-images/') 
      ? imagePath.split('/product-images/')[1]
      : imagePath

    const { error } = await supabase.storage
      .from('product-images')
      .remove([`products/${path}`])

    if (error) {
      console.error('Erro ao deletar imagem:', error)
      throw new Error(`Erro ao deletar imagem: ${error.message}`)
    }
  },

  getImageUrl(imagePath: string): string {
    if (!imagePath) return ''
    
    // If it's already a full URL, return as is
    if (imagePath.startsWith('http')) {
      return imagePath
    }

    // Otherwise, construct the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(`products/${imagePath}`)

    return publicUrl
  }
}
