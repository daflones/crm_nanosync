import { supabase } from '@/lib/supabase'
import { AtividadeService } from './atividades'

export interface Categoria {
  id: string
  nome: string
  codigo: string
  descricao?: string
  icone?: string
  cor?: string
  status: 'ativo' | 'inativo'
  ordem?: number
  configuracoes?: any
  profile: string // Campo para filtro por empresa
  created_at: string
  updated_at: string
}

export interface CategoriaCreateData {
  nome: string
  codigo: string
  descricao?: string
  icone?: string
  cor?: string
  status?: 'ativo' | 'inativo'
  ordem?: number
}

export interface CategoriaUpdateData extends Partial<CategoriaCreateData> {}

export const categoriasService = {
  async getAll(): Promise<Categoria[]> {
    // Get current user's profile to filter by company
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    if (!currentUser) {
      throw new Error('Usuário não autenticado')
    }

    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('id, admin_profile_id')
      .eq('id', currentUser.id)
      .single()

    if (!currentProfile) {
      throw new Error('Perfil não encontrado')
    }

    // Use admin_profile_id to filter categorias
    const adminId = currentProfile.admin_profile_id || currentProfile.id

    const { data, error } = await supabase
      .from('categorias')
      .select('*')
      .eq('profile', adminId) // Filter by company
      .order('nome', { ascending: true })

    if (error) {
      console.error('Erro ao buscar categorias:', error)
      throw new Error(`Erro ao buscar categorias: ${error.message}`)
    }

    return data || []
  },

  async getById(id: string): Promise<Categoria | null> {
    const { data, error } = await supabase
      .from('categorias')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Erro ao buscar categoria:', error)
      throw new Error(`Erro ao buscar categoria: ${error.message}`)
    }

    return data
  },

  async create(categoriaData: CategoriaCreateData): Promise<Categoria> {
    // Get current user's profile for company filtering
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    if (!currentUser) {
      throw new Error('Usuário não autenticado')
    }

    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('id, admin_profile_id')
      .eq('id', currentUser.id)
      .single()

    if (!currentProfile) {
      throw new Error('Perfil não encontrado')
    }

    const adminId = currentProfile.admin_profile_id || currentProfile.id

    const { data, error } = await supabase
      .from('categorias')
      .insert({
        ...categoriaData,
        status: categoriaData.status || 'ativo',
        profile: adminId, // Add company filter
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar categoria:', error)
      throw new Error(`Erro ao criar categoria: ${error.message}`)
    }

    // Registrar atividade
    await AtividadeService.criar(
      'categoria',
      data.id,
      data,
      `Categoria criada: ${data.nome} (${data.codigo})`
    )

    return data
  },

  async update(id: string, updates: CategoriaUpdateData): Promise<Categoria> {
    // Buscar dados anteriores para o log
    const categoriaAnterior = await this.getById(id)
    
    const { data, error } = await supabase
      .from('categorias')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar categoria:', error)
      throw new Error(`Erro ao atualizar categoria: ${error.message}`)
    }

    // Registrar atividade
    await AtividadeService.editar(
      'categoria',
      data.id,
      categoriaAnterior,
      data,
      `Categoria editada: ${data.nome} (${data.codigo})`
    )

    return data
  },

  async delete(id: string): Promise<void> {
    // Buscar dados da categoria antes de deletar
    const categoria = await this.getById(id)
    
    const { error } = await supabase
      .from('categorias')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Erro ao deletar categoria:', error)
      throw new Error(`Erro ao deletar categoria: ${error.message}`)
    }

    // Registrar atividade
    if (categoria) {
      await AtividadeService.deletar(
        'categoria',
        id,
        categoria,
        `Categoria deletada: ${categoria.nome} (${categoria.codigo})`
      )
    }
  }
}
