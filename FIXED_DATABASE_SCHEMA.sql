-- 🚨 CORRECTED DATABASE SCHEMA - RUN THIS IN SUPABASE SQL EDITOR 🚨
-- This fixes the table name mismatch issue

-- Drop everything and start fresh
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP FUNCTION IF EXISTS handle_new_user CASCADE;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create profiles table (NOT user_profiles!)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Onboarding data (all required)
    quit_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    has_quit BOOLEAN NOT NULL DEFAULT false,
    personal_goals TEXT[] NOT NULL DEFAULT '{}',
    quit_reasons TEXT[] NOT NULL DEFAULT '{}',
    quit_reason TEXT NOT NULL DEFAULT '',
    vape_types JSONB NOT NULL DEFAULT '[]',
    currency TEXT NOT NULL DEFAULT 'USD',
    daily_cost DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    financial_goal_description TEXT NOT NULL DEFAULT '',
    financial_goal_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    
    -- Metadata
    onboarding_completed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (
        id,
        quit_date,
        has_quit,
        personal_goals,
        quit_reasons,
        quit_reason,
        vape_types,
        currency,
        daily_cost,
        financial_goal_description,
        financial_goal_amount,
        onboarding_completed
    ) VALUES (
        NEW.id,
        NOW(),
        false,
        ARRAY[]::TEXT[],
        ARRAY[]::TEXT[],
        '',
        '[]'::JSONB,
        'USD',
        0.00,
        '',
        0.00,
        false
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile on user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Create financial_goals table
CREATE TABLE IF NOT EXISTS financial_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  target_amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  achieved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for financial_goals
ALTER TABLE financial_goals ENABLE ROW LEVEL SECURITY;

-- Financial goals policies
CREATE POLICY "Users can view own financial goals" ON financial_goals 
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own financial goals" ON financial_goals 
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own financial goals" ON financial_goals 
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own financial goals" ON financial_goals 
    FOR DELETE USING (auth.uid() = user_id);

-- Create craving_logs table
CREATE TABLE IF NOT EXISTS craving_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  intensity INTEGER NOT NULL CHECK (intensity >= 1 AND intensity <= 10),
  trigger_type TEXT,
  trigger_description TEXT,
  coping_strategy TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for craving_logs
ALTER TABLE craving_logs ENABLE ROW LEVEL SECURITY;

-- Craving logs policies
CREATE POLICY "Users can view own craving logs" ON craving_logs 
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own craving logs" ON craving_logs 
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own craving logs" ON craving_logs 
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own craving logs" ON craving_logs 
    FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_profiles_id ON profiles(id);
CREATE INDEX idx_profiles_onboarding ON profiles(onboarding_completed);
CREATE INDEX idx_financial_goals_user ON financial_goals(user_id);
CREATE INDEX idx_craving_logs_user ON craving_logs(user_id);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON financial_goals TO authenticated;
GRANT ALL ON craving_logs TO authenticated;
GRANT SELECT ON profiles TO anon; 