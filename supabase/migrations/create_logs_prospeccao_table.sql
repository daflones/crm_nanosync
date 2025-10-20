-- Criar tabela de logs de prospecção
CREATE TABLE IF NOT EXISTS logs_prospeccao (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  place_id TEXT NOT NULL,
  nome_estabelecimento TEXT NOT NULL,
  endereco TEXT NOT NULL,
  telefone TEXT,
  whatsapp_valido BOOLEAN NOT NULL DEFAULT false,
  jid TEXT,
  mensagem_enviada BOOLEAN NOT NULL DEFAULT false,
  cliente_salvo BOOLEAN NOT NULL DEFAULT false,
  cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
  data_prospeccao TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  tipo_estabelecimento TEXT NOT NULL,
  cidade TEXT NOT NULL,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_logs_prospeccao_profile_id ON logs_prospeccao(profile_id);
CREATE INDEX IF NOT EXISTS idx_logs_prospeccao_place_id ON logs_prospeccao(place_id);
CREATE INDEX IF NOT EXISTS idx_logs_prospeccao_profile_place ON logs_prospeccao(profile_id, place_id);
CREATE INDEX IF NOT EXISTS idx_logs_prospeccao_data_prospeccao ON logs_prospeccao(data_prospeccao);
CREATE INDEX IF NOT EXISTS idx_logs_prospeccao_whatsapp_valido ON logs_prospeccao(whatsapp_valido);
CREATE INDEX IF NOT EXISTS idx_logs_prospeccao_cliente_salvo ON logs_prospeccao(cliente_salvo);

-- Criar trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_logs_prospeccao_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_logs_prospeccao_updated_at
  BEFORE UPDATE ON logs_prospeccao
  FOR EACH ROW
  EXECUTE FUNCTION update_logs_prospeccao_updated_at();

-- Habilitar RLS (Row Level Security)
ALTER TABLE logs_prospeccao ENABLE ROW LEVEL SECURITY;

-- Política RLS: usuários só podem ver logs da própria empresa
CREATE POLICY "Users can only see logs from their own company" ON logs_prospeccao
  FOR ALL USING (
    profile_id IN (
      SELECT CASE 
        WHEN auth.uid() IS NULL THEN NULL
        WHEN p.admin_profile_id IS NOT NULL THEN p.admin_profile_id
        ELSE p.id
      END
      FROM profiles p
      WHERE p.id = auth.uid()
    )
  );

-- Política RLS: usuários só podem inserir logs para sua própria empresa
CREATE POLICY "Users can only insert logs for their own company" ON logs_prospeccao
  FOR INSERT WITH CHECK (
    profile_id IN (
      SELECT CASE 
        WHEN auth.uid() IS NULL THEN NULL
        WHEN p.admin_profile_id IS NOT NULL THEN p.admin_profile_id
        ELSE p.id
      END
      FROM profiles p
      WHERE p.id = auth.uid()
    )
  );

-- Comentários para documentação
COMMENT ON TABLE logs_prospeccao IS 'Tabela para armazenar logs de prospecção de estabelecimentos';
COMMENT ON COLUMN logs_prospeccao.profile_id IS 'ID do perfil/empresa que fez a prospecção';
COMMENT ON COLUMN logs_prospeccao.place_id IS 'ID único do estabelecimento no Google Maps';
COMMENT ON COLUMN logs_prospeccao.nome_estabelecimento IS 'Nome do estabelecimento prospectado';
COMMENT ON COLUMN logs_prospeccao.endereco IS 'Endereço completo do estabelecimento';
COMMENT ON COLUMN logs_prospeccao.telefone IS 'Telefone encontrado do estabelecimento';
COMMENT ON COLUMN logs_prospeccao.whatsapp_valido IS 'Se o telefone é um WhatsApp válido';
COMMENT ON COLUMN logs_prospeccao.jid IS 'JID do WhatsApp (se válido)';
COMMENT ON COLUMN logs_prospeccao.mensagem_enviada IS 'Se a mensagem foi enviada com sucesso';
COMMENT ON COLUMN logs_prospeccao.cliente_salvo IS 'Se o estabelecimento foi salvo como cliente';
COMMENT ON COLUMN logs_prospeccao.cliente_id IS 'ID do cliente criado (se aplicável)';
COMMENT ON COLUMN logs_prospeccao.data_prospeccao IS 'Data e hora da prospecção';
COMMENT ON COLUMN logs_prospeccao.tipo_estabelecimento IS 'Tipo de estabelecimento buscado';
COMMENT ON COLUMN logs_prospeccao.cidade IS 'Cidade onde foi feita a busca';
COMMENT ON COLUMN logs_prospeccao.observacoes IS 'Observações adicionais sobre a prospecção';
