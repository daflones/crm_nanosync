-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    role TEXT CHECK (role IN ('admin', 'vendedor')) DEFAULT 'vendedor',
    status TEXT CHECK (status IN ('ativo', 'inativo', 'suspenso')) DEFAULT 'ativo',
    preferences JSONB DEFAULT '{
        "theme": "light",
        "notifications": {
            "email": true,
            "push": true,
            "sound": true
        },
        "dashboard": {
            "layout": "grid",
            "widgets": ["vendas", "clientes", "propostas", "agendamentos"]
        },
        "sounds": {
            "enabled": true,
            "volume": 0.5
        }
    }'::jsonb,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vendedores table
CREATE TABLE vendedores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    cpf TEXT UNIQUE,
    whatsapp TEXT,
    telefone TEXT,
    data_nascimento DATE,
    endereco TEXT,
    numero TEXT,
    complemento TEXT,
    bairro TEXT,
    cidade TEXT,
    estado TEXT,
    cep TEXT,
    segmentos_principais TEXT[],
    segmentos_secundarios TEXT[],
    regioes_atendimento TEXT[],
    tipo_atendimento TEXT CHECK (tipo_atendimento IN ('presencial', 'online', 'hibrido')) DEFAULT 'hibrido',
    meta_mensal DECIMAL(10,2) DEFAULT 0,
    comissao_percentual DECIMAL(5,2) DEFAULT 5,
    data_contratacao DATE,
    salario_base DECIMAL(10,2) DEFAULT 0,
    status TEXT CHECK (status IN ('ativo', 'inativo', 'ferias', 'afastado', 'desligado')) DEFAULT 'ativo',
    observacoes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Categorias table
CREATE TABLE categorias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome TEXT NOT NULL UNIQUE,
    codigo TEXT NOT NULL UNIQUE,
    descricao TEXT,
    icone TEXT DEFAULT 'Package',
    cor TEXT DEFAULT '#8B5CF6',
    status TEXT CHECK (status IN ('ativo', 'inativo')) DEFAULT 'ativo',
    ordem INTEGER DEFAULT 0,
    configuracoes JSONB DEFAULT '{
        "permitir_subcategorias": true,
        "requerer_aprovacao": false
    }'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Segmentos table
CREATE TABLE segmentos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    categoria_id UUID REFERENCES categorias(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    codigo TEXT NOT NULL UNIQUE,
    descricao TEXT,
    icone TEXT DEFAULT 'Layers',
    cor TEXT DEFAULT '#8B5CF6',
    status TEXT CHECK (status IN ('ativo', 'inativo')) DEFAULT 'ativo',
    ordem INTEGER DEFAULT 0,
    configuracoes JSONB DEFAULT '{
        "margem_padrao": 30,
        "prazo_entrega_padrao": "15 dias",
        "observacoes_padrao": ""
    }'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Produtos table
CREATE TABLE produtos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    categoria_id UUID REFERENCES categorias(id) ON DELETE SET NULL,
    segmento_id UUID REFERENCES segmentos(id) ON DELETE SET NULL,
    nome TEXT NOT NULL,
    codigo TEXT NOT NULL UNIQUE,
    descricao TEXT,
    resumo TEXT,
    valor_unitario DECIMAL(10,2) NOT NULL DEFAULT 0,
    unidade TEXT DEFAULT 'un',
    especificacoes JSONB DEFAULT '{}'::jsonb,
    dimensoes TEXT,
    peso TEXT,
    material TEXT,
    cores_disponiveis TEXT[],
    acabamento TEXT,
    embalagem TEXT,
    prazo_entrega TEXT DEFAULT '15 dias',
    minimo_pedido INTEGER DEFAULT 1,
    multiplo_venda INTEGER DEFAULT 1,
    tabela_desconto JSONB DEFAULT '[]'::jsonb,
    imagem_principal TEXT,
    galeria_imagens TEXT[],
    video_url TEXT,
    catalogo_url TEXT,
    ficha_tecnica_url TEXT,
    status TEXT CHECK (status IN ('ativo', 'inativo', 'descontinuado', 'em_desenvolvimento')) DEFAULT 'ativo',
    destaque BOOLEAN DEFAULT false,
    mais_vendido BOOLEAN DEFAULT false,
    novidade BOOLEAN DEFAULT false,
    tags TEXT[],
    palavras_chave TEXT[],
    controla_estoque BOOLEAN DEFAULT false,
    estoque_atual INTEGER DEFAULT 0,
    estoque_minimo INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Servicos table
