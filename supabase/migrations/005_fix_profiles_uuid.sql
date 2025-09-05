-- Fix profiles table to auto-generate UUID for id field

-- Make sure the profiles table has proper UUID default
ALTER TABLE profiles ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Ensure the id column is properly configured as UUID
ALTER TABLE profiles ALTER COLUMN id SET DATA TYPE uuid USING id::uuid;
