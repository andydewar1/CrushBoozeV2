-- 🔧 FIX LOGS AND GOALS DATABASE SCHEMA

-- Fix craving_logs table to match what useCravingLogs expects
-- First, add the new columns
ALTER TABLE craving_logs 
ADD COLUMN IF NOT EXISTS trigger TEXT,
ADD COLUMN IF NOT EXISTS timestamp TIMESTAMPTZ DEFAULT NOW();

-- Update existing records to use the new structure BEFORE dropping old columns
UPDATE craving_logs 
SET 
  trigger = COALESCE(trigger_type, trigger_description, 'Unknown trigger'),
  timestamp = COALESCE(created_at, NOW())
WHERE trigger IS NULL OR timestamp IS NULL;

-- Now drop the old columns after data has been migrated
ALTER TABLE craving_logs 
DROP COLUMN IF EXISTS trigger_type,
DROP COLUMN IF EXISTS trigger_description;

-- Fix goals table to match what useGoals expects  
-- First add the new column
ALTER TABLE goals
ADD COLUMN IF NOT EXISTS name TEXT;

-- Update existing records BEFORE dropping old column
UPDATE goals 
SET name = COALESCE(title, 'Unnamed Goal')
WHERE name IS NULL;

-- Drop the old column after data migration
ALTER TABLE goals
DROP COLUMN IF EXISTS title;

-- Make name required
ALTER TABLE goals ALTER COLUMN name SET NOT NULL;

-- Verify the tables are correct
SELECT 'craving_logs columns:' as info;
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'craving_logs' AND table_schema = 'public';

SELECT 'goals columns:' as info; 
SELECT column_name FROM information_schema.columns
WHERE table_name = 'goals' AND table_schema = 'public'; 