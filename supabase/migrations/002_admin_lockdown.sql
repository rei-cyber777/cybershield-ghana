-- ============================================================================
-- CyberShield Ghana — Admin Lockdown & Row Level Security (RLS) Migration
-- File: supabase/migrations/002_admin_lockdown.sql
-- Safe to run multiple times (idempotent: IF NOT EXISTS / DROP POLICY IF EXISTS).
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. ADMINS TABLE & SECURITY DEFINER `is_admin()` FUNCTION
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admins (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies on public.admins (no public access)
DROP POLICY IF EXISTS "Allow public read admins" ON public.admins;
DROP POLICY IF EXISTS "Admins can read own row" ON public.admins;

-- Revoke direct table privileges on public.admins from anon and authenticated;
-- admin membership is checked exclusively via the SECURITY DEFINER function `public.is_admin()`.
REVOKE ALL ON TABLE public.admins FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admins
    WHERE user_id = auth.uid()
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;

-- ----------------------------------------------------------------------------
-- 2. SCAM REPORTS TABLE (`public.scam_reports`)
--    Anonymous users: INSERT only (status forced to 'pending')
--    Admins only: SELECT, UPDATE, DELETE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.scam_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scam_type TEXT NOT NULL,
  channel TEXT NOT NULL,
  description TEXT NOT NULL CHECK (char_length(description) BETWEEN 15 AND 1500),
  red_flags TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Relax legacy enum-style CHECK constraints from 001 if present so UI labels and 'rejected' status work
ALTER TABLE public.scam_reports DROP CONSTRAINT IF EXISTS scam_reports_scam_type_check;
ALTER TABLE public.scam_reports DROP CONSTRAINT IF EXISTS scam_reports_channel_check;
ALTER TABLE public.scam_reports DROP CONSTRAINT IF EXISTS scam_reports_status_check;

ALTER TABLE public.scam_reports
  ADD CONSTRAINT scam_reports_status_check
  CHECK (status IN ('pending', 'verified', 'rejected', 'dismissed'));

ALTER TABLE public.scam_reports ENABLE ROW LEVEL SECURITY;

-- Drop old and current policies before recreating
DROP POLICY IF EXISTS "Anon can insert pending scam reports" ON public.scam_reports;
DROP POLICY IF EXISTS "Admins can read all scam reports" ON public.scam_reports;
DROP POLICY IF EXISTS "Admins can update scam report status" ON public.scam_reports;
DROP POLICY IF EXISTS "Admins can delete scam reports" ON public.scam_reports;
DROP POLICY IF EXISTS "scam_reports_anon_insert" ON public.scam_reports;
DROP POLICY IF EXISTS "scam_reports_admin_select" ON public.scam_reports;
DROP POLICY IF EXISTS "scam_reports_admin_update" ON public.scam_reports;
DROP POLICY IF EXISTS "scam_reports_admin_delete" ON public.scam_reports;

CREATE POLICY "scam_reports_anon_insert"
  ON public.scam_reports
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    status = 'pending'
    AND char_length(description) BETWEEN 15 AND 1500
    AND char_length(scam_type) BETWEEN 2 AND 120
    AND char_length(channel) BETWEEN 2 AND 60
  );

CREATE POLICY "scam_reports_admin_select"
  ON public.scam_reports
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "scam_reports_admin_update"
  ON public.scam_reports
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "scam_reports_admin_delete"
  ON public.scam_reports
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

REVOKE ALL ON TABLE public.scam_reports FROM PUBLIC, anon, authenticated;
GRANT INSERT ON TABLE public.scam_reports TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON TABLE public.scam_reports TO authenticated;

-- ----------------------------------------------------------------------------
-- 3. VERIFIED ALERTS TABLE (`public.verified_alerts`)
--    Everyone: SELECT published rows only (`published = true`)
--    Admins only: SELECT all rows, INSERT, UPDATE, DELETE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.verified_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 5 AND 160),
  scam_type TEXT NOT NULL,
  channel TEXT NOT NULL,
  summary TEXT NOT NULL CHECK (char_length(summary) BETWEEN 15 AND 1000),
  prevention_tip TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'Moderate',
  published BOOLEAN NOT NULL DEFAULT TRUE,
  published_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.verified_alerts
  ADD COLUMN IF NOT EXISTS published BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE public.verified_alerts DROP CONSTRAINT IF EXISTS verified_alerts_severity_check;

