-- Fix RLS policies for profiles table to allow vendedor creation

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can create profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update profiles" ON profiles;

-- Allow authenticated users to create profiles
CREATE POLICY "Users can create profiles" ON profiles
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to view all profiles (needed for CRM)
CREATE POLICY "Users can view all profiles" ON profiles
FOR SELECT USING (auth.role() = 'authenticated');

-- Allow authenticated users to update profiles
CREATE POLICY "Users can update profiles" ON profiles
FOR UPDATE USING (auth.role() = 'authenticated');

-- Allow authenticated users to delete profiles
CREATE POLICY "Users can delete profiles" ON profiles
FOR DELETE USING (auth.role() = 'authenticated');
