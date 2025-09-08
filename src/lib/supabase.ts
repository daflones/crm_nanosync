import { createClient } from '@supabase/supabase-js'

// Configuração do Supabase - Substituir com suas credenciais
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.')
}

const globalAny = globalThis as any

export const supabase = globalAny.__supabase ?? (globalAny.__supabase = createClient(supabaseUrl, supabaseAnonKey, {
  db: {
    schema: 'public'
  },
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storageKey: 'sb-public'
  },
  global: {
    headers: {
      'Accept': 'application/json'
    }
  }
}))

// Tipos do banco de dados
export interface Profile {
  id: string
  email: string
  full_name: string
  avatar_url?: string
  role: 'admin' | 'vendedor'
  status: 'ativo' | 'inativo' | 'suspenso'
  cargo?: string
  phone?: string
  preferences: {
    theme: 'light' | 'dark'
    notifications: {
      email: boolean
      push: boolean
      sound: boolean
    }
    dashboard: {
      layout: string
      widgets: string[]
    }
    sounds: {
      enabled: boolean
      volume: number
    }
  }
  last_login?: Date
  created_at: Date
  updated_at: Date
}

export interface Vendedor {
  id: string
  user_id: string
  cpf?: string
  whatsapp?: string
  telefone?: string
  data_nascimento?: Date
  endereco?: string
  numero?: string
  complemento?: string
  bairro?: string
  cidade?: string
  estado?: string
  cep?: string
  segmentos_principais: string[]
  segmentos_secundarios: string[]
  regioes_atendimento: string[]
  tipo_atendimento: 'presencial' | 'online' | 'hibrido'
  meta_mensal: number
  comissao_percentual: number
  data_contratacao: Date
  salario_base: number
  status: 'ativo' | 'inativo' | 'ferias' | 'afastado' | 'desligado'
  observacoes?: string
  created_at: Date
  updated_at: Date
}

export interface Cliente {
  id: string
  vendedor_id?: string
  nome_contato: string
  cargo?: string
  email?: string
  telefone?: string
  whatsapp?: string
  linkedin?: string
  nome_empresa?: string
  razao_social?: string
  nome_fantasia?: string
  cnpj?: string
  ie?: string
  im?: string
  porte_empresa?: 'MEI' | 'micro' | 'pequena' | 'media' | 'grande'
  endereco?: string
  numero?: string
  complemento?: string
  bairro?: string
  cidade?: string
  estado?: string
  cep?: string
  pais?: string
  segmento_cliente?: string
  produtos_interesse: string[]
  volume_mensal?: string
  volume_mensal_numero?: number
  orcamento_estimado?: number
  sazonalidade?: string
  fornecedor_atual?: string
  motivo_troca?: string
  etapa_pipeline: 'novo' | 'contactado' | 'qualificado' | 'proposta' | 'negociacao' | 'fechado' | 'perdido'
  valor_estimado: number
  valor_final?: number
  probabilidade: number
  qualificacao_score: number
  qualificacao_completa: boolean
  informacoes_faltantes: string[]
  criterios_qualificacao: {
    orcamento_definido: boolean
    autoridade_decisao: boolean
    necessidade_urgente: boolean
    timeline_definida: boolean
    dados_completos: boolean
  }
  origem: 'manual' | 'whatsapp' | 'site' | 'indicacao' | 'feira' | 'cold_call' | 'email' | 'redes_sociais'
  fonte_detalhada?: string
  classificacao: 'quente' | 'morno' | 'frio'
  primeiro_contato_em?: Date
  ultimo_contato_em?: Date
  proximo_contato_em?: Date
  frequencia_contato?: string
  proposta_enviada: boolean
  proposta_enviada_em?: Date
  proposta_valor?: number
  proposta_status?: string
  data_ultima_etapa: Date
  motivo_perda?: string
  categoria_perda?: string
  concorrente?: string
  feedback_rejeicao?: string
  observacoes?: string
  tags: string[]
  caracteristicas_especiais?: string
  restricoes?: string
  preferencias_contato?: string
  melhor_horario_contato?: string
  ticket_medio_historico?: number
  lifetime_value?: number
  numero_pedidos: number
  created_at: Date
  updated_at: Date
}

export interface Categoria {
  id: string
  nome: string
  codigo: string
  descricao?: string
  icone: string
  cor: string
  status: 'ativo' | 'inativo'
  ordem: number
  configuracoes: {
    permitir_subcategorias: boolean
    requerer_aprovacao: boolean
    template_padrao?: string
  }
  created_at: Date
  updated_at: Date
}

