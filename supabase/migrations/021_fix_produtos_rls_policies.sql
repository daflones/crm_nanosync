-- Fix produtos RLS policies to allow all authenticated users to manage products
-- This migration updates the produtos table policies to allow CRUD operations for all authenticated users

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Produtos insert for admins" ON produtos;
DROP POLICY IF EXISTS "Produtos update for admins" ON produtos;
DROP POLICY IF EXISTS "Produtos delete for admins" ON produtos;

-- Create new policies that allow all authenticated users to manage products
CREATE POLICY "Produtos insert for authenticated users" ON produtos
  FOR INSERT TO authenticated 
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Produtos update for authenticated users" ON produtos
  FOR UPDATE TO authenticated 
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Produtos delete for authenticated users" ON produtos
  FOR DELETE TO authenticated 
  USING (auth.uid() IS NOT NULL);

-- The SELECT policy remains the same (already allows all authenticated users)
-- CREATE POLICY "Produtos are viewable by authenticated users" ON produtos
--   FOR SELECT TO authenticated USING (true);
