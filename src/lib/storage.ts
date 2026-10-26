/**
 * CyberShield Ghana — Privacy-First Storage & Supabase Integration Layer
 *
 * Uses VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (with compatibility for
 * NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY).
 * Never uses a service_role or secret key in browser code.
 */

import {
  INITIAL_PENDING_REPORTS,
  INITIAL_VERIFIED_ALERTS,
  ScamReportItem,
  VerifiedAlertItem,
} from './data';
import { getSupabaseClient } from './supabaseClient';
import {
  buildSubscriberInsertPayload,
  classifySupabaseSubscriberError,
  SubscriberErrorKind,
} from './supabaseNewsletter';

const REPORTS_STORAGE_KEY = 'cybershield_gh_reports_v1';
const ALERTS_STORAGE_KEY = 'cybershield_gh_alerts_v1';
const RATE_LIMIT_STORAGE_KEY = 'cybershield_gh_rate_limits_v1';

export interface SubscriberRow {
  id: string;
  email: string;
  interests: string;
  created_at: string;
}

export interface FeedbackRow {
  id: string;
  category: string;
  message: string;
  created_at: string;
}

/**
 * Simple client-side rate limiter to prevent spam bursts (e.g. max 1 action per cooldown window).
 */
export function checkRateLimit(
  actionKey: string,
  cooldownMs = 8000
): { allowed: boolean; waitSeconds: number } {
  try {
    if (typeof localStorage === 'undefined') {
      return { allowed: true, waitSeconds: 0 };
    }
    const raw = localStorage.getItem(RATE_LIMIT_STORAGE_KEY);
    const map: Record<string, number> = raw ? JSON.parse(raw) : {};
    const now = Date.now();
    const lastTime = map[actionKey] || 0;
    if (now - lastTime < cooldownMs) {
      return {
        allowed: false,
        waitSeconds: Math.ceil((cooldownMs - (now - lastTime)) / 1000),
      };
    }
    map[actionKey] = now;
    localStorage.setItem(RATE_LIMIT_STORAGE_KEY, JSON.stringify(map));
    return { allowed: true, waitSeconds: 0 };
  } catch {
    return { allowed: true, waitSeconds: 0 };
  }
}

/**
 * Formats subscriber records into an RFC-4180 CSV string for the Admin Dashboard export.
 */
export function formatSubscribersToCsv(rows: SubscriberRow[]): string {
  const escapeCsvCell = (val: string) => {
    const clean = String(val ?? '').replace(/\r?\n/g, ' ');
    if (/[",]/.test(clean)) {
      return `"${clean.replace(/"/g, '""')}"`;
    }
    return clean;
  };

  const header = ['id', 'email', 'interests', 'created_at'].join(',');
  const lines = rows.map((row) =>
    [
      escapeCsvCell(row.id),
      escapeCsvCell(row.email),
      escapeCsvCell(row.interests),
      escapeCsvCell(row.created_at),
    ].join(',')
  );

  return [header, ...lines].join('\n');
}

export function loadScamReports(): ScamReportItem[] {
  try {
    const raw = localStorage.getItem(REPORTS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(REPORTS_STORAGE_KEY, JSON.stringify(INITIAL_PENDING_REPORTS));
      return INITIAL_PENDING_REPORTS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_PENDING_REPORTS;
  }
}

export function loadVerifiedAlerts(): VerifiedAlertItem[] {
  try {
    const raw = localStorage.getItem(ALERTS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(INITIAL_VERIFIED_ALERTS));
      return INITIAL_VERIFIED_ALERTS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_VERIFIED_ALERTS;
  }
}

/**
 * Fetches published alerts from Supabase `verified_alerts` (`published = true`),
 * falling back to illustrative scenarios when no published rows exist yet.
 */
export async function fetchPublicAlerts(): Promise<VerifiedAlertItem[]> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return INITIAL_VERIFIED_ALERTS;
  }

  try {
    const { data, error } = await supabase
      .from('verified_alerts')
      .select('id, title, scam_type, channel, summary, prevention_tip, severity, published, published_at')
      .eq('published', true)
      .order('published_at', { ascending: false });

    if (error || !data || data.length === 0) {
      return INITIAL_VERIFIED_ALERTS;
    }

    const dbAlerts: VerifiedAlertItem[] = data.map((row: Record<string, unknown>) => ({
      id: String(row.id),
      title: String(row.title || ''),
      scamType: String(row.scam_type || ''),
      channel: String(row.channel || ''),
      summary: String(row.summary || ''),
      preventionTip: String(row.prevention_tip || ''),
      severity:
        row.severity === 'High' || row.severity === 'Critical' ? row.severity : 'Moderate',
      publishedAt: String(row.published_at || '').slice(0, 10),
      published: Boolean(row.published ?? true),
      isIllustrative: false,
    }));

    return [...dbAlerts, ...INITIAL_VERIFIED_ALERTS];
  } catch {
    return INITIAL_VERIFIED_ALERTS;
  }
}

