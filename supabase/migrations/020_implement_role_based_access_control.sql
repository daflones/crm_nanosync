-- Migration: Implement Role-Based Access Control
-- This migration implements comprehensive RLS policies for vendedores and admin roles

-- Enable RLS on all tables that need access control
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE propostas ENABLE ROW LEVEL SECURITY;
ALTER TABLE arquivos ENABLE ROW LEVEL SECURITY;
ALTER TABLE arquivos_ia ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendedores ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT role 
    FROM profiles 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get current user's vendedor_id
CREATE OR REPLACE FUNCTION get_current_vendedor_id()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT v.id 
    FROM vendedores v
    JOIN profiles p ON p.id = v.user_id
    WHERE p.id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies for CLIENTES table
-- Admins can see all clients, vendedores can ONLY see clients specifically assigned to them
DROP POLICY IF EXISTS "clientes_select_policy" ON clientes;
CREATE POLICY "clientes_select_policy" ON clientes
  FOR SELECT USING (
    get_user_role() = 'admin' OR 
    (get_user_role() = 'vendedor' AND vendedor_id = get_current_vendedor_id() AND vendedor_id IS NOT NULL)
  );

-- Admins can insert clients for any vendedor, vendedores can only create clients for themselves
DROP POLICY IF EXISTS "clientes_insert_policy" ON clientes;
CREATE POLICY "clientes_insert_policy" ON clientes
  FOR INSERT WITH CHECK (
    get_user_role() = 'admin' OR 
    (get_user_role() = 'vendedor' AND vendedor_id = get_current_vendedor_id() AND vendedor_id IS NOT NULL)
  );

-- Admins can update any client, vendedores can only update their own assigned clients
DROP POLICY IF EXISTS "clientes_update_policy" ON clientes;
CREATE POLICY "clientes_update_policy" ON clientes
  FOR UPDATE USING (
    get_user_role() = 'admin' OR 
    (get_user_role() = 'vendedor' AND vendedor_id = get_current_vendedor_id() AND vendedor_id IS NOT NULL)
  ) WITH CHECK (
    get_user_role() = 'admin' OR 
    (get_user_role() = 'vendedor' AND vendedor_id = get_current_vendedor_id() AND vendedor_id IS NOT NULL)
  );

-- Admins can delete any client, vendedores can only delete their own assigned clients
DROP POLICY IF EXISTS "clientes_delete_policy" ON clientes;
CREATE POLICY "clientes_delete_policy" ON clientes
  FOR DELETE USING (
    get_user_role() = 'admin' OR 
    (get_user_role() = 'vendedor' AND vendedor_id = get_current_vendedor_id() AND vendedor_id IS NOT NULL)
  );

-- RLS Policies for PROPOSTAS table
-- Admins can see all proposals, vendedores can only see their own proposals
DROP POLICY IF EXISTS "propostas_select_policy" ON propostas;
CREATE POLICY "propostas_select_policy" ON propostas
  FOR SELECT USING (
    get_user_role() = 'admin' OR 
    vendedor_id = get_current_vendedor_id()
  );

-- Admins can insert proposals for any vendedor, vendedores can only create proposals for themselves
DROP POLICY IF EXISTS "propostas_insert_policy" ON propostas;
CREATE POLICY "propostas_insert_policy" ON propostas
  FOR INSERT WITH CHECK (
    get_user_role() = 'admin' OR 
    vendedor_id = get_current_vendedor_id()
  );

-- Admins can update any proposal, vendedores can only update their own proposals
DROP POLICY IF EXISTS "propostas_update_policy" ON propostas;
CREATE POLICY "propostas_update_policy" ON propostas
  FOR UPDATE USING (
    get_user_role() = 'admin' OR 
    vendedor_id = get_current_vendedor_id()
  ) WITH CHECK (
    get_user_role() = 'admin' OR 
    vendedor_id = get_current_vendedor_id()
  );

-- Admins can delete any proposal, vendedores can only delete their own proposals
DROP POLICY IF EXISTS "propostas_delete_policy" ON propostas;
CREATE POLICY "propostas_delete_policy" ON propostas
  FOR DELETE USING (
    get_user_role() = 'admin' OR 
    vendedor_id = get_current_vendedor_id()
  );

