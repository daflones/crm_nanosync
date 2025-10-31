export type StatusAcao = 'pendente' | 'em_andamento' | 'concluida' | 'cancelada'

export type TipoAcao = 
  | 'ligacao' 
  | 'email' 
  | 'reuniao' 
  | 'proposta' 
  | 'follow_up' 
  | 'negociacao' 
  | 'fechamento'
  | 'pos_venda'
  | 'outra'

export interface ClienteAcao {
  id: string
  cliente_id: string
  profile_id: string
  titulo: string
  descricao?: string
  tipo: TipoAcao
  status: StatusAcao
  data_prevista: string
  data_conclusao?: string
  ordem: number
  responsavel_id?: string
  criado_por?: string
  created_at: string
  updated_at: string
}

export interface ClienteAcaoCreateData {
  cliente_id: string
  titulo: string
  descricao?: string
  tipo: TipoAcao
  status?: StatusAcao
  data_prevista: string
  responsavel_id?: string
  ordem?: number
}

export interface ClienteAcaoUpdateData {
  titulo?: string
  descricao?: string
  tipo?: TipoAcao
  status?: StatusAcao
  data_prevista?: string
  data_conclusao?: string
  responsavel_id?: string
  ordem?: number
}
