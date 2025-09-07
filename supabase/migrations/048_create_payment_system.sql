-- =====================================================
-- NANOSYNC CRM - SISTEMA DE PAGAMENTOS MERCADO PAGO
-- Migration 048: Sistema base de pagamentos
-- =====================================================

-- 1. ADICIONAR COLUNAS DE ASSINATURA NA TABELA PROFILES
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS plano_ativo BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS plano_id TEXT,
ADD COLUMN IF NOT EXISTS plano_expira_em TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS mercadopago_customer_id TEXT,
ADD COLUMN IF NOT EXISTS payment_metadata JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive' CHECK (subscription_status IN ('active', 'inactive', 'expired', 'cancelled', 'pending'));

-- 2. TABELA PRINCIPAL DE PAGAMENTOS
CREATE TABLE IF NOT EXISTS pagamentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Identificadores Mercado Pago
    mercadopago_payment_id TEXT UNIQUE,
    mercadopago_preference_id TEXT,
    
    -- Dados básicos do pagamento
    valor DECIMAL(10,2) NOT NULL,
    descricao TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    status_detail TEXT,
    
    -- Dados do plano
    plano_id TEXT NOT NULL,
    plano_nome TEXT,
    plano_duracao_dias INTEGER DEFAULT 30,
    
    -- Método de pagamento
    payment_method_id TEXT,
    payment_type_id TEXT,
    
    -- Dados do pagador
    payer_email TEXT,
    payer_identification_type TEXT,
    payer_identification_number TEXT,
    
    -- Metadados e resposta completa
    response_data JSONB,
    external_reference TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    date_approved TIMESTAMP WITH TIME ZONE,
    date_last_updated TIMESTAMP WITH TIME ZONE
);

-- 3. TABELA DE WEBHOOKS DO MERCADO PAGO
CREATE TABLE IF NOT EXISTS mercadopago_webhooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Dados do webhook
    event_type TEXT NOT NULL,
    resource_id TEXT,
    webhook_data JSONB NOT NULL,
    
    -- Segurança
    signature TEXT,
    
    -- Status do processamento
    processed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. TABELA DE LOGS DE ACESSO (AUDITORIA)