-- RLS Policies for ARQUIVOS table
-- Admins can see all files, vendedores can only see public files
DROP POLICY IF EXISTS "arquivos_select_policy" ON arquivos;
CREATE POLICY "arquivos_select_policy" ON arquivos
  FOR SELECT USING (
    get_user_role() = 'admin' OR 
    (get_user_role() = 'vendedor' AND is_public = true)
  );

-- Admins can insert any file, vendedores can insert files
DROP POLICY IF EXISTS "arquivos_insert_policy" ON arquivos;
CREATE POLICY "arquivos_insert_policy" ON arquivos
  FOR INSERT WITH CHECK (
    get_user_role() = 'admin' OR 
    get_user_role() = 'vendedor'
  );

-- Only admins can update files
DROP POLICY IF EXISTS "arquivos_update_policy" ON arquivos;
CREATE POLICY "arquivos_update_policy" ON arquivos
  FOR UPDATE USING (
    get_user_role() = 'admin'
  ) WITH CHECK (
    get_user_role() = 'admin'
  );

-- Only admins can delete files
DROP POLICY IF EXISTS "arquivos_delete_policy" ON arquivos;
CREATE POLICY "arquivos_delete_policy" ON arquivos
  FOR DELETE USING (
    get_user_role() = 'admin'
  );

-- RLS Policies for ARQUIVOS_IA table
-- Admins can see all AI files, vendedores can only see public AI files and their own files
DROP POLICY IF EXISTS "arquivos_ia_select_policy" ON arquivos_ia;
CREATE POLICY "arquivos_ia_select_policy" ON arquivos_ia
  FOR SELECT USING (
    get_user_role() = 'admin' OR 
    (get_user_role() = 'vendedor' AND (visibilidade = 'publico' OR criado_por = auth.uid()))
  );

-- Admins can insert any AI file, vendedores can insert AI files
DROP POLICY IF EXISTS "arquivos_ia_insert_policy" ON arquivos_ia;
CREATE POLICY "arquivos_ia_insert_policy" ON arquivos_ia
  FOR INSERT WITH CHECK (
    get_user_role() = 'admin' OR 
    get_user_role() = 'vendedor'
  );

-- Admins can update any AI file, vendedores can only update their own AI files
DROP POLICY IF EXISTS "arquivos_ia_update_policy" ON arquivos_ia;
CREATE POLICY "arquivos_ia_update_policy" ON arquivos_ia
  FOR UPDATE USING (
    get_user_role() = 'admin' OR 
    (get_user_role() = 'vendedor' AND criado_por = auth.uid())
  ) WITH CHECK (
    get_user_role() = 'admin' OR 
    (get_user_role() = 'vendedor' AND criado_por = auth.uid())
  );

-- Admins can delete any AI file, vendedores can only delete their own AI files
DROP POLICY IF EXISTS "arquivos_ia_delete_policy" ON arquivos_ia;
CREATE POLICY "arquivos_ia_delete_policy" ON arquivos_ia
  FOR DELETE USING (
    get_user_role() = 'admin' OR 
    (get_user_role() = 'vendedor' AND criado_por = auth.uid())
  );

-- RLS Policies for VENDEDORES table
-- Admins can see all vendedores, vendedores can see all vendedores (for client assignment)
DROP POLICY IF EXISTS "vendedores_select_policy" ON vendedores;
CREATE POLICY "vendedores_select_policy" ON vendedores
  FOR SELECT USING (
    get_user_role() = 'admin' OR 
    get_user_role() = 'vendedor'
  );

-- Only admins can insert vendedores
DROP POLICY IF EXISTS "vendedores_insert_policy" ON vendedores;
CREATE POLICY "vendedores_insert_policy" ON vendedores
  FOR INSERT WITH CHECK (
    get_user_role() = 'admin'
  );

-- Admins can update any vendedor, vendedores can only update their own profile
DROP POLICY IF EXISTS "vendedores_update_policy" ON vendedores;
CREATE POLICY "vendedores_update_policy" ON vendedores
  FOR UPDATE USING (
    get_user_role() = 'admin' OR 
    (get_user_role() = 'vendedor' AND id = get_current_vendedor_id())
  ) WITH CHECK (
    get_user_role() = 'admin' OR 
    (get_user_role() = 'vendedor' AND id = get_current_vendedor_id())
  );

-- Only admins can delete vendedores
DROP POLICY IF EXISTS "vendedores_delete_policy" ON vendedores;
CREATE POLICY "vendedores_delete_policy" ON vendedores
  FOR DELETE USING (
    get_user_role() = 'admin'
  );

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
