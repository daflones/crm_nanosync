-- Seed data for Inovapet CRM

-- Insert sample profiles (assumes auth.users already exist)
-- You'll need to create auth users first via Supabase Auth

-- Insert sample categories
INSERT INTO categorias (nome, codigo, descricao, icone, cor, status, ordem) VALUES
('Alimentos', 'ALI', 'Produtos alimentícios para pets', 'Package', '#10B981', 'ativo', 1),
('Higiene', 'HIG', 'Produtos de higiene e limpeza', 'Sparkles', '#3B82F6', 'ativo', 2),
('Acessórios', 'ACE', 'Acessórios e brinquedos', 'ShoppingBag', '#8B5CF6', 'ativo', 3),
('Medicamentos', 'MED', 'Medicamentos e suplementos', 'Heart', '#EF4444', 'ativo', 4),
('Serviços', 'SER', 'Serviços veterinários e grooming', 'Scissors', '#F59E0B', 'ativo', 5);

-- Insert sample segments
INSERT INTO segmentos (categoria_id, nome, codigo, descricao, icone, cor, status, ordem) VALUES
((SELECT id FROM categorias WHERE codigo = 'ALI'), 'Ração Seca', 'RS', 'Rações secas para cães e gatos', 'Package', '#10B981', 'ativo', 1),
((SELECT id FROM categorias WHERE codigo = 'ALI'), 'Ração Úmida', 'RU', 'Rações úmidas e sachês', 'Droplet', '#10B981', 'ativo', 2),
((SELECT id FROM categorias WHERE codigo = 'ALI'), 'Petiscos', 'PET', 'Petiscos e snacks', 'Cookie', '#10B981', 'ativo', 3),
((SELECT id FROM categorias WHERE codigo = 'HIG'), 'Shampoos', 'SHA', 'Shampoos e condicionadores', 'Droplets', '#3B82F6', 'ativo', 1),
((SELECT id FROM categorias WHERE codigo = 'HIG'), 'Tapetes', 'TAP', 'Tapetes higiênicos', 'Square', '#3B82F6', 'ativo', 2),
((SELECT id FROM categorias WHERE codigo = 'ACE'), 'Coleiras', 'COL', 'Coleiras e guias', 'Link', '#8B5CF6', 'ativo', 1),
((SELECT id FROM categorias WHERE codigo = 'ACE'), 'Brinquedos', 'BRI', 'Brinquedos interativos', 'GameController', '#8B5CF6', 'ativo', 2),
((SELECT id FROM categorias WHERE codigo = 'MED'), 'Vermífugos', 'VER', 'Vermífugos e antiparasitários', 'Shield', '#EF4444', 'ativo', 1),
((SELECT id FROM categorias WHERE codigo = 'MED'), 'Vitaminas', 'VIT', 'Vitaminas e suplementos', 'Pill', '#EF4444', 'ativo', 2);

