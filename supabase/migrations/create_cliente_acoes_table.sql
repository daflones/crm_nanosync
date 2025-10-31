-- Criar tabela de ações do cliente (timeline)
CREATE TABLE IF NOT EXISTS cliente_acoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descricao TEXT,
  tipo TEXT NOT NULL CHECK (tipo IN ('ligacao', 'email', 'reuniao', 'proposta', 'follow_up', 'negociacao', 'fechamento', 'pos_venda', 'outra')),
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_andamento', 'concluida', 'cancelada')),
  data_prevista TIMESTAMP WITH TIME ZONE NOT NULL,
  data_conclusao TIMESTAMP WITH TIME ZONE,
  ordem INTEGER NOT NULL DEFAULT 0,
  responsavel_id UUID REFERENCES profiles(id),
  criado_por UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX idx_cliente_acoes_cliente_id ON cliente_acoes(cliente_id);
CREATE INDEX idx_cliente_acoes_profile_id ON cliente_acoes(profile_id);
CREATE INDEX idx_cliente_acoes_status ON cliente_acoes(status);
CREATE INDEX idx_cliente_acoes_data_prevista ON cliente_acoes(data_prevista);
CREATE INDEX idx_cliente_acoes_ordem ON cliente_acoes(ordem);
CREATE INDEX idx_cliente_acoes_responsavel_id ON cliente_acoes(responsavel_id);

-- Habilitar Row Level Security (RLS)
ALTER TABLE cliente_acoes ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem ver apenas ações dos seus próprios clientes
CREATE POLICY "Users can view their own cliente acoes"
  ON cliente_acoes
  FOR SELECT
  USING (
    profile_id = auth.uid() 
    OR profile_id IN (
      SELECT id FROM profiles WHERE admin_profile_id = auth.uid()
    )
    OR auth.uid() IN (
      SELECT id FROM profiles WHERE admin_profile_id = profile_id
    )
  );

-- Política: Usuários podem inserir ações para seus próprios clientes
CREATE POLICY "Users can insert their own cliente acoes"
  ON cliente_acoes
  FOR INSERT
  WITH CHECK (
    profile_id = auth.uid()
    OR profile_id IN (
      SELECT id FROM profiles WHERE admin_profile_id = auth.uid()
    )
    OR auth.uid() IN (
      SELECT id FROM profiles WHERE admin_profile_id = profile_id
    )
  );

-- Política: Usuários podem atualizar apenas suas próprias ações
CREATE POLICY "Users can update their own cliente acoes"
  ON cliente_acoes
  FOR UPDATE
  USING (
    profile_id = auth.uid()
    OR profile_id IN (
      SELECT id FROM profiles WHERE admin_profile_id = auth.uid()
    )
    OR auth.uid() IN (
      SELECT id FROM profiles WHERE admin_profile_id = profile_id
    )
  );

-- Política: Usuários podem deletar apenas suas próprias ações
CREATE POLICY "Users can delete their own cliente acoes"
  ON cliente_acoes
  FOR DELETE
  USING (
    profile_id = auth.uid()
    OR profile_id IN (
      SELECT id FROM profiles WHERE admin_profile_id = auth.uid()
    )
    OR auth.uid() IN (
      SELECT id FROM profiles WHERE admin_profile_id = profile_id
    )
  );

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_cliente_acoes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
CREATE TRIGGER update_cliente_acoes_timestamp
  BEFORE UPDATE ON cliente_acoes
  FOR EACH ROW
  EXECUTE FUNCTION update_cliente_acoes_updated_at();

-- Comentários na tabela e colunas
COMMENT ON TABLE cliente_acoes IS 'Linha do tempo de ações e tarefas dos clientes';
COMMENT ON COLUMN cliente_acoes.titulo IS 'Título da ação (obrigatório)';
COMMENT ON COLUMN cliente_acoes.descricao IS 'Descrição detalhada da ação (opcional)';
COMMENT ON COLUMN cliente_acoes.tipo IS 'Tipo de ação: ligacao, email, reuniao, proposta, follow_up, negociacao, fechamento, pos_venda, outra';
COMMENT ON COLUMN cliente_acoes.status IS 'Status da ação: pendente, em_andamento, concluida, cancelada';
COMMENT ON COLUMN cliente_acoes.data_prevista IS 'Data e hora prevista para realizar a ação';
COMMENT ON COLUMN cliente_acoes.data_conclusao IS 'Data e hora em que a ação foi concluída';
COMMENT ON COLUMN cliente_acoes.ordem IS 'Ordem da ação na timeline (para drag & drop)';
COMMENT ON COLUMN cliente_acoes.responsavel_id IS 'Usuário responsável por executar a ação';
COMMENT ON COLUMN cliente_acoes.criado_por IS 'Usuário que criou a ação';
