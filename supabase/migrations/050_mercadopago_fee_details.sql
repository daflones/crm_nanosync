-- =====================================================
-- NANOSYNC CRM - CAMPOS FEE_DETAILS E PAYMENT_ID DAS TAXAS
-- Migration 050: Campos de taxas baseados na resposta real do Mercado Pago
-- =====================================================

-- 1. ADICIONAR CAMPOS DE TAXAS NA TABELA PAGAMENTOS
ALTER TABLE pagamentos 
-- Campos de Fee Details
ADD COLUMN IF NOT EXISTS fee_details JSONB,
ADD COLUMN IF NOT EXISTS fee_payment_id TEXT, -- payment_id específico das taxas
ADD COLUMN IF NOT EXISTS mercadopago_fee DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS application_fee DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS processing_fee DECIMAL(10,2),

-- Campos adicionais da resposta completa
ADD COLUMN IF NOT EXISTS money_release_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS operation_type TEXT,
ADD COLUMN IF NOT EXISTS order_id TEXT,
ADD COLUMN IF NOT EXISTS currency_id TEXT DEFAULT 'BRL',
ADD COLUMN IF NOT EXISTS live_mode BOOLEAN DEFAULT true,

-- Campos de captura (para pagamentos autorizados)
ADD COLUMN IF NOT EXISTS captured BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS authorization_code TEXT,

-- Campos de refund
ADD COLUMN IF NOT EXISTS refunded_amount DECIMAL(10,2) DEFAULT 0,

-- Campos de chargeback
ADD COLUMN IF NOT EXISTS charges_details JSONB,

-- Campos de split payment (marketplace)
ADD COLUMN IF NOT EXISTS marketplace_fee DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS differential_pricing_id TEXT;

-- 2. TABELA ESPECÍFICA PARA FEE_DETAILS (Para análise detalhada)
CREATE TABLE IF NOT EXISTS pagamento_taxas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pagamento_id UUID NOT NULL REFERENCES pagamentos(id) ON DELETE CASCADE,
    
    -- Identificadores das taxas
    fee_payment_id TEXT, -- payment_id específico da taxa
    fee_type TEXT, -- tipo da taxa (mercadopago_fee, application_fee, etc)
    
    -- Valores
    amount DECIMAL(10,2) NOT NULL,
    currency_id TEXT DEFAULT 'BRL',
    
    -- Detalhes da taxa
    fee_payer TEXT, -- quem paga a taxa (collector, payer)
    description TEXT,
    
    -- Metadados
    fee_details JSONB,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. FUNÇÃO PARA PROCESSAR FEE_DETAILS
CREATE OR REPLACE FUNCTION processar_fee_details(
    p_payment_id TEXT,
    p_fee_details JSONB
)
RETURNS BOOLEAN AS $$
DECLARE
    v_pagamento_id UUID;
    v_fee_record JSONB;
    v_total_mercadopago_fee DECIMAL(10,2) := 0;
    v_total_application_fee DECIMAL(10,2) := 0;
    v_fee_payment_id TEXT;
BEGIN
    -- Buscar ID interno do pagamento
    SELECT id INTO v_pagamento_id 
    FROM pagamentos 
    WHERE mercadopago_payment_id = p_payment_id;
    
    IF NOT FOUND THEN
        RETURN false;
    END IF;
    
    -- Limpar taxas existentes
    DELETE FROM pagamento_taxas WHERE pagamento_id = v_pagamento_id;
    
    -- Processar cada taxa no array fee_details
    FOR v_fee_record IN SELECT * FROM jsonb_array_elements(p_fee_details)
    LOOP
        -- Extrair payment_id da taxa se existir
        v_fee_payment_id := v_fee_record->>'payment_id';
        
        -- Inserir taxa detalhada
        INSERT INTO pagamento_taxas (
            pagamento_id, fee_payment_id, fee_type, amount, 
            fee_payer, description, fee_details
        ) VALUES (
            v_pagamento_id,
            v_fee_payment_id,
            v_fee_record->>'type',
            COALESCE((v_fee_record->>'amount')::DECIMAL, 0),
            v_fee_record->>'fee_payer',
            COALESCE(v_fee_record->>'description', ''),
            v_fee_record
        );
        
        -- Somar taxas por tipo
        IF v_fee_record->>'type' = 'mercadopago_fee' THEN
            v_total_mercadopago_fee := v_total_mercadopago_fee + COALESCE((v_fee_record->>'amount')::DECIMAL, 0);
        ELSIF v_fee_record->>'type' = 'application_fee' THEN
            v_total_application_fee := v_total_application_fee + COALESCE((v_fee_record->>'amount')::DECIMAL, 0);
        END IF;
    END LOOP;
    
    -- Atualizar pagamento principal com totais das taxas
    UPDATE pagamentos SET
        fee_details = p_fee_details,
        fee_payment_id = (
            SELECT fee_payment_id 
            FROM pagamento_taxas 
            WHERE pagamento_id = v_pagamento_id 
            AND fee_payment_id IS NOT NULL 
            LIMIT 1
        ),
        mercadopago_fee = v_total_mercadopago_fee,
        application_fee = v_total_application_fee,
        updated_at = NOW()
    WHERE id = v_pagamento_id;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. ATUALIZAR FUNÇÃO DE PROCESSAMENTO DE RESPOSTA PIX
