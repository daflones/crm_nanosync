-- Create arquivos table for file management
-- Support category-based organization with proper file metadata

CREATE TABLE IF NOT EXISTS arquivos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome TEXT NOT NULL,
    tipo TEXT NOT NULL,
    tamanho BIGINT DEFAULT 0,
    url TEXT NOT NULL,
    categoria TEXT CHECK (categoria IN ('propostas', 'contratos', 'marketing', 'produtos', 'relatorios', 'sistema', 'juridico', 'vendas')) DEFAULT 'sistema',
    bucket_name TEXT DEFAULT 'sistema',
    file_path TEXT,
    mime_type TEXT,
    is_public BOOLEAN DEFAULT true,
    tags TEXT[],
    descricao TEXT,
    metadata JSONB DEFAULT '{}',
    entity_type TEXT,
    entity_id UUID,
    downloaded_times NUMERIC DEFAULT 0,
    downloaded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on arquivos table
ALTER TABLE arquivos ENABLE ROW LEVEL SECURITY;

-- Create policies for arquivos table
CREATE POLICY "Allow authenticated users to read arquivos" ON arquivos
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert arquivos" ON arquivos
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update arquivos" ON arquivos
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete arquivos" ON arquivos
    FOR DELETE USING (auth.role() = 'authenticated');

-- Update existing records to have proper categoria based on entity_type
UPDATE arquivos 
SET categoria = CASE 
  WHEN entity_type = 'proposta' THEN 'propostas'
  WHEN entity_type = 'contrato' THEN 'contratos'
  WHEN entity_type = 'produto' THEN 'produtos'
  WHEN entity_type = 'cliente' THEN 'vendas'
  WHEN entity_type = 'vendedor' THEN 'vendas'
  ELSE 'sistema'
END,
bucket_name = CASE 
  WHEN entity_type = 'proposta' THEN 'propostas'
  WHEN entity_type = 'contrato' THEN 'contratos'
  WHEN entity_type = 'produto' THEN 'produtos'
  WHEN entity_type = 'cliente' THEN 'vendas'
  WHEN entity_type = 'vendedor' THEN 'vendas'
  ELSE 'sistema'
END,
mime_type = tipo
WHERE categoria IS NULL OR bucket_name IS NULL;

-- Add download tracking columns to existing table if they don't exist
ALTER TABLE arquivos 
ADD COLUMN IF NOT EXISTS downloaded_times NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS downloaded_at TIMESTAMPTZ;

-- Create index for better performance on category searches
CREATE INDEX IF NOT EXISTS idx_arquivos_categoria ON arquivos(categoria);
CREATE INDEX IF NOT EXISTS idx_arquivos_bucket_name ON arquivos(bucket_name);
CREATE INDEX IF NOT EXISTS idx_arquivos_tags ON arquivos USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_arquivos_downloaded_at ON arquivos(downloaded_at);

-- Add trigger to automatically update updated_at
CREATE OR REPLACE FUNCTION update_arquivos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_arquivos_updated_at ON arquivos;
CREATE TRIGGER trigger_update_arquivos_updated_at
  BEFORE UPDATE ON arquivos
  FOR EACH ROW
  EXECUTE FUNCTION update_arquivos_updated_at();
