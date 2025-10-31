export interface Cliente {
  id: string
  nome_contato: string
  email: string
  nome_empresa: string
  segmento_cliente: string
  endereco: string
  cidade: string
  estado: string
  cep: string
  etapa_pipeline: string
  classificacao: string
  origem: string
  observacoes?: string
  volume_mensal?: string
  data_criacao: string
  data_atualizacao: string
  vendedor_id?: string
  analise_cliente?: string
}

export interface ClienteCreateData {
  nome_contato: string
  email: string
  nome_empresa: string
  segmento_cliente: string
  endereco: string
  cidade: string
  estado: string
  cep: string
  etapa_pipeline: string
  classificacao: string
  origem: string
  observacoes?: string
  volume_mensal?: string
  vendedor_id?: string
  analise_cliente?: string
}

export type ClienteUpdateData = Partial<ClienteCreateData>
