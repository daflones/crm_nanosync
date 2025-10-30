-- Criar tabela setores_atendimento
CREATE TABLE IF NOT EXISTS setores_atendimento (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    email VARCHAR(255),
    telefone VARCHAR(20),
    whatsapp VARCHAR(20),
    responsavel VARCHAR(255),
    horario_funcionamento JSONB DEFAULT '{
        "segunda": {"ativo": true, "periodos": [{"inicio": "08:00", "fim": "18:00"}]},
        "terca": {"ativo": true, "periodos": [{"inicio": "08:00", "fim": "18:00"}]},
        "quarta": {"ativo": true, "periodos": [{"inicio": "08:00", "fim": "18:00"}]},
        "quinta": {"ativo": true, "periodos": [{"inicio": "08:00", "fim": "18:00"}]},
        "sexta": {"ativo": true, "periodos": [{"inicio": "08:00", "fim": "18:00"}]},
        "sabado": {"ativo": false, "periodos": [{"inicio": "08:00", "fim": "12:00"}]},
        "domingo": {"ativo": false, "periodos": [{"inicio": "08:00", "fim": "12:00"}]}
    }',
    cor_identificacao VARCHAR(7) DEFAULT '#6366f1',
    prioridade VARCHAR(20) DEFAULT 'media' CHECK (prioridade IN ('baixa', 'media', 'alta', 'urgente')),
    ativo BOOLEAN DEFAULT true,
    notificacoes_ativas BOOLEAN DEFAULT true,
    profile UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_setores_atendimento_profile ON setores_atendimento(profile);
CREATE INDEX IF NOT EXISTS idx_setores_atendimento_ativo ON setores_atendimento(ativo);
CREATE INDEX IF NOT EXISTS idx_setores_atendimento_prioridade ON setores_atendimento(prioridade);

-- Criar trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_setores_atendimento_updated_at 
    BEFORE UPDATE ON setores_atendimento 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS (Row Level Security)
ALTER TABLE setores_atendimento ENABLE ROW LEVEL SECURITY;

-- Criar políticas de segurança
CREATE POLICY "Usuários podem ver seus próprios setores" ON setores_atendimento
    FOR SELECT USING (auth.uid() = profile);

CREATE POLICY "Usuários podem inserir seus próprios setores" ON setores_atendimento
    FOR INSERT WITH CHECK (auth.uid() = profile);

CREATE POLICY "Usuários podem atualizar seus próprios setores" ON setores_atendimento
    FOR UPDATE USING (auth.uid() = profile);

CREATE POLICY "Usuários podem deletar seus próprios setores" ON setores_atendimento
    FOR DELETE USING (auth.uid() = profile);

-- Inserir alguns setores de exemplo (opcional)
INSERT INTO setores_atendimento (nome, descricao, cor_identificacao, prioridade, profile) 
VALUES 
    ('Suporte Técnico', 'Atendimento para questões técnicas e resolução de problemas', '#ef4444', 'alta', auth.uid()),
    ('Vendas', 'Atendimento comercial e negociação de propostas', '#22c55e', 'media', auth.uid()),
    ('Recursos Humanos', 'Questões relacionadas a pessoal e benefícios', '#3b82f6', 'media', auth.uid()),
    ('Financeiro', 'Cobrança, pagamentos e questões financeiras', '#f97316', 'alta', auth.uid())
ON CONFLICT DO NOTHING;
