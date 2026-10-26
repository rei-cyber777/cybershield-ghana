import React, { useState } from 'react';
import { SPOT_SCAM_SCENARIOS, SpotScamScenario } from '../lib/data';
import { CheckCircle2, AlertOctagon, RotateCcw } from 'lucide-react';

export const SpotTheScamLab: React.FC = () => {
  const [scenarioIndex, setScenarioIndex] = useState<number>(0);
  const [discoveredIds, setDiscoveredIds] = useState<string[]>([]);
  const [safeTapFeedback, setSafeTapFeedback] = useState<string | null>(null);

  const scenario: SpotScamScenario = SPOT_SCAM_SCENARIOS[scenarioIndex];
  const suspiciousSegments = scenario.segments.filter((s) => s.isSuspicious);
  const totalFlags = suspiciousSegments.length;
  const foundCount = discoveredIds.length;

  const handleSegmentTap = (segmentId: string, isSuspicious: boolean) => {
    if (isSuspicious) {
      setSafeTapFeedback(null);
      if (!discoveredIds.includes(segmentId)) {
        setDiscoveredIds((prev) => [...prev, segmentId]);
      }
    } else {
      setSafeTapFeedback(
        'That phrase alone is neutral—look closely at sender numbers, payment demands, or links!'
      );
    }
  };

  const handleScenarioSwitch = (index: number) => {
    setScenarioIndex(index);
    setDiscoveredIds([]);
    setSafeTapFeedback(null);
  };

  const handleReset = () => {
    setDiscoveredIds([]);
    setSafeTapFeedback(null);
  };

  return (
    <div className="cybershield-glass rounded-2xl p-6 sm:p-8">
      {/* Top Scenario Switcher & Score Readout */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex flex-wrap gap-2">
          {SPOT_SCAM_SCENARIOS.map((item, idx) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleScenarioSwitch(idx)}
              className={`rounded-lg px-4 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                scenarioIndex === idx
                  ? 'bg-cyan-400 text-slate-950'
                  : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
              }`}
            >
              Illustrative Scenario {idx + 1}: {item.channel}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <div
            data-testid="spot-scam-score"
            className="font-mono text-sm font-semibold text-cyan-300"
          >
            Red Flags Found: {foundCount} / {totalFlags}
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-300 hover:border-cyan-400/50 hover:text-white transition-colors whitespace-nowrap shrink-0"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Illustrative WhatsApp / SMS Chat Frame */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-800 bg-[#071018] p-5 shadow-inner">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <div className="text-xs font-mono text-emerald-400">
                Illustrative Scenario · {scenario.channel} Message Simulation
              </div>
              <div className="mt-0.5 text-sm font-bold text-white">{scenario.senderName}</div>
              <div className="font-mono text-xs text-slate-400">{scenario.senderNumber}</div>
            </div>
            <div className="font-mono text-xs text-slate-400">{scenario.timestamp}</div>
          </div>

          <p className="mt-4 text-xs text-cyan-300">
            Instruction: Tap or click each suspicious part of the message bubble below to flag it.
          </p>

          {/* Message Bubble with Interactive Tappable Segments */}
          <div className="mt-3 rounded-2xl rounded-tl-none border border-emerald-500/25 bg-[#0d1f22] p-4 space-y-2.5">
            {scenario.segments.map((seg, idx) => {
              const isRevealed = discoveredIds.includes(seg.id);
              return (
                <button
                  key={seg.id}
                  type="button"
                  onClick={() => handleSegmentTap(seg.id, seg.isSuspicious)}
                  aria-label={`Inspect message phrase ${idx + 1}: ${seg.text}`}
                  className={`block w-full rounded-lg border p-3 text-left text-sm leading-relaxed transition-all ${
                    isRevealed
                      ? 'border-rose-400 bg-rose-950/50 text-rose-100 shadow-[0_0_15px_rgba(255,30,138,0.2)]'
                      : 'border-slate-700/70 bg-slate-900/75 text-slate-100 hover:border-cyan-400/60 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span>{seg.text}</span>
                    <span className="font-mono text-xs shrink-0 text-cyan-300">
                      {isRevealed ? 'FLAGGED' : 'Tap to inspect'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {safeTapFeedback && (
            <div
              role="status"
              className="mt-3 rounded-lg border border-amber-400/30 bg-amber-950/30 px-3.5 py-2.5 text-xs text-amber-200"
            >
              {safeTapFeedback}
            </div>
          )}
        </div>

        {/* Discovered Red Flags & Completion Score Panel */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
          <div>
            <h3 className="font-display text-lg font-bold text-white">
              Revealed Red-Flag Breakdown
            </h3>
            <p className="mt-1 text-xs text-slate-400">
              Tap all {totalFlags} suspicious segments in the message to unlock the full forensic
              analysis.
            </p>

            <div className="mt-4 space-y-3">
              {suspiciousSegments.map((seg, idx) => {
                const isRevealed = discoveredIds.includes(seg.id);
                return (
                  <div
                    key={seg.id}
                    className={`rounded-xl border p-4 transition-colors ${
                      isRevealed
                        ? 'border-rose-400/40 bg-rose-950/20'
                        : 'border-slate-800 bg-slate-900/40'
                    }`}
                  >
                    {isRevealed ? (
                      <>
                        <div className="flex items-center gap-2 text-xs font-bold text-rose-300">
                          <AlertOctagon className="h-4 w-4 text-rose-400 shrink-0" />
                          <span>
                            Red Flag 0{idx + 1}: {seg.flagTitle}
                          </span>
                        </div>
                        <p className="mt-1.5 text-xs leading-relaxed text-slate-200">
                          {seg.explanation}
                        </p>
                      </>
                    ) : (
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span className="font-mono">Hidden Red Flag 0{idx + 1}</span>
                        <span>Tap suspicious phrase in chat to reveal</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {foundCount === totalFlags && (
            <div
              role="status"
              className="rounded-xl border border-emerald-400/40 bg-emerald-950/30 p-4 text-xs text-emerald-100"
            >
              <div className="flex items-center gap-2 font-display text-sm font-bold text-emerald-300">
                <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                <span>100% Detection Score ({foundCount}/{totalFlags} Flags Identified)!</span>
              </div>
              <p className="mt-1.5 leading-relaxed">
                You spotted every manipulation tactic in this message. Try switching to the other
                scenario above or test a suspicious message in the Red-Flag Scanner below.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
