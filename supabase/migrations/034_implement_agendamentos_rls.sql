-- Implement RLS policies for agendamentos table
-- Vendedores can only see their own agendamentos, admins can see all

-- Enable RLS on agendamentos table
ALTER TABLE agendamentos ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view own agendamentos" ON agendamentos;
DROP POLICY IF EXISTS "Users can insert own agendamentos" ON agendamentos;
DROP POLICY IF EXISTS "Users can update own agendamentos" ON agendamentos;
DROP POLICY IF EXISTS "Users can delete own agendamentos" ON agendamentos;

-- Policy for SELECT: Admins see all, vendedores see only their own
CREATE POLICY "Users can view agendamentos based on role" ON agendamentos
  FOR SELECT USING (
    -- Admin can see all
    (auth.jwt() -> 'user_metadata' ->> 'role')::text = 'admin'
    OR
    -- Vendedores can only see their own
    user_id = auth.uid()
  );

-- Policy for INSERT: Users can only insert with their own user_id
CREATE POLICY "Users can insert own agendamentos" ON agendamentos
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
  );

-- Policy for UPDATE: Admins can update all, vendedores can only update their own
CREATE POLICY "Users can update agendamentos based on role" ON agendamentos
  FOR UPDATE USING (
    -- Admin can update all
    (auth.jwt() -> 'user_metadata' ->> 'role')::text = 'admin'
    OR
    -- Vendedores can only update their own
    user_id = auth.uid()
  );

-- Policy for DELETE: Admins can delete all, vendedores can only delete their own
CREATE POLICY "Users can delete agendamentos based on role" ON agendamentos
  FOR DELETE USING (
    -- Admin can delete all
    (auth.jwt() -> 'user_metadata' ->> 'role')::text = 'admin'
    OR
    -- Vendedores can only delete their own
    user_id = auth.uid()
  );
