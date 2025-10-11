-- Adicionar colunas faltantes na tabela ia_config

-- Adicionar contexto_ia
ALTER TABLE public.ia_config 
ADD COLUMN IF NOT EXISTS contexto_ia TEXT;

-- Adicionar regras_especificas
ALTER TABLE public.ia_config 
ADD COLUMN IF NOT EXISTS regras_especificas TEXT 
DEFAULT 'Sempre confirme informações importantes antes de prosseguir. Seja claro e objetivo nas respostas.';

-- Adicionar regras_adicionais
ALTER TABLE public.ia_config 
ADD COLUMN IF NOT EXISTS regras_adicionais TEXT;

-- Adicionar horarios_agendamento
ALTER TABLE public.ia_config 
ADD COLUMN IF NOT EXISTS horarios_agendamento JSONB 
DEFAULT '{
  "segunda": {"inicio": "08:00", "fim": "18:00", "ativo": false},
  "terca": {"inicio": "08:00", "fim": "18:00", "ativo": false},
  "quarta": {"inicio": "08:00", "fim": "18:00", "ativo": false},
  "quinta": {"inicio": "08:00", "fim": "18:00", "ativo": false},
  "sexta": {"inicio": "08:00", "fim": "18:00", "ativo": false},
  "sabado": {"inicio": "08:00", "fim": "12:00", "ativo": false},
  "domingo": {"inicio": "08:00", "fim": "12:00", "ativo": false}
}'::jsonb;

-- Comentários para documentação
COMMENT ON COLUMN public.ia_config.contexto_ia IS 'Contexto e personalidade da IA';
COMMENT ON COLUMN public.ia_config.regras_especificas IS 'Regras específicas de comportamento da IA';
COMMENT ON COLUMN public.ia_config.regras_adicionais IS 'Regras adicionais customizadas';
COMMENT ON COLUMN public.ia_config.horarios_agendamento IS 'Horários disponíveis para agendamentos pela IA';
