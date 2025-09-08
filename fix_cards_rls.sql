-- Fix RLS policies for cards table

-- Add user_id column if it doesn't exist
ALTER TABLE cards ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Enable RLS on cards table
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can insert their own cards" ON cards;
DROP POLICY IF EXISTS "Users can view their own cards" ON cards;
DROP POLICY IF EXISTS "Users can update their own cards" ON cards;
DROP POLICY IF EXISTS "Users can delete their own cards" ON cards;

-- Create policies for cards table
-- Allow users to insert their own cards
CREATE POLICY "Users can insert their own cards" ON cards
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow users to view their own cards
CREATE POLICY "Users can view their own cards" ON cards
    FOR SELECT USING (auth.uid() = user_id);

-- Allow users to update their own cards
CREATE POLICY "Users can update their own cards" ON cards
    FOR UPDATE USING (auth.uid() = user_id);

-- Allow users to delete their own cards
CREATE POLICY "Users can delete their own cards" ON cards
    FOR DELETE USING (auth.uid() = user_id);

-- Grant necessary permissions
GRANT ALL ON cards TO authenticated;
GRANT ALL ON cards TO anon;
