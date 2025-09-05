-- Fix notificacoes prioridade constraint to match agendamentos table
-- Change 'normal' to 'media' for consistency

-- Update existing records that have 'normal' to 'media'
UPDATE notificacoes SET prioridade = 'media' WHERE prioridade = 'normal';

-- Drop existing constraint
ALTER TABLE notificacoes DROP CONSTRAINT IF EXISTS notificacoes_prioridade_check;

-- Add new constraint with consistent values
ALTER TABLE notificacoes ADD CONSTRAINT notificacoes_prioridade_check 
CHECK (prioridade IN ('baixa', 'media', 'alta', 'urgente'));

-- Update default value
ALTER TABLE notificacoes ALTER COLUMN prioridade SET DEFAULT 'media';

-- Fix trigger function to use 'media' instead of 'normal'
CREATE OR REPLACE FUNCTION trigger_agendamento_criado()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO notificacoes (
        user_id, tipo, categoria, titulo, descricao,
        referencia_id, referencia_tipo, prioridade,
        dados_extras
    ) VALUES (
        NEW.user_id,
        'agendamento_criado',
        'agendamento',
        'Novo Agendamento Criado',
        'Agendamento "' || NEW.titulo || '" foi criado para ' || NEW.data_inicio::date,
        NEW.id,
        'agendamento',
        'media', -- Changed from 'normal' to 'media'
        json_build_object(
            'titulo', NEW.titulo,
            'data_inicio', NEW.data_inicio,
            'cliente_id', NEW.cliente_id
        )
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
