import { useAuthStore } from '@/stores/authStore'

// Single source of truth: Zustand
// This hook returns a shape compatible with React Query consumers
export function useAuth() {
  const { user, loading } = useAuthStore()
  return { data: user, isLoading: loading }
}

export function useIsAdmin() {
  const { user } = useAuthStore()
  return user?.role === 'admin'
}

export function useIsVendedor() {
  const { user } = useAuthStore()
  return user?.role === 'vendedor'
}

// Removed superadmin - simplified to only admin and vendedor

export function useIsCompanyAdmin() {
  const { user } = useAuthStore()
  return user?.is_company_admin || false
}

export function useCurrentVendedorId() {
  const { user } = useAuthStore()
  return user?.vendedor_id || null
}

export function useCompanyProfileId() {
  const { user } = useAuthStore()
  return user?.company_profile_id || null
}
