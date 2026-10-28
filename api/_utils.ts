import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { normalizeSiteUrl } from '../src/lib/doubleOptInCore';

export type ApiRequest = IncomingMessage & {
  method?: string;
  query?: Record<string, string | string[] | undefined>;
  body?: unknown;
  headers: Record<string, string | string[] | undefined>;
};

export type ApiResponse = ServerResponse & {
  status?: (code: number) => ApiResponse;
  json?: (data: unknown) => void;
  redirect?: (statusOrUrl: number | string, url?: string) => void;
};

/**
 * Helper to send JSON responses that works both on Vercel Serverless Functions
 * and standard Node HTTP responses.
 */
export function sendJson(res: ApiResponse, statusCode: number, payload: unknown): void {
  if (typeof res.status === 'function' && typeof res.json === 'function') {
    const nextRes = res.status(statusCode);
    if (typeof nextRes.json === 'function') {
      nextRes.json(payload);
      return;
    }
  }
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

/**
 * Helper to send HTTP 302 redirects that works both on Vercel and Node HTTP.
 */
export function sendRedirect(res: ApiResponse, location: string, statusCode = 302): void {
  res.statusCode = statusCode;
  res.setHeader('Location', location);
  res.end();
}

/**
 * Parses JSON request body safely across Vercel and raw Node streams.
 */
export async function parseJsonBody<T = Record<string, unknown>>(req: ApiRequest): Promise<T> {
  if (req.body && typeof req.body === 'object') {
    return req.body as T;
  }
  if (typeof req.body === 'string' && req.body.trim().length > 0) {
    try {
      return JSON.parse(req.body) as T;
    } catch {
      return {} as T;
    }
  }

  return new Promise<T>((resolve) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += String(chunk);
      if (raw.length > 32_768) {
        req.destroy();
      }
    });
    req.on('end', () => {
      if (!raw.trim()) {
        resolve({} as T);
        return;
      }
      try {
        resolve(JSON.parse(raw) as T);
      } catch {
        resolve({} as T);
      }
    });
    req.on('error', () => resolve({} as T));
  });
}

/**
 * Extracts query parameter from either req.query (Vercel) or req.url.
 */
export function getQueryParam(req: ApiRequest, key: string): string {
  const fromQuery = req.query?.[key];
  if (typeof fromQuery === 'string') return fromQuery.trim();
  if (Array.isArray(fromQuery) && typeof fromQuery[0] === 'string') return fromQuery[0].trim();

  try {
    const urlObj = new URL(req.url || '/', 'http://localhost');
    return (urlObj.searchParams.get(key) || '').trim();
  } catch {
    return '';
  }
}

/**
 * Extracts client IP address from x-forwarded-for or socket.
 */
export function getClientIp(req: ApiRequest): string {
  const xff = req.headers['x-forwarded-for'];
  const rawXff = Array.isArray(xff) ? xff[0] : xff;
  if (typeof rawXff === 'string' && rawXff.trim().length > 0) {
    return rawXff.split(',')[0].trim();
  }
  const realIp = req.headers['x-real-ip'];
  if (typeof realIp === 'string' && realIp.trim().length > 0) {
    return realIp.trim();
  }
  return req.socket?.remoteAddress || '127.0.0.1';
}

/**
 * Reads server-side environment variables from process.env (never VITE_ prefixed).
 */
export function getServerEnv() {
  const supabaseUrl = (process.env.SUPABASE_URL || '').trim();
  const supabaseServiceKey = (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    ''
  ).trim();
  const resendApiKey = (process.env.RESEND_API_KEY || '').trim();
  const siteUrl = normalizeSiteUrl(
    process.env.SITE_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
  );
  const emailFrom = (
    process.env.EMAIL_FROM || 'CyberShield Ghana <newsletter@cybershieldghana.org>'
  ).trim();
  const digestSecret = (process.env.DIGEST_CRON_SECRET || '').trim();

  return {
    supabaseUrl,
    supabaseServiceKey,
    resendApiKey,
    siteUrl,
    emailFrom,
    digestSecret,
  };
}

/**
 * Creates a server-only Supabase client using SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
 */
export function createServerSupabaseAdmin(): SupabaseClient | null {
  const { supabaseUrl, supabaseServiceKey } = getServerEnv();
  if (!supabaseUrl || !supabaseServiceKey) {
    return null;
  }
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

/**
 * Sends a single transactional email via the Resend HTTP API.
 */
export async function sendResendEmail(params: {
  to: string;
  subject: string;
  html: string;
  text: string;
  unsubscribeUrl: string;
}): Promise<{ ok: boolean; error?: string }> {
  const { resendApiKey, emailFrom } = getServerEnv();
  if (!resendApiKey) {
    return {
      ok: false,
      error: 'Missing RESEND_API_KEY in server environment variables.',
    };
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: emailFrom,
      to: [params.to],
      subject: params.subject,
      html: params.html,
      text: params.text,
      headers: {
        'List-Unsubscribe': `<${params.unsubscribeUrl}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => 'Unknown Resend error');
    return {
      ok: false,
      error: `Resend API error (${response.status}): ${errText}`,
    };
  }

  return { ok: true };
}
