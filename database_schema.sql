-- Drop everything and start fresh
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP FUNCTION IF EXISTS handle_new_user CASCADE;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create user profiles table
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Onboarding data (all required)
    quit_date TIMESTAMPTZ NOT NULL,
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
    INSERT INTO user_profiles (
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
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Create indexes for performance
CREATE INDEX idx_user_profiles_id ON user_profiles(id);
CREATE INDEX idx_user_profiles_onboarding ON user_profiles(onboarding_completed);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON user_profiles TO authenticated;
GRANT SELECT ON user_profiles TO anon; 