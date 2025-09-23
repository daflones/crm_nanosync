import { supabase } from '@/lib/supabase'
import type { ArquivoIA, CreateArquivoIAData, UpdateArquivoIAData, ArquivoIAFilters } from '../../types/arquivos-ia'
import { CATEGORIA_CONFIG } from '../../types/arquivos-ia'

// Generate automatic folder path based on category and subcategory
export const generateFolderPath = (categoria: string, subcategoria?: string): string => {
  const config = CATEGORIA_CONFIG[categoria as keyof typeof CATEGORIA_CONFIG]
  if (!config) return 'outros/'
  
  if (subcategoria && subcategoria.trim()) {
    const normalizedSubcat = subcategoria.toLowerCase().replace(/\s+/g, '_')
    return `${config.folder}/${normalizedSubcat}/`
  }
  
  return `${config.folder}/`
}

// Get all AI files with filters
export const getArquivosIA = async (filters?: ArquivoIAFilters): Promise<ArquivoIA[]> => {
  try {
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

    let query = supabase
      .from('arquivos_ia')
      .select('*')
      .eq('profile', adminId)
      .is('deleted_at', null)  // Only get non-deleted files
      .order('created_at', { ascending: false })
    
    // Apply filters
    if (filters?.categoria) {
      query = query.eq('categoria', filters.categoria)
    }
    
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    
    if (filters?.disponivel_ia !== undefined) {
      query = query.eq('disponivel_ia', filters.disponivel_ia)
    }
    
    if (filters?.processado_ia !== undefined) {
      query = query.eq('processado_ia', filters.processado_ia)
    }
    
    if (filters?.visibilidade) {
      query = query.eq('visibilidade', filters.visibilidade)
    }
    
    if (filters?.cliente_id) {
      query = query.eq('cliente_id', filters.cliente_id)
    }
    
    if (filters?.produto_id) {
      query = query.eq('produto_id', filters.produto_id)
    }
    
    if (filters?.proposta_id) {
      query = query.eq('proposta_id', filters.proposta_id)
    }
    
    if (filters?.search) {
      query = query.or(`nome.ilike.%${filters.search}%,descricao.ilike.%${filters.search}%`)
    }
    
    if (filters?.palavras_chave && filters.palavras_chave.length > 0) {
      query = query.overlaps('palavras_chave', filters.palavras_chave)
    }

    const { data: arquivos, error } = await query

    if (error) {
      console.error('Erro ao buscar arquivos IA:', error)
      throw error
    }
    
    // Double-check: filter out deleted files in case the query didn't work
    const filteredArquivos = arquivos?.filter((arquivo: any) => !arquivo.deleted_at) || []

    return filteredArquivos
  } catch (error) {
    console.error('Erro ao buscar arquivos IA:', error)
    throw error
  }
}

// Get single AI file by ID
export const getArquivoIA = async (id: string): Promise<ArquivoIA | null> => {
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
    .from('arquivos_ia')
    .select(`
      *,
      clientes:cliente_id(id, nome_contato, nome_empresa),
      produtos:produto_id(id, nome),
      propostas:proposta_id(id, titulo)
    `)
    .eq('id', id)
    .eq('profile', adminId)
    .is('deleted_at', null)
    .single()

  if (error) {
    console.error('Erro ao buscar arquivo IA:', error)
    throw error
  }

  return data
}

// Upload and create AI file
export const uploadArquivoIA = async (file: File, data: CreateArquivoIAData): Promise<ArquivoIA> => {
  try {
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

    // Generate folder path based on category
    const folderPath = generateFolderPath(data.categoria, data.subcategoria)
    
    // Create unique filename
    const timestamp = Date.now()
    const extension = file.name.split('.').pop()
    const fileName = `${timestamp}_${data.nome.replace(/[^a-zA-Z0-9]/g, '_')}.${extension}`
    const fullPath = `${folderPath}${fileName}`

    // Upload file to storage
    const { error: uploadError } = await supabase.storage
      .from('ia')
      .upload(fullPath, file, {
        cacheControl: '3600',
        upsert: false
      })
    
    if (uploadError) {
      throw new Error(uploadError.message || 'Erro no upload do arquivo')
    }

    // Get file URL
    const { data: { publicUrl } } = supabase.storage
      .from('ia')
      .getPublicUrl(fullPath)
    const fileUrl = publicUrl

    // Create database record with only essential fields
    const arquivoData = {
      nome: data.nome,
      nome_original: data.nome_original,
      descricao: data.descricao || null,
      tamanho: data.tamanho,
      tipo_mime: data.tipo_mime,
      extensao: extension || null,
      url: fileUrl,
      caminho_storage: fullPath,
      bucket_name: 'ia',
      categoria: data.categoria,
      subcategoria: data.subcategoria || null,
      instrucoes_ia: data.instrucoes_ia || null,
      contexto_uso: data.contexto_uso || null,
      palavras_chave: data.palavras_chave || null,
      prioridade: data.prioridade || 5,
      observacoes: data.observacoes || null,
      cliente_id: data.cliente_id || null,
      disponivel_ia: data.disponivel_ia !== false,
      processado_ia: false,
      visibilidade: data.visibilidade || 'privado',
      profile: adminId
    }
    
    const { data: newArquivo, error } = await supabase
      .from('arquivos_ia')
      .insert([arquivoData])
      .select('*')
      .single()

    if (error) {
      console.error('Database insert error:', error)
      // If database insert fails, cleanup uploaded file
      await supabase.storage.from('ia').remove([fullPath])
      throw new Error(`Erro na inserção: ${error.message}`)
    }

    return newArquivo
  } catch (error) {
    console.error('Erro ao fazer upload do arquivo IA:', error)
    throw error
  }
}

