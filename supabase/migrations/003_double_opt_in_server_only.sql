-- ============================================================================
-- CyberShield Ghana — Migration 003: Server-Side Double Opt-In & Anon Revocation
-- Idempotent migration (safe to run multiple times in Supabase SQL Editor)
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Ensure double opt-in columns exist on public.subscribers
ALTER TABLE public.subscribers
  ADD COLUMN IF NOT EXISTS confirmed BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS confirm_token TEXT,
  ADD COLUMN IF NOT EXISTS unsubscribe_token TEXT NOT NULL DEFAULT encode(gen_random_bytes(24), 'hex');

-- 2. Indexes for fast token lookups in /api/confirm and /api/unsubscribe
CREATE UNIQUE INDEX IF NOT EXISTS idx_subscribers_confirm_token
  ON public.subscribers (confirm_token)
  WHERE confirm_token IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_subscribers_unsubscribe_token
  ON public.subscribers (unsubscribe_token);

-- 3. Lock down public.subscribers: REVOKE INSERT from anon and authenticated!
-- Only the serverless function (/api/subscribe using SUPABASE_SERVICE_ROLE_KEY)
-- may insert or update confirmation tokens.
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscribers FORCE ROW LEVEL SECURITY;

REVOKE INSERT ON public.subscribers FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.subscribers FROM PUBLIC, anon;

-- Keep SELECT, UPDATE, DELETE granted to authenticated ONLY so admins (/admin)
-- who pass public.is_admin() RLS policy can view/export/manage subscribers.
GRANT SELECT, UPDATE, DELETE ON public.subscribers TO authenticated;

-- Drop any previous anonymous insert policies
DROP POLICY IF EXISTS "Allow anonymous newsletter signup" ON public.subscribers;
DROP POLICY IF EXISTS "subscribers_anon_insert" ON public.subscribers;

-- Ensure admin-only policies remain intact
DROP POLICY IF EXISTS "subscribers_admin_select" ON public.subscribers;
DROP POLICY IF EXISTS "subscribers_admin_update" ON public.subscribers;
DROP POLICY IF EXISTS "subscribers_admin_delete" ON public.subscribers;

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
