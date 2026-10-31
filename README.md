# CyberShield Ghana

**CyberShield Ghana** is a free, open-source cybersecurity awareness and digital scam defense platform built for Ghanaians. Created by **Reindolf** (a Ghanaian student aspiring to be a cybersecurity engineer and founder of **Opportunity Bridge**), the platform helps everyday mobile users, students, and small business owners spot, verify, and report online fraud without collecting personal data.

## Tech Stack & Deployment

- **Frontend**: Vite + React 19 + TypeScript + Tailwind CSS + Three.js
- **Serverless API**: Vercel Serverless Functions (`/api/subscribe`, `/api/confirm`, `/api/unsubscribe`, `/api/news`, `/api/send-digest`)
- **Database & Auth**: Supabase (PostgreSQL with Row Level Security + Supabase Auth)
- **Transactional & Digest Email**: Resend HTTP API (`https://api.resend.com/emails` & `/emails/batch`)
- **Hosting**: Deployed on **Vercel** (`vercel.json` routes `/api/*` to serverless functions and SPA routes `/confirmed`, `/unsubscribed`, `/admin` to `/index.html`)

## Double Opt-In Newsletter & Digest Architecture

1. **`POST /api/subscribe` (`api/subscribe.ts`)**:
   - Validates the email address, checks the hidden honeypot field, and enforces per-IP sliding-window rate limiting.
   - Uses `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` on the server (`anon` has no `INSERT` privilege on `public.subscribers`).
   - Generates cryptographic `confirm_token` and `unsubscribe_token` values, inserts the subscriber with `confirmed = false`, and sends a mobile-friendly HTML + plain-text confirmation email via **Resend** containing `SITE_URL/api/confirm?token=...` and `SITE_URL/api/unsubscribe?token=...`.
   - If the email already exists with `confirmed = false`, refreshes `confirm_token` and resends the confirmation email.
   - If the email already exists with `confirmed = true`, returns the exact same neutral message (`"Check your inbox to confirm your subscription."`) without sending an email, never revealing whether an address is subscribed.
2. **`GET /api/confirm?token=...` (`api/confirm.ts`)**:
   - Verifies `confirm_token`, sets `confirmed = true`, `confirmed_at = now()`, clears `confirm_token = null`, and redirects (`302`) to `/confirmed`.
3. **`GET / POST /api/unsubscribe?token=...` (`api/unsubscribe.ts`)**:
   - Deletes the subscriber record matching `unsubscribe_token` and redirects (`302`) to `/unsubscribed`.
4. **`GET /api/news` (`api/news.ts`) & `POST /api/send-digest` (`api/send-digest.ts`)**:
   - `/api/send-digest` requires the `x-digest-secret` header (or `Authorization: Bearer <DIGEST_CRON_SECRET>`).
   - Queries confirmed subscribers (`confirmed = true`), combines the latest headlines from `/api/news` with published community alerts, and dispatches batched emails via Resend's `/emails/batch` API with a personalized one-click unsubscribe link in every email.

## Feature Status (Built vs. Planned)

