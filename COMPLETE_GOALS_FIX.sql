-- 🎯 COMPLETE GOALS FIX
-- This script ensures onboarding financial goals show up on the goals page

-- First, let's see what tables exist
SELECT 'Checking existing tables...' as info;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name IN ('profiles', 'financial_goals', 'goals')
ORDER BY table_name;

-- Create financial_goals table if it doesn't exist
CREATE TABLE IF NOT EXISTS financial_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  target_amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  achieved_at TIMESTAMPTZ,
  is_primary BOOLEAN DEFAULT false,
  baseline_amount DECIMAL(10,2) DEFAULT 0.00,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns to existing financial_goals table
DO $$
BEGIN
  -- Add is_primary column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'financial_goals' AND column_name = 'is_primary') THEN
    ALTER TABLE financial_goals ADD COLUMN is_primary BOOLEAN DEFAULT false;
    RAISE NOTICE 'Added is_primary column to financial_goals table';
  END IF;
  
  -- Add baseline_amount column if it doesn't exist  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'financial_goals' AND column_name = 'baseline_amount') THEN
    ALTER TABLE financial_goals ADD COLUMN baseline_amount DECIMAL(10,2) DEFAULT 0.00;
    RAISE NOTICE 'Added baseline_amount column to financial_goals table';
  END IF;
  
  -- Add updated_at column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'financial_goals' AND column_name = 'updated_at') THEN
    ALTER TABLE financial_goals ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    RAISE NOTICE 'Added updated_at column to financial_goals table';
  END IF;
END
$$;

-- Also create/fix the goals table for compatibility 
CREATE TABLE IF NOT EXISTS goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  target_amount DECIMAL(10,2),
  current_amount DECIMAL(10,2) DEFAULT 0.00,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migrate onboarding financial goals from profiles to financial_goals table
DO $$
BEGIN
  -- Check if profiles table exists and has financial goal data
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
    
    RAISE NOTICE 'Migrating onboarding financial goals from profiles to financial_goals table...';
    
    -- Insert financial goals from profiles where they don't already exist in financial_goals
    INSERT INTO financial_goals (user_id, name, target_amount, description, is_primary, created_at)
    SELECT 
      p.id as user_id,
      COALESCE(p.financial_goal_description, 'My Financial Goal') as name,
      COALESCE(p.financial_goal_amount, 0) as target_amount,
      p.financial_goal_description as description,
      true as is_primary, -- Mark onboarding goals as primary
      COALESCE(p.created_at, NOW()) as created_at
    FROM profiles p
    WHERE p.financial_goal_amount > 0 
      AND p.financial_goal_description IS NOT NULL 
      AND p.financial_goal_description != ''
      AND NOT EXISTS (
        SELECT 1 FROM financial_goals fg 
        WHERE fg.user_id = p.id 
        AND fg.description = p.financial_goal_description
        AND fg.target_amount = p.financial_goal_amount
      );
    
    RAISE NOTICE 'Migration completed!';
  END IF;
END
$$;

-- Enable RLS on all tables
ALTER TABLE financial_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Users can view own financial goals" ON financial_goals;
DROP POLICY IF EXISTS "Users can insert own financial goals" ON financial_goals;
DROP POLICY IF EXISTS "Users can update own financial goals" ON financial_goals;
DROP POLICY IF EXISTS "Users can delete own financial goals" ON financial_goals;

DROP POLICY IF EXISTS "Users can view own goals" ON goals;
DROP POLICY IF EXISTS "Users can insert own goals" ON goals;
DROP POLICY IF EXISTS "Users can update own goals" ON goals;
DROP POLICY IF EXISTS "Users can delete own goals" ON goals;

-- Create security policies for financial_goals
CREATE POLICY "Users can view own financial goals" ON financial_goals 
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own financial goals" ON financial_goals 
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own financial goals" ON financial_goals 
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own financial goals" ON financial_goals 
    FOR DELETE USING (auth.uid() = user_id);

-- Create security policies for goals table
CREATE POLICY "Users can view own goals" ON goals 
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own goals" ON goals 
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own goals" ON goals 
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own goals" ON goals 
    FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_financial_goals_user ON financial_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_financial_goals_primary ON financial_goals(user_id, is_primary);
CREATE INDEX IF NOT EXISTS idx_goals_user ON goals(user_id);

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON financial_goals TO authenticated;
GRANT ALL ON goals TO authenticated;

-- Verify final structure and data
SELECT 'Final financial_goals table structure:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'financial_goals' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Show migrated goals
SELECT 'Migrated financial goals:' as info;
SELECT 
  fg.name,
  fg.target_amount,
  fg.description,
  fg.is_primary,
  fg.created_at
FROM financial_goals fg
ORDER BY fg.created_at DESC
LIMIT 10;

SELECT '✅ Goals system fix completed! Onboarding goals should now appear on the goals page.' as result; 