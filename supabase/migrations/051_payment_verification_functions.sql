-- =====================================================
-- NANOSYNC CRM - FUNÇÕES DE VERIFICAÇÃO DE PAGAMENTO
-- Migration 051: Webhook e Polling para verificação em tempo real
-- =====================================================

-- 1. FUNÇÃO PARA PROCESSAR WEBHOOK DO MERCADO PAGO
CREATE OR REPLACE FUNCTION processar_webhook_pagamento(
    p_webhook_data JSONB,
    p_signature TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_payment_id TEXT;
    v_event_type TEXT;
    v_webhook_id UUID;
    v_pagamento_record RECORD;
    v_result JSONB;
BEGIN
    -- Extrair dados do webhook
    v_event_type := p_webhook_data->>'type';
    v_payment_id := p_webhook_data->'data'->>'id';
    
    -- Log do webhook recebido
    INSERT INTO mercadopago_webhooks (
        event_type, 
        resource_id, 
        webhook_data, 
        signature,
        processed_at
    ) VALUES (
        v_event_type,
        v_payment_id,
        p_webhook_data,
        p_signature,
        NOW()
    ) RETURNING id INTO v_webhook_id;
    
    -- Processar apenas eventos de pagamento
    IF v_event_type NOT IN ('payment', 'subscription_authorized_payment') THEN
        RETURN jsonb_build_object(
            'success', true,
            'message', 'Evento não processado: ' || v_event_type,
            'webhook_id', v_webhook_id
        );
    END IF;
    
    -- Verificar se pagamento existe
    SELECT * INTO v_pagamento_record
    FROM pagamentos 
    WHERE mercadopago_payment_id = v_payment_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Pagamento não encontrado: ' || v_payment_id,
            'webhook_id', v_webhook_id
        );
    END IF;
    
    -- Marcar webhook como processado
    UPDATE mercadopago_webhooks 
    SET processed_at = NOW()
    WHERE id = v_webhook_id;
    
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Webhook processado com sucesso',
        'payment_id', v_payment_id,
        'webhook_id', v_webhook_id
    );
    
EXCEPTION WHEN OTHERS THEN
    -- Log do erro
    UPDATE mercadopago_webhooks 
    SET 
        error_message = SQLERRM,
        processed_at = NOW()
    WHERE id = v_webhook_id;
    
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM,
        'webhook_id', v_webhook_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. FUNÇÃO PARA ATUALIZAR STATUS DO PAGAMENTO E LIBERAR ACESSO
