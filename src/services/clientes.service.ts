import { supabase } from '@/lib/supabase'
import type { Cliente } from '@/types/cliente'

export const clientesService = {
  async getAll() {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data as Cliente[]
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data as Cliente
  },

  async create(cliente: Omit<Cliente, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('clientes')
      .insert(cliente)
      .select()
      .single()
    
    if (error) throw error
    return data as Cliente
  },

  async update(id: string, updates: Partial<Cliente>) {
    const { data, error } = await supabase
      .from('clientes')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data as Cliente
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('clientes')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  },

  async updateStage(id: string, stage: string) {
    const { data, error } = await supabase
      .from('clientes')
      .update({ etapa_pipeline: stage })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data as Cliente
  },

  async search(query: string) {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .or(`nome.ilike.%${query}%,email.ilike.%${query}%,empresa.ilike.%${query}%`)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data as Cliente[]
  }
}
