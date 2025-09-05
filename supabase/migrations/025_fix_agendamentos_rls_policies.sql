-- Remover políticas existentes para agendamentos
DROP POLICY IF EXISTS "agendamentos_select_policy" ON agendamentos;
DROP POLICY IF EXISTS "agendamentos_insert_policy" ON agendamentos;
DROP POLICY IF EXISTS "agendamentos_update_policy" ON agendamentos;
DROP POLICY IF EXISTS "agendamentos_delete_policy" ON agendamentos;

-- Habilitar RLS na tabela agendamentos
ALTER TABLE agendamentos ENABLE ROW LEVEL SECURITY;

-- Política de SELECT: Usuários podem ver agendamentos baseado em seu papel
CREATE POLICY "agendamentos_select_policy" ON agendamentos
FOR SELECT
USING (
  CASE 
    WHEN (auth.jwt() -> 'user_metadata' ->> 'role')::text = 'admin' THEN true
    WHEN (auth.jwt() -> 'user_metadata' ->> 'role')::text = 'vendedor' THEN user_id = auth.uid()
    ELSE user_id = auth.uid() -- Fallback: usuários veem apenas seus próprios agendamentos
  END
);

-- Política de INSERT: Usuários podem inserir agendamentos
CREATE POLICY "agendamentos_insert_policy" ON agendamentos
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL AND
  user_id = auth.uid()
);

-- Política de UPDATE: Usuários podem atualizar baseado em seu papel
CREATE POLICY "agendamentos_update_policy" ON agendamentos
FOR UPDATE
USING (
  CASE 
    WHEN (auth.jwt() -> 'user_metadata' ->> 'role')::text = 'admin' THEN true
    WHEN (auth.jwt() -> 'user_metadata' ->> 'role')::text = 'vendedor' THEN user_id = auth.uid()
    ELSE user_id = auth.uid() -- Fallback: usuários editam apenas seus próprios agendamentos
  END
)
WITH CHECK (
  CASE 
    WHEN (auth.jwt() -> 'user_metadata' ->> 'role')::text = 'admin' THEN true
    WHEN (auth.jwt() -> 'user_metadata' ->> 'role')::text = 'vendedor' THEN user_id = auth.uid()
    ELSE user_id = auth.uid() -- Fallback: usuários editam apenas seus próprios agendamentos
  END
);

-- Política de DELETE: Usuários podem deletar baseado em seu papel
CREATE POLICY "agendamentos_delete_policy" ON agendamentos
FOR DELETE
USING (
  CASE 
    WHEN (auth.jwt() -> 'user_metadata' ->> 'role')::text = 'admin' THEN true
    WHEN (auth.jwt() -> 'user_metadata' ->> 'role')::text = 'vendedor' THEN user_id = auth.uid()
    ELSE user_id = auth.uid() -- Fallback: usuários deletam apenas seus próprios agendamentos
  END
);

-- Adicionar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_agendamentos_user_id ON agendamentos(user_id);
CREATE INDEX IF NOT EXISTS idx_agendamentos_data_inicio ON agendamentos(data_inicio);
CREATE INDEX IF NOT EXISTS idx_agendamentos_status ON agendamentos(status);
CREATE INDEX IF NOT EXISTS idx_agendamentos_cliente_id ON agendamentos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_agendamentos_vendedor_id ON agendamentos(vendedor_id);

-- Comentários para documentação
COMMENT ON POLICY "agendamentos_select_policy" ON agendamentos IS 'Admins veem todos os agendamentos, vendedores veem apenas os próprios';
COMMENT ON POLICY "agendamentos_insert_policy" ON agendamentos IS 'Usuários autenticados podem criar agendamentos com seu user_id';
COMMENT ON POLICY "agendamentos_update_policy" ON agendamentos IS 'Admins podem editar todos, vendedores apenas os próprios';
COMMENT ON POLICY "agendamentos_delete_policy" ON agendamentos IS 'Admins podem deletar todos, vendedores apenas os próprios';