CREATE OR REPLACE FUNCTION atualizar_pagamento_e_liberar_acesso(
    p_payment_id TEXT,
    p_new_status TEXT,
    p_status_detail TEXT DEFAULT NULL,
    p_date_approved TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_response_data JSONB DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_pagamento_record RECORD;
    v_user_id UUID;
    v_old_status TEXT;
BEGIN
    -- Buscar pagamento atual
    SELECT * INTO v_pagamento_record
    FROM pagamentos 
    WHERE mercadopago_payment_id = p_payment_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Pagamento não encontrado: %', p_payment_id;
    END IF;
    
    v_old_status := v_pagamento_record.status;
    v_user_id := v_pagamento_record.user_id;
    
    -- Atualizar status do pagamento
    UPDATE pagamentos SET
        status = p_new_status,
        status_detail = COALESCE(p_status_detail, status_detail),
        date_approved = COALESCE(p_date_approved, date_approved),
        response_data = COALESCE(p_response_data, response_data),
        updated_at = NOW()
    WHERE mercadopago_payment_id = p_payment_id;
    
    -- Log da alteração
    INSERT INTO logs_acesso (
        user_id,
        acao,
        detalhes,
        ip_address
    ) VALUES (
        v_user_id,
        'payment_status_updated',
        jsonb_build_object(
            'payment_id', p_payment_id,
            'old_status', v_old_status,
            'new_status', p_new_status,
            'status_detail', p_status_detail
        ),
        '127.0.0.1'
    );
    
    -- Se pagamento foi aprovado, ativar plano
    IF p_new_status = 'approved' AND v_old_status != 'approved' THEN
        PERFORM ativar_plano_usuario(v_user_id, v_pagamento_record.plano_id);
        
        -- Log de ativação
        INSERT INTO logs_acesso (
            user_id,
            acao,
            detalhes
        ) VALUES (
            v_user_id,
            'plan_activated',
            jsonb_build_object(
                'payment_id', p_payment_id,
                'plano_id', v_pagamento_record.plano_id,
                'activated_by', 'payment_approval'
            )
        );
    END IF;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. FUNÇÃO PARA VERIFICAÇÃO MANUAL DE PAGAMENTO (POLLING)
CREATE OR REPLACE FUNCTION verificar_pagamento_manual(
    p_payment_id TEXT,
    p_user_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_pagamento_record RECORD;
    v_can_check BOOLEAN := false;
BEGIN
    -- Buscar pagamento
    SELECT * INTO v_pagamento_record
    FROM pagamentos 
    WHERE mercadopago_payment_id = p_payment_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Pagamento não encontrado'
        );
    END IF;
    
    -- Verificar permissão (usuário dono ou admin)
    IF p_user_id IS NULL OR p_user_id = v_pagamento_record.user_id THEN
        v_can_check := true;
    END IF;
    
    IF NOT v_can_check THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Sem permissão para verificar este pagamento'
        );
    END IF;
    
    -- Log da verificação manual
    INSERT INTO logs_acesso (
        user_id,
        acao,
        detalhes
    ) VALUES (
        COALESCE(p_user_id, v_pagamento_record.user_id),
        'manual_payment_check',
        jsonb_build_object(
            'payment_id', p_payment_id,
            'current_status', v_pagamento_record.status
        )
    );
    
    -- Retornar dados atuais (a verificação externa será feita no backend)
    RETURN jsonb_build_object(
        'success', true,
        'payment_id', p_payment_id,
        'current_status', v_pagamento_record.status,
        'status_detail', v_pagamento_record.status_detail,
        'date_created', v_pagamento_record.created_at,
        'date_approved', v_pagamento_record.date_approved,
        'valor', v_pagamento_record.valor,
        'plano_id', v_pagamento_record.plano_id,
        'message', 'Verificação iniciada - aguarde atualização'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. FUNÇÃO PARA BUSCAR PAGAMENTOS PENDENTES (PARA CRON JOB)
CREATE OR REPLACE FUNCTION buscar_pagamentos_pendentes_verificacao()
RETURNS TABLE (
    payment_id TEXT,
    user_id UUID,
    created_at TIMESTAMP WITH TIME ZONE,
    minutes_pending INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.mercadopago_payment_id,
        p.user_id,
        p.created_at,
        EXTRACT(EPOCH FROM (NOW() - p.created_at))::INTEGER / 60 as minutes_pending
    FROM pagamentos p
    WHERE p.status IN ('pending', 'in_process')
    AND p.created_at > NOW() - INTERVAL '24 hours'  -- Apenas últimas 24h
    AND p.mercadopago_payment_id IS NOT NULL
    ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. FUNÇÃO PARA NOTIFICAR USUÁRIO SOBRE STATUS DO PAGAMENTO
CREATE OR REPLACE FUNCTION notificar_status_pagamento(
    p_user_id UUID,
    p_payment_id TEXT,
    p_status TEXT,
    p_message TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Inserir notificação (assumindo que existe tabela de notificações)
    INSERT INTO logs_acesso (
        user_id,
        acao,
        detalhes
    ) VALUES (
        p_user_id,
        'payment_notification',
        jsonb_build_object(
            'payment_id', p_payment_id,
            'status', p_status,
            'message', COALESCE(p_message, 'Status do pagamento atualizado'),
            'notification_type', 'payment_update'
        )
    );
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. FUNÇÃO PARA VALIDAR ASSINATURA DO WEBHOOK (SEGURANÇA)
CREATE OR REPLACE FUNCTION validar_assinatura_webhook(
    p_signature TEXT,
    p_webhook_data JSONB,
    p_secret TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_expected_signature TEXT;
BEGIN
    -- Implementar validação HMAC SHA256
    -- Esta é uma implementação simplificada
    -- No ambiente real, use a extensão pgcrypto
    
    IF p_signature IS NULL OR p_secret IS NULL THEN
        RETURN false;
    END IF;
    
    -- Por enquanto, apenas log da tentativa
    INSERT INTO logs_acesso (
        acao,
        detalhes
    ) VALUES (
        'webhook_signature_validation',
        jsonb_build_object(
            'signature_provided', p_signature IS NOT NULL,
            'secret_provided', p_secret IS NOT NULL,
            'validation_result', 'pending_implementation'
        )
    );
    
    RETURN true; -- Temporário até implementar pgcrypto
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. VIEW PARA MONITORAMENTO DE PAGAMENTOS
CREATE OR REPLACE VIEW vw_pagamentos_status AS
SELECT 
    p.id,
    p.mercadopago_payment_id,
    p.user_id,
    pr.email as user_email,
    p.status,
    p.status_detail,
    p.valor,
    p.plano_id,
    p.payment_method_id,
    p.created_at,
    p.date_approved,
    p.updated_at,
    CASE 
        WHEN p.status = 'approved' THEN 'Aprovado'
        WHEN p.status = 'pending' THEN 'Pendente'
        WHEN p.status = 'rejected' THEN 'Rejeitado'
        WHEN p.status = 'cancelled' THEN 'Cancelado'
        ELSE p.status
    END as status_descricao,
    EXTRACT(EPOCH FROM (NOW() - p.created_at))::INTEGER / 60 as minutes_since_creation,
    -- Verificar se precisa de verificação manual
    CASE 
        WHEN p.status IN ('pending', 'in_process') 
        AND p.created_at < NOW() - INTERVAL '10 minutes'
        THEN true
        ELSE false
    END as needs_manual_check
FROM pagamentos p
LEFT JOIN profiles pr ON pr.id = p.user_id
ORDER BY p.created_at DESC;

-- 8. ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_pagamentos_status_pending ON pagamentos(status) WHERE status IN ('pending', 'in_process');
CREATE INDEX IF NOT EXISTS idx_pagamentos_created_recent ON pagamentos(created_at);
CREATE INDEX IF NOT EXISTS idx_webhooks_processed ON mercadopago_webhooks(processed_at, event_type);

-- 9. CRON JOB PARA VERIFICAÇÃO AUTOMÁTICA DE PAGAMENTOS PENDENTES
-- (Executar a cada 5 minutos)
SELECT cron.schedule(
    'check-pending-payments',
    '*/5 * * * *',
    $$
    -- Esta função será chamada pelo backend para verificar pagamentos pendentes
    SELECT payment_id, user_id, minutes_pending 
    FROM buscar_pagamentos_pendentes_verificacao()
    WHERE minutes_pending BETWEEN 5 AND 1440; -- Entre 5 minutos e 24 horas
    $$
);

-- 10. GRANTS E PERMISSÕES
GRANT EXECUTE ON FUNCTION processar_webhook_pagamento TO authenticated;
GRANT EXECUTE ON FUNCTION verificar_pagamento_manual TO authenticated;
GRANT EXECUTE ON FUNCTION buscar_pagamentos_pendentes_verificacao TO authenticated;
GRANT SELECT ON vw_pagamentos_status TO authenticated;

-- RLS para a view
ALTER VIEW vw_pagamentos_status SET (security_barrier = true);

-- 11. COMENTÁRIOS
COMMENT ON FUNCTION processar_webhook_pagamento IS 'Processa webhooks do Mercado Pago em tempo real';
COMMENT ON FUNCTION atualizar_pagamento_e_liberar_acesso IS 'Atualiza status do pagamento e ativa plano se aprovado';
COMMENT ON FUNCTION verificar_pagamento_manual IS 'Permite verificação manual de pagamento via polling';
COMMENT ON FUNCTION buscar_pagamentos_pendentes_verificacao IS 'Lista pagamentos pendentes para verificação automática';
COMMENT ON VIEW vw_pagamentos_status IS 'View para monitoramento de status de pagamentos com informações úteis';
