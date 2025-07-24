-- Migration to add primary goal functionality
-- This adds new columns without breaking existing data

ALTER TABLE financial_goals 
ADD COLUMN is_primary BOOLEAN DEFAULT false,
ADD COLUMN baseline_amount DECIMAL(10,2) DEFAULT 0;

-- Add index for primary goal lookups
CREATE INDEX idx_financial_goals_is_primary ON financial_goals(user_id, is_primary);

-- Ensure only one primary goal per user (constraint)
CREATE UNIQUE INDEX idx_financial_goals_one_primary_per_user 
ON financial_goals(user_id) 
WHERE is_primary = true; 