-- 🍷 CRUSHBOOZE DATABASE SETUP - Exact CrushNic schema + name field 🍷
-- Run this in Supabase SQL Editor for your new CrushBooze project

-- 1. DROP ANY EXISTING TABLES (clean slate)
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS financial_goals CASCADE;
DROP TABLE IF EXISTS craving_logs CASCADE;
DROP TABLE IF EXISTS goals CASCADE;
DROP TABLE IF EXISTS achievements CASCADE;
DROP TABLE IF EXISTS user_achievements CASCADE;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. CREATE PROFILES TABLE
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Basic info
    name TEXT NOT NULL DEFAULT '',
    quit_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    has_quit BOOLEAN NOT NULL DEFAULT false,
    
    -- Onboarding data
    personal_goals TEXT[] NOT NULL DEFAULT '{}',
    quit_reasons TEXT[] NOT NULL DEFAULT '{}',
    quit_reason TEXT NOT NULL DEFAULT '',
    
    -- Financial data (daily_cost = weeklySpend / 7)
    currency TEXT NOT NULL DEFAULT 'USD',
    daily_cost DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    financial_goal_description TEXT NOT NULL DEFAULT '',
    financial_goal_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    
    -- System
    onboarding_completed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CREATE FINANCIAL GOALS TABLE
CREATE TABLE financial_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    target_amount DECIMAL(10,2) NOT NULL,
    description TEXT,
    achieved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CREATE CRAVING LOGS TABLE
CREATE TABLE craving_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    intensity INTEGER NOT NULL CHECK (intensity >= 1 AND intensity <= 10),
    trigger_type TEXT,
    trigger_description TEXT,
    coping_strategy TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. CREATE GOALS TABLE (for personal goals)
CREATE TABLE goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    target_amount DECIMAL(10,2),
    current_amount DECIMAL(10,2) DEFAULT 0.00,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. CREATE AUTO-PROFILE FUNCTION (CRITICAL FOR SIGNUP)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (
        id,
        name,
        quit_date,
        has_quit,
        personal_goals,
        quit_reasons,
        quit_reason,
        currency,
        daily_cost,
        financial_goal_description,
        financial_goal_amount,
        onboarding_completed
    ) VALUES (
        NEW.id,
        '',
        NOW(),
        false,
        ARRAY[]::TEXT[],
        ARRAY[]::TEXT[],
        '',
        'USD',
        0.00,
        '',
        0.00,
        false
    );
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Failed to create user profile: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. CREATE TRIGGER FOR AUTO-PROFILE CREATION
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 8. ENABLE ROW LEVEL SECURITY
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE craving_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

-- 9. CREATE SECURITY POLICIES
-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Financial goals policies
CREATE POLICY "Users can view own financial goals" ON financial_goals
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own financial goals" ON financial_goals
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own financial goals" ON financial_goals
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own financial goals" ON financial_goals
    FOR DELETE USING (auth.uid() = user_id);

-- Craving logs policies
CREATE POLICY "Users can view own craving logs" ON craving_logs
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own craving logs" ON craving_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own craving logs" ON craving_logs
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own craving logs" ON craving_logs
    FOR DELETE USING (auth.uid() = user_id);

-- Goals policies
CREATE POLICY "Users can view own goals" ON goals
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own goals" ON goals
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own goals" ON goals
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own goals" ON goals
    FOR DELETE USING (auth.uid() = user_id);

-- 10. CREATE PERFORMANCE INDEXES
CREATE INDEX idx_profiles_id ON profiles(id);
CREATE INDEX idx_profiles_onboarding ON profiles(onboarding_completed);
CREATE INDEX idx_financial_goals_user ON financial_goals(user_id);
CREATE INDEX idx_craving_logs_user ON craving_logs(user_id);
CREATE INDEX idx_goals_user ON goals(user_id);

-- 11. GRANT PERMISSIONS
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON financial_goals TO authenticated;
GRANT ALL ON craving_logs TO authenticated;
GRANT ALL ON goals TO authenticated;
GRANT SELECT ON profiles TO anon;

-- 12. VERIFY SETUP
DO $$
BEGIN
    RAISE NOTICE '✅ CRUSHBOOZE DATABASE READY!';
    RAISE NOTICE '✅ Tables: profiles (with name), financial_goals, craving_logs, goals';
    RAISE NOTICE '✅ Auto-profile trigger installed';
    RAISE NOTICE '✅ Security policies active';
END
$$;
