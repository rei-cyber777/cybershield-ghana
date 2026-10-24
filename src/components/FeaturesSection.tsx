import React, { useEffect, useState } from 'react';
import {
  CORE_FEATURES,
  FEATURE_GROUPS,
  MINI_DEMO_CHIPS,
  SECURITY_PILLARS_OVERVIEW,
  CoreFeatureItem,
  FeatureGroupId,
  FeatureIconName,
  calculateMiniDemoRisk,
  computeExplorationProgress,
} from '../lib/featuresData';
import {
  ScanSearch,
  ShieldAlert,
  FileWarning,
  Share2,
  UserX,
  Lock,
  Database,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

const ICON_MAP: Record<FeatureIconName, React.FC<{ className?: string }>> = {
  ScanSearch,
  ShieldAlert,
  FileWarning,
  Share2,
  UserX,
  Lock,
  Database,
  ShieldCheck,
};

const ACCENT_STYLES: Record<
  CoreFeatureItem['accentColor'],
  {
    iconBox: string;
    borderActive: string;
    textAccent: string;
    buttonStyle: string;
  }
> = {
  cyan: {
    iconBox:
      'border-cyan-400/40 bg-cyan-400/10 text-cyan-300 shadow-[0_0_18px_rgba(0,240,255,0.22)]',
    borderActive: 'border-cyan-400/70 shadow-[0_0_28px_rgba(0,240,255,0.16)]',
    textAccent: 'text-cyan-300',
    buttonStyle: 'bg-cyan-400 text-slate-950 hover:bg-cyan-300',
  },
  violet: {
    iconBox:
      'border-violet-400/40 bg-violet-500/15 text-violet-300 shadow-[0_0_18px_rgba(124,58,237,0.25)]',
    borderActive: 'border-violet-400/70 shadow-[0_0_28px_rgba(124,58,237,0.18)]',
    textAccent: 'text-violet-300',
    buttonStyle: 'bg-violet-400 text-slate-950 hover:bg-violet-300',
  },
  magenta: {
    iconBox:
      'border-rose-400/40 bg-rose-500/15 text-rose-300 shadow-[0_0_18px_rgba(255,30,138,0.22)]',
    borderActive: 'border-rose-400/70 shadow-[0_0_28px_rgba(255,30,138,0.16)]',
    textAccent: 'text-rose-300',
    buttonStyle: 'bg-rose-400 text-slate-950 hover:bg-rose-300',
  },
  gold: {
    iconBox:
      'border-amber-400/40 bg-amber-400/15 text-amber-300 shadow-[0_0_18px_rgba(245,183,0,0.22)]',
    borderActive: 'border-amber-400/70 shadow-[0_0_28px_rgba(245,183,0,0.16)]',
    textAccent: 'text-amber-300',
    buttonStyle: 'bg-amber-400 text-slate-950 hover:bg-amber-300',
  },
};

export const FeaturesSection: React.FC = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(false);
  const [activeGroup, setActiveGroup] = useState<FeatureGroupId>('scam_protection');
  const [expandedIds, setExpandedIds] = useState<string[]>(['feat-scam-checker']);
  const [exploredIds, setExploredIds] = useState<string[]>(['feat-scam-checker']);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [hoveredCardTilt, setHoveredCardTilt] = useState<
    Record<string, { rx: number; ry: number }>
  >({});

  // Illustrative Mini-Demo state inside Card 1 ("Scam Checker")
  const [demoSelectedChips, setDemoSelectedChips] = useState<string[]>(['chip-money-first']);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mq.matches);
    const onMotionChange = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener('change', onMotionChange);

    const checkViewport = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkViewport();
    window.addEventListener('resize', checkViewport);

    return () => {
      mq.removeEventListener('change', onMotionChange);
      window.removeEventListener('resize', checkViewport);
    };
  }, []);

  const visibleFeatures = CORE_FEATURES.filter((item) => item.groupId === activeGroup);
  const progress = computeExplorationProgress(exploredIds, CORE_FEATURES.length);
  const demoRisk = calculateMiniDemoRisk(demoSelectedChips);

  const handleToggleCard = (featureId: string) => {
    setExploredIds((prev) => (prev.includes(featureId) ? prev : [...prev, featureId]));

    setExpandedIds((prev) => {
      const isCurrentlyOpen = prev.includes(featureId);
      if (isCurrentlyOpen) {
        return prev.filter((id) => id !== featureId);
      }
      // Only one card expanded at a time on mobile; allow multiple on desktop
      if (isMobile) {
        return [featureId];
      }
      return [...prev, featureId];
    });
  };

  const handleCardKeyDown = (e: React.KeyboardEvent, featureId: string) => {
    if (e.key === 'Escape' && expandedIds.includes(featureId)) {
      e.preventDefault();
      setExpandedIds((prev) => prev.filter((id) => id !== featureId));
    };
  };

  const handleCardMouseMove = (
    e: React.MouseEvent<HTMLElement>,
    featureId: string
  ) => {
    if (prefersReducedMotion || isMobile) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setHoveredCardTilt((prev) => ({
      ...prev,
      [featureId]: { rx: -y * 4, ry: x * 5 },
    }));
  };

  const handleCardMouseLeave = (featureId: string) => {
    if (prefersReducedMotion || isMobile) return;
    setHoveredCardTilt((prev) => ({
      ...prev,
      [featureId]: { rx: 0, ry: 0 },
    }));
  };

  const toggleDemoChip = (chipId: string) => {
    setDemoSelectedChips((prev) =>
      prev.includes(chipId) ? prev.filter((id) => id !== chipId) : [...prev, chipId]
    );
  };

  const activeGroupMeta =
    FEATURE_GROUPS.find((g) => g.id === activeGroup) || FEATURE_GROUPS[0];

  return (
    <section
      id="core-features"
      aria-labelledby="core-features-heading"
      className="space-y-8"
    >
      {/* Top Header, Progress Indicator & Group Toggle */}
      <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
        <div className="max-w-2xl space-y-2">
          <div className="font-mono text-xs text-cyan-300">
            Core Security Features · Transparent Defense Architecture
          </div>
          <h2
            id="core-features-heading"
            className="font-display text-2xl font-bold text-white sm:text-3xl"
          >
            How CyberShield Keeps You Safe
          </h2>
          <p className="text-sm leading-relaxed text-slate-300">
            A plain-English breakdown of our core security features—covering{' '}
            <strong className="text-white">threat detection</strong>,{' '}
            <strong className="text-white">encryption</strong>, and{' '}
            <strong className="text-white">access control</strong>—plus 8 interactive defense
            modules below.
          </p>
        </div>

        {/* Exploration Progress Tracker ("X of 8 features explored") */}
        <div
          data-testid="features-progress-tracker"
          className="cybershield-glass rounded-xl px-4 py-3 sm:min-w-[290px]"
        >
          <div className="flex items-center justify-between gap-4 text-xs">
            <span className="font-medium text-slate-200 whitespace-nowrap">Features Explored</span>
            <span className="font-mono font-bold text-cyan-300 tabular-nums whitespace-nowrap">
              {progress.exploredCount} of {progress.totalCount} features explored
            </span>
          </div>
          <div
            role="progressbar"
            aria-valuenow={progress.exploredCount}
            aria-valuemin={0}
            aria-valuemax={progress.totalCount}
            aria-label="Core features explored progress"
            className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-900"
          >
            <div
              style={{ width: `${progress.percentage}%` }}
              className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-violet-400 to-amber-300 transition-all duration-200"
            />
          </div>
        </div>
      </div>

      {/* 3 Core Security Pillars (Threat Detection, Encryption, Access Control) with Bullet Points */}
      <div
        data-testid="security-pillars-grid"
        className="grid grid-cols-1 gap-5 lg:grid-cols-3"
      >
        {SECURITY_PILLARS_OVERVIEW.map((pillar) => {
          const PillarIcon = ICON_MAP[pillar.iconName];
          const pillarStyle = ACCENT_STYLES[pillar.accentColor];
          return (
            <div
              key={pillar.id}
              className="cybershield-glass flex flex-col justify-between rounded-2xl p-6"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <span className={`font-mono text-xs font-bold ${pillarStyle.textAccent}`}>
                    {pillar.badge}
                  </span>
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${pillarStyle.iconBox}`}
                  >
                    <PillarIcon className="h-4 w-4" aria-hidden="true" />
                  </div>
                </div>

                <h3 className="font-display text-lg font-bold text-white">
                  {pillar.title}
                </h3>

                <p className="text-xs leading-relaxed text-slate-200">
                  {pillar.plainEnglishIntro}
                </p>

                <ul className="space-y-2 border-t border-slate-800/80 pt-3 text-xs leading-relaxed text-slate-300">
                  {pillar.bulletPoints.map((bullet, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className={`font-mono font-bold ${pillarStyle.textAccent}`}>•</span>
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>

      {/* Celebratory Banner When All 8 Features Are Explored */}
      {progress.isComplete && (
        <div
          role="status"
          data-testid="features-celebration-banner"
          className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-amber-400/50 bg-gradient-to-r from-amber-950/40 via-[#0b132b] to-cyan-950/40 p-5 sm:flex-row sm:items-center"
        >
          <div className="flex items-start gap-3.5">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" aria-hidden="true" />
            <div>
              <div className="font-display text-sm font-bold text-white">
                All 8 Core Features Explored!
              </div>
              <p className="mt-0.5 text-xs text-slate-200">
                You now know how CyberShield protects both your wallet and your privacy. Put it to
                the test on a suspicious message right now.
              </p>
            </div>
          </div>
          <a
            href="#scam-checker"
            className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 text-xs font-extrabold text-slate-950 shadow-[0_0_20px_rgba(245,183,0,0.35)] hover:bg-amber-300 transition-colors whitespace-nowrap shrink-0"
          >
            <span>Check if it's a scam</span>
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        </div>
      )}

      {/* Glowing Group Toggle Tabs */}
      <div className="space-y-3">
        <div
          role="tablist"
          aria-label="Core Feature Groups"
          className="inline-flex flex-wrap gap-2 rounded-2xl border border-slate-800 bg-[#070c1c] p-1.5"
        >
          {FEATURE_GROUPS.map((group) => {
            const isSelected = activeGroup === group.id;
            const groupCount = CORE_FEATURES.filter((f) => f.groupId === group.id).length;
            const groupExploredCount = CORE_FEATURES.filter(
              (f) => f.groupId === group.id && exploredIds.includes(f.id)
            ).length;

            return (
              <button
                key={group.id}
                role="tab"
                type="button"
                aria-selected={isSelected}
                onClick={() => setActiveGroup(group.id)}
                className={`rounded-xl px-4 py-2.5 text-xs font-bold transition-all whitespace-nowrap shrink-0 sm:text-sm ${
                  isSelected
                    ? 'bg-cyan-400 text-slate-950 shadow-[0_0_24px_rgba(0,240,255,0.35)]'
                    : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <span>{group.label}</span>
                <span
                  className={`ml-2 font-mono text-xs ${
                    isSelected ? 'text-slate-900' : 'text-cyan-300'
                  }`}
                >
                  ({groupExploredCount}/{groupCount})
                </span>
              </button>
            );
          })}
        </div>

        <p className="text-xs text-slate-400">{activeGroupMeta.shortDescription}</p>
      </div>

      {/* Responsive Feature Cards Grid (1 col mobile, 2 cols tablet, 4 cols desktop) */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        {visibleFeatures.map((feature) => {
          const IconComponent = ICON_MAP[feature.iconName];
          const isExpanded = expandedIds.includes(feature.id);
          const styles = ACCENT_STYLES[feature.accentColor];
          const panelId = `feature-panel-${feature.id}`;
          const tilt = hoveredCardTilt[feature.id] || { rx: 0, ry: 0 };

          return (
            <article
              key={feature.id}
              onKeyDown={(e) => handleCardKeyDown(e, feature.id)}
              onMouseMove={(e) => handleCardMouseMove(e, feature.id)}
              onMouseLeave={() => handleCardMouseLeave(feature.id)}
              style={
                !prefersReducedMotion && !isMobile
                  ? {
                      transform: `perspective(900px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
                      transition: 'transform 160ms cubic-bezier(0.16, 1, 0.3, 1)',
                    }
                  : undefined
              }
              className={`cybershield-glass flex flex-col justify-between rounded-2xl p-5 transition-colors ${
                isExpanded ? styles.borderActive : 'hover:border-cyan-400/40'
              }`}
            >
              <div>
                {/* Card Header Button (Keyboard & Screen-Reader Accessible) */}
                <button
                  type="button"
                  aria-expanded={isExpanded}
                  aria-controls={panelId}
                  onClick={() => handleToggleCard(feature.id)}
                  className="group w-full text-left"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition-transform duration-150 ${
                        styles.iconBox
                      } ${!prefersReducedMotion ? 'group-hover:scale-105' : ''}`}
                    >
                      <IconComponent className="h-5 w-5" aria-hidden="true" />
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-slate-400">
                        {feature.number} · {feature.status}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-cyan-300" aria-hidden="true" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-slate-400" aria-hidden="true" />
                      )}
                    </div>
                  </div>

                  <h3 className="mt-4 font-display text-lg font-bold text-white group-hover:text-cyan-300 transition-colors">
                    {feature.title}
                  </h3>

                  <p className="mt-2 text-xs leading-relaxed text-slate-200">
                    {feature.oneLineSummary}
                  </p>

                  <div className="mt-3 inline-flex items-center gap-1 font-mono text-[11px] text-cyan-300">
                    <span>{isExpanded ? 'Hide details' : 'Click to inspect how it works'}</span>
                  </div>
                </button>

                {/* Expandable Details Drawer */}
                {isExpanded && (
                  <div
                    id={panelId}
                    role="region"
                    aria-label={`${feature.title} details`}
                    className="mt-4 space-y-4 border-t border-slate-800/90 pt-4 text-xs"
                  >
                    {/* What It Is */}
                    <div>
                      <div className={`font-mono font-semibold ${styles.textAccent}`}>
                        What it is:
                      </div>
                      <p className="mt-1 leading-relaxed text-slate-200">
                        {feature.whatItIs}
                      </p>
                    </div>

                    {/* How It Protects You */}
                    <div>
                      <div className={`font-mono font-semibold ${styles.textAccent}`}>
                        How it protects you:
                      </div>
                      <ul className="mt-1.5 space-y-1.5 leading-relaxed text-slate-300">
                        {feature.howItProtectsYou.map((point, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="font-mono font-bold text-cyan-400">•</span>
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Live Illustrative Mini-Demo inside Scam Checker Card */}
                    {feature.hasMiniDemo && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="rounded-xl border border-cyan-400/30 bg-[#050918] p-3.5 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-amber-300">
                            <Sparkles className="h-3 w-3" aria-hidden="true" />
                            <span>Interactive Mini-Demo (Illustrative)</span>
                          </span>
                          <span
                            data-testid="mini-demo-risk-label"
                            className={`font-mono text-xs font-bold ${
                              demoRisk.level === 'High'
                                ? 'text-rose-400'
                                : demoRisk.level === 'Moderate'
                                ? 'text-amber-300'
                                : 'text-emerald-400'
                            }`}
                          >
                            Meter: {demoRisk.level} ({demoRisk.score}%)
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-300">
                          Toggle these sample red flags to see how the risk meter reacts:
                        </p>

                        <div className="flex flex-wrap gap-1.5">
                          {MINI_DEMO_CHIPS.map((chip) => {
                            const active = demoSelectedChips.includes(chip.id);
                            return (
                              <button
                                key={chip.id}
                                type="button"
                                aria-pressed={active}
                                onClick={() => toggleDemoChip(chip.id)}
                                className={`rounded-lg border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                                  active
                                    ? 'border-cyan-400 bg-cyan-400/20 text-white'
                                    : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200'
                                }`}
                              >
                                {active ? '✓ ' : '+ '}
                                {chip.label}
                              </button>
                            );
                          })}
                        </div>

                        {/* Visual Risk Meter Bar */}
                        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-900">
                          <div
                            style={{ width: `${Math.max(8, demoRisk.score)}%` }}
                            className={`h-full rounded-full transition-all duration-150 ${
                              demoRisk.level === 'High'
                                ? 'bg-rose-500'
                                : demoRisk.level === 'Moderate'
                                ? 'bg-amber-400'
                                : 'bg-emerald-400'
                            }`}
                          />
                        </div>
                      </div>
                    )}

                    {/* Action Link ("Try it" / "Learn more") */}
                    <div className="pt-1">
                      <a
                        href={feature.ctaHref}
                        className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold transition-colors whitespace-nowrap shrink-0 ${styles.buttonStyle}`}
                      >
                        <span>{feature.ctaLabel}</span>
                        <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};
