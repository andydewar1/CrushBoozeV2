-- Clean slate approach - drop everything first
DROP TABLE IF EXISTS vape_usage CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;

-- Create base tables
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
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE vape_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    other_text TEXT,
    quantity DECIMAL(10,2) NOT NULL CHECK (quantity > 0),
    frequency TEXT NOT NULL,
    unit_cost DECIMAL(10,2) NOT NULL CHECK (unit_cost >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_vape_type CHECK (type IN ('disposable', 'pod', 'liquid', 'other')),
    CONSTRAINT valid_frequency CHECK (frequency IN ('day', 'week')),
    CONSTRAINT valid_other_text CHECK (
        (type = 'other' AND other_text IS NOT NULL) OR 
        (type != 'other' AND other_text IS NULL)
    )
);

-- Create indexes
CREATE INDEX idx_profiles_id ON profiles(id);
CREATE INDEX idx_vape_usage_profile_id ON vape_usage(profile_id);

-- Create updated_at trigger function
CREATE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers
CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vape_usage_updated_at 
    BEFORE UPDATE ON vape_usage 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vape_usage ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own vape usage" ON vape_usage
    FOR SELECT USING (auth.uid() = profile_id);

CREATE POLICY "Users can insert own vape usage" ON vape_usage
    FOR INSERT WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can update own vape usage" ON vape_usage
    FOR UPDATE USING (auth.uid() = profile_id);

-- Add table comments
COMMENT ON TABLE profiles IS 'User profiles with onboarding and quit journey data';
COMMENT ON TABLE vape_usage IS 'Normalized vape usage data linked to user profiles'; 