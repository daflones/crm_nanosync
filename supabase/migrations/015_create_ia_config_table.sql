-- Create ia_config table for AI assistant configurations
CREATE TABLE IF NOT EXISTS ia_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Contexto e personalidade da IA
  contexto_ia TEXT DEFAULT 'Você é um assistente inteligente especializado em vendas e atendimento ao cliente para a empresa. Seja sempre prestativo, profissional e focado em ajudar o cliente.',
  tom_fala VARCHAR(50) DEFAULT 'profissional' CHECK (tom_fala IN ('profissional', 'casual', 'formal', 'amigavel', 'tecnico')),
  
  -- Regras e comportamentos
  regras_especificas TEXT DEFAULT 'Sempre confirme informações importantes antes de prosseguir. Seja claro e objetivo nas respostas.',
  regras_adicionais TEXT,
  
  -- Configurações de texto
  tamanho_textos VARCHAR(20) DEFAULT 'medio' CHECK (tamanho_textos IN ('curto', 'medio', 'longo', 'detalhado')),
  usar_emojis BOOLEAN DEFAULT true,
  
  -- Horários de funcionamento
  horarios_funcionamento JSONB DEFAULT '{
    "segunda": {"inicio": "08:00", "fim": "18:00", "ativo": true},
    "terca": {"inicio": "08:00", "fim": "18:00", "ativo": true},
    "quarta": {"inicio": "08:00", "fim": "18:00", "ativo": true},
    "quinta": {"inicio": "08:00", "fim": "18:00", "ativo": true},
    "sexta": {"inicio": "08:00", "fim": "18:00", "ativo": true},
    "sabado": {"inicio": "08:00", "fim": "12:00", "ativo": false},
    "domingo": {"inicio": "08:00", "fim": "12:00", "ativo": false}
  }'::jsonb,
  
  -- Informações da empresa
  detalhes_empresa JSONB DEFAULT '{
    "nome": "",
    "segmento": "",
    "produtos_principais": [],
    "diferenciais": [],
    "valores": "",
    "missao": "",
    "contatos": {
      "telefone": "",
      "email": "",
      "whatsapp": "",
      "endereco": ""
    },
    "redes_sociais": {
      "website": "",
      "instagram": "",
      "linkedin": "",
      "facebook": ""
    }
  }'::jsonb,
  
  -- Detalhes da empresa
  detalhes_empresa JSONB DEFAULT '{
    "sobre_empresa": "",
    "missao": "",
    "visao": "",
    "valores": "",
    "produtos_servicos": [],
    "diferenciais_competitivos": [],
    "publico_alvo": "",
    "segmento_mercado": "",
    "anos_mercado": null,
    "numero_funcionarios": null,
    "certificacoes": [],
    "premios_reconhecimentos": [],
    "politicas_empresa": {
      "politica_vendas": "",
      "politica_devolucao": "",
      "politica_garantia": "",
      "politica_privacidade": "",
      "termos_uso": ""
    },
    "processos_internos": {
      "processo_vendas": "",
      "processo_atendimento": "",
      "processo_pos_venda": "",
      "tempo_entrega": "",
      "formas_pagamento": []
    }
  }'::jsonb,
  
  -- Configurações avançadas
  auto_resposta_ativa BOOLEAN DEFAULT false,
  tempo_resposta_ms INTEGER DEFAULT 2000 CHECK (tempo_resposta_ms >= 1000 AND tempo_resposta_ms <= 30000),
  mensagem_ausencia TEXT DEFAULT 'No momento estou fora do horário de atendimento. Deixe sua mensagem que retornarei assim que possível.',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  
  -- Ensure one config per user
  UNIQUE(user_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_ia_config_user_id ON ia_config(user_id);

-- Enable RLS (Row Level Security)
ALTER TABLE ia_config ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own IA configurations" ON ia_config
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own IA configurations" ON ia_config
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own IA configurations" ON ia_config
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own IA configurations" ON ia_config
  FOR DELETE USING (auth.uid() = user_id);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_ia_config_updated_at
  BEFORE UPDATE ON ia_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
