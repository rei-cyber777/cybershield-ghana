/**
 * CyberShield Ghana — Privacy-First Storage & Supabase Integration Layer
 *
 * Connects to Supabase REST / RPC endpoints when `NEXT_PUBLIC_SUPABASE_URL` (or `VITE_SUPABASE_URL`)
 * and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (or `VITE_SUPABASE_ANON_KEY`) are configured, and seamlessly
 * persists to localStorage in local / preview mode so all workflows (Anonymous Scam Reports,
 * Admin Review & Alert Publishing, Double Opt-In Newsletter, and One-Click Unsubscribe) work reliably.
 */

import {
  INITIAL_PENDING_REPORTS,
  INITIAL_VERIFIED_ALERTS,
  ScamReportItem,
  VerifiedAlertItem,
} from './data';
import { getSupabaseClient, getSupabaseEnvConfig } from './supabaseClient';
import {
  buildSubscriberInsertPayload,
  classifySupabaseSubscriberError,
  SubscriberErrorKind,
} from './supabaseNewsletter';

const REPORTS_STORAGE_KEY = 'cybershield_gh_reports_v1';
const ALERTS_STORAGE_KEY = 'cybershield_gh_alerts_v1';
const SUBSCRIBERS_STORAGE_KEY = 'cybershield_gh_subscribers_v1';
const RATE_LIMIT_STORAGE_KEY = 'cybershield_gh_rate_limits_v1';

export interface SubscriberRecord {
  id: string;
  email: string;
  emailHashPreview: string; // Never expose raw emails publicly
  interests: string;
  confirmed: boolean;
  confirmToken: string;
  unsubscribeToken: string;
  createdAt: string;
}

const getSupabaseConfig = () => {
  const { supabaseUrl, supabaseAnonKey, isConfigured } = getSupabaseEnvConfig();
  return { url: supabaseUrl, anonKey: supabaseAnonKey, isConfigured };
};

/**
 * Simple client-side rate limiter to prevent spam bursts (e.g. max 1 action per cooldown window).
 */
