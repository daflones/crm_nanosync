export interface Cliente {
  id: string
  nome: string
  tipo: 'pessoa_fisica' | 'pessoa_juridica'
  documento: string
  email: string
  telefone: string
  whatsapp?: string
  empresa?: string
  cargo?: string
  endereco?: {
    cep: string
    rua: string
    numero: string
    complemento?: string
    bairro: string
    cidade: string
    estado: string
  }
  etapa_pipeline: 'novo' | 'contato' | 'qualificacao' | 'proposta' | 'negociacao' | 'fechado' | 'perdido'
  valor_potencial: number
  probabilidade: number
  data_ultimo_contato?: string
  data_proxima_acao?: string
  responsavel_id?: string
  tags?: string[]
  observacoes?: string
  score?: number
  origem?: string
  status: 'ativo' | 'inativo' | 'prospecto' | 'suspenso'
  created_at: string
  updated_at: string
}
