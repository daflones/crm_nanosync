-- Script para adicionar campos de IA aos setores de atendimento
-- Execute este SQL no Supabase SQL Editor

-- Se a tabela já existe, adicione apenas os novos campos
ALTER TABLE setores_atendimento 
ADD COLUMN IF NOT EXISTS instrucoes_ia TEXT,
ADD COLUMN IF NOT EXISTS contexto_uso TEXT,
ADD COLUMN IF NOT EXISTS palavras_chave TEXT[];

-- OU se a tabela não existe ainda, crie com todos os campos:
CREATE TABLE IF NOT EXISTS setores_atendimento (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    email VARCHAR(255),
    telefone VARCHAR(20),
    whatsapp VARCHAR(20),
    responsavel VARCHAR(255),
    horario_funcionamento JSONB,
    cor_identificacao VARCHAR(7) DEFAULT '#6366f1',
    prioridade VARCHAR(20) DEFAULT 'media',
    ativo BOOLEAN DEFAULT true,
    notificacoes_ativas BOOLEAN DEFAULT true,
    -- Novos campos para IA
    instrucoes_ia TEXT,
    contexto_uso TEXT,
    palavras_chave TEXT[],
    -- Campos de controle
    profile UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS se ainda não estiver habilitado
ALTER TABLE setores_atendimento ENABLE ROW LEVEL SECURITY;

-- Criar ou substituir políticas
DROP POLICY IF EXISTS "Users can view own setores" ON setores_atendimento;
CREATE POLICY "Users can view own setores" ON setores_atendimento
    FOR ALL USING (auth.uid() = profile);

-- Inserir dados de exemplo com configurações de IA
INSERT INTO setores_atendimento (
    nome, 
    descricao, 
    cor_identificacao, 
    prioridade, 
    instrucoes_ia,
    contexto_uso,
    palavras_chave,
    profile
) VALUES 
(
    'Suporte Técnico', 
    'Atendimento para questões técnicas e resolução de problemas', 
    '#ef4444', 
    'alta',
    'Quando atender suporte técnico, seja técnico e objetivo. Peça informações específicas sobre o problema, como versão do sistema, mensagens de erro, e passos para reproduzir o problema.',
    'Usar para resolver problemas técnicos, bugs, falhas de sistema, dificuldades de uso da plataforma',
    ARRAY['suporte', 'técnico', 'problema', 'erro', 'bug', 'falha', 'sistema', 'plataforma', 'funcionalidade'],
    auth.uid()
),
(
    'Atendimento ao Cliente', 
    'Atendimento geral e suporte ao cliente', 
    '#22c55e', 
    'alta',
    'Quando atender clientes, seja cordial e prestativo. Ouça atentamente as necessidades, ofereça soluções adequadas e mantenha um tom profissional.',
    'Usar para atendimento geral, dúvidas sobre produtos/serviços, reclamações, sugestões',
    ARRAY['atendimento', 'cliente', 'dúvida', 'informação', 'ajuda', 'suporte', 'reclamação', 'sugestão'],
    auth.uid()
),
(
    'Recursos Humanos', 
    'Questões relacionadas a pessoal e benefícios', 
    '#3b82f6', 
    'media',
    'Quando atender RH, seja empático e confidencial. Trate questões pessoais com cuidado, explique políticas claramente e direcione para procedimentos corretos.',
    'Usar para questões trabalhistas, benefícios, folha de pagamento, políticas internas, recrutamento',
    ARRAY['rh', 'recursos humanos', 'benefícios', 'salário', 'férias', 'contrato', 'política', 'recrutamento', 'demissão'],
    auth.uid()
),
(
    'Financeiro', 
    'Cobrança, pagamentos e questões financeiras', 
    '#f97316', 
    'alta',
    'Quando atender financeiro, seja claro sobre valores e prazos. Explique opções de pagamento, políticas de cobrança e seja firme mas cordial em cobranças.',
    'Usar para questões de pagamento, cobrança, faturas, boletos, parcelamentos, questões financeiras',
    ARRAY['financeiro', 'pagamento', 'cobrança', 'fatura', 'boleto', 'parcela', 'débito', 'crédito', 'valor'],
    auth.uid()
)
ON CONFLICT (id) DO NOTHING;
