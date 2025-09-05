-- Remove the tipo constraint from notificacoes table to allow any notification type
-- This gives full flexibility to insert any tipo value

-- Drop the constraint that's causing problems
ALTER TABLE notificacoes DROP CONSTRAINT IF EXISTS notificacoes_tipo_check;
