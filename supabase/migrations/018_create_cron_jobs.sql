-- Habilitar extensão pg_cron se não estiver habilitada
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Função para expirar agendamentos
CREATE OR REPLACE FUNCTION expirar_agendamentos()
RETURNS void AS $$
DECLARE
    rec RECORD;
BEGIN
    -- Buscar agendamentos que expiraram (data < hoje) e ainda não estão expirados
    FOR rec IN 
        SELECT a.*, c.nome as cliente_nome 
        FROM agendamentos a
        LEFT JOIN clientes c ON a.cliente_id = c.id
        WHERE a.data_inicio::date < CURRENT_DATE
        AND a.status != 'expirado'
    LOOP
        -- Atualizar status para expirado
        UPDATE agendamentos 
        SET status = 'expirado', 
            updated_at = NOW()
        WHERE id = rec.id;
        
        -- Criar notificação de expiração
        INSERT INTO notificacoes (
            user_id, tipo, categoria, titulo, descricao,
            referencia_id, referencia_tipo, prioridade,
            dados_extras
        ) VALUES (
            rec.user_id,
            'agendamento_expirado',
            'agendamento',
            'Agendamento Expirado',
            'Agendamento com ' || COALESCE(rec.cliente_nome, 'Cliente') || ' expirou em ' || rec.data_inicio::date,
            rec.id,
            'agendamento',
            'alta',
            json_build_object(
                'cliente_nome', COALESCE(rec.cliente_nome, 'Cliente'),
                'data_inicio', rec.data_inicio,
                'tipo_agendamento', rec.tipo,
                'status_anterior', rec.status
            )
        );
    END LOOP;
    
    RAISE NOTICE 'Processo de expiração de agendamentos executado em %', NOW();
END;
$$ LANGUAGE plpgsql;

-- Função para expirar propostas enviadas há mais de 3 dias
CREATE OR REPLACE FUNCTION expirar_propostas_enviadas()
RETURNS void AS $$
DECLARE
    rec RECORD;
BEGIN
    -- Buscar propostas enviadas há mais de 3 dias que ainda não venceram
    FOR rec IN 
        SELECT p.*, c.nome as cliente_nome 
        FROM propostas p
        LEFT JOIN clientes c ON p.cliente_id = c.id
        WHERE p.categoria = 'enviada'
        AND p.updated_at < (NOW() - INTERVAL '3 days')
        AND p.categoria != 'vencida'
    LOOP
        -- Atualizar status para vencida
        UPDATE propostas 
        SET categoria = 'vencida', 
            updated_at = NOW()
        WHERE id = rec.id;
        
        -- Criar notificação de expiração
        INSERT INTO notificacoes (
            user_id, tipo, categoria, titulo, descricao,
            referencia_id, referencia_tipo, prioridade,
            dados_extras
        ) VALUES (
            rec.user_id,
            'proposta_expirada',
            'proposta',
            'Proposta Vencida',
            'Proposta "' || rec.titulo || '" para ' || COALESCE(rec.cliente_nome, 'Cliente') || ' venceu após 3 dias',
            rec.id,
            'proposta',
            'alta',
            json_build_object(
                'titulo', rec.titulo,
                'cliente_nome', COALESCE(rec.cliente_nome, 'Cliente'),
                'valor', rec.valor_total,
                'data_envio', rec.updated_at,
                'status_anterior', 'enviada'
            )
        );
    END LOOP;
    
    RAISE NOTICE 'Processo de expiração de propostas executado em %', NOW();
END;
$$ LANGUAGE plpgsql;

-- Função combinada para executar todas as verificações
CREATE OR REPLACE FUNCTION executar_verificacoes_automaticas()
RETURNS void AS $$
BEGIN
    -- Executar verificações de agendamentos
    PERFORM verificar_agendamentos_hoje();
    PERFORM expirar_agendamentos();
    
    -- Executar verificações de propostas
    PERFORM expirar_propostas_enviadas();
    
    -- Limpar notificações expiradas
    PERFORM cleanup_expired_notifications();
    
    RAISE NOTICE 'Todas as verificações automáticas executadas em %', NOW();
END;
$$ LANGUAGE plpgsql;

-- Agendar job para executar verificações diárias às 6:00 AM
SELECT cron.schedule(
    'verificacoes-diarias',
    '0 6 * * *',
    'SELECT executar_verificacoes_automaticas();'
);

-- Agendar job para verificar agendamentos de hoje às 8:00 AM
SELECT cron.schedule(
    'agendamentos-hoje',
    '0 8 * * *',
    'SELECT verificar_agendamentos_hoje();'
);

-- Agendar job para limpar notificações expiradas às 2:00 AM
SELECT cron.schedule(
    'limpeza-notificacoes',
    '0 2 * * *',
    'SELECT cleanup_expired_notifications();'
);

-- Agendar job para verificar propostas vencidas a cada 6 horas
SELECT cron.schedule(
    'verificar-propostas-vencidas',
    '0 */6 * * *',
    'SELECT expirar_propostas_enviadas();'
);

-- Função para listar jobs agendados (útil para debug)
CREATE OR REPLACE FUNCTION listar_cron_jobs()
RETURNS TABLE(
    jobid bigint,
    schedule text,
    command text,
    nodename text,
    nodeport integer,
    database text,
    username text,
    active boolean,
    jobname text
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        j.jobid,
        j.schedule,
        j.command,
        j.nodename,
        j.nodeport,
        j.database,
        j.username,
        j.active,
        j.jobname
    FROM cron.job j
    WHERE j.database = current_database();
END;
$$ LANGUAGE plpgsql;

-- Função para remover todos os jobs (útil para reset)
CREATE OR REPLACE FUNCTION remover_todos_cron_jobs()
RETURNS void AS $$
DECLARE
    job_record RECORD;
BEGIN
    FOR job_record IN 
        SELECT jobid FROM cron.job WHERE database = current_database()
    LOOP
        PERFORM cron.unschedule(job_record.jobid);
    END LOOP;
    
    RAISE NOTICE 'Todos os cron jobs foram removidos';
END;
$$ LANGUAGE plpgsql;

-- Comentários sobre os jobs criados:
-- 1. verificacoes-diarias: Executa todas as verificações às 6:00 AM
-- 2. agendamentos-hoje: Notifica sobre agendamentos do dia às 8:00 AM  
-- 3. limpeza-notificacoes: Remove notificações antigas às 2:00 AM
-- 4. verificar-propostas-vencidas: Verifica propostas vencidas a cada 6 horas

-- Para visualizar os jobs: SELECT * FROM listar_cron_jobs();
-- Para remover todos os jobs: SELECT remover_todos_cron_jobs();
