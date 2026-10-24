import React, { useState } from 'react';
import { ExternalLink, ShieldCheck, Users, GraduationCap } from 'lucide-react';

export const ProjectShowcase: React.FC = () => {
  const [tilt, setTilt] = useState<{ rx: number; ry: number }>({ rx: 0, ry: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ rx: -y * 5, ry: x * 6 });
  };

  const handleMouseLeave = () => {
    setTilt({ rx: 0, ry: 0 });
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: `perspective(1100px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
        transition: 'transform 160ms cubic-bezier(0.16, 1, 0.3, 1)',
      }}
      className="cybershield-glass-gold rounded-3xl p-6 sm:p-10"
    >
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-center">
        {/* Left Column: Mission, Why It Matters, and WhatsApp Join CTA */}
        <div className="lg:col-span-7 space-y-5">
          <div className="font-mono text-xs font-semibold tracking-wider text-amber-300">
            COMMUNITY SPOTLIGHT · VERIFIED OPPORTUNITIES & DIGITAL SAFETY
          </div>

          <h2 className="font-display text-2xl font-extrabold tracking-tight text-white sm:text-4xl">
            Featured Project: Opportunity Bridge
          </h2>

          <p className="text-base leading-relaxed text-slate-200">
            A community founded by <strong>Reindolf</strong> to share genuine education,
            internship, and scholarship opportunities with students across Ghana while promoting
            safe digital practices—so ambitious young people can find real life-changing
            opportunities without falling for fake advance-fee scams.
          </p>

          <div className="rounded-xl border border-amber-400/30 bg-amber-950/25 p-4">
            <div className="font-mono text-xs font-bold text-amber-300">WHY IT MATTERS</div>
            <p className="mt-1 text-sm font-medium text-amber-100">
              Finding opportunity AND staying safe while doing it—bridging the gap between student
              ambition and verified cybersecurity awareness.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <a
              href="https://chat.whatsapp.com/IP8WRS5WGXC39ZlgSCH4f5"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 rounded-xl bg-amber-400 px-6 py-3.5 text-sm font-extrabold text-slate-950 shadow-[0_0_28px_rgba(245,183,0,0.45)] hover:bg-amber-300 transition-colors whitespace-nowrap shrink-0"
            >
              <span>Join on WhatsApp</span>
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </a>
            <span className="text-xs text-slate-300">
              Free student community · Vetted links · Scam alerts
            </span>
          </div>
        </div>

        {/* Right Column: Animated Impact Counters & 3D Geometric Emblem */}
        <div className="lg:col-span-5 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-amber-400/30 bg-[#0b1022]/90 p-5">
              <div className="flex items-center justify-between text-amber-300">
                <GraduationCap className="h-6 w-6" aria-hidden="true" />
                <span className="font-mono text-xs">VERIFIED REACH</span>
              </div>
              <div className="mt-3 font-display text-3xl font-extrabold text-white tabular-nums">
                1,000+
              </div>
              <div className="mt-1 text-xs font-medium text-slate-300">
                Students reached with vetted educational opportunities
              </div>
            </div>

            <div className="rounded-2xl border border-cyan-400/30 bg-[#0b1022]/90 p-5">
              <div className="flex items-center justify-between text-cyan-300">
                <Users className="h-6 w-6" aria-hidden="true" />
                <span className="font-mono text-xs">ACTIVE NETWORK</span>
              </div>
              <div className="mt-3 font-display text-3xl font-extrabold text-white tabular-nums">
                400+
              </div>
              <div className="mt-1 text-xs font-medium text-slate-300">
                Community members learning safe digital practices
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-[#070b19]/90 p-5">
            <div className="flex items-start gap-3.5">
              <ShieldCheck className="h-5 w-5 shrink-0 text-amber-400 mt-0.5" aria-hidden="true" />
              <div className="text-xs leading-relaxed text-slate-300">
                <strong className="block font-semibold text-white">
                  Zero Processing Fees Policy
                </strong>
                Every scholarship and fellowship shared in Opportunity Bridge links directly to
                official institutions and never asks students for Mobile Money "protocol" or
                "verification" payments.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