-- Insert sample products
INSERT INTO produtos (categoria_id, segmento_id, nome, codigo, descricao, valor_unitario, unidade, prazo_entrega, minimo_pedido, status, destaque, tags) VALUES
((SELECT id FROM categorias WHERE codigo = 'ALI'), (SELECT id FROM segmentos WHERE codigo = 'RS'), 'Ração Premium Cães Adultos 15kg', 'RPC15', 'Ração super premium para cães adultos de porte médio', 189.90, 'un', '5 dias', 1, 'ativo', true, ARRAY['premium', 'cachorro', 'adulto']),
((SELECT id FROM categorias WHERE codigo = 'ALI'), (SELECT id FROM segmentos WHERE codigo = 'RS'), 'Ração Premium Gatos Adultos 10kg', 'RPG10', 'Ração super premium para gatos adultos', 169.90, 'un', '5 dias', 1, 'ativo', true, ARRAY['premium', 'gato', 'adulto']),
((SELECT id FROM categorias WHERE codigo = 'ALI'), (SELECT id FROM segmentos WHERE codigo = 'RU'), 'Sachê Premium Cães 100g', 'SPC100', 'Sachê premium sabor carne', 4.90, 'un', '3 dias', 12, 'ativo', false, ARRAY['sachê', 'cachorro', 'úmido']),
((SELECT id FROM categorias WHERE codigo = 'HIG'), (SELECT id FROM segmentos WHERE codigo = 'SHA'), 'Shampoo Neutro 500ml', 'SHN500', 'Shampoo neutro para todos os tipos de pelo', 24.90, 'un', '7 dias', 6, 'ativo', false, ARRAY['shampoo', 'higiene', 'neutro']),
((SELECT id FROM categorias WHERE codigo = 'HIG'), (SELECT id FROM segmentos WHERE codigo = 'TAP'), 'Tapete Higiênico 30un', 'TH30', 'Tapete higiênico super absorvente', 39.90, 'pct', '3 dias', 1, 'ativo', true, ARRAY['tapete', 'higiênico', 'absorvente']),
((SELECT id FROM categorias WHERE codigo = 'ACE'), (SELECT id FROM segmentos WHERE codigo = 'COL'), 'Coleira Antipulgas', 'CAP', 'Coleira antipulgas e carrapatos', 45.90, 'un', '5 dias', 1, 'ativo', false, ARRAY['coleira', 'antipulgas', 'proteção']),
((SELECT id FROM categorias WHERE codigo = 'ACE'), (SELECT id FROM segmentos WHERE codigo = 'BRI'), 'Bola Interativa', 'BI001', 'Bola com dispenser de petiscos', 29.90, 'un', '7 dias', 1, 'ativo', false, ARRAY['brinquedo', 'interativo', 'bola']),
((SELECT id FROM categorias WHERE codigo = 'MED'), (SELECT id FROM segmentos WHERE codigo = 'VER'), 'Vermífugo Oral 4 comprimidos', 'VO4', 'Vermífugo de amplo espectro', 35.90, 'cx', '3 dias', 1, 'ativo', true, ARRAY['vermífugo', 'medicamento', 'oral']);

-- Insert sample services
INSERT INTO servicos (categoria_id, nome, codigo, descricao, valor_fixo, tipo_cobranca, prazo_execucao, status, destaque, tags) VALUES
((SELECT id FROM categorias WHERE codigo = 'SER'), 'Banho e Tosa Completa', 'BTC', 'Serviço completo de banho e tosa', 80.00, 'fixo', '2 horas', 'ativo', true, ARRAY['banho', 'tosa', 'grooming']),
((SELECT id FROM categorias WHERE codigo = 'SER'), 'Consulta Veterinária', 'CV', 'Consulta veterinária básica', 150.00, 'fixo', '30 minutos', 'ativo', true, ARRAY['veterinário', 'consulta', 'saúde']),
((SELECT id FROM categorias WHERE codigo = 'SER'), 'Vacinação', 'VAC', 'Aplicação de vacinas', 120.00, 'fixo', '15 minutos', 'ativo', false, ARRAY['vacina', 'prevenção', 'saúde']);

-- Insert sample clients (leads)
INSERT INTO clientes (
    nome_contato, cargo, email, telefone, whatsapp, 
    nome_empresa, cnpj, cidade, estado, 
    segmento_cliente, produtos_interesse, etapa_pipeline, 
    valor_estimado, probabilidade, classificacao, origem
) VALUES
('João Silva', 'Proprietário', 'joao@petshopamigo.com', '11 3456-7890', '11 98765-4321', 
 'Pet Shop Amigo', '12.345.678/0001-90', 'São Paulo', 'SP', 
 'Pet Shop', ARRAY['Ração Premium Cães Adultos 15kg', 'Tapete Higiênico 30un'], 'qualificado', 
 5000.00, 70, 'quente', 'site'),
 
('Maria Santos', 'Gerente de Compras', 'maria@veterinariaanimal.com', '11 2345-6789', '11 97654-3210', 
 'Veterinária Animal+', '23.456.789/0001-01', 'São Paulo', 'SP', 
 'Clínica Veterinária', ARRAY['Vermífugo Oral 4 comprimidos', 'Shampoo Neutro 500ml'], 'proposta', 
 3500.00, 85, 'quente', 'indicacao'),
 
('Pedro Oliveira', 'Diretor', 'pedro@megapet.com', '11 4567-8901', '11 96543-2109', 
 'Mega Pet Distribuidora', '34.567.890/0001-12', 'Guarulhos', 'SP', 
 'Distribuidor', ARRAY['Ração Premium Gatos Adultos 10kg', 'Sachê Premium Cães 100g'], 'negociacao', 
 15000.00, 90, 'quente', 'feira'),
 
