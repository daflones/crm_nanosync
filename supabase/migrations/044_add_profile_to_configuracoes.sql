-- Add profile field to configuracoes table for multi-tenant support
ALTER TABLE configuracoes 
ADD COLUMN IF NOT EXISTS profile UUID REFERENCES profiles(id) ON DELETE CASCADE;

-- Add system settings fields that were missing
ALTER TABLE configuracoes 
ADD COLUMN IF NOT EXISTS backup_automatico BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS logs_auditoria BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS limite_arquivos_mb INTEGER DEFAULT 100;

-- Create index for profile field
CREATE INDEX IF NOT EXISTS idx_configuracoes_profile ON configuracoes(profile);

-- Drop existing RLS policies
DROP POLICY IF EXISTS "Users can view own configurations" ON configuracoes;
DROP POLICY IF EXISTS "Users can insert own configurations" ON configuracoes;
DROP POLICY IF EXISTS "Users can update own configurations" ON configuracoes;
DROP POLICY IF EXISTS "Users can delete own configurations" ON configuracoes;

-- Create new multi-tenant RLS policies
CREATE POLICY "Users can view company configurations" ON configuracoes
  FOR SELECT USING (
    profile IN (
      SELECT CASE 
        WHEN p.admin_profile_id IS NULL THEN p.id  -- User is admin
        ELSE p.admin_profile_id  -- User is vendedor, get admin profile
      END
      FROM profiles p 
      WHERE p.id = auth.uid()
    )
  );

CREATE POLICY "Users can insert company configurations" ON configuracoes
  FOR INSERT WITH CHECK (
    profile IN (
      SELECT CASE 
        WHEN p.admin_profile_id IS NULL THEN p.id  -- User is admin
        ELSE p.admin_profile_id  -- User is vendedor, get admin profile
      END
      FROM profiles p 
      WHERE p.id = auth.uid()
    )
  );

CREATE POLICY "Users can update company configurations" ON configuracoes
  FOR UPDATE USING (
    profile IN (
      SELECT CASE 
        WHEN p.admin_profile_id IS NULL THEN p.id  -- User is admin
        ELSE p.admin_profile_id  -- User is vendedor, get admin profile
      END
      FROM profiles p 
      WHERE p.id = auth.uid()
    )
  );

CREATE POLICY "Users can delete company configurations" ON configuracoes
  FOR DELETE USING (
    profile IN (
      SELECT CASE 
        WHEN p.admin_profile_id IS NULL THEN p.id  -- User is admin
        ELSE p.admin_profile_id  -- User is vendedor, get admin profile
      END
      FROM profiles p 
      WHERE p.id = auth.uid()
    )
  );

-- Update existing records to set profile field
UPDATE configuracoes 
SET profile = (
  SELECT CASE 
    WHEN p.admin_profile_id IS NULL THEN p.id
    ELSE p.admin_profile_id
  END
  FROM profiles p 
  WHERE p.id = configuracoes.user_id
)
WHERE profile IS NULL;

-- Make profile field NOT NULL after updating existing records
ALTER TABLE configuracoes 
ALTER COLUMN profile SET NOT NULL;
