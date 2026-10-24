-- ============================================================================
-- CyberShield Ghana — Supabase (PostgreSQL + RLS) Schema & Migration
-- File: supabase/migrations/001_extend_subscribers_and_reports.sql
-- Purpose:
--   1. Extends the existing `public.subscribers` table with double opt-in
--      (`confirmed`, `confirmed_at`) and one-click unsubscribe (`unsubscribe_token`).
--   2. Creates `public.scam_reports` (anonymous zero-PII reports) and
--      `public.verified_alerts` (published community warnings) with strict RLS.
-- ============================================================================

-- Enable pgcrypto for secure random tokens if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. EXTEND EXISTING `subscribers` TABLE
--Existing columns: (id, email, interests, created_at)
-- ----------------------------------------------------------------------------
ALTER TABLE public.subscribers
  ADD COLUMN IF NOT EXISTS confirmed BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS unsubscribe_token TEXT NOT NULL DEFAULT encode(gen_random_bytes(24), 'hex'),
  ADD COLUMN IF NOT EXISTS confirm_token TEXT NOT NULL DEFAULT encode(gen_random_bytes(24), 'hex');

-- Ensure unique constraints on email and tokens for fast, safe lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_subscribers_email_unique
  ON public.subscribers (lower(email));

CREATE UNIQUE INDEX IF NOT EXISTS idx_subscribers_unsubscribe_token
  ON public.subscribers (unsubscribe_token);

CREATE UNIQUE INDEX IF NOT EXISTS idx_subscribers_confirm_token
  ON public.subscribers (confirm_token);

-- Enable Row Level Security (strictly block public SELECT so emails are never readable)
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

-- Drop overly permissive policies if any exist
DROP POLICY IF EXISTS "Allow public read subscribers" ON public.subscribers;

-- Anonymous users can ONLY insert unconfirmed subscriptions with basic email format check
DROP POLICY IF EXISTS "Allow anonymous insert subscribers" ON public.subscribers;
CREATE POLICY "Allow anonymous insert subscribers"
  ON public.subscribers
  FOR INSERT
  TO anon
  WITH CHECK (
    confirmed = FALSE
    AND char_length(email) BETWEEN 5 AND 254
    AND email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  );

-- Secure RPC function for Double Opt-In confirmation (avoids exposing table SELECT)
CREATE OR REPLACE FUNCTION public.confirm_subscription(p_token TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated INTEGER;
BEGIN
  UPDATE public.subscribers
  SET confirmed = TRUE,
      confirmed_at = NOW()
  WHERE confirm_token = p_token
    AND confirmed = FALSE;

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated > 0;
END;
$$;

-- Secure RPC function for One-Click Unsubscribe (deletes subscriber record by token)
CREATE OR REPLACE FUNCTION public.unsubscribe_by_token(p_token TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  DELETE FROM public.subscribers
  WHERE unsubscribe_token = p_token;

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted > 0;
END;
$$;

GRANT EXECUTE ON FUNCTION public.confirm_subscription(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.unsubscribe_by_token(TEXT) TO anon, authenticated;

-- ----------------------------------------------------------------------------
-- 2. ANONYMOUS SCAM REPORTS TABLE (ZERO PERSONAL DATA)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.scam_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scam_type TEXT NOT NULL CHECK (scam_type IN ('mobile_money', 'investment', 'fake_jobs_scholarships', 'phishing', 'impersonation', 'other')),
  channel TEXT NOT NULL CHECK (channel IN ('WhatsApp', 'SMS', 'Phone Call', 'Social Media', 'Email', 'Website')),
  description TEXT NOT NULL CHECK (char_length(description) BETWEEN 15 AND 1500),
  red_flags TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'dismissed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.scam_reports ENABLE ROW LEVEL SECURITY;

-- Anyone can submit an anonymous report (status must start as 'pending')
CREATE POLICY "Anon can insert pending scam reports"
  ON public.scam_reports
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    status = 'pending'
    AND char_length(description) BETWEEN 15 AND 1500
  );

-- Only authenticated admins can view or update pending reports
CREATE POLICY "Admins can read all scam reports"
  ON public.scam_reports
  FOR SELECT
  TO authenticated
  USING ((auth.jwt() ->> 'role') = 'admin');

CREATE POLICY "Admins can update scam report status"
  ON public.scam_reports
  FOR UPDATE
  TO authenticated
  USING ((auth.jwt() ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() ->> 'role') = 'admin');

-- ----------------------------------------------------------------------------
-- 3. VERIFIED COMMUNITY ALERTS (PUBLICLY READABLE ONCE APPROVED BY ADMIN)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.verified_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 5 AND 160),
  scam_type TEXT NOT NULL,
  channel TEXT NOT NULL,
  summary TEXT NOT NULL CHECK (char_length(summary) BETWEEN 15 AND 1000),
  prevention_tip TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'High' CHECK (severity IN ('Moderate', 'High', 'Critical')),
  published_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.verified_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read verified alerts"
  ON public.verified_alerts
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can insert verified alerts"
  ON public.verified_alerts
  FOR INSERT
  TO authenticated
  WITH CHECK ((auth.jwt() ->> 'role') = 'admin');