### Built Features
- **Interactive 3D World Globe & Ghana Map (`Hero3D` & `ThreatMap`)**: Real-time Three.js 3D world globe with continental boundaries and an interactive 3D topographic map of Ghana illustrating common scam vectors, with drag-to-rotate, zoom, and low-data SVG fallback.
- **Threat Education Hub (`ScamCard`)**: Deep-dive guides on **Investment Scams**, **Mobile Money (MoMo) Fraud**, **Fake Jobs & Scholarships**, and **Phishing** with clearly labeled illustrative examples.
- **Interactive "Spot the Scam" WhatsApp Lab (`SpotTheScamLab`)**: Tap suspicious phrases inside illustrative WhatsApp and SMS messages to uncover red flags and earn a detection score.
- **"Is This a Scam?" Rule-Based Checker (`ScamChecker`)**: Client-side heuristic risk engine (`src/lib/scamCheckerEngine.ts`) that scores suspicious checklists and pasted message text locally.
- **Cyber AI Multi-Turn Defense Assistant (`CyberAiChat` + `/api/cyber-ai`)**: Multi-turn Gemini chat interface supporting specialist roles (Scam & MoMo Fraud Analyst, Emergency Incident Coach, Student & Job Opportunity Verifier) and model tiers (`gemini-3.1-flash-lite`, `gemini-3.8-flash`, and `gemini-4-argon`).
- **Cyber Readiness Quiz (`QuizCard`)**: Instant-feedback multiple-choice quiz with one-click WhatsApp shareable result cards.
- **Featured Project — Opportunity Bridge (`ProjectShowcase`)**: Connecting 1,000+ students with vetted scholarships and safe digital practices ([Join on WhatsApp](https://chat.whatsapp.com/IP8WRS5WGXC39ZlgSCH4f5)).
- **Ghana Reporting Directory & Anonymous Scam Report Form (`ReportingHub`)**: Searchable directory with official links to Ghanaian authorities (`csa.gov.gh`, `police.gov.gh`, `bog.gov.gh`, `sec.gov.gh`) + anonymous reporting (`public.scam_reports`) with phone-number redaction, honeypot spam protection, and rate limiting.
- **Server-Side Double Opt-In Newsletter & Batched Digest (`NewsletterForm` + `/api/*`)**: Full double opt-in verification via Vercel serverless functions and Resend, `/confirmed` and `/unsubscribed` status pages, and batched digest delivery (`/api/send-digest`).
- **Anonymous Community Feedback Form (`CreatorSection`)**: Insert-only feedback submission (`public.feedback`) with honeypot and rate limiting.
- **Locked-Down Admin Portal (`/admin`)**: Hidden route authenticated via **Supabase Auth** (`signInWithPassword`) and guarded by PostgreSQL `public.is_admin()` + Row Level Security to moderate pending reports, publish/unpublish alerts, view subscriber opt-in status, export subscribers as CSV, and read feedback.
- **Bilingual Support (`EN` / `Twi`)**: Built-in English and Akan (Twi) localization switcher.

### Planned Features (Not Yet Built)
- **Machine Learning Scam Classifier**: Optional on-device or server-side ML model to complement the rule-based scam checker.
- **Automated CERT/CSIRT RSS Feed Ingestion**: Scheduled background ingestion of external public advisories.

## Environment Variables

Configure these in **Vercel Project Settings → Environment Variables** (and `.env.local` for local dev):

```env
# Client-side (Browser)
VITE_SUPABASE_URL="https://your-project-ref.supabase.co"
VITE_SUPABASE_ANON_KEY="your-public-anon-key"

# Server-only (/api Vercel Serverless Functions — NEVER prefix with VITE_)
SUPABASE_URL="https://your-project-ref.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-or-secret-key"
RESEND_API_KEY="re_your_resend_api_key"
SITE_URL="https://your-domain.vercel.app"
EMAIL_FROM="CyberShield Ghana <newsletter@yourdomain.com>"
DIGEST_CRON_SECRET="your-random-secret-header-token"
```

## Database Migrations (Supabase PostgreSQL + RLS)

Run the SQL migrations in your Supabase SQL Editor in order:
1. [`supabase/migrations/001_extend_subscribers_and_reports.sql`](supabase/migrations/001_extend_subscribers_and_reports.sql)
2. [`supabase/migrations/002_admin_lockdown.sql`](supabase/migrations/002_admin_lockdown.sql)
3. [`supabase/migrations/003_double_opt_in_server_only.sql`](supabase/migrations/003_double_opt_in_server_only.sql) — Adds `confirmed`, `confirmed_at`, `confirm_token`, `unsubscribe_token` and revokes `INSERT` on `public.subscribers` from `anon`.

## License

Released under the [MIT License](LICENSE).