ALTER TABLE public.verified_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read verified alerts" ON public.verified_alerts;
DROP POLICY IF EXISTS "Admins can insert verified alerts" ON public.verified_alerts;
DROP POLICY IF EXISTS "verified_alerts_public_select_published" ON public.verified_alerts;
DROP POLICY IF EXISTS "verified_alerts_admin_select_all" ON public.verified_alerts;
DROP POLICY IF EXISTS "verified_alerts_admin_insert" ON public.verified_alerts;
DROP POLICY IF EXISTS "verified_alerts_admin_update" ON public.verified_alerts;
DROP POLICY IF EXISTS "verified_alerts_admin_delete" ON public.verified_alerts;

CREATE POLICY "verified_alerts_public_select_published"
  ON public.verified_alerts
  FOR SELECT
  TO anon, authenticated
  USING (published = TRUE);

CREATE POLICY "verified_alerts_admin_select_all"
  ON public.verified_alerts
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "verified_alerts_admin_insert"
  ON public.verified_alerts
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "verified_alerts_admin_update"
  ON public.verified_alerts
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "verified_alerts_admin_delete"
  ON public.verified_alerts
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

REVOKE ALL ON TABLE public.verified_alerts FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.verified_alerts TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.verified_alerts TO authenticated;

-- ----------------------------------------------------------------------------
-- 4. SUBSCRIBERS TABLE (`public.subscribers`)
--    Anonymous users: INSERT only
--    Admins only: SELECT, UPDATE, DELETE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  interests TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read subscribers" ON public.subscribers;
DROP POLICY IF EXISTS "Allow anonymous insert subscribers" ON public.subscribers;
DROP POLICY IF EXISTS "subscribers_anon_insert" ON public.subscribers;
DROP POLICY IF EXISTS "subscribers_admin_select" ON public.subscribers;
DROP POLICY IF EXISTS "subscribers_admin_update" ON public.subscribers;
DROP POLICY IF EXISTS "subscribers_admin_delete" ON public.subscribers;

CREATE POLICY "subscribers_anon_insert"
  ON public.subscribers
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    char_length(email) BETWEEN 5 AND 254
    AND email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
    AND char_length(interests) BETWEEN 2 AND 500
  );

CREATE POLICY "subscribers_admin_select"
  ON public.subscribers
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "subscribers_admin_update"
  ON public.subscribers
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "subscribers_admin_delete"
  ON public.subscribers
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

REVOKE ALL ON TABLE public.subscribers FROM PUBLIC, anon, authenticated;
GRANT INSERT ON TABLE public.subscribers TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON TABLE public.subscribers TO authenticated;

-- ----------------------------------------------------------------------------
-- 5. FEEDBACK TABLE (`public.feedback`)
--    Anonymous users: INSERT only
--    Admins only: SELECT, UPDATE, DELETE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL DEFAULT 'Suggestion' CHECK (char_length(category) BETWEEN 2 AND 80),
  message TEXT NOT NULL CHECK (char_length(message) BETWEEN 5 AND 2000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "feedback_anon_insert" ON public.feedback;
DROP POLICY IF EXISTS "feedback_admin_select" ON public.feedback;
DROP POLICY IF EXISTS "feedback_admin_update" ON public.feedback;
DROP POLICY IF EXISTS "feedback_admin_delete" ON public.feedback;

CREATE POLICY "feedback_anon_insert"
  ON public.feedback
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    char_length(category) BETWEEN 2 AND 80
    AND char_length(message) BETWEEN 5 AND 2000
  );

CREATE POLICY "feedback_admin_select"
  ON public.feedback
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "feedback_admin_update"
  ON public.feedback
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "feedback_admin_delete"
  ON public.feedback
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

REVOKE ALL ON TABLE public.feedback FROM PUBLIC, anon, authenticated;
GRANT INSERT ON TABLE public.feedback TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON TABLE public.feedback TO authenticated;
