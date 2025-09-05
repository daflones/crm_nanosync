-- Clean existing data and fix constraint properly
-- First check what prioridade values exist and clean them

-- See what values we have
-- SELECT DISTINCT prioridade FROM notificacoes;

-- Update all invalid prioridade values to 'media'
UPDATE notificacoes SET prioridade = 'media' 
WHERE prioridade NOT IN ('baixa', 'media', 'alta', 'urgente');

-- Also update 'normal' to 'media' for consistency
UPDATE notificacoes SET prioridade = 'media' WHERE prioridade = 'normal';

-- Drop existing constraint
ALTER TABLE notificacoes DROP CONSTRAINT IF EXISTS notificacoes_prioridade_check;

-- Add new constraint that accepts 'media'
ALTER TABLE notificacoes ADD CONSTRAINT notificacoes_prioridade_check 
CHECK (prioridade IN ('baixa', 'media', 'alta', 'urgente'));

-- Update default value
ALTER TABLE notificacoes ALTER COLUMN prioridade SET DEFAULT 'media';

-- Re-create the trigger function
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
        'media',
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
DROP TRIGGER IF EXISTS trigger_agendamento_insert ON agendamentos;
CREATE TRIGGER trigger_agendamento_insert
    AFTER INSERT ON agendamentos
    FOR EACH ROW
    EXECUTE FUNCTION trigger_agendamento_criado();
