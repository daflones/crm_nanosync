import { supabase } from '@/lib/supabase'
import { AtividadeService } from './atividades'

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
  profile: string // Campo para filtro por empresa
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

    // Use admin_profile_id to filter segmentos
    const adminId = currentProfile.admin_profile_id || currentProfile.id

    const { data, error } = await supabase
      .from('segmentos')
      .select('*')
      .eq('profile', adminId) // Filter by company
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
      .from('segmentos')
      .insert({
        ...segmentoData,
        status: segmentoData.status || 'ativo',
        profile: adminId, // Add company filter
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar segmento:', error)
      throw new Error(`Erro ao criar segmento: ${error.message}`)
    }

    // Registrar atividade
    await AtividadeService.criar(
      'segmento',
      data.id,
      data,
      `Segmento criado: ${data.nome} (${data.codigo})`
    )

    return data
  },

  async update(id: string, updates: SegmentoUpdateData): Promise<Segmento> {
    // Buscar dados anteriores para o log
    const segmentoAnterior = await this.getById(id)
    
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

    // Registrar atividade
    await AtividadeService.editar(
      'segmento',
      data.id,
      segmentoAnterior,
      data,
      `Segmento editado: ${data.nome} (${data.codigo})`
    )

    return data
  },

  async delete(id: string): Promise<void> {
    // Buscar dados do segmento antes de deletar
    const segmento = await this.getById(id)
    
    const { error } = await supabase
      .from('segmentos')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Erro ao deletar segmento:', error)
      throw new Error(`Erro ao deletar segmento: ${error.message}`)
    }

    // Registrar atividade
    if (segmento) {
      await AtividadeService.deletar(
        'segmento',
        id,
        segmento,
        `Segmento deletado: ${segmento.nome} (${segmento.codigo})`
      )
    }
  }
}
