import { supabase } from '@/lib/supabase'

export interface Configuracoes {
  id?: string
  user_id: string
  profile: string // Campo para filtro por empresa
  // Notificações
  notificacoes_email: boolean
  notificacoes_novos_clientes: boolean
  notificacoes_propostas_vencendo: boolean
  notificacoes_agendamentos: boolean
  // Aparência
  tema: 'light' | 'dark'
  idioma: string
  // Sistema (admin only)
  backup_automatico?: boolean
  logs_auditoria?: boolean
  limite_arquivos_mb?: number
  // 2FA
  two_factor_enabled: boolean
  created_at?: string
  updated_at?: string
}

// Buscar configurações do usuário
export const getConfiguracoes = async (userId: string) => {
  try {
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

    const adminId = currentProfile.admin_profile_id || currentProfile.id

    const { data, error } = await supabase
      .from('configuracoes')
      .select('*')
      .eq('user_id', userId)
      .eq('profile', adminId) // Filter by company
      .single()

    if (error && error.code === 'PGRST116') {
      // Configurações não existem, retornar valores padrão sem criar row
      const defaultConfig: Configuracoes = {
        user_id: userId,
        profile: adminId,
        notificacoes_email: true,
        notificacoes_novos_clientes: true,
        notificacoes_propostas_vencendo: true,
        notificacoes_agendamentos: true,
        tema: 'light',
        idioma: 'pt-BR',
        two_factor_enabled: false,
        backup_automatico: false,
        logs_auditoria: false,
        limite_arquivos_mb: 100
      }

      return { data: defaultConfig, error: null }
    }

    return { data, error }
  } catch (error) {
    console.error('Erro ao buscar configurações:', error)
    return { data: null, error }
  }
}

// Salvar/Atualizar configurações
export const upsertConfiguracoes = async (userId: string, configuracoes: Partial<Configuracoes>) => {
  try {
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

    // Primeiro, verificar se já existe uma configuração para o usuário
    const { data: existingConfig } = await supabase
      .from('configuracoes')
      .select('id')
      .eq('user_id', userId)
      .eq('profile', adminId) // Filter by company
      .single()

    if (existingConfig) {
      // Se existe, fazer UPDATE
      const { data, error } = await supabase
        .from('configuracoes')
        .update({ 
          ...configuracoes,
          profile: adminId, // Ensure company filter is maintained
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('profile', adminId) // Filter by company
        .select()
        .single()

      return { data, error }
    } else {
      // Se não existe, fazer INSERT
      const { data, error } = await supabase
        .from('configuracoes')
        .insert([{ 
          user_id: userId, 
          profile: adminId, // Add company filter
          ...configuracoes,
          updated_at: new Date().toISOString()
        }])
        .select()
        .single()

      return { data, error }
    }
  } catch (error) {
    console.error('Erro ao salvar configurações:', error)
    return { data: null, error }
  }
}

// Alterar senha
export const changePassword = async (newPassword: string) => {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    })
    return { error }
  } catch (error) {
    console.error('Erro ao alterar senha:', error)
    return { error }
  }
}

// Verificar senha atual
export const verifyCurrentPassword = async (email: string, currentPassword: string) => {
  try {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: currentPassword
    })
    return { isValid: !error, error }
  } catch (error) {
    console.error('Erro ao verificar senha:', error)
    return { isValid: false, error }
  }
}

// Atualizar perfil
export const updateProfile = async (userId: string, profile: any) => {
  try {
    const updateData: any = {
      full_name: profile.full_name,
      cargo: profile.cargo,
      updated_at: new Date().toISOString()
    }
    
    // Só incluir telefone se não estiver vazio
    if (profile.phone && profile.phone.trim()) {
      updateData.telefone = profile.phone
    }
    
    const { data, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      console.error('Erro do Supabase:', error)
    }
    
    return { data, error }
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error)
    return { data: null, error }
  }
}

// Buscar perfil
export const getProfile = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    return { data, error }
  } catch (error) {
    console.error('Erro ao buscar perfil:', error)
    return { data: null, error }
  }
}

// Testar configurações de email (admin only)
export const testEmailConfig = async () => {
  // Simular teste de email
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ success: true, message: 'Email de teste enviado com sucesso!' })
    }, 2000)
  })
}
