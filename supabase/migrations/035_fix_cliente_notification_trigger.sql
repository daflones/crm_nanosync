-- Fix cliente notification trigger to use auth.uid() instead of NEW.user_id
-- The clientes table doesn't have a user_id field, so we need to use the current authenticated user

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS trigger_cliente_insert ON clientes;
DROP FUNCTION IF EXISTS trigger_cliente_criado();

-- Create updated trigger function that uses auth.uid()
CREATE OR REPLACE FUNCTION trigger_cliente_criado()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create notification if user is authenticated
    IF auth.uid() IS NOT NULL THEN
        INSERT INTO notificacoes (
            user_id, tipo, categoria, titulo, descricao,
            referencia_id, referencia_tipo, prioridade,
            dados_extras
        ) VALUES (
            auth.uid(), -- Use current authenticated user instead of NEW.user_id
            'cliente_criado',
            'cliente',
            'Novo Cliente Cadastrado',
            'Cliente "' || NEW.nome_contato || '"' || 
            CASE WHEN NEW.nome_empresa IS NOT NULL THEN ' (' || NEW.nome_empresa || ')' ELSE '' END || 
            ' foi cadastrado',
            NEW.id,
            'cliente',
            'normal',
            json_build_object(
                'nome_contato', NEW.nome_contato,
                'nome_empresa', NEW.nome_empresa,
                'email', NEW.email,
                'telefone', NEW.telefone
            )
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER trigger_cliente_insert
    AFTER INSERT ON clientes
    FOR EACH ROW
    EXECUTE FUNCTION trigger_cliente_criado();

-- Also fix other triggers that might have similar issues
-- Fix agendamento trigger to use auth.uid() if user_id is not available
CREATE OR REPLACE FUNCTION trigger_agendamento_criado()
RETURNS TRIGGER AS $$
BEGIN
    -- Use NEW.user_id if available, otherwise use auth.uid()
    INSERT INTO notificacoes (
        user_id, tipo, categoria, titulo, descricao,
        referencia_id, referencia_tipo, prioridade,
        dados_extras
    ) VALUES (
        COALESCE(NEW.user_id, auth.uid()),
        'agendamento_criado',
        'agendamento',
        'Novo Agendamento Criado',
        'Agendamento "' || NEW.titulo || '" foi criado para ' || NEW.data_inicio::date,
        NEW.id,
        'agendamento',
        'normal',
        json_build_object(
            'titulo', NEW.titulo,
            'data_inicio', NEW.data_inicio,
            'cliente_id', NEW.cliente_id
        )
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix proposta triggers to use auth.uid() if user_id is not available
CREATE OR REPLACE FUNCTION trigger_proposta_criada()
RETURNS TRIGGER AS $$
BEGIN
    -- Use NEW.user_id if available, otherwise use auth.uid()
    INSERT INTO notificacoes (
        user_id, tipo, categoria, titulo, descricao,
        referencia_id, referencia_tipo, prioridade,
        dados_extras
    ) VALUES (
        COALESCE(NEW.user_id, auth.uid()),
        'proposta_criada',
        'proposta',
        'Nova Proposta Criada',
        'Proposta "' || NEW.titulo || '" foi criada',
        NEW.id,
        'proposta',
        'normal',
        json_build_object(
            'titulo', NEW.titulo,
            'valor', NEW.valor_total,
            'cliente_id', NEW.cliente_id
        )
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
            COALESCE(NEW.user_id, auth.uid()),
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
$$ LANGUAGE plpgsql SECURITY DEFINER;
