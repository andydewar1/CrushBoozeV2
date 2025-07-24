-- CrushNic V2 Database Schema
-- This file contains all necessary tables for the onboarding and user data

-- Drop everything first to avoid conflicts
DROP TABLE IF EXISTS craving_logs CASCADE;
DROP TABLE IF EXISTS financial_goals CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;

-- Create profiles table for storing user onboarding data
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    quit_date TIMESTAMPTZ NOT NULL,
    has_quit BOOLEAN NOT NULL DEFAULT false,
    personal_goals TEXT[] NOT NULL DEFAULT '{}',
    quit_reasons TEXT[] NOT NULL DEFAULT '{}',
    quit_reason TEXT NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    financial_goal_description TEXT NOT NULL,
    financial_goal_amount DECIMAL(10,2) NOT NULL,
    daily_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
    vape_types JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create financial_goals table for storing user financial goals
CREATE TABLE financial_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    target_amount DECIMAL(10,2) NOT NULL,
    description TEXT,
    achieved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create craving_logs table for storing user craving logs
CREATE TABLE craving_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    intensity INTEGER NOT NULL CHECK (intensity >= 1 AND intensity <= 10),
    trigger TEXT NOT NULL,
    coping_strategy TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_profiles_id ON profiles(id);
CREATE INDEX idx_financial_goals_user_id ON financial_goals(user_id);
CREATE INDEX idx_craving_logs_user_id ON craving_logs(user_id);
CREATE INDEX idx_craving_logs_timestamp ON craving_logs(timestamp);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_financial_goals_updated_at ON financial_goals;
CREATE TRIGGER update_financial_goals_updated_at 
    BEFORE UPDATE ON financial_goals 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_craving_logs_updated_at ON craving_logs;
CREATE TRIGGER update_craving_logs_updated_at 
    BEFORE UPDATE ON craving_logs 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE craving_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

DROP POLICY IF EXISTS "Users can view own financial goals" ON financial_goals;
DROP POLICY IF EXISTS "Users can insert own financial goals" ON financial_goals;
DROP POLICY IF EXISTS "Users can update own financial goals" ON financial_goals;
DROP POLICY IF EXISTS "Users can delete own financial goals" ON financial_goals;

DROP POLICY IF EXISTS "Users can view own craving logs" ON craving_logs;
DROP POLICY IF EXISTS "Users can insert own craving logs" ON craving_logs;
DROP POLICY IF EXISTS "Users can update own craving logs" ON craving_logs;
DROP POLICY IF EXISTS "Users can delete own craving logs" ON craving_logs;

-- Create RLS policies for profiles
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Create RLS policies for financial_goals
CREATE POLICY "Users can view own financial goals" ON financial_goals 
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own financial goals" ON financial_goals 
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own financial goals" ON financial_goals 
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own financial goals" ON financial_goals 
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for craving_logs
CREATE POLICY "Users can view own craving logs" ON craving_logs 
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own craving logs" ON craving_logs 
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own craving logs" ON craving_logs 
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own craving logs" ON craving_logs 
    FOR DELETE USING (auth.uid() = user_id);

-- Add helpful comments
COMMENT ON TABLE profiles IS 'User profiles with onboarding data and quit journey information';
COMMENT ON TABLE financial_goals IS 'User financial goals for motivation during quit journey';
COMMENT ON TABLE craving_logs IS 'User craving logs to track and analyze craving patterns'; 