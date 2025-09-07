-- =====================================================
-- NANOSYNC CRM - CAMPOS PIX E CARTÃO MERCADO PAGO
-- Migration 049: Campos específicos para PIX e Cartão de Crédito
-- =====================================================

-- 1. ADICIONAR CAMPOS PIX NA TABELA PAGAMENTOS
ALTER TABLE pagamentos 
-- Campos PIX específicos
ADD COLUMN IF NOT EXISTS qr_code_base64 TEXT,
ADD COLUMN IF NOT EXISTS qr_code TEXT,
ADD COLUMN IF NOT EXISTS ticket_url TEXT,
ADD COLUMN IF NOT EXISTS date_of_expiration TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS point_of_interaction JSONB,

-- Campos Cartão específicos
ADD COLUMN IF NOT EXISTS token TEXT,
ADD COLUMN IF NOT EXISTS issuer_id TEXT,
ADD COLUMN IF NOT EXISTS first_six_digits TEXT,
ADD COLUMN IF NOT EXISTS last_four_digits TEXT,
ADD COLUMN IF NOT EXISTS card_holder_name TEXT,

-- Transaction details (comum para ambos)
ADD COLUMN IF NOT EXISTS net_received_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS total_paid_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS overpaid_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS installment_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS financial_institution TEXT;

-- 2. ATUALIZAR CONSTRAINTS PARA PAYMENT_METHOD_ID
ALTER TABLE pagamentos 
DROP CONSTRAINT IF EXISTS pagamentos_payment_method_id_check;

ALTER TABLE pagamentos 
ADD CONSTRAINT pagamentos_payment_method_id_check 
CHECK (payment_method_id IN ('pix', 'visa', 'master', 'amex', 'elo', 'hipercard', 'diners', 'discover'));

-- 3. ATUALIZAR CONSTRAINTS PARA PAYMENT_TYPE_ID
ALTER TABLE pagamentos 
DROP CONSTRAINT IF EXISTS pagamentos_payment_type_id_check;

ALTER TABLE pagamentos 
ADD CONSTRAINT pagamentos_payment_type_id_check 
CHECK (payment_type_id IN ('account_money', 'ticket', 'bank_transfer', 'atm', 'credit_card', 'debit_card', 'prepaid_card'));

