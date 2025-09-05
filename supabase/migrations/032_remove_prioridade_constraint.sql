-- Remove the prioridade constraint completely to allow any value
-- This gives full flexibility to insert any prioridade value

-- Drop the constraint that's causing problems
ALTER TABLE notificacoes DROP CONSTRAINT IF EXISTS notificacoes_prioridade_check;

-- Set default to 'media' but allow any value
ALTER TABLE notificacoes ALTER COLUMN prioridade SET DEFAULT 'media';

-- No constraint = complete freedom to insert any prioridade value
