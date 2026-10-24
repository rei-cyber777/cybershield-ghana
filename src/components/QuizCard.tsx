import React, { useState } from 'react';
import { QUIZ_QUESTIONS } from '../lib/data';
import { Award, CheckCircle2, XCircle, Share2, RotateCcw } from 'lucide-react';

export const QuizCard: React.FC = () => {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});

  const answeredCount = Object.keys(selectedAnswers).length;
  const totalQuestions = QUIZ_QUESTIONS.length;

  const correctCount = QUIZ_QUESTIONS.reduce((acc, q) => {
    const chosenId = selectedAnswers[q.id];
    const chosenOpt = q.options.find((o) => o.id === chosenId);
    return acc + (chosenOpt?.isCorrect ? 1 : 0);
  }, 0);

  const handleSelectOption = (questionId: string, optionId: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionId,
    }));
  };

  const handleResetQuiz = () => {
    setSelectedAnswers({});
  };

  const shareText = encodeURIComponent(
    `I scored ${correctCount}/${totalQuestions} on the CyberShield Ghana Cyber Readiness Quiz! Test how well you can spot Mobile Money & scholarship scams: ${
      typeof window !== 'undefined' ? window.location.origin : ''
    }`
  );
  const whatsappShareUrl = `https://wa.me/?text=${shareText}`;

  return (
    <div className="cybershield-glass rounded-2xl p-6 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="font-mono text-xs text-cyan-300">
            INTERACTIVE DRILL · {answeredCount}/{totalQuestions} COMPLETED
          </div>
          <h3 className="mt-1 font-display text-xl font-bold text-white">
            Ghana Cyber Readiness Scenarios
          </h3>
        </div>

        <div className="flex items-center gap-4">
          <div className="font-mono text-sm font-semibold text-amber-300 tabular-nums">
            Current Score: {correctCount} / {totalQuestions}
          </div>
          {answeredCount > 0 && (
            <button
              type="button"
              onClick={handleResetQuiz}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-300 hover:border-cyan-400/50 hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Retake Quiz</span>
            </button>
          )}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {QUIZ_QUESTIONS.map((q, qIdx) => {
          const chosenOptionId = selectedAnswers[q.id];
          const chosenOption = q.options.find((o) => o.id === chosenOptionId);

          return (
            <div
              key={q.id}
              className="flex flex-col justify-between rounded-xl border border-slate-800 bg-[#070d20] p-5"
            >
              <div>
                <div className="font-mono text-xs text-cyan-300">SCENARIO 0{qIdx + 1}</div>
                <p className="mt-2 text-sm font-medium leading-relaxed text-white">
                  {q.scenario}
                </p>

                <div className="mt-4 space-y-2.5">
                  {q.options.map((opt) => {
                    const isSelected = chosenOptionId === opt.id;
                    let borderStyle =
                      'border-slate-800 bg-slate-900/70 text-slate-200 hover:border-slate-700';
                    if (isSelected) {
                      borderStyle = opt.isCorrect
                        ? 'border-emerald-400 bg-emerald-950/40 text-emerald-100'
                        : 'border-rose-400 bg-rose-950/40 text-rose-100';
                    }

                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleSelectOption(q.id, opt.id)}
                        className={`w-full rounded-lg border p-3 text-left text-xs leading-relaxed transition-colors ${borderStyle}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span>{opt.text}</span>
                          {isSelected &&
                            (opt.isCorrect ? (
                              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                            ) : (
                              <XCircle className="h-4 w-4 shrink-0 text-rose-400" />
                            ))}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {chosenOption && (
                <div
                  role="status"
                  className={`mt-4 rounded-lg border p-3 text-xs leading-relaxed ${
                    chosenOption.isCorrect
                      ? 'border-emerald-500/30 bg-emerald-950/25 text-emerald-200'
                      : 'border-rose-500/30 bg-rose-950/25 text-rose-200'
                  }`}
                >
                  <strong className="font-semibold">
                    {chosenOption.isCorrect ? 'Correct: ' : 'Watch Out: '}
                  </strong>
                  {chosenOption.feedback}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Shareable Result Card */}
      <div className="mt-8 rounded-2xl border border-cyan-400/30 bg-gradient-to-r from-[#09132c] via-[#0d1533] to-[#170f2e] p-6">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-amber-400/40 bg-amber-400/10 text-amber-300">
              <Award className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <div className="font-mono text-xs text-amber-300">
                SHAREABLE CYBER READINESS CARD
              </div>
              <h4 className="mt-1 font-display text-lg font-bold text-white">
                Readiness Score: {correctCount} / {totalQuestions} Scenarios Defended
              </h4>
              <p className="mt-1 text-xs text-slate-300">
                Share your result card with classmates, parents, and campus WhatsApp groups so
                more Ghanaians learn to spot MoMo and scholarship scams.
              </p>
            </div>
          </div>

          <a
            href={whatsappShareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-400 px-5 py-3 text-xs font-bold text-slate-950 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:bg-emerald-300 transition-colors whitespace-nowrap shrink-0"
          >
            <Share2 className="h-4 w-4" aria-hidden="true" />
            <span>Share Score on WhatsApp</span>
          </a>
        </div>
      </div>
    </div>
  );
};