export interface Segmento {
  id: string
  categoria_id: string
  nome: string
  codigo: string
  descricao?: string
  icone: string
  cor: string
  status: 'ativo' | 'inativo'
  ordem: number
  configuracoes: {
    margem_padrao: number
    prazo_entrega_padrao: string
    observacoes_padrao: string
  }
  created_at: Date
  updated_at: Date
}

export interface Produto {
  id: string
  categoria_id?: string
  segmento_id?: string
  nome: string
  codigo: string
  descricao?: string
  resumo?: string
  valor_unitario: number
  unidade: string
  especificacoes: any
  dimensoes?: string
  peso?: string
  material?: string
  cores_disponiveis: string[]
  acabamento?: string
  embalagem?: string
  prazo_entrega: string
  minimo_pedido: number
  multiplo_venda: number
  tabela_desconto: Array<{
    quantidade: number
    desconto: number
  }>
  imagem_principal?: string
  galeria_imagens: string[]
  video_url?: string
  catalogo_url?: string
  ficha_tecnica_url?: string
  status: 'ativo' | 'inativo' | 'descontinuado' | 'em_desenvolvimento'
  destaque: boolean
  mais_vendido: boolean
  novidade: boolean
  tags: string[]
  palavras_chave: string[]
  controla_estoque: boolean
  estoque_atual: number
  estoque_minimo: number
  created_at: Date
  updated_at: Date
}

export interface Agendamento {
  id: string
  cliente_id?: string
  vendedor_id?: string
  titulo: string
  descricao?: string
  objetivo?: string
  data_inicio: Date
  data_fim: Date
  duracao_minutos?: number
  tipo: 'primeira_reuniao' | 'apresentacao' | 'proposta' | 'negociacao' | 
        'fechamento' | 'followup' | 'tecnica' | 'treinamento' | 'suporte'
  categoria: 'comercial' | 'tecnica' | 'suporte' | 'administrativa'
  prioridade: 'baixa' | 'media' | 'alta' | 'urgente'
  modalidade: 'presencial' | 'online' | 'telefone' | 'whatsapp'
  endereco_reuniao?: string
  link_online?: string
  plataforma?: string
  senha_reuniao?: string
  id_sala_online?: string
  participantes: Array<{
    nome: string
    email: string
    telefone?: string
    cargo?: string
  }>
  participantes_externos: string[]
  agenda?: string
  materiais_necessarios?: string[]
  documentos_anexos?: string[]
  produtos_apresentar?: string[]
  servicos_apresentar?: string[]
  status: 'agendado' | 'confirmado' | 'em_andamento' | 'concluido' | 
          'cancelado' | 'nao_compareceu' | 'remarcado'
  lembrete_enviado: boolean
  lembrete_enviado_em?: Date
  confirmacao_cliente: boolean
  confirmacao_em?: Date
  resultado?: string
  ata_reuniao?: string
  proximos_passos?: string
  data_proximo_contato?: Date
  valor_discutido?: number
  interesse_demonstrado?: number
  reagendamento_de?: string
  motivo_reagendamento?: string
  contador_reagendamentos: number
  google_event_id?: string
  outlook_event_id?: string
  created_at: Date
  updated_at: Date
}

export interface Proposta {
  id: string
  cliente_id: string
  vendedor_id: string
  numero_proposta: string
  titulo: string
  versao: number
  proposta_pai?: string
  descricao?: string
  observacoes?: string
  termos_condicoes?: string
  valor_produtos: number
  valor_servicos: number
  valor_desconto: number
  percentual_desconto: number
  valor_frete: number
  valor_impostos: number
  valor_total: number
  forma_pagamento: string
  condicoes_pagamento?: string
  prazo_entrega?: string
  local_entrega?: string
  responsavel_frete: 'cliente' | 'fornecedor' | 'compartilhado'
  condicoes_especiais?: string
  garantia?: string
  suporte_incluido: boolean
  treinamento_incluido: boolean
  status: 'rascunho' | 'revisao' | 'aprovada_interna' | 'enviada' | 
          'visualizada' | 'em_negociacao' | 'aprovada' | 'rejeitada' | 'vencida'
  validade_dias: number
  data_vencimento?: Date
  data_aprovacao_interna?: Date
  data_envio?: Date
  data_visualizacao?: Date
  data_resposta?: Date
  data_assinatura?: Date
  feedback_cliente?: string
  objecoes?: string
  pontos_negociacao?: string
  motivo_rejeicao?: string
  arquivo_pdf_url?: string
  template_usado?: string
  assinatura_digital_url?: string
  documentos_anexos: string[]
  visualizacoes: number
  tempo_visualizacao: number
  paginas_visualizadas: number[]
  ultima_interacao?: Date
  requer_aprovacao: boolean
  aprovada_por?: string
  motivo_aprovacao?: string
  created_at: Date
  updated_at: Date
}