CREATE OR REPLACE FUNCTION processar_resposta_pix(
    p_payment_id TEXT,
    p_response JSONB
)
RETURNS BOOLEAN AS $$
DECLARE
    v_point_of_interaction JSONB;
    v_transaction_data JSONB;
    v_fee_details JSONB;
BEGIN
    -- Extrair dados principais
    v_point_of_interaction := p_response->'point_of_interaction';
    v_transaction_data := v_point_of_interaction->'transaction_data';
    v_fee_details := p_response->'fee_details';
    
    -- Atualizar pagamento com dados PIX completos
    UPDATE pagamentos SET
        -- Dados PIX
        qr_code_base64 = v_transaction_data->>'qr_code_base64',
        qr_code = v_transaction_data->>'qr_code',
        ticket_url = v_transaction_data->>'ticket_url',
        point_of_interaction = v_point_of_interaction,
        date_of_expiration = CASE 
            WHEN p_response->>'date_of_expiration' IS NOT NULL 
            THEN (p_response->>'date_of_expiration')::TIMESTAMP WITH TIME ZONE
            ELSE NULL 
        END,
        -- Transaction details
        net_received_amount = COALESCE((p_response->'transaction_details'->>'net_received_amount')::DECIMAL, 0),
        total_paid_amount = COALESCE((p_response->'transaction_details'->>'total_paid_amount')::DECIMAL, 0),
        overpaid_amount = COALESCE((p_response->'transaction_details'->>'overpaid_amount')::DECIMAL, 0),
        -- Campos adicionais
        money_release_date = CASE 
            WHEN p_response->>'money_release_date' IS NOT NULL 
            THEN (p_response->>'money_release_date')::TIMESTAMP WITH TIME ZONE
            ELSE NULL 
        END,
        operation_type = p_response->>'operation_type',
        order_id = p_response->>'order_id',
        currency_id = COALESCE(p_response->>'currency_id', 'BRL'),
        live_mode = COALESCE((p_response->>'live_mode')::BOOLEAN, true),
        captured = COALESCE((p_response->>'captured')::BOOLEAN, true),
        updated_at = NOW()
    WHERE mercadopago_payment_id = p_payment_id;
    
    -- Processar fee_details se existir
    IF v_fee_details IS NOT NULL THEN
        PERFORM processar_fee_details(p_payment_id, v_fee_details);
    END IF;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. ATUALIZAR FUNÇÃO DE PROCESSAMENTO DE RESPOSTA CARTÃO
CREATE OR REPLACE FUNCTION processar_resposta_cartao(
    p_payment_id TEXT,
    p_response JSONB
)
RETURNS BOOLEAN AS $$
DECLARE
    v_card JSONB;
    v_fee_details JSONB;
BEGIN
    -- Extrair dados do cartão e taxas
    v_card := p_response->'card';
    v_fee_details := p_response->'fee_details';
    
    -- Atualizar pagamento com dados do cartão completos
    UPDATE pagamentos SET
        -- Dados do cartão
        first_six_digits = v_card->>'first_six_digits',
        last_four_digits = v_card->>'last_four_digits',
        card_holder_name = v_card->'cardholder'->>'name',
        -- Transaction details
        net_received_amount = COALESCE((p_response->'transaction_details'->>'net_received_amount')::DECIMAL, 0),
        total_paid_amount = COALESCE((p_response->'transaction_details'->>'total_paid_amount')::DECIMAL, 0),
        installment_amount = COALESCE((p_response->'transaction_details'->>'installment_amount')::DECIMAL, 0),
        financial_institution = p_response->'transaction_details'->>'financial_institution',
        -- Campos adicionais
        money_release_date = CASE 
            WHEN p_response->>'money_release_date' IS NOT NULL 
            THEN (p_response->>'money_release_date')::TIMESTAMP WITH TIME ZONE
            ELSE NULL 
        END,
        operation_type = p_response->>'operation_type',
        order_id = p_response->>'order_id',
        currency_id = COALESCE(p_response->>'currency_id', 'BRL'),
        live_mode = COALESCE((p_response->>'live_mode')::BOOLEAN, true),
        captured = COALESCE((p_response->>'captured')::BOOLEAN, true),
        authorization_code = p_response->>'authorization_code',
        updated_at = NOW()
    WHERE mercadopago_payment_id = p_payment_id;
    
    -- Processar fee_details se existir
    IF v_fee_details IS NOT NULL THEN
        PERFORM processar_fee_details(p_payment_id, v_fee_details);
    END IF;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. FUNÇÃO PARA BUSCAR INFORMAÇÕES COMPLETAS DO PAGAMENTO
