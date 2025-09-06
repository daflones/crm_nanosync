import { create } from 'zustand'
import { supabase, type Profile } from '@/lib/supabase'
import { AtividadeService } from '@/services/api/atividades'
import { CacheManager } from '@/utils/cacheManager'

interface AuthState {
  user: Profile | null
  loading: boolean
  error: string | null
  initialized: boolean
  
  // Actions
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, fullName: string) => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updateProfile: (data: Partial<Profile>) => Promise<void>
  checkAuth: () => Promise<void>
  clearError: () => void
}

// Set up auth state listener once
let authListenerInitialized = false

export const useAuthStore = create<AuthState>((set, get) => ({
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

        set({ user: profile, loading: false, initialized: true })
        
        // Atualizar último login
        await supabase
          .from('profiles')
          .update({ last_login: new Date().toISOString() })
          .eq('id', data.user.id)

        // Registrar atividade de login
        await AtividadeService.login(
          `Login realizado: ${profile?.full_name || profile?.email || 'Usuário'}`
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
      console.log('Iniciando cadastro para:', email)
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      })

      console.log('Resposta do signUp:', { data, error })

      if (error) {
        console.error('Erro no signUp:', error)
        throw error
      }

      if (data.user) {
        console.log('Usuário criado, aguardando confirmação de email...')
        console.log('Email de confirmação enviado para:', email)
        
        // Não criar perfil imediatamente - aguardar confirmação de email
        // O perfil será criado via trigger no Supabase após confirmação
      }

      set({ loading: false })
    } catch (error: any) {
      console.error('Erro geral no cadastro:', error)
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
      
      // Clear all cache and storage using CacheManager
      await CacheManager.clearAllData()
      
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

  checkAuth: async () => {
    const { initialized } = get()
    set({ loading: true })
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        set({ user: profile, loading: false, initialized: true })
      } else {
        set({ user: null, loading: false, initialized: true })
      }

      // Set up auth state change listener only once
      if (!initialized && !authListenerInitialized) {
        authListenerInitialized = true
        supabase.auth.onAuthStateChange(async (event, session) => {
          if (event === 'SIGNED_OUT' || !session) {
            set({ user: null, loading: false })
          } else if (event === 'SIGNED_IN' && session?.user) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single()
            set({ user: profile, loading: false })
          }
        })
      }
    } catch (error: any) {
      set({ error: error.message, loading: false, user: null, initialized: true })
    }
  },

  clearError: () => set({ error: null }),
}))
