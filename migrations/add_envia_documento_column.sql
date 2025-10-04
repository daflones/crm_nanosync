-- Adicionar coluna envia_documento na tabela ia_config
-- Esta coluna controla se a área de Arquivos IA deve ser exibida

-- Verificar se a coluna já existe antes de adicionar
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'ia_config' 
        AND column_name = 'envia_documento'
    ) THEN
        ALTER TABLE ia_config 
        ADD COLUMN envia_documento BOOLEAN DEFAULT false;
        
        -- Adicionar comentário na coluna
        COMMENT ON COLUMN ia_config.envia_documento IS 'Controla se a área de Arquivos IA deve ser exibida no sistema';
    END IF;
END $$;

-- Atualizar registros existentes para false (desabilitado por padrão)
UPDATE ia_config 
SET envia_documento = false 
WHERE envia_documento IS NULL;