/**
 * Anonymous scam report submission (INSERT-only for `anon` under RLS; never chains `.select()`).
 */
export async function submitAnonymousReport(input: {
  scamType: string;
  channel: 'WhatsApp' | 'SMS' | 'Phone Call' | 'Social Media';
  description: string;
  honeypot?: string;
}): Promise<{ ok: boolean; error?: string }> {
  // 1. Honeypot spam protection: if hidden field is filled by a bot, reject
  if (input.honeypot && input.honeypot.trim().length > 0) {
    return { ok: false, error: 'Spam check triggered.' };
  }

  // 2. Validate description length & scrub accidental phone numbers for privacy
  const cleanDescription = input.description.trim();
  if (cleanDescription.length < 15) {
    return {
      ok: false,
      error: 'Please provide at least 15 characters describing how the scam happened.',
    };
  }
  if (cleanDescription.length > 1500) {
    return {
      ok: false,
      error: 'Report description must be under 1,500 characters.',
    };
  }

  // Automatically redact 10-digit Ghana phone numbers so no personal numbers are stored
  const privacySafeDescription = cleanDescription.replace(
    /(\+?233|0)\s*[235]\d[\s-]?\d{3}[\s-]?\d{4}/g,
    '[REDACTED-PHONE]'
  );

  const rate = checkRateLimit('submit_report', 5000);
  if (!rate.allowed) {
    return {
      ok: false,
      error: `Please wait ${rate.waitSeconds}s before submitting another report.`,
    };
  }

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { error } = await supabase.from('scam_reports').insert({
        scam_type: input.scamType,
        channel: input.channel,
        description: privacySafeDescription,
        status: 'pending',
      });

      if (error) {
        console.error('[CyberShield Report] Supabase insert error:', error);
        return {
          ok: false,
          error: 'Could not save report right now. Please try again shortly.',
        };
      }
    } catch (err) {
      console.error('[CyberShield Report] Network error:', err);
      return {
        ok: false,
        error: 'Network error while submitting report. Please check your connection.',
      };
    }
  }

  return { ok: true };
}

/**
 * Anonymous feedback submission (INSERT-only for `anon` on `public.feedback`; never chains `.select()`).
 */
export async function submitAnonymousFeedback(input: {
  category: string;
  message: string;
  honeypot?: string;
}): Promise<{ ok: boolean; error?: string }> {
  if (input.honeypot && input.honeypot.trim().length > 0) {
    return { ok: false, error: 'Spam check triggered.' };
  }

  const cleanMessage = input.message.trim();
  if (cleanMessage.length < 5) {
    return {
      ok: false,
      error: 'Please enter at least 5 characters of feedback.',
    };
  }
  if (cleanMessage.length > 2000) {
    return {
      ok: false,
      error: 'Feedback message must be under 2,000 characters.',
    };
  }

  const rate = checkRateLimit('submit_feedback', 6000);
  if (!rate.allowed) {
    return {
      ok: false,
      error: `Please wait ${rate.waitSeconds}s before sending another feedback message.`,
    };
  }

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { error } = await supabase.from('feedback').insert({
        category: input.category.trim() || 'Suggestion',
        message: cleanMessage,
      });

      if (error) {
        console.error('[CyberShield Feedback] Supabase insert error:', error);
        return {
          ok: false,
          error: 'Could not submit feedback right now. Please try again shortly.',
        };
      }
    } catch (err) {
      console.error('[CyberShield Feedback] Network error:', err);
      return {
        ok: false,
        error: 'Network error while submitting feedback. Please check your connection.',
      };
    }
  }

  return { ok: true };
}

