-- Migration to update tempo_resposta from seconds to milliseconds
-- This migration renames the column and converts existing values

-- Step 1: Add new column with milliseconds
ALTER TABLE ia_config 
ADD COLUMN tempo_resposta_ms INTEGER DEFAULT 2000 
CHECK (tempo_resposta_ms >= 1000 AND tempo_resposta_ms <= 30000);

-- Step 2: Convert existing data from seconds to milliseconds
UPDATE ia_config 
SET tempo_resposta_ms = COALESCE(tempo_resposta_segundos * 1000, 2000)
WHERE tempo_resposta_segundos IS NOT NULL;

-- Step 3: Drop the old column
ALTER TABLE ia_config 
DROP COLUMN IF EXISTS tempo_resposta_segundos;

-- Step 4: Add comment for documentation
COMMENT ON COLUMN ia_config.tempo_resposta_ms IS 'Response time in milliseconds (1000-30000ms = 1-30 seconds)';
