import { type CurrentUser } from '@/hooks/useCurrentUser'
import { type Agendamento, type AgendamentoCreateData, type AgendamentoUpdateData } from '@/services/api/agendamentos'
import { canUserModifyAgendamento, canUserCreateAgendamentoForVendedor } from '@/utils/agendamentosFilters'

/**
 * Validates if user has permission to create an agendamento
 */
export const validateAgendamentoCreate = (
  data: AgendamentoCreateData,
  currentUser: CurrentUser | null | undefined
): { isValid: boolean; error?: string } => {
  if (!currentUser) {
    return { isValid: false, error: 'Usuário não autenticado' }
  }

  if (!data.vendedor_id) {
    return { isValid: false, error: 'Vendedor é obrigatório' }
  }

  if (!canUserCreateAgendamentoForVendedor(data.vendedor_id, currentUser)) {
    return { 
      isValid: false, 
      error: 'Você não tem permissão para criar agendamentos para este vendedor' 
    }
  }

  return { isValid: true }
}

/**
 * Validates if user has permission to update an agendamento
 */
export const validateAgendamentoUpdate = (
  agendamento: Agendamento,
  data: AgendamentoUpdateData,
  currentUser: CurrentUser | null | undefined
): { isValid: boolean; error?: string } => {
  if (!currentUser) {
    return { isValid: false, error: 'Usuário não autenticado' }
  }

  if (!canUserModifyAgendamento(agendamento, currentUser)) {
    return { 
      isValid: false, 
      error: 'Você não tem permissão para editar este agendamento' 
    }
  }

  // If trying to change vendedor_id, validate permission for new vendedor
  if (data.vendedor_id && data.vendedor_id !== agendamento.vendedor_id) {
    if (!canUserCreateAgendamentoForVendedor(data.vendedor_id, currentUser)) {
      return { 
        isValid: false, 
        error: 'Você não tem permissão para atribuir este agendamento ao vendedor selecionado' 
      }
    }
  }

  return { isValid: true }
}

/**
 * Validates if user has permission to delete an agendamento
 */
export const validateAgendamentoDelete = (
  agendamento: Agendamento,
  currentUser: CurrentUser | null | undefined
): { isValid: boolean; error?: string } => {
  if (!currentUser) {
    return { isValid: false, error: 'Usuário não autenticado' }
  }

  if (!canUserModifyAgendamento(agendamento, currentUser)) {
    return { 
      isValid: false, 
      error: 'Você não tem permissão para excluir este agendamento' 
    }
  }

  return { isValid: true }
}
