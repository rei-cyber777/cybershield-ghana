import React, { useState } from 'react';
import { THREAT_CATEGORIES, REAL_SCAM_EXAMPLES, ThreatCategory } from '../lib/data';
import { Language } from '../lib/i18n';
import { ChevronDown, ChevronUp, ShieldCheck, AlertTriangle, Eye } from 'lucide-react';

interface ScamCardProps {
  lang: Language;
}

/**
 * Custom Procedural SVG Illustrations per Scam Type
 */
const ThreatIllustration: React.FC<{ id: ThreatCategory['id'] }> = ({ id }) => {
  switch (id) {
    case 'mobile_money':
      return (
        <svg viewBox="0 0 64 64" className="h-12 w-12 shrink-0" fill="none" aria-hidden="true">
          <rect x="14" y="6" width="36" height="52" rx="6" stroke="#00F0FF" strokeWidth="2" fill="#0B1124" />
          <path d="M22 24H42M22 32H36" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" />
          <circle cx="32" cy="44" r="5" stroke="#F5B700" strokeWidth="2" />
          <path d="M46 14L54 22M54 14L46 22" stroke="#FF1E8A" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      );
    case 'fake_jobs_scholarships':
      return (
        <svg viewBox="0 0 64 64" className="h-12 w-12 shrink-0" fill="none" aria-hidden="true">
          <path d="M32 12L8 24L32 36L56 24L32 12Z" stroke="#F5B700" strokeWidth="2" fill="#0B1124" />
          <path d="M16 29V44C16 48 23 52 32 52C41 52 48 48 48 44V29" stroke="#00F0FF" strokeWidth="2" />
          <circle cx="48" cy="44" r="7" fill="#050816" stroke="#FF1E8A" strokeWidth="2" />
          <path d="M48 40V45M48 48H48.02" stroke="#FF1E8A" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 'investment':
      return (
        <svg viewBox="0 0 64 64" className="h-12 w-12 shrink-0" fill="none" aria-hidden="true">
          <rect x="8" y="10" width="48" height="44" rx="6" stroke="#7C3AED" strokeWidth="2" fill="#0B1124" />
          <path d="M16 42L26 30L34 36L48 18" stroke="#00F0FF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M40 18H48V26" stroke="#F5B700" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'phishing':
    default:
      return (
        <svg viewBox="0 0 64 64" className="h-12 w-12 shrink-0" fill="none" aria-hidden="true">
          <path d="M32 8V28C32 35 37 40 43 40C49 40 53 35 53 29C53 24 49 21 45 21" stroke="#FF1E8A" strokeWidth="2.2" strokeLinecap="round" />
          <rect x="12" y="34" width="32" height="22" rx="4" stroke="#00F0FF" strokeWidth="2" fill="#0B1124" />
          <circle cx="28" cy="45" r="3" fill="#F5B700" />
        </svg>
      );
  }
};

export const ScamCard: React.FC<ScamCardProps> = ({ lang }) => {
  const [activeTabId, setActiveTabId] = useState<ThreatCategory['id']>('mobile_money');
  const [openAccordion, setOpenAccordion] = useState<'how' | 'flags' | 'action'>('how');
  const [selectedExampleId, setSelectedExampleId] = useState<string>(REAL_SCAM_EXAMPLES[0].id);

  const activeCategory =
    THREAT_CATEGORIES.find((cat) => cat.id === activeTabId) || THREAT_CATEGORIES[0];

  const activeExample =
    REAL_SCAM_EXAMPLES.find((ex) => ex.id === selectedExampleId) || REAL_SCAM_EXAMPLES[0];

  return (
    <div className="space-y-16">
      {/* Interactive Threat Education Tabs & Accordion */}
      <div className="cybershield-glass rounded-2xl p-6 sm:p-8">
        {/* Category Selector Tabs */}
        <div
          role="tablist"
          aria-label="Scam Categories"
          className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4"
        >
          {THREAT_CATEGORIES.map((cat) => {
            const isSelected = cat.id === activeTabId;
            return (
              <button
                key={cat.id}
                role="tab"
                type="button"
                aria-selected={isSelected}
                onClick={() => setActiveTabId(cat.id)}
                className={`flex items-center gap-3 rounded-xl border p-3.5 text-left transition-colors ${
                  isSelected
                    ? 'border-cyan-400 bg-cyan-400/10 text-white shadow-[0_0_24px_rgba(0,240,255,0.12)]'
                    : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700 hover:text-white'
                }`}
              >
                <ThreatIllustration id={cat.id} />
                <div className="min-w-0">
                  <div className="font-display text-sm font-bold leading-snug text-white">
                    {lang === 'tw' ? cat.titleTwi : cat.title}
                  </div>
                  <div className="mt-1 text-xs text-cyan-300 truncate">{cat.riskTag}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Active Category Details */}
        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="lg:col-span-5 flex flex-col justify-between rounded-xl border border-slate-800 bg-[#070c1d] p-6">
            <div>
              <div className="text-xs font-mono text-cyan-300">
                THREAT DOSSIER · {activeCategory.riskTag.toUpperCase()}
              </div>
              <h3 className="mt-2 font-display text-2xl font-bold text-white">
                {lang === 'tw' ? activeCategory.titleTwi : activeCategory.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-300">
                {activeCategory.tagline}
              </p>
            </div>

            <div className="mt-6 border-t border-slate-800 pt-4 text-xs text-slate-400">
              <span>Quick Summary: </span>
              <span className="text-slate-200">
                {activeCategory.howItWorks.length} attack stages · {activeCategory.redFlags.length}{' '}
                critical red flags · {activeCategory.whatToDo.length} defense rules
              </span>
            </div>
          </div>

          {/* 3-Part Interactive Accordion (How it Works, Red Flags, What to Do) */}
          <div className="lg:col-span-7 space-y-3">
            {/* Panel 1: How It Works */}
            <div className="rounded-xl border border-slate-800 bg-[#080e22]">
              <button
                type="button"
                aria-expanded={openAccordion === 'how'}
                onClick={() => setOpenAccordion('how')}
                className="flex w-full items-center justify-between px-5 py-4 text-left"
              >
                <span className="font-display text-base font-bold text-white">
                  01. How This Scam Works
                </span>
                {openAccordion === 'how' ? (
                  <ChevronUp className="h-5 w-5 text-cyan-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-slate-400" />
                )}
              </button>
              {openAccordion === 'how' && (
                <div className="border-t border-slate-800/80 px-5 pb-5 pt-3">
                  <ol className="space-y-2.5 text-sm leading-relaxed text-slate-300">
                    {activeCategory.howItWorks.map((step, idx) => (
                      <li key={idx} className="flex gap-3">
                        <span className="font-mono font-semibold text-cyan-300">0{idx + 1}.</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>

            {/* Panel 2: Red Flags */}
            <div className="rounded-xl border border-slate-800 bg-[#080e22]">
              <button
                type="button"
                aria-expanded={openAccordion === 'flags'}
                onClick={() => setOpenAccordion('flags')}
                className="flex w-full items-center justify-between px-5 py-4 text-left"
              >
                <span className="flex items-center gap-2 font-display text-base font-bold text-rose-300">
                  <AlertTriangle className="h-4 w-4 text-rose-400" aria-hidden="true" />
                  <span>02. Red Flags to Spot Immediately</span>
                </span>
                {openAccordion === 'flags' ? (
                  <ChevronUp className="h-5 w-5 text-rose-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-slate-400" />
                )}
              </button>
              {openAccordion === 'flags' && (
                <div className="border-t border-slate-800/80 px-5 pb-5 pt-3">
                  <ul className="space-y-2.5 text-sm leading-relaxed text-slate-200">
                    {activeCategory.redFlags.map((flag, idx) => (
                      <li key={idx} className="flex gap-3">
                        <span className="font-mono font-semibold text-rose-400">[!]</span>
                        <span>{flag}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Panel 3: What to Do */}
            <div className="rounded-xl border border-slate-800 bg-[#080e22]">
              <button
                type="button"
                aria-expanded={openAccordion === 'action'}
                onClick={() => setOpenAccordion('action')}
                className="flex w-full items-center justify-between px-5 py-4 text-left"
              >
                <span className="flex items-center gap-2 font-display text-base font-bold text-emerald-300">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" aria-hidden="true" />
                  <span>03. What You Should Do</span>
                </span>
                {openAccordion === 'action' ? (
                  <ChevronUp className="h-5 w-5 text-emerald-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-slate-400" />
                )}
              </button>
              {openAccordion === 'action' && (
                <div className="border-t border-slate-800/80 px-5 pb-5 pt-3">
                  <ul className="space-y-2.5 text-sm leading-relaxed text-slate-200">
                    {activeCategory.whatToDo.map((action, idx) => (
                      <li key={idx} className="flex gap-3">
                        <span className="font-mono font-semibold text-emerald-400">✓</span>
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Real Anonymized Scam Examples Archive */}
      <div id="real-examples" className="cybershield-glass rounded-2xl p-6 sm:p-8">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-800 pb-6 md:flex-row md:items-end">
          <div>
            <div className="text-xs font-mono text-cyan-300">
              DECONSTRUCTED CASE ARCHIVE · ANONYMIZED EXAMPLES
            </div>
            <h3 className="mt-2 font-display text-2xl font-bold text-white">
              Real Anonymized Scam Examples with Annotated Red Flags
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {REAL_SCAM_EXAMPLES.map((ex) => (
              <button
                key={ex.id}
                type="button"
                onClick={() => setSelectedExampleId(ex.id)}
                className={`rounded-lg px-3.5 py-2 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  ex.id === activeExample.id
                    ? 'bg-cyan-400 text-slate-950 font-semibold'
                    : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                }`}
              >
                {ex.category}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Anonymized Message Transcript */}
          <div className="lg:col-span-6 rounded-xl border border-slate-800 bg-[#050814] p-5">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>{activeExample.category}</span>
              <span>·</span>
              <span className="font-mono">{activeExample.channel}</span>
            </div>
            <h4 className="mt-2 font-display text-lg font-bold text-white">
              {activeExample.title}
            </h4>
            <blockquote className="mt-4 rounded-lg border border-slate-800 bg-slate-950/90 p-4 font-mono text-xs leading-relaxed text-slate-200">
              "{activeExample.rawMessage}"
            </blockquote>
            <div className="mt-4 rounded-lg bg-cyan-950/30 border border-cyan-400/20 p-3.5 text-xs text-cyan-100">
              <strong className="font-semibold text-cyan-300">Defense Rule: </strong>
              {activeExample.takeaway}
            </div>
          </div>

          {/* Annotated Red Flags Breakdown */}
          <div className="lg:col-span-6 space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono text-rose-300">
              <Eye className="h-4 w-4" aria-hidden="true" />
              <span>ANNOTATED MANIPULATION TRIGGERS ({activeExample.annotations.length})</span>
            </div>
            {activeExample.annotations.map((ann, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-slate-800 bg-[#091026] p-4"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-rose-300">
                    0{idx + 1}. {ann.label}
                  </span>
                  <span className="font-mono text-slate-400">Red Flag</span>
                </div>
                <div className="mt-1.5 font-mono text-xs text-amber-300">
                  "{ann.highlight}"
                </div>
                <p className="mt-2 text-xs leading-relaxed text-slate-300">{ann.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
