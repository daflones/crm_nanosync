-- Fix propostas triggers to use 'status' instead of 'categoria'
-- The propostas table uses 'status' field, not 'categoria'

-- Drop existing trigger first
DROP TRIGGER IF EXISTS trigger_proposta_mudanca_status ON propostas;

-- Update the trigger function to use 'status' instead of 'categoria'
CREATE OR REPLACE FUNCTION trigger_proposta_mudanca()
RETURNS TRIGGER AS $$
BEGIN
    -- Se mudou o status
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO notificacoes (
            user_id, tipo, categoria, titulo, descricao,
            referencia_id, referencia_tipo, prioridade,
            dados_extras
        ) VALUES (
            NEW.vendedor_id, -- Use vendedor_id instead of user_id since propostas doesn't have user_id
            'proposta_mudou_categoria',
            'proposta',
            'Status da Proposta Alterado',
            'Proposta mudou de "' || COALESCE(OLD.status, 'Indefinido') || '" para "' || NEW.status || '"',
            NEW.id,
            'proposta',
            CASE 
                WHEN NEW.status = 'aprovada' THEN 'alta'
                WHEN NEW.status = 'rejeitada' THEN 'normal'
                WHEN NEW.status = 'vencida' THEN 'normal'
                ELSE 'normal'
            END,
            json_build_object(
                'status_anterior', OLD.status,
                'status_novo', NEW.status,
                'valor', NEW.valor_total,
                'cliente_id', NEW.cliente_id
            )
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
CREATE TRIGGER trigger_proposta_mudanca_status
    AFTER UPDATE ON propostas
    FOR EACH ROW
    EXECUTE FUNCTION trigger_proposta_mudanca();

-- Also fix the cron job functions that reference 'categoria' instead of 'status'
CREATE OR REPLACE FUNCTION verificar_propostas_vencidas()
RETURNS void AS $$
DECLARE
    rec RECORD;
BEGIN
    -- Buscar propostas enviadas há mais de 3 dias
    FOR rec IN 
        SELECT p.*, c.nome as cliente_nome 
        FROM propostas p
        LEFT JOIN clientes c ON p.cliente_id = c.id
        WHERE p.status = 'enviada'
        AND p.updated_at < (NOW() - INTERVAL '3 days')
        AND p.status != 'vencida'
    LOOP
        -- Atualizar status para vencida
        UPDATE propostas 
        SET status = 'vencida', 
            updated_at = NOW()
        WHERE id = rec.id;
        
        -- Criar notificação de expiração
        INSERT INTO notificacoes (
            user_id, tipo, categoria, titulo, descricao,
            referencia_id, referencia_tipo, prioridade,
            dados_extras
        ) VALUES (
            rec.vendedor_id,
            'proposta_expirada',
            'proposta',
            'Proposta Expirada',
            'A proposta "' || rec.titulo || '" para o cliente ' || COALESCE(rec.cliente_nome, 'N/A') || ' expirou após 3 dias sem resposta.',
            rec.id,
            'proposta',
            'normal',
            json_build_object(
                'cliente_id', rec.cliente_id,
                'valor', rec.valor_total,
                'data_envio', rec.data_envio
            )
        );
    END LOOP;
END;
$$ LANGUAGE plpgsql;
