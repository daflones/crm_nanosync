import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface UserProfile {
  id: string
  email: string
  full_name: string
  role: 'admin' | 'vendedor'
  status: 'ativo' | 'inativo' | 'suspenso'
  avatar_url?: string
  vendedor_id?: string
}

export function useAuth() {
  return useQuery({
    queryKey: ['auth', 'profile'],
    queryFn: async (): Promise<UserProfile | null> => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return null

      const { data: profile, error } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          full_name,
          role,
          status,
          avatar_url,
          vendedores!vendedores_user_id_fkey(id)
        `)
        .eq('id', user.id)
        .single()

      if (error) {
        console.error('Error fetching user profile:', error)
        return null
      }

      return {
        ...profile,
        vendedor_id: profile.vendedores?.[0]?.id || null
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useIsAdmin() {
  const { data: profile } = useAuth()
  return profile?.role === 'admin'
}

export function useIsVendedor() {
  const { data: profile } = useAuth()
  return profile?.role === 'vendedor'
}

export function useCurrentVendedorId() {
  const { data: profile } = useAuth()
  return profile?.vendedor_id || null
}
