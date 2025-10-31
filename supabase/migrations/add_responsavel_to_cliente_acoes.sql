-- Adicionar coluna responsavel_id à tabela cliente_acoes (caso a tabela já exista)
-- Esta migration é segura para rodar mesmo se a coluna já existir

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cliente_acoes' 
    AND column_name = 'responsavel_id'
  ) THEN
    ALTER TABLE cliente_acoes 
    ADD COLUMN responsavel_id UUID REFERENCES profiles(id);
    
    -- Adicionar índice
    CREATE INDEX idx_cliente_acoes_responsavel_id ON cliente_acoes(responsavel_id);
    
    -- Adicionar comentário
    COMMENT ON COLUMN cliente_acoes.responsavel_id IS 'Usuário responsável por executar a ação';
    
    RAISE NOTICE 'Coluna responsavel_id adicionada com sucesso';
  ELSE
    RAISE NOTICE 'Coluna responsavel_id já existe';
  END IF;
END $$;
