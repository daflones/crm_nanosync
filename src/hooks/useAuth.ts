import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface UserProfile {
  id: string
  full_name: string
  role: 'admin' | 'vendedor' | 'superadmin'
  status: 'ativo' | 'inativo' | 'suspenso'
  avatar_url?: string
  vendedor_id?: string
  admin_profile_id?: string | null
  // Campos calculados
  company_profile_id?: string // ID da empresa (admin principal)
  is_company_admin?: boolean // Se é admin da empresa
  is_vendedor?: boolean // Se é vendedor
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
          full_name,
          role,
          status,
          avatar_url,
          admin_profile_id,
          vendedores!vendedores_user_id_fkey(id)
        `)
        .eq('id', user.id)
        .single()

      if (error) {
        console.error('Error fetching user profile:', error)
        return null
      }

      // Calcular campos derivados
      const isCompanyAdmin = profile.role === 'admin' && profile.admin_profile_id === profile.id
      const isVendedor = profile.role === 'vendedor'
      const companyProfileId = isCompanyAdmin ? profile.id : profile.admin_profile_id

      return {
        ...profile,
        vendedor_id: profile.vendedores?.[0]?.id || null,
        company_profile_id: companyProfileId,
        is_company_admin: isCompanyAdmin,
        is_vendedor: isVendedor
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

export function useIsSuperAdmin() {
  const { data: profile } = useAuth()
  return profile?.role === 'superadmin'
}

export function useIsCompanyAdmin() {
  const { data: profile } = useAuth()
  return profile?.is_company_admin || false
}

export function useCurrentVendedorId() {
  const { data: profile } = useAuth()
  return profile?.vendedor_id || null
}

export function useCompanyProfileId() {
  const { data: profile } = useAuth()
  return profile?.company_profile_id || null
}
