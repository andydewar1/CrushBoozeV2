-- 🍺 CRUSHBOOZE DATABASE MIGRATION 🍺
-- Run this in Supabase SQL Editor to add the new column

-- Add name column for personalization ("Hey Andy!")
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS name TEXT DEFAULT '';

-- Verify the change
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name = 'name';

-- That's it! Just one new column.
-- The existing daily_cost field is reused (we save weeklySpend ÷ 7)
