-- Migration: Create arquivos_ia table for AI file management
-- This table stores files specifically for AI usage with enhanced metadata and relationships

CREATE TABLE IF NOT EXISTS arquivos_ia (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Basic file information
  nome VARCHAR(255) NOT NULL,
  nome_original VARCHAR(255) NOT NULL,
  descricao TEXT,
  
  -- File technical metadata
  tamanho BIGINT NOT NULL,
  tipo_mime VARCHAR(100) NOT NULL,
  extensao VARCHAR(10),
  url TEXT NOT NULL,
  caminho_storage TEXT NOT NULL, -- Will include automatic folder structure
  bucket_name VARCHAR(50) DEFAULT 'ia' NOT NULL,
  
  -- AI-specific metadata
  categoria VARCHAR(50) NOT NULL CHECK (categoria IN (
    'catalogo', 'produto', 'proposta', 'fechamento', 'manual', 
    'faq', 'suporte_tecnico', 'comercial', 'juridico', 'financeiro'
  )),
  subcategoria VARCHAR(50),
  instrucoes_ia TEXT, -- How AI should interpret and use this file
  contexto_uso TEXT, -- When and in what situations AI should reference
  palavras_chave TEXT[], -- Keywords for search and indexing
  prioridade INTEGER DEFAULT 5 CHECK (prioridade >= 1 AND prioridade <= 10),
  observacoes TEXT, -- Detailed notes about special content treatment
  
  -- Relationship fields (multiple relationships possible)
  cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
  produto_id UUID REFERENCES produtos(id) ON DELETE SET NULL,
  proposta_id UUID REFERENCES propostas(id) ON DELETE SET NULL,
  contrato_id UUID, -- Assuming contracts table exists or will exist
  
  -- Advanced controls
  status VARCHAR(20) DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'arquivado')),
  disponivel_ia BOOLEAN DEFAULT true,
  processado_ia BOOLEAN DEFAULT false,
  data_processamento TIMESTAMPTZ,
  versao INTEGER DEFAULT 1,
  arquivo_pai_id UUID REFERENCES arquivos_ia(id) ON DELETE SET NULL, -- For versioning
  
  -- Access controls
  visibilidade VARCHAR(20) DEFAULT 'privado' CHECK (visibilidade IN ('publico', 'privado', 'restrito')),
  
  -- Usage tracking
  visualizacoes INTEGER DEFAULT 0,
  downloads INTEGER DEFAULT 0,
  ultima_utilizacao_ia TIMESTAMPTZ,
  
  -- Audit fields
  criado_por UUID, -- User who created
  atualizado_por UUID, -- User who last updated
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ -- Soft delete
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_arquivos_ia_categoria ON arquivos_ia(categoria);
CREATE INDEX IF NOT EXISTS idx_arquivos_ia_status ON arquivos_ia(status);
CREATE INDEX IF NOT EXISTS idx_arquivos_ia_disponivel_ia ON arquivos_ia(disponivel_ia);
CREATE INDEX IF NOT EXISTS idx_arquivos_ia_cliente_id ON arquivos_ia(cliente_id);
CREATE INDEX IF NOT EXISTS idx_arquivos_ia_produto_id ON arquivos_ia(produto_id);
CREATE INDEX IF NOT EXISTS idx_arquivos_ia_proposta_id ON arquivos_ia(proposta_id);
CREATE INDEX IF NOT EXISTS idx_arquivos_ia_palavras_chave ON arquivos_ia USING GIN(palavras_chave);
CREATE INDEX IF NOT EXISTS idx_arquivos_ia_created_at ON arquivos_ia(created_at);
CREATE INDEX IF NOT EXISTS idx_arquivos_ia_deleted_at ON arquivos_ia(deleted_at);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_arquivos_ia_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER trigger_arquivos_ia_updated_at
  BEFORE UPDATE ON arquivos_ia
  FOR EACH ROW
  EXECUTE FUNCTION update_arquivos_ia_updated_at();

-- Create function to generate automatic folder structure based on category
CREATE OR REPLACE FUNCTION generate_ia_folder_path(categoria_param VARCHAR, subcategoria_param VARCHAR DEFAULT NULL)
RETURNS TEXT AS $$
BEGIN
  IF subcategoria_param IS NOT NULL AND subcategoria_param != '' THEN
    RETURN LOWER(categoria_param) || '/' || LOWER(REPLACE(subcategoria_param, ' ', '_')) || '/';
  ELSE
    RETURN LOWER(categoria_param) || '/';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Add RLS (Row Level Security) policies if needed
ALTER TABLE arquivos_ia ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to read active files
CREATE POLICY "Users can view active arquivos_ia" ON arquivos_ia
  FOR SELECT USING (deleted_at IS NULL AND status != 'arquivado');

-- Policy for authenticated users to insert
CREATE POLICY "Users can insert arquivos_ia" ON arquivos_ia
  FOR INSERT WITH CHECK (true);

-- Policy for authenticated users to update their own files
CREATE POLICY "Users can update arquivos_ia" ON arquivos_ia
  FOR UPDATE USING (true);

-- Policy for soft delete (update deleted_at)
CREATE POLICY "Users can soft delete arquivos_ia" ON arquivos_ia
  FOR UPDATE USING (true);

-- Add comments for documentation
COMMENT ON TABLE arquivos_ia IS 'Table for managing AI-specific files with enhanced metadata and relationships';
COMMENT ON COLUMN arquivos_ia.categoria IS 'File category that determines automatic folder organization';
COMMENT ON COLUMN arquivos_ia.instrucoes_ia IS 'Specific instructions for how AI should interpret this file';
COMMENT ON COLUMN arquivos_ia.contexto_uso IS 'Context about when AI should reference this file';
COMMENT ON COLUMN arquivos_ia.palavras_chave IS 'Keywords array for search and indexing';
COMMENT ON COLUMN arquivos_ia.prioridade IS 'Priority level for AI usage (1-10, higher is more important)';
COMMENT ON COLUMN arquivos_ia.caminho_storage IS 'Storage path including automatic folder structure';
COMMENT ON COLUMN arquivos_ia.disponivel_ia IS 'Whether this file is available for AI usage';
COMMENT ON COLUMN arquivos_ia.processado_ia IS 'Whether this file has been processed/indexed by AI';
