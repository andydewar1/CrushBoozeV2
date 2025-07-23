DELETE FROM financial_goals WHERE user_id = '35fc5167-28ad-4f10-9c3c-2d87a849088a';
DELETE FROM profiles WHERE id = '35fc5167-28ad-4f10-9c3c-2d87a849088a';

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS financial_goal_description TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS financial_goal_amount DECIMAL(10,2);

INSERT INTO profiles (
  id, 
  quit_date, 
  has_quit, 
  personal_goals, 
  quit_reasons, 
  quit_reason, 
  currency, 
  financial_goal_description, 
  financial_goal_amount, 
  daily_cost
) VALUES (
  '35fc5167-28ad-4f10-9c3c-2d87a849088a',
  '2024-12-15T10:00:00.000Z',
  true,
  ARRAY['Save Money', 'Improve Health'],
  ARRAY['health', 'money'],
  'I want to be healthier and save money',
  'USD',
  'Holiday to Dubai',
  2000.00,
  15.50
);

CREATE TABLE IF NOT EXISTS financial_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  target_amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  achieved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO financial_goals (
  user_id,
  name,
  target_amount,
  description
) VALUES (
  '35fc5167-28ad-4f10-9c3c-2d87a849088a',
  'Holiday to Dubai',
  2000.00,
  'Save for dream vacation to Dubai'
);

ALTER TABLE financial_goals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own financial goals" ON financial_goals;
DROP POLICY IF EXISTS "Users can insert own financial goals" ON financial_goals;
DROP POLICY IF EXISTS "Users can update own financial goals" ON financial_goals;
DROP POLICY IF EXISTS "Users can delete own financial goals" ON financial_goals;

CREATE POLICY "Users can view own financial goals" ON financial_goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own financial goals" ON financial_goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own financial goals" ON financial_goals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own financial goals" ON financial_goals FOR DELETE USING (auth.uid() = user_id); 