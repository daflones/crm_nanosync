-- Criar tabela de notificações
CREATE TABLE IF NOT EXISTS notificacoes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Identificação e categorização
  tipo VARCHAR(50) NOT NULL CHECK (tipo IN (
    'agendamento_criado', 'agendamento_hoje', 'agendamento_expirado',
    'proposta_criada', 'proposta_mudou_categoria', 'proposta_aprovada', 
    'proposta_recusada', 'proposta_negociacao', 'proposta_expirada',
    'cliente_criado', 'cliente_atualizado', 
    'sistema', 'erro', 'sucesso', 'aviso'
  )),
  categoria VARCHAR(30) NOT NULL CHECK (categoria IN (
    'agendamento', 'proposta', 'cliente', 'sistema', 'geral'
  )),
  
  -- Conteúdo da notificação
  titulo VARCHAR(255) NOT NULL,
  descricao TEXT,
  dados_extras JSONB DEFAULT '{}'::jsonb, -- Para informações específicas
  
  -- Referencias
  referencia_id UUID, -- ID do agendamento, proposta, cliente, etc.
  referencia_tipo VARCHAR(50), -- 'agendamento', 'proposta', 'cliente'
  
  -- Status e prioridade
  prioridade VARCHAR(20) DEFAULT 'normal' CHECK (prioridade IN ('baixa', 'normal', 'alta', 'urgente')),
  lida BOOLEAN DEFAULT false,
  
  -- Metadados
  ip_origem INET,
  user_agent TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  lida_em TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days')
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_notificacoes_user_id ON notificacoes(user_id);
CREATE INDEX IF NOT EXISTS idx_notificacoes_tipo ON notificacoes(tipo);
CREATE INDEX IF NOT EXISTS idx_notificacoes_categoria ON notificacoes(categoria);
CREATE INDEX IF NOT EXISTS idx_notificacoes_lida ON notificacoes(lida);
CREATE INDEX IF NOT EXISTS idx_notificacoes_created_at ON notificacoes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notificacoes_referencia ON notificacoes(referencia_id, referencia_tipo);
CREATE INDEX IF NOT EXISTS idx_notificacoes_expires_at ON notificacoes(expires_at);

-- RLS (Row Level Security)
ALTER TABLE notificacoes ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
DROP POLICY IF EXISTS "Users can view own notifications" ON notificacoes;
CREATE POLICY "Users can view own notifications" ON notificacoes
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own notifications" ON notificacoes;
CREATE POLICY "Users can insert own notifications" ON notificacoes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notifications" ON notificacoes;
CREATE POLICY "Users can update own notifications" ON notificacoes
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own notifications" ON notificacoes;
CREATE POLICY "Users can delete own notifications" ON notificacoes
  FOR DELETE USING (auth.uid() = user_id);

-- Função para limpar notificações expiradas automaticamente
CREATE OR REPLACE FUNCTION cleanup_expired_notifications()
RETURNS void AS $$
BEGIN
  DELETE FROM notificacoes WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Função para verificar agendamentos expirados
CREATE OR REPLACE FUNCTION verificar_agendamentos_expirados()
RETURNS void AS $$
DECLARE
    rec RECORD;
BEGIN
    -- Buscar agendamentos que expiraram e ainda não foram notificados
    FOR rec IN 
        SELECT a.*, c.nome as cliente_nome 
        FROM agendamentos a
        JOIN clientes c ON a.cliente_id = c.id
        WHERE a.data_inicio::date < CURRENT_DATE
        AND NOT EXISTS (
            SELECT 1 FROM notificacoes n 
            WHERE n.referencia_id = a.id 
            AND n.tipo = 'agendamento_expirado'
        )
    LOOP
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
            'Agendamento com ' || rec.cliente_nome || ' expirou em ' || rec.data_inicio::date,
            rec.id,
            'agendamento',
            'alta',
            json_build_object(
                'cliente_nome', rec.cliente_nome,
                'data_inicio', rec.data_inicio,
                'tipo_agendamento', rec.tipo
            )
        );
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Função para verificar agendamentos de hoje
CREATE OR REPLACE FUNCTION verificar_agendamentos_hoje()
RETURNS void AS $$
DECLARE
    rec RECORD;
BEGIN
    FOR rec IN 
        SELECT a.*, c.nome as cliente_nome 
        FROM agendamentos a
        JOIN clientes c ON a.cliente_id = c.id
        WHERE a.data_inicio::date = CURRENT_DATE
        AND NOT EXISTS (
            SELECT 1 FROM notificacoes n 
            WHERE n.referencia_id = a.id 
            AND n.tipo = 'agendamento_hoje'
            AND DATE(n.created_at) = CURRENT_DATE
        )
    LOOP
        INSERT INTO notificacoes (
            user_id, tipo, categoria, titulo, descricao,
            referencia_id, referencia_tipo, prioridade,
            dados_extras
        ) VALUES (
            rec.user_id,
            'agendamento_hoje',
            'agendamento',
            'Agendamento Hoje',
            'Agendamento com ' || rec.cliente_nome || ' hoje às ' || EXTRACT(HOUR FROM rec.data_inicio) || ':' || LPAD(EXTRACT(MINUTE FROM rec.data_inicio)::text, 2, '0'),
            rec.id,
            'agendamento',
            'alta',
            json_build_object(
                'cliente_nome', rec.cliente_nome,
                'data_inicio', rec.data_inicio,
                'hora_agendamento', EXTRACT(HOUR FROM rec.data_inicio) || ':' || LPAD(EXTRACT(MINUTE FROM rec.data_inicio)::text, 2, '0')
            )
        );
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Trigger para mudanças em propostas
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

CREATE TRIGGER trigger_proposta_update
    AFTER UPDATE ON propostas
    FOR EACH ROW
    EXECUTE FUNCTION trigger_proposta_mudanca();

-- Trigger para criação de propostas
CREATE OR REPLACE FUNCTION trigger_proposta_criada()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO notificacoes (
        user_id, tipo, categoria, titulo, descricao,
        referencia_id, referencia_tipo, prioridade,
        dados_extras
    ) VALUES (
        NEW.user_id,
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
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_proposta_insert
    AFTER INSERT ON propostas
    FOR EACH ROW
    EXECUTE FUNCTION trigger_proposta_criada();

-- Trigger para criação de agendamentos
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
        'normal',
        json_build_object(
            'titulo', NEW.titulo,
            'data_inicio', NEW.data_inicio,
            'cliente_id', NEW.cliente_id
        )
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_agendamento_insert
    AFTER INSERT ON agendamentos
    FOR EACH ROW
    EXECUTE FUNCTION trigger_agendamento_criado();

-- Trigger para criação de clientes
CREATE OR REPLACE FUNCTION trigger_cliente_criado()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO notificacoes (
        user_id, tipo, categoria, titulo, descricao,
        referencia_id, referencia_tipo, prioridade,
        dados_extras
    ) VALUES (
        NEW.user_id,
        'cliente_criado',
        'cliente',
        'Novo Cliente Cadastrado',
        'Cliente "' || NEW.nome || '" foi cadastrado',
        NEW.id,
        'cliente',
        'normal',
        json_build_object(
            'nome', NEW.nome,
            'email', NEW.email,
            'telefone', NEW.telefone
        )
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_cliente_insert
    AFTER INSERT ON clientes
    FOR EACH ROW
    EXECUTE FUNCTION trigger_cliente_criado();
