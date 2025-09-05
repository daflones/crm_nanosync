-- Fix the constraint to match what the system is actually trying to insert
-- The system is inserting 'media' but constraint only accepts 'normal'

-- Drop existing constraint
ALTER TABLE notificacoes DROP CONSTRAINT IF EXISTS notificacoes_prioridade_check;

-- Add new constraint that includes 'media' instead of 'normal'
ALTER TABLE notificacoes ADD CONSTRAINT notificacoes_prioridade_check 
CHECK (prioridade IN ('baixa', 'media', 'alta', 'urgente'));

-- Update any existing 'normal' values to 'media'
UPDATE notificacoes SET prioridade = 'media' WHERE prioridade = 'normal';

-- Update default value to 'media'
ALTER TABLE notificacoes ALTER COLUMN prioridade SET DEFAULT 'media';

-- Re-enable the agendamento trigger with correct prioridade
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
        'media', -- Using 'media' to match what the system expects
        json_build_object(
            'titulo', NEW.titulo,
            'data_inicio', NEW.data_inicio,
            'cliente_id', NEW.cliente_id
        )
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Re-enable the trigger
CREATE TRIGGER trigger_agendamento_insert
    AFTER INSERT ON agendamentos
    FOR EACH ROW
    EXECUTE FUNCTION trigger_agendamento_criado();
