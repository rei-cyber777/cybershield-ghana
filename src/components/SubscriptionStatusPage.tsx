import React from 'react';
import { CheckCircle2, MailX, AlertTriangle, ArrowLeft, Shield } from 'lucide-react';

interface SubscriptionStatusPageProps {
  mode: 'confirmed' | 'unsubscribed';
}

export const SubscriptionStatusPage: React.FC<SubscriptionStatusPageProps> = ({ mode }) => {
  const params =
    typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const statusParam = params?.get('status') || 'ok';
  const isInvalidOrError = statusParam === 'invalid' || statusParam === 'error';

  const isConfirmedMode = mode === 'confirmed';

  return (
    <div className="cybershield-grid-bg flex min-h-screen flex-col items-center justify-center px-4 py-16 text-slate-100">
      <div className="cybershield-glass w-full max-w-lg rounded-3xl border border-cyan-400/30 p-8 text-center sm:p-10">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-400/30 bg-[#070d20]">
          {isInvalidOrError ? (
            <AlertTriangle className="h-7 w-7 text-amber-400" aria-hidden="true" />
          ) : isConfirmedMode ? (
            <CheckCircle2 className="h-7 w-7 text-emerald-400" aria-hidden="true" />
          ) : (
            <MailX className="h-7 w-7 text-cyan-400" aria-hidden="true" />
          )}
        </div>

        <div className="mt-4 inline-flex items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-wider text-cyan-300">
          <Shield className="h-3.5 w-3.5 text-cyan-400" aria-hidden="true" />
          <span>CyberShield Ghana · Newsletter</span>
        </div>

        {isConfirmedMode ? (
          isInvalidOrError ? (
            <>
              <h1 className="mt-2 font-display text-2xl font-extrabold text-white sm:text-3xl">
                Confirmation Link Expired or Already Used
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-slate-300">
                This confirmation link is no longer valid—either your email is already confirmed or
                the link expired. You can request a fresh confirmation email anytime on the
                newsletter form.
              </p>
            </>
          ) : (
            <>
              <h1 className="mt-2 font-display text-2xl font-extrabold text-white sm:text-3xl">
                Subscription Confirmed!
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-slate-300">
                Your email address is now verified. You will receive our curated Cybersecurity &amp;
                Global Tech digest, and you can unsubscribe with a single click at the bottom of any
                email.
              </p>
            </>
          )
        ) : isInvalidOrError ? (
          <>
            <h1 className="mt-2 font-display text-2xl font-extrabold text-white sm:text-3xl">
              Invalid Unsubscribe Link
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">
              We could not verify that unsubscribe token, or your email address has already been
              removed from our list.
            </p>
          </>
        ) : (
          <>
            <h1 className="mt-2 font-display text-2xl font-extrabold text-white sm:text-3xl">
              You Have Been Unsubscribed
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">
              Your email address has been permanently removed from the CyberShield Ghana newsletter
              list. You will not receive any further digests.
            </p>
          </>
        )}

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <a
            href="/"
            className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 text-sm font-extrabold text-slate-950 shadow-[0_0_24px_rgba(0,240,255,0.35)] hover:bg-cyan-300 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span>Back to CyberShield Ghana</span>
          </a>
        </div>
      </div>
    </div>
  );
};
