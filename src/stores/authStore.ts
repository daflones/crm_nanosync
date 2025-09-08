import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase, type Profile } from '@/lib/supabase'
// Removed unused imports - AuthChangeEvent, Session no longer needed
import { AtividadeService } from '@/services/api/atividades'

interface AuthState {
  user: StoreUser | null
  loading: boolean
  error: string | null
  initialized: boolean
  
  // Actions
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, fullName: string) => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updateProfile: (data: Partial<Profile>) => Promise<void>
  initializeAuth: () => Promise<void>
  refreshUser: () => Promise<void>
  clearError: () => void
}

// Simplified user with only admin and vendedor roles
export interface StoreUser extends Profile {
  vendedor_id?: string | null
  is_company_admin?: boolean
  company_profile_id?: string | null
  is_vendedor?: boolean
}

// Global flag to prevent concurrent refreshUser calls
let isRefreshing = false

export const useAuthStore = create<AuthState>()(persist(
  (set, get) => ({
    user: null,
    loading: true,
    error: null,
    initialized: false,
  
  signIn: async (email: string, password: string) => {
    set({ loading: true, error: null })
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      if (data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single()

        // Compute derived fields
        const storeUser = await buildStoreUser(profile)
        set({ user: storeUser, loading: false, initialized: true })
        
        // Atualizar último login
        await supabase
          .from('profiles')
          .update({ last_login: new Date().toISOString() })
          .eq('id', data.user.id)

        // Registrar atividade de login
        await AtividadeService.login(
          `Login realizado: ${storeUser?.full_name || (storeUser as any)?.email || 'Usuário'}`
        )
      }
    } catch (error: any) {
      set({ error: error.message, loading: false })
      throw error
    }
  },

  signUp: async (email: string, password: string, fullName: string) => {
    set({ loading: true, error: null })
    try {
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      })


      if (error) {
        throw error
      }

      if (data.user) {
        
        // Não criar perfil imediatamente - aguardar confirmação de email
        // O perfil será criado via trigger no Supabase após confirmação
      }

      set({ loading: false })
    } catch (error: any) {
      set({ error: error.message, loading: false })
      throw error
    }
  },

  signOut: async () => {
    const { user } = get()
    set({ loading: true })
    try {
      // Registrar atividade de logout antes de fazer logout
      if (user) {
        await AtividadeService.logout(
          `Logout realizado: ${user.full_name || user.email || 'Usuário'}`
        )
      }
      
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      // Clear all application state
      set({ user: null, loading: false, initialized: true })
      
      // Clear localStorage auth data
      localStorage.removeItem('auth-store')
      
      // Force complete page reload to ensure clean state
      window.location.href = '/login'
      
    } catch (error: any) {
      set({ error: error.message, loading: false })
      throw error
    }
  },

  resetPassword: async (email: string) => {
    set({ loading: true, error: null })
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (error) throw error
      set({ loading: false })
    } catch (error: any) {
      set({ error: error.message, loading: false })
      throw error
    }
  },

  updateProfile: async (data: Partial<Profile>) => {
    const user = get().user
    if (!user) return

    set({ loading: true, error: null })
    try {
      const { error } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', user.id)

      if (error) throw error

      set({ user: { ...user, ...data }, loading: false })
    } catch (error: any) {
      set({ error: error.message, loading: false })
      throw error
    }
  },

  initializeAuth: async () => {
    const { initialized } = get()
    if (initialized) {
      return
    }
    set({ loading: true, initialized: false })
    
    try {
      // Get current session
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        await get().refreshUser()
      } else {
        set({ user: null, loading: false, initialized: true })
      }

      // Disable auth state change listener to prevent tab switching refreshes
      // Session will be maintained through Supabase's built-in persistence
    } catch (error: any) {
      console.error('Auth initialization error:', error)
      set({ error: error.message, loading: false, user: null, initialized: true })
    }
  },

  refreshUser: async () => {
    if (isRefreshing) {
      return
    }
    
    isRefreshing = true
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.user) {
        set({ user: null, loading: false, initialized: true })
        return
      }
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (profile) {
        const storeUser = await buildStoreUser(profile)
        set({ user: storeUser, loading: false, initialized: true })
      } else {
        set({ user: null, loading: false, initialized: true })
      }
    } catch (error: any) {
      console.error('Error refreshing user:', error)
      set({ error: error.message, loading: false, initialized: true })
    } finally {
      isRefreshing = false
    }
  },

    clearError: () => set({ error: null }),
  }),
  {
    name: 'auth-store',
    partialize: (state: AuthState) => ({ 
      user: state.user,
      initialized: state.initialized 
    }),
  }
))

// Helper to compute derived user fields - simplified for admin/vendedor only
async function buildStoreUser(profile: Profile): Promise<StoreUser> {
  try {
    // Only support admin and vendedor roles
    const role = profile.role
    
    let vendedor_id: string | null = null
    if (role === 'vendedor') {
      const { data: vendedor } = await supabase
        .from('vendedores')
        .select('id')
        .eq('user_id', profile.id)
        .single()
      vendedor_id = vendedor?.id || null
    }

    const isCompanyAdmin = (profile as any).admin_profile_id === profile.id && role === 'admin'
    const companyProfileId = isCompanyAdmin ? profile.id : (profile as any).admin_profile_id || null

    return {
      ...profile,
      role: role as 'admin' | 'vendedor',
      vendedor_id,
      is_company_admin: isCompanyAdmin,
      company_profile_id: companyProfileId,
      is_vendedor: role === 'vendedor',
    }
  } catch (error) {
    console.error('Error building store user:', error)
    const role = profile.role
    return {
      ...profile,
      role: role as 'admin' | 'vendedor',
      vendedor_id: null,
      is_company_admin: false,
      company_profile_id: (profile as any).admin_profile_id || null,
      is_vendedor: role === 'vendedor',
    }
  }
}
