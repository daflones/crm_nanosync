import { useAuthStore } from '@/stores/authStore'

export interface CurrentUser {
  id: string
  email: string
  full_name: string
  role: 'admin' | 'vendedor' | 'superadmin'
  vendedor_id?: string | null
  avatar_url?: string
  status: 'ativo' | 'inativo' | 'suspenso'
  preferences?: any
}

// Zustand como fonte da verdade
export const useCurrentUser = () => {
  const { user, loading } = useAuthStore()
  const current: CurrentUser | null = user
    ? {
        id: user.id,
        email: (user as any).email,
        full_name: user.full_name,
        role: user.role,
        vendedor_id: user.vendedor_id ?? null,
        avatar_url: user.avatar_url,
        status: user.status,
        preferences: (user as any).preferences,
      }
    : null

  // Compatível com API do React Query (data/isLoading)
  return { data: current, isLoading: loading }
}

// Helper hooks
export const useIsAdmin = () => {
  const { user } = useAuthStore()
  return user?.role === 'admin'
}

export const useCurrentVendedorId = () => {
  const { user } = useAuthStore()
  return user?.vendedor_id || null
}

export const useUserRole = () => {
  const { user } = useAuthStore()
  return user?.role || null
}
