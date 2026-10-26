import React, { useState } from 'react';
import {
  RED_FLAG_INDICATORS,
  evaluateScamRisk,
  ScamEvaluationResult,
} from '../lib/scamCheckerEngine';
import { Language } from '../lib/i18n';
import { ShieldAlert, ShieldCheck, ScanLine, RotateCcw } from 'lucide-react';

interface ScamCheckerProps {
  lang: Language;
}

export const ScamChecker: React.FC<ScamCheckerProps> = ({ lang }) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [messageText, setMessageText] = useState<string>('');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [result, setResult] = useState<ScamEvaluationResult | null>(null);

  const toggleFlag = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleRunScan = (e: React.FormEvent) => {
    e.preventDefault();
    setIsScanning(true);
    const computed = evaluateScamRisk({
      selectedFlagIds: selectedIds,
      messageText,
    });
    // Quick scanning reveal (180ms for crisp feedback within latency budget)
    window.setTimeout(() => {
      setIsScanning(false);
      setResult(computed);
    }, 180);
  };

  const handleReset = () => {
    setSelectedIds([]);
    setMessageText('');
    setResult(null);
    setIsScanning(false);
  };

  return (
    <div className="cybershield-glass rounded-2xl p-6 sm:p-8">
      <form onSubmit={handleRunScan} className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left Column: Red-Flag Checklist + Optional Message Paste */}
        <div className="lg:col-span-7 space-y-5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-cyan-300">
              STEP 1 · CHECK ALL WARNING SIGNS THAT APPLY ({selectedIds.length} SELECTED)
            </span>
            {selectedIds.length > 0 && (
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-cyan-300 transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Clear selection</span>
              </button>
            )}
          </div>

          <div className="space-y-2.5">
            {RED_FLAG_INDICATORS.map((indicator) => {
              const checked = selectedIds.includes(indicator.id);
              return (
                <label
                  key={indicator.id}
                  className={`flex cursor-pointer items-start gap-3.5 rounded-xl border p-3.5 text-sm transition-colors ${
                    checked
                      ? 'border-cyan-400 bg-cyan-400/10 text-white'
                      : 'border-slate-800 bg-slate-900/60 text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleFlag(indicator.id)}
                    className="mt-1 h-4 w-4 rounded border-slate-600 accent-cyan-400"
                  />
                  <div className="space-y-1">
                    <div className="font-medium leading-snug">
                      {lang === 'tw' ? indicator.questionTwi : indicator.question}
                    </div>
                    <div className="font-mono text-xs text-slate-400">
                      Category: {indicator.category} · Risk Weight: +{indicator.weight}
                    </div>
                  </div>
                </label>
              );
            })}
          </div>

          <div>
            <label
              htmlFor="scam-checker-message"
              className="block font-mono text-xs text-cyan-300"
            >
              STEP 2 (OPTIONAL) · PASTE SUSPICIOUS SMS OR WHATSAPP TEXT TO SCAN FOR KEYWORDS
            </label>
            <textarea
              id="scam-checker-message"
              rows={3}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Paste the message here (never include your real PIN or password)..."
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950/90 p-3.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-400"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-6 py-3 text-sm font-bold text-slate-950 shadow-[0_0_24px_rgba(0,240,255,0.3)] hover:bg-cyan-300 transition-colors whitespace-nowrap shrink-0"
            >
              <ScanLine className="h-4 w-4" aria-hidden="true" />
              <span>Run Threat Scan</span>
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm font-medium text-slate-300 hover:border-slate-500 hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Reset Scanner
            </button>
          </div>
        </div>

        {/* Right Column: Scanner Terminal & Risk Verdict Output */}
        <div className="lg:col-span-5 flex flex-col justify-between rounded-2xl border border-slate-800 bg-[#050918] p-6">
          {isScanning ? (
            <div
              role="status"
              className="flex h-full min-h-[280px] flex-col items-center justify-center text-center"
            >
              <ScanLine className="h-10 w-10 text-cyan-400 animate-bounce" />
              <div className="mt-3 font-mono text-sm font-semibold text-cyan-300">
                SCANNING RED-FLAG HEURISTICS...
              </div>
              <p className="mt-1 text-xs text-slate-400">
                Evaluating against Ghanaian MoMo, scholarship, and phishing rule signatures.
              </p>
            </div>
          ) : result ? (
            <div data-testid="scam-checker-result" className="space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <div className="font-mono text-xs text-slate-400">SCAN VERDICT</div>
                  <div
                    className={`mt-1 font-display text-2xl font-extrabold ${
                      result.riskLevel === 'Critical' || result.riskLevel === 'High'
                        ? 'text-rose-400'
                        : result.riskLevel === 'Moderate'
                        ? 'text-amber-300'
                        : 'text-emerald-400'
                    }`}
                  >
                    {result.riskLevel.toUpperCase()} RISK
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-xs text-slate-400">RISK SCORE</div>
                  <div className="mt-1 font-mono text-3xl font-bold text-white tabular-nums">
                    {result.score}/100
                  </div>
                </div>
              </div>

              <p className="text-sm leading-relaxed text-slate-200">{result.summary}</p>

              {result.detectedTextPatterns.length > 0 && (
                <div className="rounded-xl border border-rose-500/30 bg-rose-950/25 p-3.5">
                  <div className="font-mono text-xs font-semibold text-rose-300">
                    TEXT PATTERNS DETECTED IN MESSAGE:
                  </div>
                  <ul className="mt-1.5 space-y-1 text-xs text-rose-100">
                    {result.detectedTextPatterns.map((pat, i) => (
                      <li key={i}>• {pat}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div>
                <div className="font-mono text-xs font-semibold text-cyan-300">
                  RECOMMENDED NEXT STEPS:
                </div>
                <ul className="mt-2.5 space-y-2 text-xs leading-relaxed text-slate-200">
                  {result.recommendedActions.map((step, idx) => (
                    <li
                      key={idx}
                      className="rounded-lg border border-slate-800 bg-slate-900/80 p-3"
                    >
                      <span className="font-mono font-bold text-cyan-300">0{idx + 1}. </span>
                      {step}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="flex h-full min-h-[280px] flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 font-mono text-xs text-cyan-300">
                  <ShieldCheck className="h-4 w-4" />
                  <span>MODULAR RULE ENGINE READY</span>
                </div>
                <h3 className="mt-3 font-display text-xl font-bold text-white">
                  Awaiting Red-Flag Selection
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-300">
                  Check one or more warning signs on the left (or paste a suspicious message) and
                  click <strong>Run Threat Scan</strong> to calculate the risk score and receive
                  Ghana-specific action steps.
                </p>
              </div>

              <div className="rounded-xl border border-slate-800/90 bg-slate-950/70 p-4 text-xs text-slate-400">
                <div className="flex items-center gap-2 font-mono text-slate-300">
                  <ShieldAlert className="h-4 w-4 text-amber-400 shrink-0" />
                  <span>Privacy Note</span>
                </div>
                <p className="mt-1 leading-relaxed">
                  Your message is checked directly in your browser and is never saved. Never share
                  your real MoMo PIN or OTP code anywhere online.
                </p>
              </div>
            </div>
          )}
        </div>
      </form>
    </div>
  );
};
