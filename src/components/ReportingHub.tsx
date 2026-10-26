import React, { useEffect, useState } from 'react';
import {
  GHANA_AUTHORITIES_DIRECTORY,
  INITIAL_VERIFIED_ALERTS,
  VerifiedAlertItem,
} from '../lib/data';
import {
  fetchPublicAlerts,
  submitAnonymousReport,
} from '../lib/storage';
import {
  Search,
  ShieldAlert,
  Share2,
  Send,
  ExternalLink,
} from 'lucide-react';

export const ReportingHub: React.FC = () => {
  // Directory search & filter state
  const [directoryQuery, setDirectoryQuery] = useState<string>('');
  const [selectedScamFilter, setSelectedScamFilter] = useState<string>('All');

  // Public Community Alerts & Illustrative Scenarios state
  const [alerts, setAlerts] = useState<VerifiedAlertItem[]>(INITIAL_VERIFIED_ALERTS);

  // Anonymous Report Form state
  const [scamType, setScamType] = useState<string>('Mobile Money Fraud');
  const [channel, setChannel] = useState<'WhatsApp' | 'SMS' | 'Phone Call' | 'Social Media'>(
    'WhatsApp'
  );
  const [description, setDescription] = useState<string>('');
  const [honeypot, setHoneypot] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitStatus, setSubmitStatus] = useState<{
    type: 'idle' | 'success' | 'error';
    message: string;
  }>({ type: 'idle', message: '' });

  useEffect(() => {
    let active = true;
    fetchPublicAlerts().then((loaded) => {
      if (active) {
        setAlerts(loaded);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const filteredAuthorities = GHANA_AUTHORITIES_DIRECTORY.filter((auth) => {
    const matchesFilter =
      selectedScamFilter === 'All' ||
      auth.scamTypes.some((t) => t.toLowerCase().includes(selectedScamFilter.toLowerCase()));
    const matchesQuery =
      directoryQuery.trim() === '' ||
      auth.organization.toLowerCase().includes(directoryQuery.toLowerCase()) ||
      auth.role.toLowerCase().includes(directoryQuery.toLowerCase()) ||
      auth.scamTypes.some((t) => t.toLowerCase().includes(directoryQuery.toLowerCase()));
    return matchesFilter && matchesQuery;
  });

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus({ type: 'idle', message: '' });

    const res = await submitAnonymousReport({
      scamType,
      channel,
      description,
      honeypot,
    });

    setIsSubmitting(false);

    if (!res.ok) {
      setSubmitStatus({
        type: 'error',
        message: res.error || 'Could not submit report. Please check your input.',
      });
      return;
    }

    setDescription('');
    setSubmitStatus({
      type: 'success',
      message:
        'Thank you. Your anonymous scam report has been submitted for review. Any phone numbers were automatically redacted for privacy.',
    });
  };

  return (
    <div className="space-y-16">
      {/* 1. Ghana Cybercrime Reporting & Authorities Directory */}
      <div id="directory" className="cybershield-glass rounded-2xl p-6 sm:p-8">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-800 pb-6 lg:flex-row lg:items-end">
          <div>
            <div className="font-mono text-xs text-cyan-300">
              OFFICIAL REPORTING DIRECTORY
            </div>
            <h3 className="mt-2 font-display text-2xl font-bold text-white">
              Ghana Cybercrime Reporting & Authorities Directory
            </h3>
            <p className="mt-1 text-xs text-slate-400">
              Never trust contact numbers sent inside a suspicious message. Visit the official
              websites linked below to confirm current reporting channels.
            </p>
          </div>

          {/* Search input */}
          <div className="relative w-full lg:w-80">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              type="search"
              value={directoryQuery}
              onChange={(e) => setDirectoryQuery(e.target.value)}
              aria-label="Search authorities by scam type or agency name"
              placeholder="Search by scam type or agency..."
              className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2.5 pl-10 pr-4 text-xs text-slate-100 placeholder:text-slate-500 focus:border-cyan-400"
            />
          </div>
        </div>

        {/* Filter Buttons by Scam Type */}
        <div className="mt-4 flex flex-wrap gap-2">
          {(
            [
              'All',
              'Mobile Money Fraud',
              'Investment Scams',
              'Fake Jobs & Scholarships',
              'Phishing',
            ] as const
          ).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setSelectedScamFilter(type)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                selectedScamFilter === type
                  ? 'bg-cyan-400 text-slate-950 font-semibold'
                  : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
          {filteredAuthorities.map((auth) => (
            <div
              key={auth.id}
              className="flex flex-col justify-between rounded-xl border border-slate-800 bg-[#070d20] p-5"
            >
              <div>
                <h4 className="font-display text-base font-bold text-white">
                  {auth.organization}
                </h4>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-300">{auth.role}</p>
                <div className="mt-3 text-xs text-slate-400">
                  <span>Handles: </span>
                  <span className="text-cyan-300">{auth.scamTypes.join(' · ')}</span>
                </div>
              </div>

              <div className="mt-4 space-y-2.5 border-t border-slate-800/80 pt-3.5 text-xs">
                <p className="text-slate-300">{auth.whenToContact}</p>
                <div className="flex items-center justify-between gap-2 pt-1">
                  <span className="font-mono text-[11px] text-amber-200">
                    {auth.contactPlaceholder}
                  </span>
                  <a
                    href={auth.officialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-lg border border-cyan-400/40 bg-cyan-950/30 px-3 py-1.5 text-xs font-semibold text-cyan-300 hover:bg-cyan-900/50 transition-colors whitespace-nowrap shrink-0"
                  >
                    <span>Official Website</span>
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Anonymous Scam Report Form + Community Scam Alerts & Illustrative Scenarios */}
      <div id="report-scam" className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left: Anonymous Scam Report Form */}
        <div className="lg:col-span-5 cybershield-glass rounded-2xl p-6 sm:p-8">
          <div className="font-mono text-xs text-cyan-300">
            ANONYMOUS REPORT · NO PERSONAL DATA COLLECTED
          </div>
          <h3 className="mt-2 font-display text-xl font-bold text-white">
            Submit an Anonymous Scam Report
          </h3>
          <p className="mt-1.5 text-xs leading-relaxed text-slate-300">
            We do not ask for your name or phone number. Any 10-digit phone numbers typed in the
            description are automatically redacted before your report is saved for review.
          </p>

          <form onSubmit={handleReportSubmit} className="mt-6 space-y-4">
            {/* Hidden Honeypot Input for Spam Protection */}
            <div className="hidden" aria-hidden="true">
              <label htmlFor="cybershield-hp-field">Leave this field empty</label>
              <input
                id="cybershield-hp-field"
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
              />
            </div>

            <div>
              <label
                htmlFor="report-scam-type"
                className="block text-xs font-semibold text-slate-200"
              >
                Scam Category
              </label>
              <select
                id="report-scam-type"
                value={scamType}
                onChange={(e) => setScamType(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white focus:border-cyan-400"
              >
                <option value="Mobile Money Fraud">Mobile Money (MoMo) Fraud</option>
                <option value="Fake Jobs & Scholarships">Fake Jobs & Scholarships</option>
                <option value="Investment Scams">Investment & Crypto Scams</option>
                <option value="Phishing">Phishing & Account Takeover</option>
                <option value="Impersonation">Impersonation / Protocol Scam</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="report-channel"
                className="block text-xs font-semibold text-slate-200"
              >
                Channel Used by Scammer
              </label>
              <select
                id="report-channel"
                value={channel}
                onChange={(e) =>
                  setChannel(
                    e.target.value as 'WhatsApp' | 'SMS' | 'Phone Call' | 'Social Media'
                  )
                }
                className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white focus:border-cyan-400"
              >
                <option value="WhatsApp">WhatsApp</option>
                <option value="SMS">SMS Text Message</option>
                <option value="Phone Call">Phone Call</option>
                <option value="Social Media">Social Media (Telegram / Facebook / X)</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="report-description"
                className="block text-xs font-semibold text-slate-200"
              >
                What Happened? (No personal info)
              </label>
              <textarea
                id="report-description"
                rows={4}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what the message or caller asked you to do (minimum 15 characters)..."
                className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 p-3.5 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 text-sm font-bold text-slate-950 shadow-[0_0_20px_rgba(0,240,255,0.28)] hover:bg-cyan-300 disabled:opacity-60 transition-colors"
            >
              <Send className="h-4 w-4" aria-hidden="true" />
              <span>{isSubmitting ? 'Submitting...' : 'Submit Anonymous Report'}</span>
            </button>

            {submitStatus.type !== 'idle' && (
              <div
                role="status"
                data-testid="report-submit-status"
                className={`rounded-xl border p-3.5 text-xs leading-relaxed ${
                  submitStatus.type === 'success'
                    ? 'border-emerald-400/40 bg-emerald-950/30 text-emerald-200'
                    : 'border-rose-400/40 bg-rose-950/30 text-rose-200'
                }`}
              >
                {submitStatus.message}
              </div>
            )}
          </form>
        </div>

        {/* Right: Community Scam Alerts & Illustrative Scenarios (with WhatsApp Share) */}
        <div className="lg:col-span-7 cybershield-glass rounded-2xl p-6 sm:p-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <div className="font-mono text-xs text-amber-300">
                  COMMUNITY ALERTS & ILLUSTRATIVE SCENARIOS ({alerts.length})
                </div>
                <h3 className="mt-1 font-display text-xl font-bold text-white">
                  Scam Warnings & Illustrative Examples
                </h3>
              </div>
              <ShieldAlert className="h-6 w-6 text-amber-400 shrink-0" aria-hidden="true" />
            </div>

            <div data-testid="verified-alerts-list" className="mt-5 space-y-4">
              {alerts.map((alert) => {
                const isExample = Boolean(alert.isIllustrative);
                const alertShareText = encodeURIComponent(
                  `CyberShield Ghana Scam Warning (${alert.scamType} via ${alert.channel}): ${alert.summary} — Safety Tip: ${alert.preventionTip}`
                );
                const whatsappUrl = `https://wa.me/?text=${alertShareText}`;

                return (
                  <div
                    key={alert.id}
                    className="rounded-xl border border-slate-800 bg-[#070d20] p-5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                      <span>
                        <strong className="text-amber-300">
                          {isExample ? 'Example · Illustrative scenario' : 'Community Alert'}
                        </strong>{' '}
                        · {alert.scamType} · {alert.channel}
                      </span>
                      <span className="font-mono">{alert.publishedAt}</span>
                    </div>

                    <h4 className="mt-2 font-display text-base font-bold text-white">
                      {alert.title}
                    </h4>
                    <p className="mt-1.5 text-xs leading-relaxed text-slate-300">
                      {alert.summary}
                    </p>

                    <div className="mt-3 flex flex-col justify-between gap-3 border-t border-slate-800/80 pt-3 sm:flex-row sm:items-center">
                      <span className="text-xs text-cyan-200">
                        <strong className="text-cyan-400">Safety Tip: </strong>
                        {alert.preventionTip}
                      </span>

                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-400/40 bg-emerald-950/40 px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-900/50 transition-colors whitespace-nowrap shrink-0"
                      >
                        <Share2 className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Share on WhatsApp</span>
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