CREATE TABLE servicos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    categoria_id UUID REFERENCES categorias(id) ON DELETE SET NULL,
    segmento_id UUID REFERENCES segmentos(id) ON DELETE SET NULL,
    nome TEXT NOT NULL,
    codigo TEXT NOT NULL UNIQUE,
    descricao TEXT,
    resumo TEXT,
    valor_hora DECIMAL(10,2),
    valor_fixo DECIMAL(10,2),
    tipo_cobranca TEXT CHECK (tipo_cobranca IN ('hora', 'fixo', 'projeto', 'mensal')) DEFAULT 'fixo',
    prazo_execucao TEXT,
    requisitos TEXT,
    entregaveis TEXT,
    imagem_principal TEXT,
    galeria_imagens TEXT[],
    portfolio_url TEXT,
    status TEXT CHECK (status IN ('ativo', 'inativo', 'suspenso')) DEFAULT 'ativo',
    destaque BOOLEAN DEFAULT false,
    tags TEXT[],
    palavras_chave TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Clientes table
CREATE TABLE clientes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendedor_id UUID REFERENCES vendedores(id) ON DELETE SET NULL,
    nome_contato TEXT NOT NULL,
    cargo TEXT,
    email TEXT,
    telefone TEXT,
    whatsapp TEXT,
    linkedin TEXT,
    nome_empresa TEXT,
    razao_social TEXT,
    nome_fantasia TEXT,
    cnpj TEXT UNIQUE,
    ie TEXT,
    im TEXT,
    porte_empresa TEXT CHECK (porte_empresa IN ('MEI', 'micro', 'pequena', 'media', 'grande')),
    endereco TEXT,
    numero TEXT,
    complemento TEXT,
    bairro TEXT,
    cidade TEXT,
    estado TEXT,
    cep TEXT,
    pais TEXT DEFAULT 'Brasil',
    segmento_cliente TEXT,
    produtos_interesse TEXT[],
    volume_mensal TEXT,
    volume_mensal_numero DECIMAL(10,2),
    orcamento_estimado DECIMAL(10,2),
    sazonalidade TEXT,
    fornecedor_atual TEXT,
    motivo_troca TEXT,
    etapa_pipeline TEXT CHECK (etapa_pipeline IN ('novo', 'contactado', 'qualificado', 'proposta', 'negociacao', 'fechado', 'perdido')) DEFAULT 'novo',
    valor_estimado DECIMAL(10,2) DEFAULT 0,
    valor_final DECIMAL(10,2),
    probabilidade INTEGER DEFAULT 0 CHECK (probabilidade >= 0 AND probabilidade <= 100),
    qualificacao_score INTEGER DEFAULT 0 CHECK (qualificacao_score >= 0 AND qualificacao_score <= 100),
    qualificacao_completa BOOLEAN DEFAULT false,
    informacoes_faltantes TEXT[],
    criterios_qualificacao JSONB DEFAULT '{
        "orcamento_definido": false,
        "autoridade_decisao": false,
        "necessidade_urgente": false,
        "timeline_definida": false,
        "dados_completos": false
    }'::jsonb,
    origem TEXT CHECK (origem IN ('manual', 'whatsapp', 'site', 'indicacao', 'feira', 'cold_call', 'email', 'redes_sociais')) DEFAULT 'manual',
    fonte_detalhada TEXT,
    classificacao TEXT CHECK (classificacao IN ('quente', 'morno', 'frio')) DEFAULT 'frio',
    primeiro_contato_em TIMESTAMPTZ,
    ultimo_contato_em TIMESTAMPTZ,
    proximo_contato_em TIMESTAMPTZ,
    frequencia_contato TEXT,
    proposta_enviada BOOLEAN DEFAULT false,
    proposta_enviada_em TIMESTAMPTZ,
    proposta_valor DECIMAL(10,2),
    proposta_status TEXT,
    data_ultima_etapa TIMESTAMPTZ DEFAULT NOW(),
    motivo_perda TEXT,
    categoria_perda TEXT,
    concorrente TEXT,
    feedback_rejeicao TEXT,
    observacoes TEXT,
    tags TEXT[],
    caracteristicas_especiais TEXT,
    restricoes TEXT,
    preferencias_contato TEXT,
    melhor_horario_contato TEXT,
    ticket_medio_historico DECIMAL(10,2),
    lifetime_value DECIMAL(10,2),
    numero_pedidos INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agendamentos table
