# CyberShield Ghana

**CyberShield Ghana** is a free, open-source cybersecurity awareness and digital scam defense platform built for Ghanaians. Created by **Reindolf** (a Ghanaian student aspiring to be a cybersecurity engineer and founder of **Opportunity Bridge**), the platform helps everyday mobile users, students, and small business owners spot, verify, and report online fraud without collecting personal data.

## Tech Stack & Deployment

- **Frontend**: Vite + React 19 + TypeScript + Tailwind CSS + Three.js
- **Backend / Database**: Supabase (PostgreSQL with Row Level Security + Supabase Auth)
- **Hosting**: Deployed on **Vercel** (`vercel.json` configured with SPA routing for `/admin`)

## Feature Status (Built vs. Planned)

### Built Features
- **Interactive 3D World Globe & Ghana Map (`Hero3D` & `ThreatMap`)**: Real-time Three.js 3D world globe with continental boundaries and an interactive 3D topographic map of Ghana illustrating common scam vectors, with automatic low-data SVG fallback.
- **Threat Education Hub (`ScamCard`)**: Deep-dive guides on **Investment Scams**, **Mobile Money (MoMo) Fraud**, **Fake Jobs & Scholarships**, and **Phishing** with clearly labeled illustrative examples.
- **Interactive "Spot the Scam" WhatsApp Lab (`SpotTheScamLab`)**: Tap suspicious phrases inside illustrative WhatsApp and SMS messages to uncover red flags and earn a detection score.
- **"Is This a Scam?" Rule-Based Checker (`ScamChecker`)**: Client-side heuristic risk engine (`src/lib/scamCheckerEngine.ts`) that scores suspicious checklists and pasted message text without sending user messages to a server.
- **Cyber Readiness Quiz (`QuizCard`)**: Instant-feedback multiple-choice quiz with one-click WhatsApp shareable result cards.
- **Featured Project — Opportunity Bridge (`ProjectShowcase`)**: Connecting 1,000+ students with vetted scholarships and safe digital practices ([Join on WhatsApp](https://chat.whatsapp.com/IP8WRS5WGXC39ZlgSCH4f5)).
- **Ghana Reporting Directory & Anonymous Scam Report Form (`ReportingHub`)**: Searchable directory with official links to Ghanaian authorities (`csa.gov.gh`, `police.gov.gh`, `bog.gov.gh`, `sec.gov.gh`) + anonymous reporting (`public.scam_reports`) with phone-number redaction, honeypot spam protection, and client rate limiting.
- **Cybersecurity & Global Tech Newsletter Signup (`NewsletterForm`)**: Direct insert into `public.subscribers` (`email`, `interests`) under strict insert-only Row Level Security with honeypot and rate limiting.
- **Anonymous Community Feedback Form (`CreatorSection`)**: Insert-only feedback submission (`public.feedback`) with honeypot and rate limiting.
- **Locked-Down Admin Portal (`/admin`)**: Hidden route authenticated via **Supabase Auth** (`signInWithPassword`) and guarded by PostgreSQL `public.is_admin()` + Row Level Security (`supabase/migrations/002_admin_lockdown.sql`) to moderate pending reports, publish/unpublish alerts, export subscribers as CSV, and read feedback.
- **Bilingual Support (`EN` / `Twi`)**: Built-in English and Akan (Twi) localization switcher.

### Planned Features (Not Yet Built)
- **Automated Email Delivery & Double Opt-In Confirmation Emails**: Automated digest emails, confirmation links, and one-click unsubscribe links via an email provider (Resend / Supabase Edge Functions).
- **Machine Learning Scam Classifier**: Optional server-side or on-device ML model to complement the rule-based scam checker.
- **Live Threat Intelligence Feeds**: Automated ingestion of verified public advisories from official CERT/CSIRT RSS feeds.

## Environment Variables

Copy `.env.example` to `.env.local` and configure your Supabase project credentials:

```env
VITE_SUPABASE_URL="https://your-project-ref.supabase.co"
VITE_SUPABASE_ANON_KEY="your-public-anon-key"
```

>Never expose your Supabase `service_role` or secret key in browser code or `VITE_*` variables.

## Database Migrations (Supabase PostgreSQL + RLS)

Run the SQL migrations in your Supabase SQL Editor in order:
1. [`supabase/migrations/001_extend_subscribers_and_reports.sql`](supabase/migrations/001_extend_subscribers_and_reports.sql)
2. [`supabase/migrations/002_admin_lockdown.sql`](supabase/migrations/002_admin_lockdown.sql) — Locks down `scam_reports`, `verified_alerts`, `subscribers`, and `feedback` with `public.admins` and `public.is_admin()`.

## License

Released under the [MIT License](LICENSE).
