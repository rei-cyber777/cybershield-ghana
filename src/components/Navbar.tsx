import React from 'react';
import { Language, TRANSLATIONS } from '../lib/i18n';

interface NavbarProps {
  lang: Language;
}

export const Navbar: React.FC<NavbarProps> = ({ lang }) => {
  const t = TRANSLATIONS[lang].nav;

  return (
    <header className="sticky top-0 z-50 border-b border-cyan-400/15 bg-[#050816]/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-8 px-4 py-3.5 sm:px-6 lg:px-8">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#top"
          className="font-display text-base font-bold tracking-tight text-slate-100 hover:text-cyan-300 transition-colors whitespace-nowrap shrink-0 sm:text-lg"
        >
          CyberShield Ghana
        </a>

        {/* Zone 2: 5 concise single-line navigation links */}
        <nav
          aria-label="Primary Navigation"
          className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300"
        >
          <a
            href="#threats"
            className="hover:text-cyan-300 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            {t.threats}
          </a>
          <a
            href="#scam-checker"
            className="hover:text-cyan-300 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            {t.checker}
          </a>
          <a
            href="#cyber-ai"
            className="text-cyan-300 hover:text-cyan-200 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 font-semibold"
          >
            Cyber AI
          </a>
          <a
            href="#opportunity-bridge"
            className="hover:text-amber-300 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            {t.opportunityBridge}
          </a>
          <a
            href="#cyber-news"
            className="hover:text-cyan-300 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            {t.cyberTechNews}
          </a>
          <a
            href="#directory"
            className="hover:text-cyan-300 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            {t.directory}
          </a>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center shrink-0">
          <a
            href="#report-scam"
            className="rounded-lg bg-cyan-400 px-4 py-2 text-xs font-semibold text-slate-950 shadow-[0_0_20px_rgba(0,240,255,0.35)] hover:bg-cyan-300 transition-colors whitespace-nowrap shrink-0 sm:text-sm"
          >
            {t.reportCta}
          </a>
        </div>
      </div>
    </header>
  );
};
