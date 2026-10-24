# CyberShield Ghana

**CyberShield Ghana** is a free, open-source cybersecurity awareness and digital scam defense platform built for Ghanaians. Created by **Reindolf** (a Ghanaian student aspiring to be a cybersecurity engineer and founder of **Opportunity Bridge**), the platform helps everyday mobile users, students, and small business owners spot, verify, and report online fraud without collecting personal data.

## Key Features

1. **Interactive 3D Holographic Shield (`Hero3D`)**: Real-time Three.js sovereign shield with West Africa/Ghana telemetry nodes, pointer parallax, and automatic low-data / `prefers-reduced-motion` SVG fallback.
2. **Illustrative Threat Visualization (`ThreatMap`)**: Educational visualization showing how common scam vectors (Mobile Money reversal tricks, fake scholarships, WhatsApp investment clones, and phishing) are detected and blocked.
3. **Threat Education Hub**: Deep-dive guides on **Investment Scams**, **Mobile Money (MoMo) Fraud**, **Fake Jobs & Scholarships**, and **Phishing** with custom SVG icons, *How it Works*, *Red Flags*, and *What to Do*.
4. **Interactive "Spot the Scam" WhatsApp Lab**: Tap suspicious parts of realistic messages to uncover red flags and earn a detection score.
5. **"Is This a Scam?" Rule-Based Checker**: Modular, decoupled risk engine (`src/lib/scamCheckerEngine.ts`) ready to be swapped with an ML model in the future.
6. **Cyber Readiness Quiz**: Instant feedback quiz with one-click WhatsApp shareable result cards.
7. **Real Anonymized Scam Examples**: Annotated scam messages with toggleable red-flag callouts.
8. **Featured Project — Opportunity Bridge**: Connecting 1,000+ students with verified scholarships and safe digital practices ([Join on WhatsApp](https://chat.whatsapp.com/IP8WRS5WGXC39ZlgSCH4f5)).
9. **Ghana Reporting Directory & Zero-PII Anonymous Scam Report Form**: Searchable directory + anonymous reporting with honeypot spam protection and Protected Admin Console to publish verified alerts.
10. **Double Opt-In Cybersecurity Newsletter & Curated News**: Supabase (`subscribers` table with RLS, `confirmed`, and `unsubscribe_token`) migration SQL + privacy-first double opt-in flow.
11. **Bilingual Support (`EN` / `Twi`)**: Built-in English and Akan (Twi) localization switcher.

## Environment Variables

Copy `.env.example` to `.env` and configure your Supabase project credentials:

```env
NEXT_PUBLIC_SUPABASE_URL="https://your-project-ref.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-public-anon-key"
```

## Database Migration (Supabase PostgreSQL + RLS)

Run the SQL migration in [`supabase/migrations/001_extend_subscribers_and_reports.sql`](supabase/migrations/001_extend_subscribers_and_reports.sql) inside your Supabase SQL Editor to add `confirmed` and `unsubscribe_token` to `public.subscribers` and set up strict Row Level Security policies.

## License

Released under the [MIT License](LICENSE).
