-- Fix notificacoes constraint definitively
-- The original constraint uses 'normal' but the system is trying to insert 'media'

-- First, update any existing records
UPDATE notificacoes SET prioridade = 'normal' WHERE prioridade = 'media';

-- Drop the existing constraint
ALTER TABLE notificacoes DROP CONSTRAINT IF EXISTS notificacoes_prioridade_check;

-- Add the constraint with the correct values that match the original schema
ALTER TABLE notificacoes ADD CONSTRAINT notificacoes_prioridade_check 
CHECK (prioridade IN ('baixa', 'normal', 'alta', 'urgente'));

-- Update all trigger functions to use 'normal' instead of 'media'

-- Fix agendamento trigger
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
        'normal', -- Using 'normal' to match constraint
        json_build_object(
            'titulo', NEW.titulo,
            'data_inicio', NEW.data_inicio,
            'cliente_id', NEW.cliente_id
        )
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fix proposta triggers
CREATE OR REPLACE FUNCTION trigger_proposta_mudanca()
RETURNS TRIGGER AS $$
BEGIN
    -- Se mudou a categoria/status
    IF OLD.categoria IS DISTINCT FROM NEW.categoria THEN
        INSERT INTO notificacoes (
            user_id, tipo, categoria, titulo, descricao,
            referencia_id, referencia_tipo, prioridade,
            dados_extras
        ) VALUES (
            NEW.user_id,
            'proposta_mudou_categoria',
            'proposta',
            'Status da Proposta Alterado',
            'Proposta mudou de "' || COALESCE(OLD.categoria, 'Indefinido') || '" para "' || NEW.categoria || '"',
            NEW.id,
            'proposta',
            CASE 
                WHEN NEW.categoria = 'aprovada' THEN 'alta'
                WHEN NEW.categoria = 'recusada' THEN 'normal'
                ELSE 'normal'
            END,
            json_build_object(
                'categoria_anterior', OLD.categoria,
                'categoria_nova', NEW.categoria,
                'valor', NEW.valor_total,
                'cliente_id', NEW.cliente_id
            )
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
