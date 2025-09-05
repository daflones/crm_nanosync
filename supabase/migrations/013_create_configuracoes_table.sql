-- Create configuracoes table for user settings
CREATE TABLE IF NOT EXISTS configuracoes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Notification settings
  notificacoes_email BOOLEAN DEFAULT true,
  notificacoes_novos_clientes BOOLEAN DEFAULT true,
  notificacoes_propostas_vencendo BOOLEAN DEFAULT true,
  notificacoes_agendamentos BOOLEAN DEFAULT true,
  
  -- Appearance settings
  tema VARCHAR(10) DEFAULT 'light' CHECK (tema IN ('light', 'dark')),
  idioma VARCHAR(10) DEFAULT 'pt-BR' CHECK (idioma IN ('pt-BR', 'en-US', 'es-ES')),
  
  -- Security settings
  two_factor_enabled BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  
  -- Ensure one config per user
  UNIQUE(user_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_configuracoes_user_id ON configuracoes(user_id);

-- Enable RLS (Row Level Security)
ALTER TABLE configuracoes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own configurations" ON configuracoes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own configurations" ON configuracoes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own configurations" ON configuracoes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own configurations" ON configuracoes
  FOR DELETE USING (auth.uid() = user_id);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_configuracoes_updated_at
  BEFORE UPDATE ON configuracoes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