// Update AI file
export const updateArquivoIA = async (id: string, data: UpdateArquivoIAData): Promise<ArquivoIA> => {
  const { data: updatedArquivo, error } = await supabase
    .from('arquivos_ia')
    .update(data)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Erro ao atualizar arquivo IA:', error)
    throw error
  }

  return updatedArquivo
}

// Soft delete AI file
export const deleteArquivoIA = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('arquivos_ia')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    console.error('Erro ao excluir arquivo IA:', error)
    throw error
  }
}

// Hard delete AI file (removes from storage and database)
export const hardDeleteArquivoIA = async (id: string): Promise<void> => {
  // First get the file info
  const arquivo = await getArquivoIA(id)
  if (!arquivo) {
    throw new Error('Arquivo não encontrado')
  }

  // Delete from storage
  await supabase.storage.from(arquivo.bucket_name).remove([arquivo.caminho_storage])

  // Delete from database
  const { error } = await supabase
    .from('arquivos_ia')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Erro ao excluir permanentemente arquivo IA:', error)
    throw error
  }
}

// Mark file as processed by AI
export const markAsProcessed = async (id: string): Promise<ArquivoIA> => {
  const { data: updatedArquivo, error } = await supabase
    .from('arquivos_ia')
    .update({ 
      processado_ia: true,
      data_processamento: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Erro ao marcar arquivo como processado:', error)
    throw error
  }

  return updatedArquivo
}

// Update usage statistics
export const updateUsageStats = async (id: string, type: 'view' | 'download' | 'ai_usage'): Promise<void> => {
  let updateData: any = {}
  
  switch (type) {
    case 'view':
      updateData = { visualizacoes: supabase.rpc('increment_views', { arquivo_id: id }) }
      break
    case 'download':
      updateData = { downloads: supabase.rpc('increment_downloads', { arquivo_id: id }) }
      break
    case 'ai_usage':
      updateData = { ultima_utilizacao_ia: new Date().toISOString() }
      break
  }

  const { error } = await supabase
    .from('arquivos_ia')
    .update(updateData)
    .eq('id', id)

  if (error) {
    console.error('Erro ao atualizar estatísticas de uso:', error)
    throw error
  }
}

// Get files by category (for folder navigation)
export const getArquivosByCategory = async (categoria: string, subcategoria?: string): Promise<ArquivoIA[]> => {
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

  let query = supabase
    .from('arquivos_ia')
    .select('*')
    .eq('categoria', categoria)
    .eq('profile', adminId)
    .is('deleted_at', null)
    .order('nome')

  if (subcategoria) {
    query = query.eq('subcategoria', subcategoria)
  }

  const { data, error } = await query

  if (error) {
    console.error('Erro ao buscar arquivos por categoria:', error)
    throw error
  }

  return data || []
}

// Get category statistics
export const getCategoryStats = async () => {
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
    .from('arquivos_ia')
    .select('categoria, status, disponivel_ia, processado_ia')
    .eq('profile', adminId)
    .is('deleted_at', null)

  if (error) {
    console.error('Erro ao buscar estatísticas por categoria:', error)
    throw error
  }

  // Process statistics
  const stats = data?.reduce((acc: any, arquivo: any) => {
    const cat = arquivo.categoria
    if (!acc[cat]) {
      acc[cat] = {
        total: 0,
        ativo: 0,
        disponivel_ia: 0,
        processado_ia: 0
      }
    }
    
    acc[cat].total++
    if (arquivo.status === 'ativo') acc[cat].ativo++
    if (arquivo.disponivel_ia) acc[cat].disponivel_ia++
    if (arquivo.processado_ia) acc[cat].processado_ia++
    
    return acc
  }, {} as Record<string, any>)

  return stats || {}
}
