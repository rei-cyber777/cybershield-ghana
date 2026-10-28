/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import React, { Suspense, useEffect, useState } from 'react';
import { Navbar } from './components/Navbar';
import { InteractiveGridBackground } from './components/InteractiveGridBackground';
import { FeaturesSection } from './components/FeaturesSection';
import { ThreatMap } from './components/ThreatMap';
import { ScamCard } from './components/ScamCard';
import { SpotTheScamLab } from './components/SpotTheScamLab';
import { ScamChecker } from './components/ScamChecker';
import { QuizCard } from './components/QuizCard';
import { ProjectShowcase } from './components/ProjectShowcase';
import { ReportingHub } from './components/ReportingHub';
import { NewsletterForm } from './components/NewsletterForm';
import { CreatorSection } from './components/CreatorSection';
import { AdminDashboard } from './components/AdminDashboard';
import { SubscriptionStatusPage } from './components/SubscriptionStatusPage';
import { PROTECTION_STEPS } from './lib/data';
import { Language, TRANSLATIONS } from './lib/i18n';
import { initTabVisibilityListener } from './lib/tabVisibility';
import { Shield, Terminal, Globe2, Cpu, ArrowRight } from 'lucide-react';

// Lazy-load the 3D scene so the page renders immediately on mobile / slow connections
const LazyHero3D = React.lazy(() =>
  import('./components/Hero3D').then((mod) => ({ default: mod.Hero3D }))
);

type AppRouteMode = 'home' | 'admin' | 'confirmed' | 'unsubscribed';

function detectRouteMode(): AppRouteMode {
  if (typeof window === 'undefined') return 'home';
  const path = window.location.pathname.replace(/\/+$/, '');
  const hash = window.location.hash;
  if (path === '/admin' || hash === '#/admin') return 'admin';
  if (path === '/confirmed' || hash === '#/confirmed') return 'confirmed';
  if (path === '/unsubscribed' || hash === '#/unsubscribed') return 'unsubscribed';
  return 'home';
}

