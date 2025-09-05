-- Add nome and email columns to vendedores table to avoid profile dependency

ALTER TABLE vendedores 
ADD COLUMN IF NOT EXISTS nome VARCHAR(255),
ADD COLUMN IF NOT EXISTS email VARCHAR(255);
