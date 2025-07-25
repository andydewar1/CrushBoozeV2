-- 🚀 INSTANT DATABASE SETUP - NO HANGING, NO TRIGGERS 🚀
-- This removes the problematic trigger that's causing 3+ minute delays

-- 1. REMOVE THE PROBLEMATIC TRIGGER
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

-- 2. ENSURE CLEAN TABLES
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS financial_goals CASCADE;
DROP TABLE IF EXISTS craving_logs CASCADE;
DROP TABLE IF EXISTS goals CASCADE;

-- 3. CREATE PROFILES TABLE (SIMPLE, NO TRIGGER)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Basic info
    quit_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    has_quit BOOLEAN NOT NULL DEFAULT false,
    
    -- Onboarding data
    personal_goals TEXT[] NOT NULL DEFAULT '{}',
    quit_reasons TEXT[] NOT NULL DEFAULT '{}',
    quit_reason TEXT NOT NULL DEFAULT '',
    vape_types JSONB NOT NULL DEFAULT '[]',
    
    -- Financial data
    currency TEXT NOT NULL DEFAULT 'USD',
    daily_cost DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    financial_goal_description TEXT NOT NULL DEFAULT '',
    financial_goal_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    
    -- System
    onboarding_completed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CREATE OTHER TABLES
CREATE TABLE financial_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    target_amount DECIMAL(10,2) NOT NULL,
    description TEXT,
    achieved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

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

-- 5. ENABLE RLS (REQUIRED FOR SECURITY)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE craving_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

-- 6. CREATE SECURITY POLICIES
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view own financial goals" ON financial_goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own financial goals" ON financial_goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own financial goals" ON financial_goals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own financial goals" ON financial_goals FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own craving logs" ON craving_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own craving logs" ON craving_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own craving logs" ON craving_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own craving logs" ON craving_logs FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own goals" ON goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own goals" ON goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own goals" ON goals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own goals" ON goals FOR DELETE USING (auth.uid() = user_id);

-- 7. CREATE INDEXES
CREATE INDEX idx_profiles_id ON profiles(id);
CREATE INDEX idx_profiles_onboarding ON profiles(onboarding_completed);
CREATE INDEX idx_financial_goals_user ON financial_goals(user_id);
CREATE INDEX idx_craving_logs_user ON craving_logs(user_id);
CREATE INDEX idx_goals_user ON goals(user_id);

-- 8. GRANT PERMISSIONS
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON financial_goals TO authenticated;
GRANT ALL ON craving_logs TO authenticated;
GRANT ALL ON goals TO authenticated;

-- 9. SUCCESS MESSAGE
DO $$
BEGIN
    RAISE NOTICE '🚀 INSTANT DATABASE SETUP COMPLETE!';
    RAISE NOTICE '🚀 NO MORE TRIGGERS = NO MORE HANGING!';
    RAISE NOTICE '🚀 Profiles will be created by app code, not database triggers';
    RAISE NOTICE '🚀 Signup should now complete in under 3 seconds!';
END
$$; 