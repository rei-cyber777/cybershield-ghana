import crypto from 'node:crypto';

export const NEUTRAL_SUBSCRIBE_MESSAGE = 'Check your inbox to confirm your subscription.';

export interface SubscribeRequestInput {
  email?: unknown;
  interests?: unknown;
  honeypot?: unknown;
}

export interface ValidatedSubscribeInput {
  email: string;
  interests: string;
  isHoneypotTriggered: boolean;
}

export interface DigestNewsHeadline {
  id: string;
  title: string;
  category: string;
  summary: string;
  url: string;
  publishedAt: string;
}

const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

/**
 * Validates incoming /api/subscribe body.
 */
export function validateSubscribeInput(
  body: SubscribeRequestInput
): { ok: true; data: ValidatedSubscribeInput } | { ok: false; error: string } {
  const honeypot = typeof body?.honeypot === 'string' ? body.honeypot.trim() : '';
  if (honeypot.length > 0) {
    return {
      ok: true,
      data: {
        email: '',
        interests: '',
        isHoneypotTriggered: true,
      },
    };
  }

  const rawEmail = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!rawEmail || rawEmail.length > 254 || !EMAIL_REGEX.test(rawEmail)) {
    return {
      ok: false,
      error: 'Please enter a valid email address (for example, name@example.com).',
    };
  }

  const rawInterests =
    typeof body?.interests === 'string' && body.interests.trim().length > 0
      ? body.interests.trim().slice(0, 240)
      : 'Cybersecurity & Ghana Scam Alerts + Global Tech & AI News (Weekly Digest)';

  return {
    ok: true,
    data: {
      email: rawEmail,
      interests: rawInterests,
      isHoneypotTriggered: false,
    },
  };
}

/**
 * Generates a cryptographically random 48-character hex token (24 bytes).
 */
export function generateSecureToken(): string {
  return crypto.randomBytes(24).toString('hex');
}

/**
 * Validates a hex token from /api/confirm or /api/unsubscribe query string.
 */
export function isValidHexToken(token: unknown): token is string {
  return typeof token === 'string' && /^[a-f0-9]{32,128}$/i.test(token.trim());
}

/**
 * Simple sliding-window per-IP rate limiter for serverless functions.
 */
const ipBuckets = new Map<string, number[]>();

export function checkServerIpRateLimit(
  ip: string,
  maxRequests = 5,
  windowMs = 10 * 60 * 1000,
  nowMs = Date.now()
): { allowed: boolean; retryAfterSeconds: number } {
  const key = (ip || 'unknown').trim();
  const timestamps = ipBuckets.get(key) || [];
  const cutoff = nowMs - windowMs;
  const recent = timestamps.filter((t) => t > cutoff);

  if (recent.length >= maxRequests) {
    const oldest = recent[0];
    const retryAfterSeconds = Math.max(1, Math.ceil((oldest + windowMs - nowMs) / 1000));
    ipBuckets.set(key, recent);
    return { allowed: false, retryAfterSeconds };
  }

  recent.push(nowMs);
  ipBuckets.set(key, recent);
  return { allowed: true, retryAfterSeconds: 0 };
}

export function resetServerIpRateLimits(): void {
  ipBuckets.clear();
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Normalizes SITE_URL with no trailing slash.
 */
export function normalizeSiteUrl(rawSiteUrl?: string): string {
  const cleaned = (rawSiteUrl || 'http://localhost:3000').trim().replace(/\/+$/, '');
  return cleaned || 'http://localhost:3000';
}

/**
 * Builds both mobile-friendly HTML and plain-text versions of the Double Opt-In Confirmation Email.
 */
export function buildConfirmationEmail(params: {
  email: string;
  interests: string;
  confirmToken: string;
  unsubscribeToken: string;
  siteUrl: string;
}): {
  subject: string;
  confirmUrl: string;
  unsubscribeUrl: string;
  html: string;
  text: string;
} {
  const base = normalizeSiteUrl(params.siteUrl);
  const confirmUrl = `${base}/api/confirm?token=${encodeURIComponent(params.confirmToken)}`;
  const unsubscribeUrl = `${base}/api/unsubscribe?token=${encodeURIComponent(
    params.unsubscribeToken
  )}`;
  const safeInterests = escapeHtml(params.interests);

  const subject = 'Confirm your CyberShield Ghana newsletter subscription';

  const text = [
    'CyberShield Ghana — Cybersecurity & Global Tech Briefing',
    '========================================================',
    '',
    'Hello,',
    '',
    'Thank you for signing up for the CyberShield Ghana newsletter.',
    `Selected topics: ${params.interests}`,
    '',
    'Please confirm your email address by opening the link below:',
    confirmUrl,
    '',
    'If you did not request this subscription, you can safely ignore this email or cancel immediately:',
    unsubscribeUrl,
    '',
    '—',
    'Sent by CyberShield Ghana (Built by Reindolf · Opportunity Bridge)',
    `Website: ${base}`,
    `Unsubscribe anytime: ${unsubscribeUrl}`,
  ].join('\n');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background-color:#050816;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#e2e8f0;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#050816;padding:28px 14px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#080f24;border:1px solid #1e293b;border-radius:16px;padding:32px 24px;">
          <tr>
            <td>
              <div style="font-family:monospace;font-size:11px;letter-spacing:1px;color:#00f0ff;font-weight:700;text-transform:uppercase;">
                CyberShield Ghana · Double Opt-In Verification
              </div>
              <h1 style="margin:12px 0 8px;font-size:22px;line-height:1.3;color:#ffffff;">
                Confirm your newsletter subscription
              </h1>
              <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#cbd5e1;">
                Thanks for requesting updates from <strong>CyberShield Ghana</strong>. Click the button below to verify your email address and activate your briefing.
              </p>

              <div style="background-color:#050918;border:1px solid #1e293b;border-radius:10px;padding:12px 14px;margin-bottom:24px;">
                <div style="font-size:11px;font-family:monospace;color:#f5b700;font-weight:700;">SELECTED BRIEFING TRACKS</div>
                <div style="margin-top:4px;font-size:13px;color:#f8fafc;">${safeInterests}</div>
              </div>

              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
                <tr>
                  <td align="center" style="border-radius:10px;background-color:#00f0ff;">
                    <a href="${confirmUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:13px 24px;font-size:14px;font-weight:800;color:#050816;text-decoration:none;border-radius:10px;">
                      Confirm My Subscription
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 8px;font-size:12px;line-height:1.5;color:#94a3b8;">
                Or copy and paste this confirmation link into your browser:
              </p>
              <p style="margin:0 0 24px;font-size:12px;line-height:1.5;word-break:break-all;">
                <a href="${confirmUrl}" style="color:#00f0ff;text-decoration:underline;">${confirmUrl}</a>
              </p>

              <hr style="border:none;border-top:1px solid #1e293b;margin:24px 0;" />

              <p style="margin:0;font-size:12px;line-height:1.6;color:#64748b;">
                <strong>Sender:</strong> CyberShield Ghana · Open-Source Digital Safety Platform (Built by Reindolf)<br />
                Didn't request this email? You can ignore this message or <a href="${unsubscribeUrl}" style="color:#94a3b8;text-decoration:underline;">cancel &amp; unsubscribe immediately</a>.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return {
    subject,
    confirmUrl,
    unsubscribeUrl,
    html,
    text,
  };
}

