export type StatusTicket = 'aberto' | 'em_andamento' | 'aguardando_cliente' | 'resolvido' | 'fechado' | 'cancelado'
export type PrioridadeTicket = 'baixa' | 'media' | 'alta' | 'urgente'

export interface TicketSuporte {
  id: string
  profile_id: string
  cliente_id: string
  vendedor_id?: string | null
  setor_id?: string | null
  titulo: string
  descricao: string
  status: StatusTicket
  prioridade: PrioridadeTicket
  solucao?: string | null
  observacoes?: string | null
  created_at: string
  updated_at: string
  resolvido_em?: string | null
  fechado_em?: string | null
  
  // Dados relacionados (joins)
  cliente?: {
    id: string
    nome_contato: string
    nome_empresa?: string
    whatsapp?: string
  }
  vendedor?: {
    id: string
    nome: string
  }
  setor?: {
    id: string
    nome: string
    cor_identificacao?: string
  }
}

export interface TicketCreateData {
  cliente_id: string
  vendedor_id?: string | null
  setor_id?: string | null
  titulo: string
  descricao: string
  status?: StatusTicket
  prioridade?: PrioridadeTicket
  observacoes?: string | null
}

export interface TicketUpdateData {
  vendedor_id?: string | null
  setor_id?: string | null
  titulo?: string
  descricao?: string
  status?: StatusTicket
  prioridade?: PrioridadeTicket
  solucao?: string | null
  observacoes?: string | null
  resolvido_em?: string | null
  fechado_em?: string | null
}

// Labels para exibição
export const STATUS_LABELS: Record<StatusTicket, string> = {
  aberto: 'Aberto',
  em_andamento: 'Em Andamento',
  aguardando_cliente: 'Aguardando Cliente',
  resolvido: 'Resolvido',
  fechado: 'Fechado',
  cancelado: 'Cancelado',
}

export const PRIORIDADE_LABELS: Record<PrioridadeTicket, string> = {
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta',
  urgente: 'Urgente',
}

// Cores para status
export const STATUS_COLORS: Record<StatusTicket, string> = {
  aberto: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  em_andamento: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  aguardando_cliente: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  resolvido: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  fechado: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
  cancelado: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
}

// Cores para prioridade
export const PRIORIDADE_COLORS: Record<PrioridadeTicket, string> = {
  baixa: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
  media: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  alta: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  urgente: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
}
