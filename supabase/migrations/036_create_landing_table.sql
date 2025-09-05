-- Create landing table for lead capture
CREATE TABLE IF NOT EXISTS landing (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  whatsapp VARCHAR(20) NOT NULL,
  email VARCHAR(255) NOT NULL,
  nome_empresa VARCHAR(255) NOT NULL,
  setor_empresa VARCHAR(100),
  numero_funcionarios VARCHAR(50),
  principal_desafio TEXT[],
  experiencia_crm BOOLEAN DEFAULT false,
  faixa_orcamento VARCHAR(100),
  necessidade_especifica TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_landing_created_at ON landing(created_at);
CREATE INDEX IF NOT EXISTS idx_landing_email ON landing(email);
CREATE INDEX IF NOT EXISTS idx_landing_whatsapp ON landing(whatsapp);

-- Add RLS policies
ALTER TABLE landing ENABLE ROW LEVEL SECURITY;

-- Allow public inserts (for lead capture)
CREATE POLICY "Allow public inserts" ON landing
  FOR INSERT 
  WITH CHECK (true);

-- Allow admins to read all leads
CREATE POLICY "Allow admin read" ON landing
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_landing_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_landing_updated_at
  BEFORE UPDATE ON landing
  FOR EACH ROW
  EXECUTE FUNCTION update_landing_updated_at();
