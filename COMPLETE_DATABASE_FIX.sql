-- 🔧 COMPLETE DATABASE FIX FOR LOGS
-- This script ensures your database structure matches what useCravingLogs expects

-- First, let's see what we're working with
SELECT 'Checking existing craving_logs table structure...' as info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'craving_logs' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Create the table if it doesn't exist
CREATE TABLE IF NOT EXISTS craving_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  intensity INTEGER NOT NULL CHECK (intensity >= 1 AND intensity <= 10),
  trigger TEXT,
  coping_strategy TEXT,
  notes TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- If the table exists but has old columns, migrate the data
DO $$
BEGIN
  -- Check if old columns exist and new columns don't
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'craving_logs' AND column_name = 'trigger_type') 
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'craving_logs' AND column_name = 'trigger') THEN
    
    RAISE NOTICE 'Migrating from old column structure to new...';
    
    -- Add new columns
    ALTER TABLE craving_logs ADD COLUMN IF NOT EXISTS trigger TEXT;
    ALTER TABLE craving_logs ADD COLUMN IF NOT EXISTS timestamp TIMESTAMPTZ DEFAULT NOW();
    
    -- Migrate existing data
    UPDATE craving_logs 
    SET 
      trigger = COALESCE(trigger_type, trigger_description, 'Unknown trigger'),
      timestamp = COALESCE(created_at, NOW())
    WHERE trigger IS NULL OR timestamp IS NULL;
    
    -- Drop old columns
    ALTER TABLE craving_logs DROP COLUMN IF EXISTS trigger_type;
    ALTER TABLE craving_logs DROP COLUMN IF EXISTS trigger_description;
    
    RAISE NOTICE 'Data migration completed successfully!';
  END IF;
  
  -- Ensure required columns exist
  ALTER TABLE craving_logs ADD COLUMN IF NOT EXISTS trigger TEXT;
  ALTER TABLE craving_logs ADD COLUMN IF NOT EXISTS timestamp TIMESTAMPTZ DEFAULT NOW();
  
END
$$;

-- Enable RLS if not already enabled
ALTER TABLE craving_logs ENABLE ROW LEVEL SECURITY;

-- Recreate policies (they'll be ignored if they exist)
DROP POLICY IF EXISTS "Users can view own craving logs" ON craving_logs;
DROP POLICY IF EXISTS "Users can insert own craving logs" ON craving_logs;
DROP POLICY IF EXISTS "Users can update own craving logs" ON craving_logs;
DROP POLICY IF EXISTS "Users can delete own craving logs" ON craving_logs;

CREATE POLICY "Users can view own craving logs" ON craving_logs 
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own craving logs" ON craving_logs 
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own craving logs" ON craving_logs 
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own craving logs" ON craving_logs 
    FOR DELETE USING (auth.uid() = user_id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_craving_logs_user ON craving_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_craving_logs_timestamp ON craving_logs(timestamp);

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON craving_logs TO authenticated;

-- Verify final structure
SELECT 'Final craving_logs table structure:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'craving_logs' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Test query to ensure it works
SELECT 'Testing query compatibility...' as info;
SELECT COUNT(*) as total_logs FROM craving_logs;

SELECT '✅ Database fix completed! Your logs should now load properly.' as result; 