CREATE OR REPLACE FUNCTION buscar_pagamento_completo(p_payment_id UUID)
RETURNS TABLE (
    -- Dados básicos
    id UUID,
    mercadopago_payment_id TEXT,
    status TEXT,
    valor DECIMAL(10,2),
    payment_method_id TEXT,
    
    -- Dados PIX
    qr_code_base64 TEXT,
    qr_code TEXT,
    ticket_url TEXT,
    
    -- Dados de taxas
    mercadopago_fee DECIMAL(10,2),
    application_fee DECIMAL(10,2),
    fee_payment_id TEXT,
    
    -- Datas
    created_at TIMESTAMP WITH TIME ZONE,
    date_approved TIMESTAMP WITH TIME ZONE,
    money_release_date TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.mercadopago_payment_id,
        p.status,
        p.valor,
        p.payment_method_id,
        p.qr_code_base64,
        p.qr_code,
        p.ticket_url,
        p.mercadopago_fee,
        p.application_fee,
        p.fee_payment_id,
        p.created_at,
        p.date_approved,
        p.money_release_date
    FROM pagamentos p
    WHERE p.id = p_payment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. FUNÇÃO PARA BUSCAR TAXAS DETALHADAS
CREATE OR REPLACE FUNCTION buscar_taxas_pagamento(p_payment_id UUID)
RETURNS TABLE (
    fee_type TEXT,
    amount DECIMAL(10,2),
    fee_payment_id TEXT,
    fee_payer TEXT,
    description TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pt.fee_type,
        pt.amount,
        pt.fee_payment_id,
        pt.fee_payer,
        pt.description
    FROM pagamento_taxas pt
    WHERE pt.pagamento_id = p_payment_id
    ORDER BY pt.created_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_pagamentos_fee_payment_id ON pagamentos(fee_payment_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_money_release_date ON pagamentos(money_release_date);
CREATE INDEX IF NOT EXISTS idx_pagamentos_operation_type ON pagamentos(operation_type);
CREATE INDEX IF NOT EXISTS idx_pagamentos_order_id ON pagamentos(order_id);

CREATE INDEX IF NOT EXISTS idx_pagamento_taxas_pagamento_id ON pagamento_taxas(pagamento_id);
CREATE INDEX IF NOT EXISTS idx_pagamento_taxas_fee_payment_id ON pagamento_taxas(fee_payment_id);
CREATE INDEX IF NOT EXISTS idx_pagamento_taxas_fee_type ON pagamento_taxas(fee_type);

-- 9. RLS PARA NOVA TABELA
ALTER TABLE pagamento_taxas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payment fees" ON pagamento_taxas
    FOR SELECT USING (
        pagamento_id IN (
            SELECT id FROM pagamentos WHERE user_id = auth.uid()
        )
    );

-- 10. TRIGGERS PARA UPDATED_AT
CREATE TRIGGER update_pagamento_taxas_updated_at 
    BEFORE UPDATE ON pagamento_taxas 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 11. COMENTÁRIOS PARA DOCUMENTAÇÃO
COMMENT ON COLUMN pagamentos.fee_details IS 'JSON completo com detalhes das taxas do Mercado Pago';
COMMENT ON COLUMN pagamentos.fee_payment_id IS 'Payment ID específico das taxas gerado pelo Mercado Pago';
COMMENT ON COLUMN pagamentos.mercadopago_fee IS 'Taxa total do Mercado Pago';
COMMENT ON COLUMN pagamentos.application_fee IS 'Taxa da aplicação (marketplace)';
COMMENT ON COLUMN pagamentos.money_release_date IS 'Data de liberação do dinheiro';
COMMENT ON COLUMN pagamentos.operation_type IS 'Tipo de operação (regular_payment, money_transfer, etc)';

COMMENT ON TABLE pagamento_taxas IS 'Detalhamento individual de cada taxa cobrada no pagamento';
COMMENT ON COLUMN pagamento_taxas.fee_payment_id IS 'Payment ID específico desta taxa individual';

COMMENT ON FUNCTION processar_fee_details IS 'Processa array fee_details e extrai payment_id das taxas';
COMMENT ON FUNCTION buscar_pagamento_completo IS 'Busca informações completas do pagamento incluindo taxas';
COMMENT ON FUNCTION buscar_taxas_pagamento IS 'Busca detalhamento individual de todas as taxas do pagamento';

-- 12. GRANT PERMISSIONS
GRANT EXECUTE ON FUNCTION buscar_pagamento_completo TO authenticated;
GRANT EXECUTE ON FUNCTION buscar_taxas_pagamento TO authenticated;
