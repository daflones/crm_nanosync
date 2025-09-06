// Types for AI Files management system

export interface ArquivoIA {
  id: string
  
  // Basic file information
  nome: string
  nome_original: string
  descricao?: string
  
  // File technical metadata
  tamanho: number
  tipo_mime: string
  extensao?: string
  url: string
  caminho_storage: string
  bucket_name: string
  
  // AI-specific metadata
  categoria: CategoriaArquivoIA
  subcategoria?: string
  instrucoes_ia?: string
  contexto_uso?: string
  palavras_chave?: string[]
  prioridade: number
  observacoes?: string
  
  // Relationship fields
  cliente_id?: string
  produto_id?: string
  proposta_id?: string
  contrato_id?: string
  
  // Advanced controls
  status: StatusArquivoIA
  disponivel_ia: boolean
  processado_ia: boolean
  data_processamento?: string
  versao: number
  arquivo_pai_id?: string
  
  // Access controls
  visibilidade: VisibilidadeArquivo
  
  // Usage tracking
  visualizacoes: number
  downloads: number
  ultima_utilizacao_ia?: string
  
  // Multi-tenant field
  profile: string
  
  // Audit fields
  criado_por?: string
  atualizado_por?: string
  created_at: string
  updated_at: string
  deleted_at?: string
}

export type CategoriaArquivoIA = 
  | 'catalogo'
  | 'apresentacao'
  | 'promocoes'
  | 'marketing'
  | 'video'
  | 'propostas'

export type StatusArquivoIA = 'ativo' | 'inativo' | 'arquivado'

export type VisibilidadeArquivo = 'publico' | 'privado' | 'restrito'

export interface CreateArquivoIAData {
  nome: string
  nome_original: string
  descricao?: string
  tamanho: number
  tipo_mime: string
  extensao?: string
  categoria: CategoriaArquivoIA
  subcategoria?: string
  instrucoes_ia?: string
  contexto_uso?: string
  palavras_chave?: string[]
  prioridade?: number
  observacoes?: string
  cliente_id?: string
  produto_id?: string
  proposta_id?: string
  contrato_id?: string
  visibilidade?: VisibilidadeArquivo
  disponivel_ia?: boolean
}

export interface UpdateArquivoIAData {
  nome?: string
  descricao?: string
  categoria?: CategoriaArquivoIA
  subcategoria?: string
  instrucoes_ia?: string
  contexto_uso?: string
  palavras_chave?: string[]
  prioridade?: number
  observacoes?: string
  cliente_id?: string
  produto_id?: string
  proposta_id?: string
  contrato_id?: string
  status?: StatusArquivoIA
  disponivel_ia?: boolean
  processado_ia?: boolean
  visibilidade?: VisibilidadeArquivo
}

export interface ArquivoIAFilters {
  categoria?: CategoriaArquivoIA
  status?: StatusArquivoIA
  disponivel_ia?: boolean
  processado_ia?: boolean
  visibilidade?: VisibilidadeArquivo
  cliente_id?: string
  produto_id?: string
  proposta_id?: string
  search?: string
  palavras_chave?: string[]
}

// Category configuration for automatic folder organization
export const CATEGORIA_CONFIG: Record<CategoriaArquivoIA, {
  label: string
  description: string
  folder: string
  subcategorias?: string[]
}> = {
  catalogo: {
    label: 'Catálogo',
    description: 'Catálogos de produtos e serviços',
    folder: 'catalogos',
    subcategorias: ['produtos', 'servicos', 'linha_completa']
  },
  apresentacao: {
    label: 'Apresentação',
    description: 'Apresentações comerciais e institucionais',
    folder: 'apresentacoes',
    subcategorias: ['comercial', 'institucional', 'produtos', 'servicos']
  },
  promocoes: {
    label: 'Promoções',
    description: 'Materiais promocionais e ofertas especiais',
    folder: 'promocoes',
    subcategorias: ['desconto', 'combo', 'sazonal', 'lancamento']
  },
  marketing: {
    label: 'Marketing',
    description: 'Materiais de marketing e comunicação',
    folder: 'marketing',
    subcategorias: ['campanhas', 'social_media', 'email_marketing', 'branding']
  },
  video: {
    label: 'Vídeo',
    description: 'Conteúdos em vídeo para diversos fins',
    folder: 'videos',
    subcategorias: ['institucional', 'produto', 'tutorial', 'depoimento']
  },
  propostas: {
    label: 'Propostas',
    description: 'Documentos de propostas comerciais',
    folder: 'propostas',
    subcategorias: ['comerciais', 'tecnicas', 'orcamentos', 'contratos']
  }
}

export const STATUS_CONFIG: Record<StatusArquivoIA, {
  label: string
  color: string
}> = {
  ativo: { label: 'Ativo', color: 'green' },
  inativo: { label: 'Inativo', color: 'gray' },
  arquivado: { label: 'Arquivado', color: 'red' }
}

export const VISIBILIDADE_CONFIG: Record<VisibilidadeArquivo, {
  label: string
  description: string
  icon: string
}> = {
  publico: {
    label: 'Público',
    description: 'Visível para todos os usuários',
    icon: 'Globe'
  },
  privado: {
    label: 'Privado',
    description: 'Visível apenas para o criador',
    icon: 'Lock'
  },
  restrito: {
    label: 'Restrito',
    description: 'Visível para usuários específicos',
    icon: 'Shield'
  }
}
