-- =============================================================================
-- PRODUCTION (CrushBooze): additive only — no DROP, no TRUNCATE, no changes to
-- other tables. Same pattern as CrushNic `DAILY_CHECKINS_MIGRATION.sql`.
-- Creates `daily_checkins` + RLS policies (skipped if already present).
-- Drinking semantics: status IN ('clean', 'drank') — clean = dry day, drank = slipped.
-- =============================================================================
-- If `daily_checkins` already exists with a different schema, do not run blind;
-- verify in a staging clone first.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.daily_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day_key TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('clean', 'drank')),
  mood TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, day_key)
);

-- UNIQUE(user_id, day_key) already indexes (user_id, day_key) for user-scoped queries.

ALTER TABLE public.daily_checkins ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies p
    WHERE p.schemaname = 'public'
      AND p.tablename = 'daily_checkins'
      AND p.policyname = 'Users can view own daily checkins'
  ) THEN
    CREATE POLICY "Users can view own daily checkins"
      ON public.daily_checkins
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies p
    WHERE p.schemaname = 'public'
      AND p.tablename = 'daily_checkins'
      AND p.policyname = 'Users can insert own daily checkins'
  ) THEN
    CREATE POLICY "Users can insert own daily checkins"
      ON public.daily_checkins
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies p
    WHERE p.schemaname = 'public'
      AND p.tablename = 'daily_checkins'
      AND p.policyname = 'Users can update own daily checkins'
  ) THEN
    CREATE POLICY "Users can update own daily checkins"
      ON public.daily_checkins
      FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies p
    WHERE p.schemaname = 'public'
      AND p.tablename = 'daily_checkins'
      AND p.policyname = 'Users can delete own daily checkins'
  ) THEN
    CREATE POLICY "Users can delete own daily checkins"
      ON public.daily_checkins
      FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.daily_checkins TO authenticated;
