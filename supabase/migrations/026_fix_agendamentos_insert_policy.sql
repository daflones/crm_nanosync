-- Fix agendamentos insert policy to allow null user_id temporarily
-- This is needed until we implement proper authentication

-- Drop existing insert policy
DROP POLICY IF EXISTS "agendamentos_insert_policy" ON agendamentos;

-- Create new insert policy that allows null user_id for development
CREATE POLICY "agendamentos_insert_policy" ON agendamentos
FOR INSERT
WITH CHECK (
  -- Allow inserts with null user_id for development
  -- OR authenticated users can insert with their user_id
  user_id IS NULL OR 
  (auth.uid() IS NOT NULL AND user_id = auth.uid())
);

-- Update comment
COMMENT ON POLICY "agendamentos_insert_policy" ON agendamentos IS 'Permite inserção com user_id null para desenvolvimento ou com user_id do usuário autenticado';
