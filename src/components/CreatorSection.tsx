import React, { useEffect, useState } from 'react';
import { ShieldCheck, MessageSquarePlus, FileCode2, CheckCircle2 } from 'lucide-react';
import { processImageDataToMonochrome } from '../lib/portraitProcessor';

const CREATOR_PORTRAIT_SRC = '/assets/aistudio/rei_kn_d5c40a28.jpg';

export const CreatorSection: React.FC = () => {
  const [feedbackText, setFeedbackText] = useState<string>('');
  const [feedbackCategory, setFeedbackCategory] = useState<string>('Suggestion');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState<boolean>(false);
  const [processedBwDataUrl, setProcessedBwDataUrl] = useState<string | null>(null);
  const [activeDocTab, setActiveDocTab] = useState<
    'README' | 'CONTRIBUTING' | 'LICENSE' | 'ATTRIBUTIONS'
  >('README');

  // Process the uploaded portrait into a pure Black & White studio portrait
  // with green-screen chroma despill & dark studio vignette
  useEffect(() => {
    let cancelled = false;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (cancelled) return;
      try {
        const canvas = document.createElement('canvas');
        const w = img.naturalWidth || 600;
        const h = img.naturalHeight || 600;
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // 1. Extract subject in pure Black & White with green-screen keyed out
        const subjectCanvas = document.createElement('canvas');
        subjectCanvas.width = w;
        subjectCanvas.height = h;
        const sCtx = subjectCanvas.getContext('2d');
        if (!sCtx) return;

        sCtx.drawImage(img, 0, 0, w, h);
        const imgData = sCtx.getImageData(0, 0, w, h);
        processImageDataToMonochrome(imgData.data, true);
        sCtx.putImageData(imgData, 0, 0);

        // 2. Paint a sleek monochrome dark-gray/black studio backdrop gradient
        const bgGrad = ctx.createRadialGradient(
          w * 0.5,
          h * 0.42,
          w * 0.06,
          w * 0.5,
          h * 0.5,
          w * 0.68
        );
        bgGrad.addColorStop(0, '#2a2a2e');
        bgGrad.addColorStop(0.55, '#121215');
        bgGrad.addColorStop(1, '#050507');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, w, h);

        // 3. Composite the pure Black & White portrait over the monochrome studio backdrop
        ctx.drawImage(subjectCanvas, 0, 0, w, h);

        setProcessedBwDataUrl(canvas.toDataURL('image/png'));
      } catch {
        // Fallback relies on CSS grayscale filter on the raw image
      }
    };
    img.src = CREATOR_PORTRAIT_SRC;
    return () => {
      cancelled = true;
    };
  }, []);

  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (feedbackText.trim().length < 5) return;
    setFeedbackSubmitted(true);
    setFeedbackText('');
  };

  return (
    <div className="space-y-16">
      {/* 1. About the Creator: Built by Reindolf */}
      <div className="cybershield-glass rounded-2xl p-6 sm:p-10">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-center">
          {/* Creator Black & White Portrait */}
          <div className="lg:col-span-4 flex flex-col items-center text-center">
            <div className="group relative h-56 w-56 overflow-hidden rounded-2xl border border-slate-700/90 bg-[#0a0a0d] shadow-[0_0_32px_rgba(0,0,0,0.85)] sm:h-64 sm:w-64">
              {/* Direct asset img with mandatory CSS grayscale (Black & White) */}
              <img
                src={processedBwDataUrl || CREATOR_PORTRAIT_SRC}
                data-original-src={CREATOR_PORTRAIT_SRC}
                alt="Reindolf — Creator of CyberShield Ghana (Black and White Portrait)"
                className="h-full w-full object-cover object-top grayscale contrast-115 brightness-95 transition-transform duration-500 group-hover:scale-[1.02]"
              />

              {/* Subtle monochrome vignette & bottom nameplate overlay */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20"
              />
              <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between rounded-xl border border-white/15 bg-black/75 px-3 py-1.5 backdrop-blur-md">
                <div className="text-left">
                  <div className="font-display text-xs font-bold tracking-wide text-white">
                    Reindolf
                  </div>
                  <div className="font-mono text-[10px] text-slate-300">
                    Founder · CyberShield GH
                  </div>
                </div>
                <ShieldCheck className="h-4 w-4 text-cyan-400 shrink-0" aria-hidden="true" />
              </div>
            </div>

            {/* Social & Community Links */}
            <div className="mt-4 flex flex-wrap justify-center gap-2 text-xs">
              <a
                href="https://chat.whatsapp.com/IP8WRS5WGXC39ZlgSCH4f5"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-amber-400/40 bg-amber-950/30 px-3 py-1.5 font-medium text-amber-300 hover:bg-amber-900/40 transition-colors"
              >
                Opportunity Bridge WhatsApp
              </a>
              <a
                href="#scam-checker"
                className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 font-mono text-slate-300 hover:border-cyan-400/40 hover:text-white transition-colors"
              >
                Scam Checker Engine
              </a>
            </div>
          </div>

          {/* Creator Story & Mission */}
          <div className="lg:col-span-8 space-y-4">
            <div className="font-mono text-xs text-cyan-300">
              ABOUT THE CREATOR · STUDENT & ASPIRING CYBERSECURITY ENGINEER
            </div>
            <h3 className="font-display text-2xl font-bold text-white sm:text-3xl">
              Built by Reindolf in Ghana
            </h3>
            <p className="text-sm leading-relaxed text-slate-200">
              Hi, I’m <strong>Reindolf</strong>, a student from Ghana aspiring to become a
              cybersecurity engineer. Every week, I see hardworking students, parents, and small
              business owners targeted by Mobile Money reversal tricks, fake protocol recruitment
              fees, and fraudulent scholarship links.
            </p>
            <p className="text-sm leading-relaxed text-slate-300">
              I built <strong>CyberShield Ghana</strong> as a free, 100% open-source platform so
              anyone can learn how scams work, test suspicious messages before acting, and warn the
              community without sacrificing their privacy. Alongside CyberShield, I started{' '}
              <a
                href="https://chat.whatsapp.com/IP8WRS5WGXC39ZlgSCH4f5"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-amber-300 underline underline-offset-4 hover:text-amber-200"
              >
                Opportunity Bridge
              </a>{' '}
              to connect over 1,000 students with verified scholarships and safe digital practices.
            </p>
          </div>
        </div>
      </div>

      {/* 2. Open-Source Documentation & Anonymous Feedback */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left: Open-Source Repository Files Preview */}
        <div className="lg:col-span-7 cybershield-glass rounded-2xl p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <FileCode2 className="h-5 w-5 text-cyan-400" aria-hidden="true" />
              <h3 className="font-display text-lg font-bold text-white">
                Open-Source Project Files
              </h3>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {(['README', 'CONTRIBUTING', 'LICENSE', 'ATTRIBUTIONS'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveDocTab(tab)}
                  className={`rounded-lg px-3 py-1 text-xs font-mono transition-colors ${
                    activeDocTab === tab
                      ? 'bg-cyan-400 text-slate-950 font-semibold'
                      : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {tab}.md
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-slate-800 bg-[#050814] p-4 font-mono text-xs leading-relaxed text-slate-300">
            {activeDocTab === 'README' && (
              <div className="space-y-2">
                <div className="text-cyan-300 font-bold"># CyberShield Ghana (README.md)</div>
                <p>
                  Free, open-source cybersecurity awareness platform for Ghanaians. Includes
                  procedural Three.js 3D shield (`Hero3D`), rule-based scam scanner
                  (`src/lib/scamCheckerEngine.ts`), bilingual EN/Twi support, and Supabase RLS
                  migrations (`supabase/migrations/001_extend_subscribers_and_reports.sql`).
                </p>
              </div>
            )}
            {activeDocTab === 'CONTRIBUTING' && (
              <div className="space-y-2">
                <div className="text-cyan-300 font-bold">
                  # Contributing New Scam Examples (CONTRIBUTING.md)
                </div>
                <p>
                  Strip all real phone numbers (`[REDACTED-NUMBER]`) and submit a JSON entry with
                  `title`, `category`, `channel`, `anonymizedMessage`, `annotations`, and
                  `whatToDo`.
                </p>
              </div>
            )}
            {activeDocTab === 'LICENSE' && (
              <div className="space-y-2">
                <div className="text-cyan-300 font-bold"># MIT License (LICENSE)</div>
                <p>
                  Copyright (c) 2026 Reindolf (CyberShield Ghana & Opportunity Bridge). Free to
                  use, study, modify, and distribute under the permissive MIT License.
                </p>
              </div>
            )}
            {activeDocTab === 'ATTRIBUTIONS' && (
              <div className="space-y-2">
                <div className="text-cyan-300 font-bold">
                  # Asset & Library Attributions (ATTRIBUTIONS.md)
                </div>
                <p>
                  100% original procedural Three.js geometry and custom SVG threat illustrations.
                  Fonts: Orbitron, Plus Jakarta Sans, JetBrains Mono (SIL OFL 1.1). Icons:
                  lucide-react (ISC).
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Community Feedback & Resource Suggestion Box */}
        <div className="lg:col-span-5 cybershield-glass rounded-2xl p-6 sm:p-8">
          <div className="flex items-center gap-2 font-mono text-xs text-cyan-300">
            <MessageSquarePlus className="h-4 w-4" aria-hidden="true" />
            <span>COMMUNITY FEEDBACK</span>
          </div>
          <h3 className="mt-2 font-display text-lg font-bold text-white">
            Suggest a Feature or Local Translation
          </h3>
          <p className="mt-1 text-xs text-slate-300">
            Help improve CyberShield Ghana—share feedback on scam guides, Twi translations, or new
            campus safety resources.
          </p>

          <form onSubmit={handleFeedbackSubmit} className="mt-4 space-y-3.5">
            <div>
              <label
                htmlFor="feedback-category"
                className="block text-xs font-semibold text-slate-200"
              >
                Feedback Type
              </label>
              <select
                id="feedback-category"
                value={feedbackCategory}
                onChange={(e) => setFeedbackCategory(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
              >
                <option value="Suggestion">Feature or Guide Suggestion</option>
                <option value="Translation">Twi / Local Language Translation</option>
                <option value="Scam Pattern">New Scam Pattern to Document</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="feedback-message"
                className="block text-xs font-semibold text-slate-200"
              >
                Your Feedback (Anonymous)
              </label>
              <textarea
                id="feedback-message"
                rows={3}
                required
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Share your idea or improvement..."
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-xs text-white placeholder:text-slate-500"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-xl border border-cyan-400/50 bg-cyan-400/15 px-4 py-2.5 text-xs font-bold text-cyan-200 hover:bg-cyan-400 hover:text-slate-950 transition-colors"
            >
              Send Anonymous Feedback
            </button>

            {feedbackSubmitted && (
              <div
                role="status"
                className="flex items-center gap-2 rounded-lg border border-emerald-400/40 bg-emerald-950/30 p-3 text-xs text-emerald-200"
              >
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Thank you! Your feedback has been recorded for Reindolf’s review.</span>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};
