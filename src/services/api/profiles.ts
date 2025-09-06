import { supabase } from '@/lib/supabase'

export interface Profile {
  id: string
  email: string
  full_name: string
  phone?: string
  cargo?: string
  role: 'admin' | 'vendedor'
  status: 'ativo' | 'inativo'
  admin_profile_id?: string
  created_at: string
  updated_at: string
}

export const getProfile = async (userId: string): Promise<Profile | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    console.error('Erro ao buscar perfil:', error)
    return null
  }

  return data
}

export const updateProfile = async (userId: string, profileData: Partial<Profile>): Promise<void> => {
  const { error } = await supabase
    .from('profiles')
    .update({
      ...profileData,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)

  if (error) {
    throw new Error(`Erro ao atualizar perfil: ${error.message}`)
  }
}