export function approveReportAndPublishAlert(
  reportId: string,
  customPreventionTip?: string
): { reports: ScamReportItem[]; alerts: VerifiedAlertItem[]; publishedAlert?: VerifiedAlertItem } {
  const reports = loadScamReports();
  const target = reports.find((r) => r.id === reportId);
  const updatedReports = reports.map((r) =>
    r.id === reportId ? { ...r, status: 'verified' as const } : r
  );

  const alerts = loadVerifiedAlerts();
  let publishedAlert: VerifiedAlertItem | undefined;

  if (target) {
    publishedAlert = {
      id: `alert-${Date.now()}`,
      title: `Community Alert: ${target.scamType} via ${target.channel}`,
      scamType: target.scamType,
      channel: target.channel,
      summary: target.description,
      preventionTip:
        customPreventionTip?.trim() ||
        'Pause and verify independently through official USSD or institutional websites. Never send fees or PIN codes.',
      severity: 'Moderate',
      publishedAt: new Date().toISOString().slice(0, 10),
    };
  }

  const updatedAlerts = publishedAlert ? [publishedAlert, ...alerts] : alerts;

  try {
    localStorage.setItem(REPORTS_STORAGE_KEY, JSON.stringify(updatedReports));
    localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(updatedAlerts));
  } catch {
    // ignore
  }

  return { reports: updatedReports, alerts: updatedAlerts, publishedAlert };
}

export function dismissPendingReport(reportId: string): ScamReportItem[] {
  const reports = loadScamReports();
  const updated = reports.map((r) =>
    r.id === reportId ? { ...r, status: 'dismissed' as const } : r
  );
  try {
    localStorage.setItem(REPORTS_STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // ignore
  }
  return updated;
}

export async function subscribeNewsletter(input: {
  email: string;
  interests: string;
  honeypot?: string;
}): Promise<{
  ok: boolean;
  error?: string;
  errorKind?: SubscriberErrorKind;
}> {
  if (input.honeypot && input.honeypot.trim().length > 0) {
    return { ok: false, error: 'Automated submission blocked.' };
  }

  const built = buildSubscriberInsertPayload(input.email, input.interests);
  if (!built.ok) {
    console.error('[CyberShield Newsletter] Validation error:', built.error);
    return {
      ok: false,
      errorKind: built.error.kind,
      error: built.error.userMessage,
    };
  }

  const { payload } = built;

  const supabase = getSupabaseClient();
  if (!supabase) {
    return {
      ok: false,
      errorKind: 'missing_config',
      error: 'Newsletter service is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
    };
  }

  const rate = checkRateLimit('newsletter_sub', 5000);
  if (!rate.allowed) {
    return {
      ok: false,
      error: `Please wait ${rate.waitSeconds}s before trying again.`,
    };
  }

  try {
    const { error } = await supabase.from('subscribers').insert({
      email: payload.email,
      interests: payload.interests,
    });

    if (error) {
      console.error('[CyberShield Newsletter] Supabase insert error:', error);
      const classified = classifySupabaseSubscriberError(error);
      return {
        ok: false,
        errorKind: classified.kind,
        error: classified.userMessage,
      };
    }
  } catch (networkErr) {
    console.error('[CyberShield Newsletter] Supabase network error:', networkErr);
    const classified = classifySupabaseSubscriberError(networkErr);
    return {
      ok: false,
      errorKind: classified.kind,
      error: classified.userMessage,
    };
  }

  return { ok: true };
}
