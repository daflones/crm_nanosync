import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'

export interface CurrentUser {
  id: string
  email: string
  full_name: string
  role: 'admin' | 'vendedor'
  vendedor_id?: string
  avatar_url?: string
  status: 'ativo' | 'inativo' | 'suspenso'
  preferences?: any
}

export const useCurrentUser = () => {
  const { user } = useAuthStore()

  return useQuery<CurrentUser | null>({
    queryKey: ['current-user', user?.id],
    queryFn: async () => {
      if (!user?.id) return null

      // Get profile data
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileError || !profile) {
        console.error('Error fetching profile:', profileError)
        return null
      }

      // Get vendedor_id if user is a vendedor
      let vendedor_id: string | undefined

      if (profile.role === 'vendedor') {
        const { data: vendedor, error: vendedorError } = await supabase
          .from('vendedores')
          .select('id')
          .eq('user_id', user.id)
          .single()

        if (!vendedorError && vendedor) {
          vendedor_id = vendedor.id
        }
      }

      return {
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name,
        role: profile.role,
        vendedor_id,
        avatar_url: profile.avatar_url,
        status: profile.status,
        preferences: profile.preferences
      }
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  })
}

// Helper hooks for common use cases
export const useIsAdmin = () => {
  const { data: user } = useCurrentUser()
  return user?.role === 'admin'
}

export const useCurrentVendedorId = () => {
  const { data: user } = useCurrentUser()
  return user?.vendedor_id || null
}

export const useUserRole = () => {
  const { data: user } = useCurrentUser()
  return user?.role || null
}
