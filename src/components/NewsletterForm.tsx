import React, { useState } from 'react';
import { CURATED_CYBER_NEWS, NEWSLETTER_TOPIC_TRACKS } from '../lib/data';
import { checkRateLimit } from '../lib/storage';
import { buildSubscriberInsertPayload } from '../lib/supabaseNewsletter';
import {
  Mail,
  CheckCircle2,
  ExternalLink,
  Check,
  Globe,
  Shield,
  Sparkles,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';

type NewsHubTab = 'signup' | 'cyber-feed' | 'global-tech-feed';

export const NewsletterForm: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NewsHubTab>('signup');
  const [email, setEmail] = useState<string>('');
  const [selectedTracks, setSelectedTracks] = useState<string[]>([
    'Cybersecurity & Ghana Scam Alerts',
    'Global Tech & AI News',
  ]);
  const [cadence, setCadence] = useState<'Weekly Digest' | 'Instant Alerts + Weekly Tech'>(
    'Weekly Digest'
  );
  const [honeypot, setHoneypot] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'idle' | 'confirmed' | 'error';
    text: string;
  }>({ type: 'idle', text: '' });

  const toggleTrack = (trackId: string) => {
    setSelectedTracks((prev) => {
      if (prev.includes(trackId)) {
        if (prev.length === 1) return prev;
        return prev.filter((id) => id !== trackId);
      }
      return [...prev, trackId];
    });
  };

  const formattedInterests = `${selectedTracks.join(' + ')} (${cadence})`;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setIsSubmitting(true);
    setStatusMessage({ type: 'idle', text: '' });

    // If honeypot is filled, send to /api/subscribe (which returns neutral 200 without writing)
    if (honeypot.trim().length > 0) {
      setIsSubmitting(false);
      setEmail('');
      setStatusMessage({
        type: 'confirmed',
        text: 'Check your inbox to confirm your subscription.',
      });
      return;
    }

    // 1. Client-side email format check before calling /api/subscribe
    const built = buildSubscriberInsertPayload(email, formattedInterests);
    if (!built.ok) {
      setIsSubmitting(false);
      setStatusMessage({
        type: 'error',
        text: built.error.userMessage,
      });
      return;
    }

    const rate = checkRateLimit('newsletter_signup', 5000);
    if (!rate.allowed) {
      setIsSubmitting(false);
      setStatusMessage({
        type: 'error',
        text: `Please wait ${rate.waitSeconds} seconds before submitting again.`,
      });
      return;
    }

    const { payload } = built;

    // 2. Call serverless function POST /api/subscribe
    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: payload.email,
          interests: payload.interests,
          honeypot,
        }),
      });

      const data = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        message?: string;
        error?: string;
      };

      if (!response.ok || data.ok === false) {
        setIsSubmitting(false);
        setStatusMessage({
          type: 'error',
          text:
            data.error ||
            'Unable to send confirmation email right now. Please try again shortly.',
        });
        return;
      }

      setIsSubmitting(false);
      setEmail('');
      setStatusMessage({
        type: 'confirmed',
        text: data.message || 'Check your inbox to confirm your subscription.',
      });
    } catch (networkErr) {
      console.error('[CyberShield Newsletter] /api/subscribe network failure:', networkErr);
      setIsSubmitting(false);
      setStatusMessage({
        type: 'error',
        text: 'Network error while connecting to the subscription server. Please check your connection and try again.',
      });
    }
  };

  const cyberNewsItems = CURATED_CYBER_NEWS.filter(
    (item) =>
      item.category === 'Ghana Alerts' ||
      item.category === 'Global Cybersecurity' ||
      item.category === 'Student Safety Tips'
  );

  const globalTechItems = CURATED_CYBER_NEWS.filter(
    (item) =>
      item.category === 'Global Tech & AI' || item.category === 'Global Cybersecurity'
  );

  return (
    <div className="space-y-8">
      {/* Interactive 3-Tab Switcher for Cybersecurity & Global Tech News Sign-Up */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div
          role="tablist"
          aria-label="Cybersecurity and Global Tech News Tabs"
          className="inline-flex flex-wrap gap-2 rounded-2xl border border-slate-800 bg-[#070c1c] p-1.5"
        >
          <button
            role="tab"
            type="button"
            data-testid="tab-news-signup"
            aria-selected={activeTab === 'signup'}
            onClick={() => setActiveTab('signup')}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all whitespace-nowrap shrink-0 sm:text-sm ${
              activeTab === 'signup'
                ? 'bg-cyan-400 text-slate-950 shadow-[0_0_24px_rgba(0,240,255,0.35)]'
                : 'text-slate-300 hover:bg-slate-900 hover:text-white'
            }`}
          >
            <Mail className="h-4 w-4" aria-hidden="true" />
            <span>Sign Up: Cyber & Global Tech News</span>
          </button>

          <button
            role="tab"
            type="button"
            data-testid="tab-cyber-briefings"
            aria-selected={activeTab === 'cyber-feed'}
            onClick={() => setActiveTab('cyber-feed')}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all whitespace-nowrap shrink-0 sm:text-sm ${
              activeTab === 'cyber-feed'
                ? 'bg-cyan-400 text-slate-950 shadow-[0_0_24px_rgba(0,240,255,0.35)]'
                : 'text-slate-300 hover:bg-slate-900 hover:text-white'
            }`}
          >
            <Shield className="h-4 w-4" aria-hidden="true" />
            <span>Cybersecurity Topics ({cyberNewsItems.length})</span>
          </button>

          <button
            role="tab"
            type="button"
            data-testid="tab-global-tech-feed"
            aria-selected={activeTab === 'global-tech-feed'}
            onClick={() => setActiveTab('global-tech-feed')}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all whitespace-nowrap shrink-0 sm:text-sm ${
              activeTab === 'global-tech-feed'
                ? 'bg-cyan-400 text-slate-950 shadow-[0_0_24px_rgba(0,240,255,0.35)]'
                : 'text-slate-300 hover:bg-slate-900 hover:text-white'
            }`}
          >
            <Globe className="h-4 w-4" aria-hidden="true" />
            <span>Global Tech & AI Topics ({globalTechItems.length})</span>
          </button>
        </div>

        <div className="text-xs text-slate-300">
          We only use your email to send the news you asked for, and we never share it.
        </div>
      </div>

      {/* TAB 1: SIGN UP FOR CYBERSECURITY & GLOBAL TECH NEWS */}
      {activeTab === 'signup' && (
        <div
          role="tabpanel"
          aria-label="Sign Up for Cybersecurity and Global Tech News"
          className="cybershield-glass rounded-2xl p-6 sm:p-10"
        >
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start">
            {/* Left Column: Multi-Track Topic Selector & Plain-Language Privacy Note */}
            <div className="lg:col-span-7 space-y-6">
              <div>
                <div className="inline-flex items-center gap-1.5 font-mono text-xs text-cyan-300">
                  <Sparkles className="h-3.5 w-3.5 text-amber-400" aria-hidden="true" />
                  <span>CUSTOMIZE YOUR CYBERSECURITY & GLOBAL TECH BRIEFING</span>
                </div>
                <h3 className="mt-1 font-display text-2xl font-extrabold text-white sm:text-3xl">
                  Sign Up for Cybersecurity & Global Tech News
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-300">
                  Select the topics you care about below—from Ghana Mobile Money scam alerts to
                  global AI developments, passkeys, and cloud engineering news.
                </p>
              </div>

              {/* Selectable Topic Track Cards */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-200">
                    1. Choose Your News Tracks (Select one or more):
                  </span>
                  <span className="font-mono text-cyan-300">
                    {selectedTracks.length} selected
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {NEWSLETTER_TOPIC_TRACKS.map((track) => {
                    const isSelected = selectedTracks.includes(track.id);
                    return (
                      <button
                        key={track.id}
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => toggleTrack(track.id)}
                        className={`flex flex-col justify-between rounded-xl border p-4 text-left transition-all ${
                          isSelected
                            ? 'border-cyan-400 bg-cyan-400/10 shadow-[0_0_20px_rgba(0,240,255,0.14)]'
                            : 'border-slate-800 bg-[#070d20]/80 hover:border-slate-700'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono text-[10px] font-bold text-cyan-300">
                              {track.badge}
                            </span>
                            <span
                              className={`inline-flex h-5 w-5 items-center justify-center rounded-md border ${
                                isSelected
                                  ? 'border-cyan-400 bg-cyan-400 text-slate-950'
                                  : 'border-slate-700 bg-slate-900 text-transparent'
                              }`}
                            >
                              <Check className="h-3.5 w-3.5 stroke-[3]" />
                            </span>
                          </div>
                          <div className="mt-1.5 font-display text-sm font-bold text-white">
                            {track.label}
                          </div>
                          <p className="mt-1 text-xs leading-relaxed text-slate-300">
                            {track.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Plain-Language Double Opt-In Privacy Note */}
              <div className="rounded-xl border border-slate-800 bg-[#060a18] p-4 text-xs leading-relaxed text-slate-300">
                <strong className="block font-semibold text-cyan-300">
                  Privacy &amp; Double Opt-In Promise:
                </strong>
                When you sign up, our server sends a confirmation link to your inbox. We only send
                digests after you click that link to verify your email, we never reveal whether an
                address is subscribed, and every email includes a one-click unsubscribe link that
                deletes your record immediately.
              </div>
            </div>

            {/* Right Column: Email & Cadence Sign-Up Form */}
            <div className="lg:col-span-5 rounded-2xl border border-cyan-400/30 bg-[#070d20] p-6">
              <div className="border-b border-slate-800 pb-4">
                <div className="font-mono text-xs font-bold text-amber-300">
                  STEP 2 · COMPLETE YOUR SUBSCRIPTION
                </div>
                <h4 className="mt-1 font-display text-lg font-bold text-white">
                  Cyber & Global Tech Digest Sign-Up
                </h4>
              </div>

              <form onSubmit={handleSubmit} noValidate className="mt-4 space-y-4">
                {/* Honeypot */}
                <div className="hidden" aria-hidden="true">
                  <label htmlFor="newsletter-hp">Do not fill</label>
                  <input
                    id="newsletter-hp"
                    type="text"
                    tabIndex={-1}
                    value={honeypot}
                    onChange={(e) => setHoneypot(e.target.value)}
                  />
                </div>

                <div>
                  <label
                    htmlFor="newsletter-email"
                    className="block text-xs font-semibold text-slate-200"
                  >
                    Email Address
                  </label>
                  <div className="relative mt-1.5">
                    <Mail
                      className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                      aria-hidden="true"
                    />
                    <input
                      id="newsletter-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400"
                    />
                  </div>
                </div>

                {/* Delivery Frequency Selector */}
                <div>
                  <label
                    htmlFor="newsletter-cadence"
                    className="block text-xs font-semibold text-slate-200"
                  >
                    Delivery Frequency
                  </label>
                  <select
                    id="newsletter-cadence"
                    value={cadence}
                    onChange={(e) =>
                      setCadence(
                        e.target.value as 'Weekly Digest' | 'Instant Alerts + Weekly Tech'
                      )
                    }
                    className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white focus:border-cyan-400"
                  >
                    <option value="Weekly Digest">
                      Weekly Cyber & Global Tech Digest (Every Friday)
                    </option>
                    <option value="Instant Alerts + Weekly Tech">
                      Instant Scam Alerts + Weekly Tech Roundup
                    </option>
                  </select>
                </div>

                {/* Summary of Active Tracks */}
                <div className="rounded-xl border border-slate-800 bg-slate-950/90 p-3 text-xs">
                  <div className="font-mono text-[11px] text-cyan-300">
                    SELECTED BRIEFING TRACKS:
                  </div>
                  <div className="mt-1 font-medium text-slate-200">
                    {selectedTracks.join(' · ')}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-xl bg-cyan-400 px-5 py-3 text-sm font-extrabold text-slate-950 shadow-[0_0_22px_rgba(0,240,255,0.35)] hover:bg-cyan-300 disabled:opacity-60 transition-colors"
                >
                  {isSubmitting ? 'Submitting...' : 'Sign Up for Cyber & Global Tech News'}
                </button>
              </form>

              {statusMessage.type !== 'idle' && (
                <div
                  role="status"
                  data-testid="newsletter-status"
                  className={`mt-4 rounded-xl border p-4 text-xs ${
                    statusMessage.type === 'error'
                      ? 'border-rose-400/50 bg-rose-950/40 text-rose-100'
                      : 'border-emerald-400/50 bg-emerald-950/35 text-emerald-100'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    {statusMessage.type === 'error' ? (
                      <AlertCircle
                        className="mt-0.5 h-4 w-4 shrink-0 text-rose-400"
                        aria-hidden="true"
                      />
                    ) : (
                      <CheckCircle2
                        className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400"
                        aria-hidden="true"
                      />
                    )}
                    <p className="leading-relaxed font-medium">{statusMessage.text}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CYBERSECURITY TOPICS (ILLUSTRATIVE EXAMPLES & GUIDES) */}
      {activeTab === 'cyber-feed' && (
        <div
          role="tabpanel"
          aria-label="Cybersecurity Topics"
          className="cybershield-glass rounded-2xl p-6 sm:p-8"
        >
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div>
              <div className="font-mono text-xs text-cyan-300">
                EXAMPLE BRIEFING TOPICS · ILLUSTRATIVE SCENARIOS
              </div>
              <h3 className="mt-1 font-display text-2xl font-bold text-white">
                Sample Cybersecurity Briefing Topics
              </h3>
              <p className="mt-1 text-xs text-slate-400">
                Illustrative examples of the topics covered in our digest, plus our community guide.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                if (!selectedTracks.includes('Cybersecurity & Ghana Scam Alerts')) {
                  setSelectedTracks((prev) => [...prev, 'Cybersecurity & Ghana Scam Alerts']);
                }
                setActiveTab('signup');
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-400 px-4 py-2.5 text-xs font-bold text-slate-950 hover:bg-cyan-300 transition-colors whitespace-nowrap shrink-0"
            >
              <span>Sign Up for Cyber Alerts</span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            {cyberNewsItems.map((item) => {
              const isExternal = item.url.startsWith('http');
              return (
                <a
                  key={item.id}
                  href={item.url}
                  target={isExternal ? '_blank' : undefined}
                  rel={isExternal ? 'noopener noreferrer' : undefined}
                  className="group flex flex-col justify-between rounded-xl border border-slate-800 bg-[#070d20] p-5 hover:border-cyan-400/50 transition-colors"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="font-mono text-cyan-300">{item.category}</span>
                      <span className="font-mono text-amber-300">
                        {item.isIllustrative ? 'Example · Illustrative scenario' : item.date}
                      </span>
                    </div>
                    <h4 className="mt-2 font-display text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
                      {item.title}
                    </h4>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-slate-800/80 pt-3 text-xs text-slate-300">
                    <span>{item.source}</span>
                    <span className="inline-flex items-center gap-1 font-semibold text-cyan-300">
                      <span>{isExternal ? 'Open Community Link' : 'Open Guide'}</span>
                      <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                    </span>
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: GLOBAL TECH & AI TOPICS (ILLUSTRATIVE EXAMPLES) */}
      {activeTab === 'global-tech-feed' && (
        <div
          role="tabpanel"
          aria-label="Global Tech and AI Topics"
          className="cybershield-glass rounded-2xl p-6 sm:p-8"
        >
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div>
              <div className="font-mono text-xs text-amber-300">
                EXAMPLE BRIEFING TOPICS · ILLUSTRATIVE SCENARIOS
              </div>
              <h3 className="mt-1 font-display text-2xl font-bold text-white">
                Sample Global Tech & AI Briefing Topics
              </h3>
              <p className="mt-1 text-xs text-slate-400">
                Illustrative examples of global technology, passwordless login, and software safety
                topics covered in our digest.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                if (!selectedTracks.includes('Global Tech & AI News')) {
                  setSelectedTracks((prev) => [...prev, 'Global Tech & AI News']);
                }
                setActiveTab('signup');
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-amber-400 px-4 py-2.5 text-xs font-extrabold text-slate-950 hover:bg-amber-300 transition-colors whitespace-nowrap shrink-0"
            >
              <span>Sign Up for Global Tech News</span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            {globalTechItems.map((item) => {
              const isExternal = item.url.startsWith('http');
              return (
                <a
                  key={item.id}
                  href={item.url}
                  target={isExternal ? '_blank' : undefined}
                  rel={isExternal ? 'noopener noreferrer' : undefined}
                  className="group flex flex-col justify-between rounded-xl border border-slate-800 bg-[#070d20] p-5 hover:border-amber-400/50 transition-colors"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="font-mono text-amber-300">{item.category}</span>
                      <span className="font-mono text-cyan-300">
                        {item.isIllustrative ? 'Example · Illustrative scenario' : item.date}
                      </span>
                    </div>
                    <h4 className="mt-2 font-display text-base font-bold text-white group-hover:text-amber-300 transition-colors">
                      {item.title}
                    </h4>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-slate-800/80 pt-3 text-xs text-slate-300">
                    <span>{item.source}</span>
                    <span className="inline-flex items-center gap-1 font-semibold text-amber-300">
                      <span>{isExternal ? 'Open Link' : 'Open Guide'}</span>
                      <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                    </span>
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