-- 4. FUNÇÃO PARA CRIAR PAGAMENTO PIX
CREATE OR REPLACE FUNCTION criar_pagamento_pix(
    p_user_id UUID,
    p_valor DECIMAL(10,2),
    p_descricao TEXT,
    p_plano_id TEXT,
    p_payer_email TEXT,
    p_payer_identification_type TEXT DEFAULT 'CPF',
    p_payer_identification_number TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_payment_id UUID;
    v_external_reference TEXT;
BEGIN
    -- Gerar referência externa única
    v_external_reference := 'PIX_' || p_user_id || '_' || EXTRACT(EPOCH FROM NOW())::BIGINT;
    
    -- Inserir pagamento
    INSERT INTO pagamentos (
        user_id,
        valor,
        descricao,
        plano_id,
        payment_method_id,
        payment_type_id,
        payer_email,
        payer_identification_type,
        payer_identification_number,
        external_reference,
        status
    ) VALUES (
        p_user_id,
        p_valor,
        p_descricao,
        p_plano_id,
        'pix',
        'bank_transfer',
        p_payer_email,
        p_payer_identification_type,
        p_payer_identification_number,
        v_external_reference,
        'pending'
    ) RETURNING id INTO v_payment_id;
    
    -- Log da criação
    INSERT INTO logs_acesso (user_id, acao, detalhes) VALUES (
        p_user_id,
        'pix_payment_created',
        jsonb_build_object(
            'payment_id', v_payment_id,
            'valor', p_valor,
            'plano_id', p_plano_id
        )
    );
    
    RETURN v_payment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. FUNÇÃO PARA CRIAR PAGAMENTO CARTÃO
CREATE OR REPLACE FUNCTION criar_pagamento_cartao(
    p_user_id UUID,
    p_valor DECIMAL(10,2),
    p_descricao TEXT,
    p_plano_id TEXT,
    p_token TEXT,
    p_payment_method_id TEXT,
    p_issuer_id TEXT,
    p_payer_email TEXT,
    p_installments INTEGER DEFAULT 1,
    p_payer_identification_type TEXT DEFAULT 'CPF',
    p_payer_identification_number TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_payment_id UUID;
    v_external_reference TEXT;
    v_payment_type_id TEXT;
BEGIN
    -- Determinar tipo de pagamento baseado no método
    v_payment_type_id := CASE 
        WHEN p_payment_method_id IN ('visa', 'master', 'amex', 'elo', 'hipercard', 'diners', 'discover') 
        THEN 'credit_card'
        ELSE 'debit_card'
    END;
    
    -- Gerar referência externa única
    v_external_reference := 'CARD_' || p_user_id || '_' || EXTRACT(EPOCH FROM NOW())::BIGINT;
    
    -- Inserir pagamento
    INSERT INTO pagamentos (
        user_id,
        valor,
        descricao,
        plano_id,
        payment_method_id,
        payment_type_id,
        token,
        issuer_id,
        payer_email,
        payer_identification_type,
        payer_identification_number,
        external_reference,
        status
    ) VALUES (
        p_user_id,
        p_valor,
        p_descricao,
        p_plano_id,
        p_payment_method_id,
        v_payment_type_id,
        p_token,
        p_issuer_id,
        p_payer_email,
        p_payer_identification_type,
        p_payer_identification_number,
        v_external_reference,
        'pending'
    ) RETURNING id INTO v_payment_id;
    
    -- Log da criação
    INSERT INTO logs_acesso (user_id, acao, detalhes) VALUES (
        p_user_id,
        'card_payment_created',
        jsonb_build_object(
            'payment_id', v_payment_id,
            'valor', p_valor,
            'plano_id', p_plano_id,
            'payment_method', p_payment_method_id,
            'installments', p_installments
        )
    );
    
    RETURN v_payment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. FUNÇÃO PARA PROCESSAR RESPOSTA PIX DO MERCADO PAGO
CREATE OR REPLACE FUNCTION processar_resposta_pix(
    p_payment_id TEXT,
    p_response JSONB
)
RETURNS BOOLEAN AS $$
DECLARE
    v_point_of_interaction JSONB;
    v_transaction_data JSONB;
BEGIN
    -- Extrair dados do PIX
    v_point_of_interaction := p_response->'point_of_interaction';
    v_transaction_data := v_point_of_interaction->'transaction_data';
    
    -- Atualizar pagamento com dados PIX
    UPDATE pagamentos SET
        mercadopago_payment_id = p_response->>'id',
        status = p_response->>'status',
        status_detail = p_response->>'status_detail',
        qr_code_base64 = v_transaction_data->>'qr_code_base64',
        qr_code = v_transaction_data->>'qr_code',
        ticket_url = v_transaction_data->>'ticket_url',
        point_of_interaction = v_point_of_interaction,
        date_of_expiration = CASE 
            WHEN p_response->>'date_of_expiration' IS NOT NULL 
            THEN (p_response->>'date_of_expiration')::TIMESTAMP WITH TIME ZONE
            ELSE NULL 
        END,
        net_received_amount = COALESCE((p_response->'transaction_details'->>'net_received_amount')::DECIMAL, 0),
        total_paid_amount = COALESCE((p_response->'transaction_details'->>'total_paid_amount')::DECIMAL, 0),
        overpaid_amount = COALESCE((p_response->'transaction_details'->>'overpaid_amount')::DECIMAL, 0),
        response_data = p_response,
        updated_at = NOW()
    WHERE mercadopago_payment_id = p_payment_id OR id::TEXT = p_payment_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. FUNÇÃO PARA PROCESSAR RESPOSTA CARTÃO DO MERCADO PAGO
CREATE OR REPLACE FUNCTION processar_resposta_cartao(
    p_payment_id TEXT,
    p_response JSONB
)
RETURNS BOOLEAN AS $$
DECLARE
    v_card JSONB;
BEGIN
    -- Extrair dados do cartão
    v_card := p_response->'card';
    
    -- Atualizar pagamento com dados do cartão
    UPDATE pagamentos SET
        mercadopago_payment_id = p_response->>'id',
        status = p_response->>'status',
        status_detail = p_response->>'status_detail',
        first_six_digits = v_card->>'first_six_digits',
        last_four_digits = v_card->>'last_four_digits',
        card_holder_name = v_card->'cardholder'->>'name',
        net_received_amount = COALESCE((p_response->'transaction_details'->>'net_received_amount')::DECIMAL, 0),
        total_paid_amount = COALESCE((p_response->'transaction_details'->>'total_paid_amount')::DECIMAL, 0),
        installment_amount = COALESCE((p_response->'transaction_details'->>'installment_amount')::DECIMAL, 0),
        financial_institution = p_response->'transaction_details'->>'financial_institution',
        date_approved = CASE 
            WHEN p_response->>'date_approved' IS NOT NULL 
            THEN (p_response->>'date_approved')::TIMESTAMP WITH TIME ZONE
            ELSE NULL 
        END,
        response_data = p_response,
        updated_at = NOW()
    WHERE mercadopago_payment_id = p_payment_id OR id::TEXT = p_payment_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. FUNÇÃO PARA BUSCAR DADOS PIX PARA EXIBIÇÃO
CREATE OR REPLACE FUNCTION buscar_dados_pix(p_payment_id UUID)
RETURNS TABLE (
    payment_id UUID,
    mercadopago_payment_id TEXT,
    status TEXT,
    valor DECIMAL(10,2),
    qr_code_base64 TEXT,
    qr_code TEXT,
    ticket_url TEXT,
    date_of_expiration TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.mercadopago_payment_id,
        p.status,
        p.valor,
        p.qr_code_base64,
        p.qr_code,
        p.ticket_url,
        p.date_of_expiration,
        p.created_at
    FROM pagamentos p
    WHERE p.id = p_payment_id
    AND p.payment_method_id = 'pix';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. FUNÇÃO PARA BUSCAR DADOS CARTÃO PARA EXIBIÇÃO
CREATE OR REPLACE FUNCTION buscar_dados_cartao(p_payment_id UUID)
RETURNS TABLE (
    payment_id UUID,
    mercadopago_payment_id TEXT,
    status TEXT,
    status_detail TEXT,
    valor DECIMAL(10,2),
    payment_method_id TEXT,
    first_six_digits TEXT,
    last_four_digits TEXT,
    installment_amount DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE,
    date_approved TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.mercadopago_payment_id,
        p.status,
        p.status_detail,
        p.valor,
        p.payment_method_id,
        p.first_six_digits,
        p.last_four_digits,
        p.installment_amount,
        p.created_at,
        p.date_approved
    FROM pagamentos p
    WHERE p.id = p_payment_id
    AND p.payment_method_id != 'pix';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. ATUALIZAR FUNÇÃO DE PROCESSAMENTO DE WEBHOOK
CREATE OR REPLACE FUNCTION processar_webhook_mercadopago(
    p_event_type TEXT,
    p_resource_id TEXT,
    p_webhook_data JSONB,
    p_signature TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_webhook_id UUID;
    v_pagamento RECORD;
    v_result JSONB;
BEGIN
    -- Inserir log do webhook
    INSERT INTO mercadopago_webhooks (
        event_type, resource_id, webhook_data, signature
    ) VALUES (
        p_event_type, p_resource_id, p_webhook_data, p_signature
    ) RETURNING id INTO v_webhook_id;
    
    -- Processar apenas eventos de pagamento
    IF p_event_type = 'payment' THEN
        -- Buscar pagamento existente
        SELECT * INTO v_pagamento
        FROM pagamentos 
        WHERE mercadopago_payment_id = p_resource_id;
        
        IF FOUND THEN
            -- Determinar se é PIX ou Cartão e processar adequadamente
            IF v_pagamento.payment_method_id = 'pix' THEN
                -- Processar como PIX (dados serão buscados via API externa)
                PERFORM processar_resposta_pix(p_resource_id, '{}');
            ELSE
                -- Processar como Cartão (dados serão buscados via API externa)
                PERFORM processar_resposta_cartao(p_resource_id, '{}');
            END IF;
            
            -- Se pagamento foi aprovado, ativar plano
            IF (p_webhook_data->'data'->>'status') = 'approved' THEN
                PERFORM processar_pagamento_aprovado(p_resource_id);
            END IF;
        END IF;
        
        -- Marcar webhook como processado
        UPDATE mercadopago_webhooks 
        SET processed_at = NOW()
        WHERE id = v_webhook_id;
        
        v_result := jsonb_build_object(
            'success', true,
            'webhook_id', v_webhook_id,
            'message', 'Webhook de pagamento processado'
        );
    ELSE
        v_result := jsonb_build_object(
            'success', true,
            'webhook_id', v_webhook_id,
            'message', 'Evento não processado: ' || p_event_type
        );
    END IF;
    
    RETURN v_result;
    
EXCEPTION WHEN OTHERS THEN
    -- Log do erro
    UPDATE mercadopago_webhooks 
    SET error_message = SQLERRM
    WHERE id = v_webhook_id;
    
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM,
        'webhook_id', v_webhook_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. ÍNDICES ESPECÍFICOS PARA PIX E CARTÃO
CREATE INDEX IF NOT EXISTS idx_pagamentos_payment_method ON pagamentos(payment_method_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_qr_code ON pagamentos(qr_code) WHERE qr_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pagamentos_token ON pagamentos(token) WHERE token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pagamentos_date_expiration ON pagamentos(date_of_expiration) WHERE date_of_expiration IS NOT NULL;

-- 12. GRANTS E PERMISSÕES
GRANT EXECUTE ON FUNCTION criar_pagamento_pix TO authenticated;
GRANT EXECUTE ON FUNCTION criar_pagamento_cartao TO authenticated;
GRANT EXECUTE ON FUNCTION processar_resposta_pix TO authenticated;
GRANT EXECUTE ON FUNCTION processar_resposta_cartao TO authenticated;
GRANT EXECUTE ON FUNCTION buscar_dados_pix TO authenticated;
GRANT EXECUTE ON FUNCTION buscar_dados_cartao TO authenticated;

-- 13. COMENTÁRIOS PARA DOCUMENTAÇÃO
COMMENT ON COLUMN pagamentos.qr_code_base64 IS 'QR Code PIX em formato base64 para exibição';
COMMENT ON COLUMN pagamentos.qr_code IS 'Código PIX para copia e cola';
COMMENT ON COLUMN pagamentos.ticket_url IS 'URL da página de pagamento PIX do Mercado Pago';
COMMENT ON COLUMN pagamentos.date_of_expiration IS 'Data de expiração do pagamento PIX';
COMMENT ON COLUMN pagamentos.point_of_interaction IS 'Dados completos de interação PIX (JSON)';

COMMENT ON COLUMN pagamentos.token IS 'Token do cartão gerado pelo MercadoPago.js';
COMMENT ON COLUMN pagamentos.issuer_id IS 'ID do emissor do cartão';
COMMENT ON COLUMN pagamentos.first_six_digits IS 'Primeiros 6 dígitos do cartão (para identificação)';
COMMENT ON COLUMN pagamentos.last_four_digits IS 'Últimos 4 dígitos do cartão (para exibição)';
COMMENT ON COLUMN pagamentos.card_holder_name IS 'Nome do portador do cartão';

COMMENT ON COLUMN pagamentos.net_received_amount IS 'Valor líquido recebido (após taxas)';
COMMENT ON COLUMN pagamentos.total_paid_amount IS 'Valor total pago pelo cliente';
COMMENT ON COLUMN pagamentos.overpaid_amount IS 'Valor pago a mais (PIX)';
COMMENT ON COLUMN pagamentos.installment_amount IS 'Valor de cada parcela (cartão)';

COMMENT ON FUNCTION criar_pagamento_pix IS 'Cria novo pagamento PIX no sistema';
COMMENT ON FUNCTION criar_pagamento_cartao IS 'Cria novo pagamento com cartão no sistema';
COMMENT ON FUNCTION processar_resposta_pix IS 'Processa resposta da API do Mercado Pago para PIX';
COMMENT ON FUNCTION processar_resposta_cartao IS 'Processa resposta da API do Mercado Pago para cartão';
COMMENT ON FUNCTION buscar_dados_pix IS 'Busca dados de pagamento PIX para exibição ao usuário';
COMMENT ON FUNCTION buscar_dados_cartao IS 'Busca dados de pagamento cartão para exibição ao usuário';