CREATE TABLE IF NOT EXISTS logs_acesso (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    
    -- Dados da ação
    acao TEXT NOT NULL,
    detalhes JSONB DEFAULT '{}',
    
    -- Dados da requisição
    ip_address INET,
    user_agent TEXT,
    
    -- Resultado
    sucesso BOOLEAN DEFAULT true,
    erro_message TEXT,
    
    -- Timestamp
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. TABELA DE PREFERÊNCIAS DO MERCADO PAGO
CREATE TABLE IF NOT EXISTS mercadopago_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Identificadores
    preference_id TEXT UNIQUE NOT NULL,
    payment_id UUID REFERENCES pagamentos(id) ON DELETE CASCADE,
    
    -- Dados da preferência
    preference_data JSONB NOT NULL,
    
    -- URLs de retorno
    success_url TEXT,
    failure_url TEXT,
    pending_url TEXT,
    
    -- Status
    status TEXT DEFAULT 'active',
    expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. FUNÇÃO PARA ATUALIZAR UPDATED_AT
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. TRIGGERS PARA UPDATED_AT
CREATE TRIGGER update_pagamentos_updated_at 
    BEFORE UPDATE ON pagamentos 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_preferences_updated_at 
    BEFORE UPDATE ON mercadopago_preferences 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 8. FUNÇÃO PARA VERIFICAR SE PLANO ESTÁ ATIVO
CREATE OR REPLACE FUNCTION verificar_plano_ativo(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_plano_ativo BOOLEAN;
    v_expira_em TIMESTAMP WITH TIME ZONE;
BEGIN
    SELECT plano_ativo, plano_expira_em 
    INTO v_plano_ativo, v_expira_em
    FROM profiles 
    WHERE id = p_user_id;
    
    -- Se não encontrou o usuário
    IF NOT FOUND THEN
        RETURN false;
    END IF;
    
    -- Se plano não está marcado como ativo
    IF NOT v_plano_ativo THEN
        RETURN false;
    END IF;
    
    -- Se tem data de expiração e já expirou
    IF v_expira_em IS NOT NULL AND v_expira_em < NOW() THEN
        -- Marcar como inativo automaticamente
        UPDATE profiles 
        SET plano_ativo = false, subscription_status = 'expired'
        WHERE id = p_user_id;
        
        RETURN false;
    END IF;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. FUNÇÃO PARA ATIVAR PLANO DO USUÁRIO
CREATE OR REPLACE FUNCTION ativar_plano_usuario(
    p_user_id UUID,
    p_plano_id TEXT,
    p_duracao_dias INTEGER DEFAULT 30
)
RETURNS BOOLEAN AS $$
DECLARE
    v_nova_expiracao TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Calcular nova data de expiração
    v_nova_expiracao := NOW() + (p_duracao_dias || ' days')::INTERVAL;
    
    -- Atualizar perfil do usuário
    UPDATE profiles SET
        plano_ativo = true,
        plano_id = p_plano_id,
        plano_expira_em = v_nova_expiracao,
        subscription_status = 'active',
        updated_at = NOW()
    WHERE id = p_user_id;
    
    -- Log da ativação
    INSERT INTO logs_acesso (user_id, acao, detalhes) VALUES (
        p_user_id,
        'plan_activated',
        jsonb_build_object(
            'plano_id', p_plano_id,
            'duracao_dias', p_duracao_dias,
            'expira_em', v_nova_expiracao
        )
    );
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. FUNÇÃO PARA PROCESSAR PAGAMENTO APROVADO
CREATE OR REPLACE FUNCTION processar_pagamento_aprovado(p_payment_id TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    v_pagamento RECORD;
BEGIN
    -- Buscar dados do pagamento
    SELECT * INTO v_pagamento
    FROM pagamentos 
    WHERE mercadopago_payment_id = p_payment_id;
    
    IF NOT FOUND THEN
        RETURN false;
    END IF;
    
    -- Ativar plano do usuário
    PERFORM ativar_plano_usuario(
        v_pagamento.user_id,
        v_pagamento.plano_id,
        COALESCE(v_pagamento.plano_duracao_dias, 30)
    );
    
    -- Atualizar status do pagamento
    UPDATE pagamentos SET
        status = 'approved',
        date_approved = NOW(),
        updated_at = NOW()
    WHERE id = v_pagamento.id;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. FUNÇÃO PARA EXPIRAR PLANOS VENCIDOS
CREATE OR REPLACE FUNCTION expirar_planos_vencidos()
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    -- Contar quantos serão expirados
    SELECT COUNT(*) INTO v_count
    FROM profiles 
    WHERE plano_ativo = true 
    AND plano_expira_em < NOW();
    
    -- Expirar planos vencidos
    UPDATE profiles SET
        plano_ativo = false,
        subscription_status = 'expired',
        updated_at = NOW()
    WHERE plano_ativo = true 
    AND plano_expira_em < NOW();
    
    -- Log da operação
    INSERT INTO logs_acesso (acao, detalhes) VALUES (
        'bulk_plan_expiration',
        jsonb_build_object('expired_count', v_count)
    );
    
    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. FUNÇÃO PARA NOTIFICAR USUÁRIOS SOBRE EXPIRAÇÃO
CREATE OR REPLACE FUNCTION notificar_expiracao_proxima()
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    -- Contar usuários que expiram em 3 dias
    SELECT COUNT(*) INTO v_count
    FROM profiles 
    WHERE plano_ativo = true 
    AND plano_expira_em BETWEEN NOW() AND NOW() + INTERVAL '3 days';
    
    -- Log dos usuários a serem notificados
    INSERT INTO logs_acesso (user_id, acao, detalhes)
    SELECT 
        id,
        'expiration_warning',
        jsonb_build_object(
            'expires_at', plano_expira_em,
            'days_remaining', EXTRACT(DAY FROM plano_expira_em - NOW())
        )
    FROM profiles 
    WHERE plano_ativo = true 
    AND plano_expira_em BETWEEN NOW() AND NOW() + INTERVAL '3 days';
    
    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13. FUNÇÃO PARA PROCESSAR WEBHOOK
CREATE OR REPLACE FUNCTION processar_webhook_mercadopago(
    p_event_type TEXT,
    p_resource_id TEXT,
    p_webhook_data JSONB,
    p_signature TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_webhook_id UUID;
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
        -- Aqui será implementada a lógica específica de processamento
        -- Por enquanto, apenas marcar como processado
        UPDATE mercadopago_webhooks 
        SET processed_at = NOW()
        WHERE id = v_webhook_id;
        
        v_result := jsonb_build_object(
            'success', true,
            'webhook_id', v_webhook_id,
            'message', 'Webhook processado'
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

-- 14. ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_pagamentos_user_id ON pagamentos(user_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_mercadopago_id ON pagamentos(mercadopago_payment_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_status ON pagamentos(status);
CREATE INDEX IF NOT EXISTS idx_pagamentos_created_at ON pagamentos(created_at);

CREATE INDEX IF NOT EXISTS idx_profiles_plano_ativo ON profiles(plano_ativo);
CREATE INDEX IF NOT EXISTS idx_profiles_plano_expira_em ON profiles(plano_expira_em);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_status ON profiles(subscription_status);

CREATE INDEX IF NOT EXISTS idx_webhooks_event_type ON mercadopago_webhooks(event_type);
CREATE INDEX IF NOT EXISTS idx_webhooks_resource_id ON mercadopago_webhooks(resource_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_created_at ON mercadopago_webhooks(created_at);

CREATE INDEX IF NOT EXISTS idx_logs_user_id ON logs_acesso(user_id);
CREATE INDEX IF NOT EXISTS idx_logs_acao ON logs_acesso(acao);
CREATE INDEX IF NOT EXISTS idx_logs_created_at ON logs_acesso(created_at);

-- 15. ROW LEVEL SECURITY (RLS)
ALTER TABLE pagamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE mercadopago_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs_acesso ENABLE ROW LEVEL SECURITY;

-- Políticas para pagamentos
CREATE POLICY "Users can view own payments" ON pagamentos
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own payments" ON pagamentos
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own payments" ON pagamentos
    FOR UPDATE USING (user_id = auth.uid());

-- Políticas para preferências
CREATE POLICY "Users can view own preferences" ON mercadopago_preferences
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own preferences" ON mercadopago_preferences
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Políticas para logs (apenas visualização própria)
CREATE POLICY "Users can view own logs" ON logs_acesso
    FOR SELECT USING (user_id = auth.uid());

-- 16. CRON JOBS
-- Expirar planos vencidos (diário às 6:00)
SELECT cron.schedule(
    'expire-plans-daily',
    '0 6 * * *',
    'SELECT expirar_planos_vencidos();'
);

-- Notificar sobre expirações próximas (diário às 9:00)
SELECT cron.schedule(
    'notify-expiration-daily',
    '0 9 * * *',
    'SELECT notificar_expiracao_proxima();'
);

-- 17. GRANTS E PERMISSÕES
GRANT EXECUTE ON FUNCTION verificar_plano_ativo TO authenticated;
GRANT EXECUTE ON FUNCTION ativar_plano_usuario TO authenticated;
GRANT EXECUTE ON FUNCTION processar_pagamento_aprovado TO authenticated;
GRANT EXECUTE ON FUNCTION processar_webhook_mercadopago TO authenticated;

-- 18. COMENTÁRIOS PARA DOCUMENTAÇÃO
COMMENT ON TABLE pagamentos IS 'Tabela principal de pagamentos do sistema de assinaturas';
COMMENT ON TABLE mercadopago_webhooks IS 'Log de webhooks recebidos do Mercado Pago';
COMMENT ON TABLE logs_acesso IS 'Auditoria de ações relacionadas a pagamentos e acesso';
COMMENT ON TABLE mercadopago_preferences IS 'Preferências de pagamento criadas no Mercado Pago';

COMMENT ON COLUMN profiles.plano_ativo IS 'Indica se o usuário tem plano ativo no momento';
COMMENT ON COLUMN profiles.plano_expira_em IS 'Data de expiração do plano atual';
COMMENT ON COLUMN profiles.mercadopago_customer_id IS 'ID do cliente no Mercado Pago';
COMMENT ON COLUMN profiles.subscription_status IS 'Status da assinatura (active, inactive, expired, cancelled, pending)';

COMMENT ON FUNCTION verificar_plano_ativo IS 'Verifica se o plano do usuário está ativo e não expirado';
COMMENT ON FUNCTION ativar_plano_usuario IS 'Ativa plano para usuário com duração específica';
COMMENT ON FUNCTION processar_pagamento_aprovado IS 'Processa pagamento aprovado e ativa plano';
COMMENT ON FUNCTION expirar_planos_vencidos IS 'Expira planos que passaram da data de vencimento';
COMMENT ON FUNCTION notificar_expiracao_proxima IS 'Identifica usuários para notificação de expiração';
COMMENT ON FUNCTION processar_webhook_mercadopago IS 'Processa webhooks recebidos do Mercado Pago';