export default function App() {
  const [lang, setLang] = useState<Language>('en');
  const [forceStatic3D, setForceStatic3D] = useState<boolean>(false);
  const [typedLength, setTypedLength] = useState<number>(0);
  const [routeMode, setRouteMode] = useState<AppRouteMode>(detectRouteMode);

  const t = TRANSLATIONS[lang];
  const fullMissionText = t.hero.missionTerminal;

  // Swap tab title ("Come back to CyberShield! 🛡️") and favicon when user switches tabs
  useEffect(() => {
    return initTabVisibilityListener();
  }, []);

  useEffect(() => {
    const onRouteChange = () => setRouteMode(detectRouteMode());
    window.addEventListener('popstate', onRouteChange);
    window.addEventListener('hashchange', onRouteChange);
    return () => {
      window.removeEventListener('popstate', onRouteChange);
      window.removeEventListener('hashchange', onRouteChange);
    };
  }, []);

  // Terminal-style typing effect for the mission statement
  useEffect(() => {
    setTypedLength(0);
    const interval = window.setInterval(() => {
      setTypedLength((prev) => {
        if (prev >= fullMissionText.length) {
          window.clearInterval(interval);
          return fullMissionText.length;
        }
        return prev + 3;
      });
    }, 24);
    return () => window.clearInterval(interval);
  }, [fullMissionText]);

  // Automatically enable Data Saver static fallback if browser Save-Data is set
  useEffect(() => {
    const nav = navigator as Navigator & {
      connection?: { saveData?: boolean; effectiveType?: string };
    };
    if (nav.connection?.saveData || nav.connection?.effectiveType === '2g') {
      setForceStatic3D(true);
    }
  }, []);

  if (routeMode === 'admin') {
    return <AdminDashboard />;
  }

  if (routeMode === 'confirmed' || routeMode === 'unsubscribed') {
    return <SubscriptionStatusPage mode={routeMode} />;
  }

  return (
    <div
      id="top"
      className="cybershield-grid-bg relative min-h-screen text-slate-100"
    >
      {/* Interactive Cyber Grid Background (squares & rectangles move and glow on cursor hover) */}
      <InteractiveGridBackground lowDataMode={forceStatic3D} />

      {/* Sticky 3-Zone Glass Navigation */}
      <Navbar lang={lang} />

      <main className="relative z-20 mx-auto max-w-7xl space-y-24 px-4 pb-24 pt-6 sm:px-6 lg:px-8">
        {/* Workspace Accessibility & Language Toolbar (below top bar per design rules) */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-800/90 bg-[#080d1e]/90 px-4 py-2.5 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <Shield className="h-4 w-4 text-cyan-400 shrink-0" aria-hidden="true" />
            <span>{t.hero.kicker}</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Language Switcher (English / Twi) */}
            <div
              role="group"
              aria-label="Language Selector"
              className="inline-flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-950 p-1"
            >
              <Globe2 className="ml-1.5 h-3.5 w-3.5 text-cyan-400" aria-hidden="true" />
              <button
                type="button"
                onClick={() => setLang('en')}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  lang === 'en'
                    ? 'bg-cyan-400 text-slate-950 font-bold'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setLang('tw')}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  lang === 'tw'
                    ? 'bg-cyan-400 text-slate-950 font-bold'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Twi (Akan)
              </button>
            </div>

            {/* 3D / Low-Data Mode Toggle */}
            <button
              type="button"
              onClick={() => setForceStatic3D((prev) => !prev)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-cyan-400/50 transition-colors whitespace-nowrap shrink-0"
            >
              <Cpu className="h-3.5 w-3.5 text-cyan-400" aria-hidden="true" />
              <span>{forceStatic3D ? t.hero.enable3DLabel : t.hero.lowDataModeLabel}</span>
            </button>
          </div>
        </div>

        {/* 1. HERO SECTION */}
        <section aria-labelledby="hero-heading" className="space-y-12">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-center">
            {/* Hero Copy & Terminal Mission */}
            <div className="lg:col-span-7 space-y-6">
              <h1
                id="hero-heading"
                style={{ fontSize: 'clamp(2.25rem, 4vw, 3.75rem)' }}
                className="font-display font-extrabold leading-[1.1] tracking-tight text-white [text-wrap:balance]"
              >
                {t.hero.headlinePrefix}{' '}
                <span className="bg-gradient-to-r from-cyan-300 via-violet-400 to-amber-300 bg-clip-text text-transparent">
                  {t.hero.headlineHighlight}
                </span>{' '}
                {t.hero.headlineSuffix}
              </h1>

              {/* Terminal-style typing mission box */}
              <div className="rounded-xl border border-cyan-400/25 bg-[#070c1c] p-4 shadow-inner">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-2 text-xs font-mono text-cyan-300">
                  <Terminal className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>cybershield-ghana · mission-statement.sh</span>
                </div>
                <p
                  aria-label={fullMissionText}
                  className="mt-3 min-h-[3.5rem] font-mono text-xs leading-relaxed text-slate-200 sm:text-sm"
                >
                  {fullMissionText.slice(0, typedLength)}
                  <span className="ml-0.5 inline-block h-4 w-2 bg-cyan-400 align-middle" />
                </p>
              </div>

              {/* Dual Glowing Action Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <a
                  href="#scam-checker"
                  className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-6 py-3.5 text-sm font-extrabold text-slate-950 shadow-[0_0_28px_rgba(0,240,255,0.4)] hover:bg-cyan-300 transition-colors whitespace-nowrap shrink-0"
                >
                  <span>{t.hero.ctaCheck}</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </a>

                <a
                  href="#report-scam"
                  className="inline-flex items-center gap-2 rounded-xl border border-violet-400/60 bg-violet-950/40 px-6 py-3.5 text-sm font-bold text-white shadow-[0_0_22px_rgba(124,58,237,0.28)] hover:border-cyan-400 hover:bg-violet-900/50 transition-colors whitespace-nowrap shrink-0"
                >
                  <span>{t.hero.ctaReport}</span>
                </a>
              </div>
            </div>

            {/* Real-Time 3D Holographic Ghana Shield with Static Fallback */}
            <div className="lg:col-span-5">
              <Suspense
                fallback={
                  <div className="flex h-[380px] w-full items-center justify-center rounded-2xl border border-cyan-400/20 bg-[#070d20] p-6 text-xs font-mono text-cyan-300">
                    Initializing Holographic Shield...
                  </div>
                }
              >
                <LazyHero3D forceStaticFallback={forceStatic3D} />
              </Suspense>
            </div>
          </div>

          {/* Full-Width 4-Column Awareness & Community Impact Strip */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="cybershield-glass rounded-xl p-5">
              <div className="font-mono text-xs text-cyan-300">Threat Categories Covered</div>
              <div className="mt-2 font-display text-3xl font-extrabold text-white tabular-nums">
                4 Core Pillars
              </div>
              <div className="mt-1 text-xs text-slate-300">
                MoMo fraud, fake scholarships, investment scams & phishing
              </div>
            </div>

            <div className="cybershield-glass rounded-xl p-5">
              <div className="font-mono text-xs text-cyan-300">Red-Flag Heuristic Rules</div>
              <div className="mt-2 font-display text-3xl font-extrabold text-white tabular-nums">
                13 Signatures
              </div>
              <div className="mt-1 text-xs text-slate-300">
                Rule-based checklist and suspicious message pattern scanner
              </div>
            </div>

            <div className="cybershield-glass rounded-xl p-5">
              <div className="font-mono text-xs text-amber-300">Opportunity Bridge Reach</div>
              <div className="mt-2 font-display text-3xl font-extrabold text-white tabular-nums">
                1,000+ Students
              </div>
              <div className="mt-1 text-xs text-slate-300">
                400+ active community members sharing verified opportunities
              </div>
            </div>

            <div className="cybershield-glass rounded-xl p-5">
              <div className="font-mono text-xs text-emerald-300">Privacy & Data Collection</div>
              <div className="mt-2 font-display text-3xl font-extrabold text-white tabular-nums">
                0% Personal Data
              </div>
              <div className="mt-1 text-xs text-slate-300">
                Anonymous scam reports with automatic phone number redaction
              </div>
            </div>
          </div>

          {/* 4-Step Scroll Story: How CyberShield Protects You */}
          <div className="pt-4">
            <h2 className="font-display text-xl font-bold text-white sm:text-2xl">
              {t.hero.stepsTitle}
            </h2>
            <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
              {PROTECTION_STEPS.map((step) => (
                <div
                  key={step.number}
                  className="cybershield-glass flex flex-col justify-between rounded-2xl p-6"
                >
                  <div>
                    <div className="font-mono text-xs font-bold text-cyan-300">
                      STEP {step.number}
                    </div>
                    <h3 className="mt-2 font-display text-lg font-bold text-white">
                      {lang === 'tw' ? step.titleTwi : `${step.number}. ${step.title}`}
                    </h3>
                    <p className="mt-1.5 text-xs font-semibold text-slate-200">{step.subtitle}</p>
                    <p className="mt-2.5 text-xs leading-relaxed text-slate-300">
                      {step.description}
                    </p>
                  </div>

                  <a
                    href={step.actionAnchor}
                    className="mt-5 inline-flex items-center gap-1.5 text-xs font-bold text-cyan-300 hover:text-cyan-200 transition-colors"
                  >
                    <span>{step.actionLabel}</span>
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </a>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="circuit-divider" aria-hidden="true" />

        {/* 1B. CORE FEATURES SECTION ("How CyberShield Keeps You Safe") */}
        <FeaturesSection />

        <div className="circuit-divider" aria-hidden="true" />

        {/* 2. ILLUSTRATIVE THREAT MAP */}
        <section id="threat-map" aria-labelledby="threat-map-heading" className="space-y-6">
          <div className="max-w-3xl">
            <h2
              id="threat-map-heading"
              className="font-display text-2xl font-bold text-white sm:text-3xl"
            >
              {t.sections.threatMapTitle}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">
              {t.sections.threatMapSubtitle}
            </p>
          </div>
          <ThreatMap />
        </section>

        <div className="circuit-divider" aria-hidden="true" />

        {/* 3. THREAT EDUCATION & REAL ANONYMIZED EXAMPLES */}
        <section id="threats" aria-labelledby="threat-edu-heading" className="space-y-6">
          <div className="max-w-3xl">
            <h2
              id="threat-edu-heading"
              className="font-display text-2xl font-bold text-white sm:text-3xl"
            >
              {t.sections.threatEduTitle}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">
              {t.sections.threatEduSubtitle}
            </p>
          </div>
          <ScamCard lang={lang} />
        </section>

        <div className="circuit-divider" aria-hidden="true" />

        {/* 4. SPOT THE SCAM (INTERACTIVE WHATSAPP / SMS INSPECTOR) */}
        <section id="spot-the-scam" aria-labelledby="spot-scam-heading" className="space-y-6">
          <div className="max-w-3xl">
            <h2
              id="spot-scam-heading"
              className="font-display text-2xl font-bold text-white sm:text-3xl"
            >
              {t.sections.spotScamTitle}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">
              {t.sections.spotScamSubtitle}
            </p>
          </div>
          <SpotTheScamLab />
        </section>

        <div className="circuit-divider" aria-hidden="true" />

        {/* 5. "IS THIS A SCAM?" RULE-BASED CHECKER */}
        <section id="scam-checker" aria-labelledby="scam-checker-heading" className="space-y-6">
          <div className="max-w-3xl">
            <h2
              id="scam-checker-heading"
              className="font-display text-2xl font-bold text-white sm:text-3xl"
            >
              {t.sections.checkerTitle}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">
              {t.sections.checkerSubtitle}
            </p>
          </div>
          <ScamChecker lang={lang} />
        </section>

        <div className="circuit-divider" aria-hidden="true" />

        {/* 6. INTERACTIVE QUIZ WITH SHAREABLE RESULT CARD */}
        <section id="quiz" aria-labelledby="quiz-heading" className="space-y-6">
          <div className="max-w-3xl">
            <h2
              id="quiz-heading"
              className="font-display text-2xl font-bold text-white sm:text-3xl"
            >
              {t.sections.quizTitle}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">
              {t.sections.quizSubtitle}
            </p>
          </div>
          <QuizCard />
        </section>

        <div className="circuit-divider" aria-hidden="true" />

        {/* 7. FEATURED PROJECT: OPPORTUNITY BRIDGE */}
        <section id="opportunity-bridge" aria-label="Featured Project Opportunity Bridge">
          <ProjectShowcase />
        </section>

        <div className="circuit-divider" aria-hidden="true" />

        {/* 8. REPORT & AUTHORITIES DIRECTORY + ANONYMOUS REPORT FORM + ADMIN VIEW */}
        <section aria-labelledby="reporting-heading" className="space-y-6">
          <div className="max-w-3xl">
            <h2
              id="reporting-heading"
              className="font-display text-2xl font-bold text-white sm:text-3xl"
            >
              {t.sections.reportTitle}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">
              {t.sections.reportSubtitle}
            </p>
          </div>
          <ReportingHub />
        </section>

        <div className="circuit-divider" aria-hidden="true" />

        {/* 9. CYBERSECURITY NEWS & DOUBLE OPT-IN NEWSLETTER */}
        <section id="cyber-news" aria-labelledby="news-heading" className="space-y-6">
          <div className="max-w-3xl">
            <h2
              id="news-heading"
              className="font-display text-2xl font-bold text-white sm:text-3xl"
            >
              {t.sections.newsTitle}
            </h2>
          </div>
          <NewsletterForm />
        </section>

        <div className="circuit-divider" aria-hidden="true" />

        {/* 10. ABOUT THE CREATOR (REINDOLF) & OPEN-SOURCE RESOURCES */}
        <section id="creator" aria-labelledby="creator-heading" className="space-y-6">
          <CreatorSection />
        </section>
      </main>

      {/* Quiet Open-Source Footer */}
      <footer className="border-t border-slate-800/90 bg-[#03050e] py-10 text-xs text-slate-400">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-4 sm:flex-row sm:items-center sm:px-6 lg:px-8">
          <div>
            <span className="font-display font-bold text-white">CyberShield Ghana</span>
            <span className="mx-2">·</span>
            <span>Open-Source MIT License · Built by Reindolf</span>
          </div>

          <div className="flex flex-wrap items-center gap-5">
            <a href="#threats" className="hover:text-cyan-300 transition-colors">
              Threat Guides
            </a>
            <a href="#scam-checker" className="hover:text-cyan-300 transition-colors">
              Scam Checker
            </a>
            <a
              href="https://chat.whatsapp.com/IP8WRS5WGXC39ZlgSCH4f5"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-300 hover:text-amber-200 transition-colors"
            >
              Opportunity Bridge WhatsApp
            </a>
            <a href="#directory" className="hover:text-cyan-300 transition-colors">
              Authorities Directory
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
