-- Fix RLS policies for profiles table to allow admin to create vendedor profiles
-- This migration fixes the conflict between role-based access control and profile creation

-- Drop existing policies on profiles table
DROP POLICY IF EXISTS "Users can create profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update profiles" ON profiles;
DROP POLICY IF EXISTS "Users can delete profiles" ON profiles;

-- Create new policies that allow proper profile management

-- Allow authenticated users to view profiles (needed for CRM operations)
CREATE POLICY "profiles_select_policy" ON profiles
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow profile creation for:
-- 1. New user registration (self-creation)
-- 2. Admin creating vendedor profiles
CREATE POLICY "profiles_insert_policy" ON profiles
  FOR INSERT WITH CHECK (
    -- Allow self-creation during registration
    auth.uid() = id OR
    -- Allow admin to create profiles for vendedores
    (
      auth.role() = 'authenticated' AND
      EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role = 'admin'
      )
    )
  );

-- Allow profile updates for:
-- 1. Self-updates
-- 2. Admin updating any profile
CREATE POLICY "profiles_update_policy" ON profiles
  FOR UPDATE USING (
    -- Allow self-updates
    auth.uid() = id OR
    -- Allow admin to update any profile
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  ) WITH CHECK (
    -- Same conditions for WITH CHECK
    auth.uid() = id OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Allow profile deletion for admins only (except self-deletion)
CREATE POLICY "profiles_delete_policy" ON profiles
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Ensure RLS is enabled on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