/**
 * Builds both mobile-friendly HTML and plain-text versions of the Newsletter Digest Email.
 */
export function buildDigestEmail(params: {
  items: DigestNewsHeadline[];
  unsubscribeToken: string;
  siteUrl: string;
  dateLabel?: string;
}): {
  subject: string;
  unsubscribeUrl: string;
  html: string;
  text: string;
} {
  const base = normalizeSiteUrl(params.siteUrl);
  const unsubscribeUrl = `${base}/api/unsubscribe?token=${encodeURIComponent(
    params.unsubscribeToken
  )}`;
  const dateStr = params.dateLabel || new Date().toISOString().slice(0, 10);
  const subject = `CyberShield Ghana Digest (${dateStr}): Cybersecurity & Global Tech`;

  const textLines: string[] = [
    `CyberShield Ghana Briefing — ${dateStr}`,
    '========================================================',
    '',
  ];

  for (const item of params.items) {
    const fullUrl = item.url.startsWith('http') ? item.url : `${base}${item.url}`;
    textLines.push(`* [${item.category}] ${item.title}`);
    textLines.push(`  ${item.summary}`);
    textLines.push(`  Read more: ${fullUrl}`);
    textLines.push('');
  }

  textLines.push('—');
  textLines.push('Sent by CyberShield Ghana (Built by Reindolf · Opportunity Bridge)');
  textLines.push(`Unsubscribe with one click: ${unsubscribeUrl}`);

  const itemsHtml = params.items
    .map((item) => {
      const fullUrl = item.url.startsWith('http') ? item.url : `${base}${item.url}`;
      return `
      <div style="background-color:#050918;border:1px solid #1e293b;border-radius:12px;padding:16px;margin-bottom:14px;">
        <div style="font-family:monospace;font-size:11px;color:#00f0ff;font-weight:700;">
          ${escapeHtml(item.category)}
        </div>
        <h2 style="margin:6px 0 8px;font-size:16px;line-height:1.35;color:#ffffff;">
          ${escapeHtml(item.title)}
        </h2>
        <p style="margin:0 0 12px;font-size:13px;line-height:1.55;color:#cbd5e1;">
          ${escapeHtml(item.summary)}
        </p>
        <a href="${escapeHtml(fullUrl)}" target="_blank" rel="noopener noreferrer" style="font-size:12px;font-weight:700;color:#f5b700;text-decoration:none;">
          Open Briefing &rarr;
        </a>
      </div>`;
    })
    .join('\n');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background-color:#050816;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#e2e8f0;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#050816;padding:28px 14px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;background-color:#080f24;border:1px solid #1e293b;border-radius:16px;padding:32px 24px;">
          <tr>
            <td>
              <div style="font-family:monospace;font-size:11px;letter-spacing:1px;color:#00f0ff;font-weight:700;text-transform:uppercase;">
                CyberShield Ghana · ${escapeHtml(dateStr)}
              </div>
              <h1 style="margin:10px 0 6px;font-size:22px;line-height:1.3;color:#ffffff;">
                Cybersecurity &amp; Global Tech Digest
              </h1>
              <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#94a3b8;">
                Curated digital safety guidance for Ghana and key global technology updates.
              </p>

              ${itemsHtml}

              <hr style="border:none;border-top:1px solid #1e293b;margin:24px 0;" />

              <p style="margin:0;font-size:12px;line-height:1.6;color:#64748b;">
                <strong>Sender:</strong> CyberShield Ghana · Open-Source Digital Safety Platform (Built by Reindolf)<br />
                You are receiving this email because you confirmed your subscription on <a href="${base}" style="color:#94a3b8;">CyberShield Ghana</a>.<br />
                <a href="${unsubscribeUrl}" style="color:#f87171;text-decoration:underline;">Unsubscribe instantly</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return {
    subject,
    unsubscribeUrl,
    html,
    text: textLines.join('\n'),
  };
}
