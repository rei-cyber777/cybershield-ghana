import crypto from 'node:crypto';
import { buildDigestEmail, DigestNewsHeadline } from '../src/lib/doubleOptInCore';
import { LATEST_DIGEST_HEADLINES } from './news';
import {
  ApiRequest,
  ApiResponse,
  createServerSupabaseAdmin,
  getServerEnv,
  sendJson,
} from './_utils';

function timingSafeCompare(a: string, b: string): boolean {
  if (!a || !b) return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') {
    sendJson(res, 405, { ok: false, error: 'Method Not Allowed. Use POST.' });
    return;
  }

  const { digestSecret, resendApiKey, emailFrom, siteUrl } = getServerEnv();
  if (!digestSecret) {
    sendJson(res, 503, {
      ok: false,
      error: 'DIGEST_CRON_SECRET is not configured in environment variables.',
    });
    return;
  }

  // Check secret header: x-digest-secret or Authorization: Bearer <secret>
  const headerSecret = req.headers['x-digest-secret'];
  const authHeader = req.headers['authorization'];
  const rawSecret =
    (typeof headerSecret === 'string' && headerSecret.trim()) ||
    (typeof authHeader === 'string' && authHeader.replace(/^Bearer\s+/i, '').trim()) ||
    '';

  if (!timingSafeCompare(rawSecret, digestSecret)) {
    sendJson(res, 401, { ok: false, error: 'Unauthorized: invalid or missing digest secret.' });
    return;
  }

  if (!resendApiKey) {
    sendJson(res, 503, { ok: false, error: 'RESEND_API_KEY is not configured.' });
    return;
  }

  const supabaseAdmin = createServerSupabaseAdmin();
  if (!supabaseAdmin) {
    sendJson(res, 503, {
      ok: false,
      error: 'SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not configured.',
    });
    return;
  }

  try {
    // 1. Fetch confirmed subscribers only
    const { data: subscribers, error: subError } = await supabaseAdmin
      .from('subscribers')
      .select('email, interests, unsubscribe_token')
      .eq('confirmed', true);

    if (subError) {
      console.error('[/api/send-digest] Error querying confirmed subscribers:', subError);
      sendJson(res, 500, { ok: false, error: 'Failed to query confirmed subscribers.' });
      return;
    }

    if (!subscribers || subscribers.length === 0) {
      sendJson(res, 200, {
        ok: true,
        sentCount: 0,
        batchesSent: 0,
        message: 'No confirmed subscribers found.',
      });
      return;
    }

    // 2. Combine latest headlines from /api/news with any published alerts in Supabase
    const headlines: DigestNewsHeadline[] = [...LATEST_DIGEST_HEADLINES];
    const { data: publishedAlerts } = await supabaseAdmin
      .from('verified_alerts')
      .select('id, title, category, summary, published_at')
      .eq('published', true)
      .order('published_at', { ascending: false })
      .limit(3);

    if (publishedAlerts && publishedAlerts.length > 0) {
      for (const alert of publishedAlerts) {
        headlines.unshift({
          id: String(alert.id),
          title: String(alert.title),
          category: `Community Alert · ${String(alert.category)}`,
          summary: String(alert.summary),
          url: '/#report-scam',
          publishedAt: String(alert.published_at || '').slice(0, 10),
        });
      }
    }

    // 3. Send in batches of up to 100 emails via Resend Batch API
    const BATCH_SIZE = 100;
    let sentCount = 0;
    let batchesSent = 0;
    const dateLabel = new Date().toISOString().slice(0, 10);

    for (let i = 0; i < subscribers.length; i += BATCH_SIZE) {
      const chunk = subscribers.slice(i, i + BATCH_SIZE);
      const batchPayload = chunk.map((sub) => {
        const built = buildDigestEmail({
          items: headlines,
          unsubscribeToken: String(sub.unsubscribe_token),
          siteUrl,
          dateLabel,
        });
        return {
          from: emailFrom,
          to: [String(sub.email)],
          subject: built.subject,
          html: built.html,
          text: built.text,
          headers: {
            'List-Unsubscribe': `<${built.unsubscribeUrl}>`,
            'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
          },
        };
      });

      const resp = await fetch('https://api.resend.com/emails/batch', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(batchPayload),
      });

      if (!resp.ok) {
        const errText = await resp.text().catch(() => 'Unknown Resend batch error');
        console.error('[/api/send-digest] Resend batch failed:', errText);
        sendJson(res, 502, {
          ok: false,
          sentCount,
          batchesSent,
          error: `Resend batch API failed (${resp.status}): ${errText}`,
        });
        return;
      }

      sentCount += chunk.length;
      batchesSent += 1;
    }

    sendJson(res, 200, {
      ok: true,
      sentCount,
      batchesSent,
      headlineCount: headlines.length,
    });
  } catch (err) {
    console.error('[/api/send-digest] Unexpected error:', err);
    sendJson(res, 500, { ok: false, error: 'Unexpected error while sending digest.' });
  }
}