('Ana Costa', 'Compradora', 'ana@petcare.com', '11 5678-9012', '11 95432-1098', 
 'Pet Care Center', '45.678.901/0001-23', 'Santo André', 'SP', 
 'Pet Shop', ARRAY['Coleira Antipulgas', 'Bola Interativa'], 'novo', 
 2000.00, 30, 'morno', 'cold_call'),
 
('Carlos Ferreira', 'Proprietário', 'carlos@canil.com', '11 6789-0123', '11 94321-0987', 
 'Canil Amigos Fiéis', '56.789.012/0001-34', 'São Bernardo', 'SP', 
 'Canil', ARRAY['Ração Premium Cães Adultos 15kg'], 'contactado', 
 8000.00, 50, 'morno', 'email'),
 
('Lucia Mendes', 'Gerente', 'lucia@hotelcao.com', '11 7890-1234', '11 93210-9876', 
 'Hotel para Cães', '67.890.123/0001-45', 'Osasco', 'SP', 
 'Hotel Pet', ARRAY['Tapete Higiênico 30un', 'Shampoo Neutro 500ml'], 'qualificado', 
 4500.00, 65, 'quente', 'whatsapp');

-- Create a function to handle profile creation
CREATE OR REPLACE FUNCTION handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, status)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'vendedor'),
    'ativo'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE segmentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE servicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE agendamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE propostas ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposta_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE atividades ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Profiles: Users can read all profiles but only update their own
CREATE POLICY "Profiles are viewable by authenticated users" ON profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Vendedores: Authenticated users can view all
CREATE POLICY "Vendedores are manageable by authenticated users" ON vendedores
  FOR ALL TO authenticated USING (true);

-- Clientes: Authenticated users can manage all
CREATE POLICY "Clientes are manageable by authenticated users" ON clientes
  FOR ALL TO authenticated USING (true);

-- Categorias: Read for all, write for admins
CREATE POLICY "Categorias are viewable by authenticated users" ON categorias
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Categorias insert for admins" ON categorias
  FOR INSERT TO authenticated 
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Categorias update for admins" ON categorias
  FOR UPDATE TO authenticated 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Categorias delete for admins" ON categorias
  FOR DELETE TO authenticated 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Segmentos: Read for all, write for admins
CREATE POLICY "Segmentos are viewable by authenticated users" ON segmentos
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Segmentos insert for admins" ON segmentos
  FOR INSERT TO authenticated 
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Segmentos update for admins" ON segmentos
  FOR UPDATE TO authenticated 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Segmentos delete for admins" ON segmentos
  FOR DELETE TO authenticated 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Produtos: Read for all, write for admins
CREATE POLICY "Produtos are viewable by authenticated users" ON produtos
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Produtos insert for admins" ON produtos
  FOR INSERT TO authenticated 
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Produtos update for admins" ON produtos
  FOR UPDATE TO authenticated 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Produtos delete for admins" ON produtos
  FOR DELETE TO authenticated 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Servicos: Read for all, write for admins
CREATE POLICY "Servicos are viewable by authenticated users" ON servicos
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Servicos insert for admins" ON servicos
  FOR INSERT TO authenticated 
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Servicos update for admins" ON servicos
  FOR UPDATE TO authenticated 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Servicos delete for admins" ON servicos
  FOR DELETE TO authenticated 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Agendamentos: Users can manage all
CREATE POLICY "Agendamentos are manageable by authenticated users" ON agendamentos
  FOR ALL TO authenticated USING (true);

-- Propostas: Users can manage all
CREATE POLICY "Propostas are manageable by authenticated users" ON propostas
  FOR ALL TO authenticated USING (true);

-- Proposta Items: Users can manage all
CREATE POLICY "Proposta items are manageable by authenticated users" ON proposta_itens
  FOR ALL TO authenticated USING (true);

-- Atividades: Read only for authenticated users
CREATE POLICY "Atividades are viewable by authenticated users" ON atividades
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "System can insert atividades" ON atividades
  FOR INSERT TO authenticated WITH CHECK (true);
