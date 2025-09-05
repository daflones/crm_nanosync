import { supabase } from '@/lib/supabase'

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
    const { data, error } = await supabase
      .from('categorias')
      .select('*')
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
    const { data, error } = await supabase
      .from('categorias')
      .insert({
        ...categoriaData,
        status: categoriaData.status || 'ativo',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar categoria:', error)
      throw new Error(`Erro ao criar categoria: ${error.message}`)
    }

    return data
  },

  async update(id: string, updates: CategoriaUpdateData): Promise<Categoria> {
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

    return data
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('categorias')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Erro ao deletar categoria:', error)
      throw new Error(`Erro ao deletar categoria: ${error.message}`)
    }
  }
}
