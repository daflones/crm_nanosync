-- Script simplificado para criar tabela setores_atendimento
-- Execute este SQL no Supabase SQL Editor

CREATE TABLE setores_atendimento (
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
    profile UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE setores_atendimento ENABLE ROW LEVEL SECURITY;

-- Políticas básicas
CREATE POLICY "Users can view own setores" ON setores_atendimento
    FOR ALL USING (auth.uid() = profile);