CREATE TABLE agendamentos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
    vendedor_id UUID REFERENCES vendedores(id) ON DELETE CASCADE,
    titulo TEXT NOT NULL,
    descricao TEXT,
    objetivo TEXT,
    data_inicio TIMESTAMPTZ NOT NULL,
    data_fim TIMESTAMPTZ NOT NULL,
    duracao_minutos INTEGER,
    tipo TEXT CHECK (tipo IN ('primeira_reuniao', 'apresentacao', 'proposta', 'negociacao', 'fechamento', 'followup', 'tecnica', 'treinamento', 'suporte')) DEFAULT 'primeira_reuniao',
    categoria TEXT CHECK (categoria IN ('comercial', 'tecnica', 'suporte', 'administrativa')) DEFAULT 'comercial',
    prioridade TEXT CHECK (prioridade IN ('baixa', 'media', 'alta', 'urgente')) DEFAULT 'media',
    modalidade TEXT CHECK (modalidade IN ('presencial', 'online', 'telefone', 'whatsapp')) DEFAULT 'presencial',
    endereco_reuniao TEXT,
    link_online TEXT,
    plataforma TEXT,
    senha_reuniao TEXT,
    id_sala_online TEXT,
    participantes JSONB DEFAULT '[]'::jsonb,
    participantes_externos TEXT[],
    agenda TEXT,
    materiais_necessarios TEXT[],
    documentos_anexos TEXT[],
    produtos_apresentar TEXT[],
    servicos_apresentar TEXT[],
    status TEXT CHECK (status IN ('agendado', 'confirmado', 'em_andamento', 'concluido', 'cancelado', 'nao_compareceu', 'remarcado')) DEFAULT 'agendado',
    lembrete_enviado BOOLEAN DEFAULT false,
    lembrete_enviado_em TIMESTAMPTZ,
    confirmacao_cliente BOOLEAN DEFAULT false,
    confirmacao_em TIMESTAMPTZ,
    resultado TEXT,
    ata_reuniao TEXT,
    proximos_passos TEXT,
    data_proximo_contato TIMESTAMPTZ,
    valor_discutido DECIMAL(10,2),
    interesse_demonstrado INTEGER CHECK (interesse_demonstrado >= 0 AND interesse_demonstrado <= 10),
    reagendamento_de UUID,
    motivo_reagendamento TEXT,
    contador_reagendamentos INTEGER DEFAULT 0,
    google_event_id TEXT,
    outlook_event_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Propostas table
CREATE TABLE propostas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
    vendedor_id UUID REFERENCES vendedores(id) ON DELETE CASCADE,
    numero_proposta TEXT NOT NULL UNIQUE,
    titulo TEXT NOT NULL,
    versao INTEGER DEFAULT 1,
    proposta_pai UUID,
    descricao TEXT,
    observacoes TEXT,
    termos_condicoes TEXT,
    valor_produtos DECIMAL(10,2) DEFAULT 0,
    valor_servicos DECIMAL(10,2) DEFAULT 0,
    valor_desconto DECIMAL(10,2) DEFAULT 0,
    percentual_desconto DECIMAL(5,2) DEFAULT 0,
    valor_frete DECIMAL(10,2) DEFAULT 0,
    valor_impostos DECIMAL(10,2) DEFAULT 0,
    valor_total DECIMAL(10,2) DEFAULT 0,
    forma_pagamento TEXT,
    condicoes_pagamento TEXT,
    prazo_entrega TEXT,
    local_entrega TEXT,
    responsavel_frete TEXT CHECK (responsavel_frete IN ('cliente', 'fornecedor', 'compartilhado')) DEFAULT 'cliente',
    condicoes_especiais TEXT,
    garantia TEXT,
    suporte_incluido BOOLEAN DEFAULT false,
    treinamento_incluido BOOLEAN DEFAULT false,
    status TEXT CHECK (status IN ('rascunho', 'revisao', 'aprovada_interna', 'enviada', 'visualizada', 'em_negociacao', 'aprovada', 'rejeitada', 'vencida')) DEFAULT 'rascunho',
    validade_dias INTEGER DEFAULT 30,
    data_vencimento TIMESTAMPTZ,
    data_aprovacao_interna TIMESTAMPTZ,
    data_envio TIMESTAMPTZ,
    data_visualizacao TIMESTAMPTZ,
    data_resposta TIMESTAMPTZ,
    data_assinatura TIMESTAMPTZ,
    feedback_cliente TEXT,
    objecoes TEXT,
    pontos_negociacao TEXT,
    motivo_rejeicao TEXT,
    arquivo_pdf_url TEXT,
    template_usado TEXT,
    assinatura_digital_url TEXT,
    documentos_anexos TEXT[],
    visualizacoes INTEGER DEFAULT 0,
    tempo_visualizacao INTEGER DEFAULT 0,
    paginas_visualizadas INTEGER[],
    ultima_interacao TIMESTAMPTZ,
    requer_aprovacao BOOLEAN DEFAULT false,
    aprovada_por UUID,
    motivo_aprovacao TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Proposta Itens table
