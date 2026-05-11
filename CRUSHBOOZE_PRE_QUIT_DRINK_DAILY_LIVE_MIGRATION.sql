-- =============================================================================
-- PRODUCTION (CrushBooze): additive only — no DROP, no TRUNCATE, no changes to
-- other tables. Naming parallels CRUSHBOOZE_DAILY_CHECKINS_LIVE_MIGRATION.sql.
--
-- One row per user per calendar day (`day_key` = `YYYY-MM-DD`):
--   • drink_count — daily aggregate from “Log drink” (not per-sip events).
--   • delay_first_drink, resist_one_urge, read_personal_why — quit-prep checklist.
-- Run once in Supabase SQL editor (safe if table/policies already exist).
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.pre_quit_booze_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day_key TEXT NOT NULL,
  drink_count INTEGER NOT NULL DEFAULT 0 CHECK (drink_count >= 0),
  delay_first_drink BOOLEAN NOT NULL DEFAULT FALSE,
  resist_one_urge BOOLEAN NOT NULL DEFAULT FALSE,
  read_personal_why BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, day_key)
);

ALTER TABLE public.pre_quit_booze_daily ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies p
    WHERE p.schemaname = 'public'
      AND p.tablename = 'pre_quit_booze_daily'
      AND p.policyname = 'Users can view own pre_quit_booze_daily rows'
  ) THEN
    CREATE POLICY "Users can view own pre_quit_booze_daily rows"
      ON public.pre_quit_booze_daily
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies p
    WHERE p.schemaname = 'public'
      AND p.tablename = 'pre_quit_booze_daily'
      AND p.policyname = 'Users can insert own pre_quit_booze_daily rows'
  ) THEN
    CREATE POLICY "Users can insert own pre_quit_booze_daily rows"
      ON public.pre_quit_booze_daily
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies p
    WHERE p.schemaname = 'public'
      AND p.tablename = 'pre_quit_booze_daily'
      AND p.policyname = 'Users can update own pre_quit_booze_daily rows'
  ) THEN
    CREATE POLICY "Users can update own pre_quit_booze_daily rows"
      ON public.pre_quit_booze_daily
      FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies p
    WHERE p.schemaname = 'public'
      AND p.tablename = 'pre_quit_booze_daily'
      AND p.policyname = 'Users can delete own pre_quit_booze_daily rows'
  ) THEN
    CREATE POLICY "Users can delete own pre_quit_booze_daily rows"
      ON public.pre_quit_booze_daily
      FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.pre_quit_booze_daily TO authenticated;

CREATE INDEX IF NOT EXISTS idx_pre_quit_booze_daily_user_day
  ON public.pre_quit_booze_daily(user_id, day_key);

COMMENT ON TABLE public.pre_quit_booze_daily IS
  'Pre-quit: one row per user per day_key. drink_count = daily drink tally; booleans = quit-prep checklist for that day.';

COMMENT ON COLUMN public.pre_quit_booze_daily.day_key IS
  'Calendar date for this row (YYYY-MM-DD), aligned with CrushNic daily pattern.';

COMMENT ON COLUMN public.pre_quit_booze_daily.drink_count IS
  'Number of drinks logged that day (aggregate counter from app; not individual sip rows).';

COMMENT ON COLUMN public.pre_quit_booze_daily.delay_first_drink IS
  'Quit prep: user delayed first drink that day.';

COMMENT ON COLUMN public.pre_quit_booze_daily.resist_one_urge IS
  'Quit prep: user noted/logged at least one urge to drink that day (app checklist).';

COMMENT ON COLUMN public.pre_quit_booze_daily.read_personal_why IS
  'Quit prep: user re-read their personal motivation that day.';

COMMENT ON COLUMN public.pre_quit_booze_daily.completed_at IS
  'When all three prep booleans were true for this day (nullable if incomplete).';
