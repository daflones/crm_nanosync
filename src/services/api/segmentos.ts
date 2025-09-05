import { supabase } from '@/lib/supabase'

export interface Segmento {
  id: string
  categoria_id: string
  nome: string
  codigo: string
  descricao?: string
  icone?: string
  cor?: string
  status: 'ativo' | 'inativo'
  ordem?: number
  configuracoes?: {
    margem_padrao?: number
    prazo_entrega_padrao?: string
    observacoes_padrao?: string
  }
  created_at: string
  updated_at: string
}

export interface SegmentoCreateData {
  categoria_id: string
  nome: string
  codigo: string
  descricao?: string
  icone?: string
  cor?: string
  status?: 'ativo' | 'inativo'
  ordem?: number
  configuracoes?: {
    margem_padrao?: number
    prazo_entrega_padrao?: string
    observacoes_padrao?: string
  }
}

export interface SegmentoUpdateData extends Partial<SegmentoCreateData> {}

export const segmentosService = {
  async getAll(): Promise<Segmento[]> {
    const { data, error } = await supabase
      .from('segmentos')
      .select('*')
      .order('nome', { ascending: true })

    if (error) {
      console.error('Erro ao buscar segmentos:', error)
      throw new Error(`Erro ao buscar segmentos: ${error.message}`)
    }

    return data || []
  },

  async getById(id: string): Promise<Segmento | null> {
    const { data, error } = await supabase
      .from('segmentos')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Erro ao buscar segmento:', error)
      throw new Error(`Erro ao buscar segmento: ${error.message}`)
    }

    return data
  },

  async create(segmentoData: SegmentoCreateData): Promise<Segmento> {
    const { data, error } = await supabase
      .from('segmentos')
      .insert({
        ...segmentoData,
        status: segmentoData.status || 'ativo',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar segmento:', error)
      throw new Error(`Erro ao criar segmento: ${error.message}`)
    }

    return data
  },

  async update(id: string, updates: SegmentoUpdateData): Promise<Segmento> {
    const { data, error } = await supabase
      .from('segmentos')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar segmento:', error)
      throw new Error(`Erro ao atualizar segmento: ${error.message}`)
    }

    return data
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('segmentos')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Erro ao deletar segmento:', error)
      throw new Error(`Erro ao deletar segmento: ${error.message}`)
    }
  }
}
