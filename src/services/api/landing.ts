import { supabase } from '@/lib/supabase'
import type { LeadFormData } from '@/lib/validations/landing'

export interface Lead extends LeadFormData {
  id: string
  created_at: string
  updated_at: string
}

// API endpoint for lead submission (for React Router project)
export const submitLeadToAPI = async (data: LeadFormData): Promise<{ success: boolean; leadId?: string; error?: string }> => {
  try {
    // Since we're using React Router, we'll submit directly to Supabase
    // In a production environment, you might want to use a backend API
    const response = await landingService.createLead(data)
    return { success: true, leadId: response.id }
  } catch (error) {
    console.error('Lead submission error:', error)
    return { success: false, error: 'Erro ao enviar formulário. Tente novamente.' }
  }
}

export const landingService = {
  // Create a new lead
  async createLead(data: LeadFormData): Promise<Lead> {
    const { data: lead, error } = await supabase
      .from('landing')
      .insert([data])
      .select()
      .single()

    if (error) {
      console.error('Error creating lead:', error)
      throw new Error('Erro ao salvar dados. Tente novamente.')
    }

    return lead
  },

  // Get all leads (admin only)
  async getLeads(): Promise<Lead[]> {
    const { data: leads, error } = await supabase
      .from('landing')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching leads:', error)
      throw new Error('Erro ao buscar leads.')
    }

    return leads || []
  },

  // Get lead by ID
  async getLeadById(id: string): Promise<Lead | null> {
    const { data: lead, error } = await supabase
      .from('landing')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching lead:', error)
      return null
    }

    return lead
  },

  // Update lead
  async updateLead(id: string, data: Partial<LeadFormData>): Promise<Lead> {
    const { data: lead, error } = await supabase
      .from('landing')
      .update(data)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating lead:', error)
      throw new Error('Erro ao atualizar lead.')
    }

    return lead
  },

  // Delete lead
  async deleteLead(id: string): Promise<void> {
    const { error } = await supabase
      .from('landing')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting lead:', error)
      throw new Error('Erro ao deletar lead.')
    }
  }
}
