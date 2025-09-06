-- Fix 406 error on profiles table by updating RLS policies
-- This migration addresses the "Not Acceptable" error during profile creation

-- Drop existing problematic policies
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_delete_policy" ON profiles;

-- Create simplified policies that work with Supabase auth

-- Allow all authenticated users to read profiles (needed for app functionality)
CREATE POLICY "Enable read access for authenticated users" ON profiles
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow users to insert their own profile during registration
-- Also allow service role for admin operations
CREATE POLICY "Enable insert for users and service role" ON profiles
  FOR INSERT WITH CHECK (
    auth.uid() = id OR 
    auth.role() = 'service_role'
  );

-- Allow users to update their own profile
-- Allow admins to update any profile in their company
CREATE POLICY "Enable update for users and admins" ON profiles
  FOR UPDATE USING (
    auth.uid() = id OR
    (
      EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid() 
        AND p.role = 'admin'
        AND (
          p.admin_profile_id = profiles.admin_profile_id OR
          p.id = profiles.admin_profile_id OR
          profiles.admin_profile_id IS NULL
        )
      )
    )
  );

-- Allow admins to delete profiles in their company (except themselves)
CREATE POLICY "Enable delete for admins" ON profiles
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() 
      AND p.role = 'admin'
      AND profiles.id != auth.uid()
      AND (
        p.admin_profile_id = profiles.admin_profile_id OR
        p.id = profiles.admin_profile_id
      )
    )
  );

-- Ensure RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
