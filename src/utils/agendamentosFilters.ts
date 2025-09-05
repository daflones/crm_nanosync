import { type Agendamento } from '@/services/api/agendamentos'
import { type CurrentUser } from '@/hooks/useCurrentUser'

/**
 * Filters agendamentos based on user role and permissions
 * @param agendamentos - Array of agendamentos to filter
 * @param currentUser - Current user information
 * @returns Filtered array of agendamentos
 */
export const filterAgendamentosByUser = (
  agendamentos: Agendamento[],
  currentUser: CurrentUser | null | undefined
): Agendamento[] => {
  if (!currentUser || !agendamentos) return []

  // Admin users can see all agendamentos
  if (currentUser.role === 'admin') {
    return agendamentos
  }

  // Vendedor users can only see their own agendamentos
  if (currentUser.role === 'vendedor' && currentUser.vendedor_id) {
    return agendamentos.filter(agendamento => 
      agendamento.vendedor_id === currentUser.vendedor_id
    )
  }

  // If no valid role or vendedor_id, return empty array
  return []
}

/**
 * Checks if current user can edit/delete a specific agendamento
 * @param agendamento - The agendamento to check permissions for
 * @param currentUser - Current user information
 * @returns boolean indicating if user has permission
 */
export const canUserModifyAgendamento = (
  agendamento: Agendamento,
  currentUser: CurrentUser | null | undefined
): boolean => {
  if (!currentUser || !agendamento) return false

  // Admin users can modify any agendamento
  if (currentUser.role === 'admin') {
    return true
  }

  // Vendedor users can only modify their own agendamentos
  if (currentUser.role === 'vendedor' && currentUser.vendedor_id) {
    return agendamento.vendedor_id === currentUser.vendedor_id
  }

  return false
}

/**
 * Validates if user has permission to create agendamento with specified vendedor_id
 * @param vendedor_id - The vendedor_id to assign to the agendamento
 * @param currentUser - Current user information
 * @returns boolean indicating if user has permission
 */
export const canUserCreateAgendamentoForVendedor = (
  vendedor_id: string,
  currentUser: CurrentUser | null | undefined
): boolean => {
  if (!currentUser) return false

  // Admin users can create agendamentos for any vendedor
  if (currentUser.role === 'admin') {
    return true
  }

  // Vendedor users can only create agendamentos for themselves
  if (currentUser.role === 'vendedor' && currentUser.vendedor_id) {
    return vendedor_id === currentUser.vendedor_id
  }

  return false
}