CREATE TABLE proposta_itens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    proposta_id UUID REFERENCES propostas(id) ON DELETE CASCADE,
    tipo TEXT CHECK (tipo IN ('produto', 'servico')) NOT NULL,
    produto_id UUID REFERENCES produtos(id) ON DELETE SET NULL,
    servico_id UUID REFERENCES servicos(id) ON DELETE SET NULL,
    nome TEXT NOT NULL,
    descricao TEXT,
    quantidade DECIMAL(10,2) NOT NULL DEFAULT 1,
    unidade TEXT DEFAULT 'un',
    valor_unitario DECIMAL(10,2) NOT NULL,
    percentual_desconto DECIMAL(5,2) DEFAULT 0,
    valor_desconto DECIMAL(10,2) DEFAULT 0,
    valor_total DECIMAL(10,2) NOT NULL,
    observacoes TEXT,
    especificacoes_customizadas JSONB,
    ordem INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Atividades table (histórico de ações)
CREATE TABLE atividades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entidade_tipo TEXT NOT NULL,
    entidade_id UUID NOT NULL,
    usuario_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    acao TEXT NOT NULL,
    descricao TEXT,
    dados_anteriores JSONB,
    dados_novos JSONB,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_vendedores_user_id ON vendedores(user_id);
CREATE INDEX idx_vendedores_status ON vendedores(status);
CREATE INDEX idx_clientes_vendedor_id ON clientes(vendedor_id);
CREATE INDEX idx_clientes_etapa_pipeline ON clientes(etapa_pipeline);
CREATE INDEX idx_clientes_cnpj ON clientes(cnpj);
CREATE INDEX idx_produtos_categoria_id ON produtos(categoria_id);
CREATE INDEX idx_produtos_segmento_id ON produtos(segmento_id);
CREATE INDEX idx_produtos_status ON produtos(status);
CREATE INDEX idx_agendamentos_cliente_id ON agendamentos(cliente_id);
CREATE INDEX idx_agendamentos_vendedor_id ON agendamentos(vendedor_id);
CREATE INDEX idx_agendamentos_data_inicio ON agendamentos(data_inicio);
CREATE INDEX idx_agendamentos_status ON agendamentos(status);
CREATE INDEX idx_propostas_cliente_id ON propostas(cliente_id);
CREATE INDEX idx_propostas_vendedor_id ON propostas(vendedor_id);
CREATE INDEX idx_propostas_numero ON propostas(numero_proposta);
CREATE INDEX idx_propostas_status ON propostas(status);
CREATE INDEX idx_proposta_itens_proposta_id ON proposta_itens(proposta_id);
CREATE INDEX idx_atividades_entidade ON atividades(entidade_tipo, entidade_id);
CREATE INDEX idx_atividades_usuario_id ON atividades(usuario_id);
CREATE INDEX idx_atividades_created_at ON atividades(created_at DESC);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_vendedores_updated_at BEFORE UPDATE ON vendedores
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_categorias_updated_at BEFORE UPDATE ON categorias
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_segmentos_updated_at BEFORE UPDATE ON segmentos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_produtos_updated_at BEFORE UPDATE ON produtos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_servicos_updated_at BEFORE UPDATE ON servicos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_clientes_updated_at BEFORE UPDATE ON clientes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_agendamentos_updated_at BEFORE UPDATE ON agendamentos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_propostas_updated_at BEFORE UPDATE ON propostas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_proposta_itens_updated_at BEFORE UPDATE ON proposta_itens
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