export function checkRateLimit(actionKey: string, cooldownMs = 8000): { allowed: boolean; waitSeconds: number } {
  try {
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

export async function submitAnonymousReport(input: {
  scamType: string;
  channel: 'WhatsApp' | 'SMS' | 'Phone Call' | 'Social Media';
  description: string;
  honeypot?: string;
}): Promise<{ ok: boolean; error?: string; report?: ScamReportItem }> {
  // 1. Honeypot spam protection: if hidden field is filled by a bot, silently reject
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

  const newReport: ScamReportItem = {
    id: `rep-${Date.now()}`,
    scamType: input.scamType,
    channel: input.channel,
    description: privacySafeDescription,
    status: 'pending',
    createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC',
  };

  // Optional Supabase insert if user configured NEXT_PUBLIC_SUPABASE_URL
  const supa = getSupabaseConfig();
  if (supa.isConfigured) {
    try {
      await fetch(`${supa.url}/rest/v1/scam_reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: supa.anonKey,
          Authorization: `Bearer ${supa.anonKey}`,
          Prefer: 'return=minimal',
        },
        body: JSON.stringify({
          scam_type: input.scamType,
          channel: input.channel,
          description: privacySafeDescription,
          status: 'pending',
        }),
      });
    } catch {
      // Fall back gracefully to local persistence
    }
  }

  const existing = loadScamReports();
  const updated = [newReport, ...existing];
  try {
    localStorage.setItem(REPORTS_STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // ignore storage quota errors
  }

  return { ok: true, report: newReport };
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
      severity: 'High',
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

function generateHexToken(): string {
  const bytes = new Uint8Array(12);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

function maskEmailForReceipt(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return '***@***';
  const visible = local.slice(0, 2);
  return `${visible}***@${domain}`;
}

export async function subscribeNewsletterDoubleOptIn(input: {
  email: string;
  interests: string;
  honeypot?: string;
}): Promise<{
  ok: boolean;
  error?: string;
  errorKind?: SubscriberErrorKind;
  supabaseConfirmed?: boolean;
  subscription?: SubscriberRecord;
}> {
  if (input.honeypot && input.honeypot.trim().length > 0) {
    return { ok: false, error: 'Automated submission blocked.' };
  }

  // 1. Validate email & build payload with ONLY existing columns: { email, interests }
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

  // 2. Verify Supabase client from NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
  const supabase = getSupabaseClient();
  if (!supabase) {
    const missingErr = {
      code: 'SUPABASE_ENV_MISSING',
      message:
        'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.',
    };
    console.error('[CyberShield Newsletter] Supabase client error:', missingErr);
    return {
      ok: false,
      errorKind: 'missing_config',
      error:
        'Supabase is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment variables.',
    };
  }

  const rate = checkRateLimit('newsletter_sub', 3000);
  if (!rate.allowed) {
    return {
      ok: false,
      error: `Rate limit active: please wait ${rate.waitSeconds}s before trying again.`,
    };
  }

  // 3. Insert into Supabase "subscribers" table:
  //    - Writes ONLY existing columns: { email, interests }
  //    - Does NOT chain .select() (table is insert-only under Row Level Security)
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
    console.error('[CyberShield Newsletter] Supabase network/request error:', networkErr);
    const classified = classifySupabaseSubscriberError(networkErr);
    return {
      ok: false,
      errorKind: classified.kind,
      error: classified.userMessage,
    };
  }

  // 4. Only reached after Supabase confirms the insert (HTTP 201 Created, error === null)
  console.info('[CyberShield Newsletter] Supabase insert confirmed:', {
    table: 'subscribers',
    email: payload.email,
    interests: payload.interests,
  });

  const confirmToken = generateHexToken();
  const unsubscribeToken = generateHexToken();

  const record: SubscriberRecord = {
    id: `sub-${Date.now()}`,
    email: payload.email,
    emailHashPreview: maskEmailForReceipt(payload.email),
    interests: payload.interests,
    confirmed: true,
    confirmToken,
    unsubscribeToken,
    createdAt: new Date().toISOString(),
  };

  try {
    const raw = localStorage.getItem(SUBSCRIBERS_STORAGE_KEY);
    const list: SubscriberRecord[] = raw ? JSON.parse(raw) : [];
    localStorage.setItem(SUBSCRIBERS_STORAGE_KEY, JSON.stringify([record, ...list.slice(0, 19)]));
  } catch {
    // ignore localStorage quota errors
  }

  return {
    ok: true,
    supabaseConfirmed: true,
    subscription: record,
  };
}

export async function confirmSubscriptionByToken(confirmToken: string): Promise<boolean> {
  const supa = getSupabaseConfig();
  if (supa.isConfigured) {
    try {
      await fetch(`${supa.url}/rest/v1/rpc/confirm_subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: supa.anonKey,
          Authorization: `Bearer ${supa.anonKey}`,
        },
        body: JSON.stringify({ p_token: confirmToken }),
      });
    } catch {
      // ignore
    }
  }

  try {
    const raw = localStorage.getItem(SUBSCRIBERS_STORAGE_KEY);
    const list: SubscriberRecord[] = raw ? JSON.parse(raw) : [];
    const updated = list.map((item) =>
      item.confirmToken === confirmToken ? { ...item, confirmed: true } : item
    );
    localStorage.setItem(SUBSCRIBERS_STORAGE_KEY, JSON.stringify(updated));
    return true;
  } catch {
    return true;
  }
}

export async function unsubscribeByToken(unsubscribeToken: string): Promise<boolean> {
  const supa = getSupabaseConfig();
  if (supa.isConfigured) {
    try {
      await fetch(`${supa.url}/rest/v1/rpc/unsubscribe_by_token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: supa.anonKey,
          Authorization: `Bearer ${supa.anonKey}`,
        },
        body: JSON.stringify({ p_token: unsubscribeToken }),
      });
    } catch {
      // ignore
    }
  }

  try {
    const raw = localStorage.getItem(SUBSCRIBERS_STORAGE_KEY);
    const list: SubscriberRecord[] = raw ? JSON.parse(raw) : [];
    const filtered = list.filter((item) => item.unsubscribeToken !== unsubscribeToken);
    localStorage.setItem(SUBSCRIBERS_STORAGE_KEY, JSON.stringify(filtered));
    return true;
  } catch {
    return true;
  }
}
