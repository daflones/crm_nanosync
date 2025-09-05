-- Add cargo column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cargo TEXT;
