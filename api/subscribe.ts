import {
  NEUTRAL_SUBSCRIBE_MESSAGE,
  buildConfirmationEmail,
  checkServerIpRateLimit,
  generateSecureToken,
  validateSubscribeInput,
} from '../src/lib/doubleOptInCore';
import {
  ApiRequest,
  ApiResponse,
  createServerSupabaseAdmin,
  getClientIp,
  getServerEnv,
  parseJsonBody,
  sendJson,
  sendResendEmail,
} from './_utils';

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') {
    sendJson(res, 405, { ok: false, error: 'Method Not Allowed. Use POST.' });
    return;
  }

  // 1. Rate limit per client IP (max 5 requests per 10 minutes)
  const clientIp = getClientIp(req);
  const rateLimit = checkServerIpRateLimit(clientIp, 5, 10 * 60 * 1000);
  if (!rateLimit.allowed) {
    res.setHeader('Retry-After', String(rateLimit.retryAfterSeconds));
    sendJson(res, 429, {
      ok: false,
      error: `Too many subscription attempts. Please try again in ${rateLimit.retryAfterSeconds} seconds.`,
    });
    return;
  }

  // 2. Parse and validate request body + honeypot check
  const body = await parseJsonBody<{
    email?: unknown;
    interests?: unknown;
    honeypot?: unknown;
  }>(req);

  const validated = validateSubscribeInput(body);
  if (!validated.ok) {
    sendJson(res, 400, { ok: false, error: validated.error });
    return;
  }

  // If honeypot was filled by a bot, return the neutral success message without writing or emailing
  if (validated.data.isHoneypotTriggered) {
    sendJson(res, 200, { ok: true, message: NEUTRAL_SUBSCRIBE_MESSAGE });
    return;
  }

  const { email, interests } = validated.data;

  // 3. Connect to Supabase using server-only SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
  const supabaseAdmin = createServerSupabaseAdmin();
  const { siteUrl } = getServerEnv();

  if (!supabaseAdmin) {
    console.error('[/api/subscribe] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    sendJson(res, 503, {
      ok: false,
      error: 'Subscription service is being configured. Please try again shortly.',
    });
    return;
  }

  try {
    // 4. Look up whether the email already exists in public.subscribers
    const { data: existingRow, error: lookupError } = await supabaseAdmin
      .from('subscribers')
      .select('id, email, confirmed, confirm_token, unsubscribe_token')
      .eq('email', email)
      .maybeSingle();

    if (lookupError) {
      console.error('[/api/subscribe] Supabase lookup error:', lookupError);
      sendJson(res, 500, {
        ok: false,
        error: 'Unable to process your subscription right now. Please try again.',
      });
      return;
    }

    // Case A: Already confirmed -> return the exact same neutral message without sending an email
    // (Never reveal whether an email address is already subscribed!)
    if (existingRow && existingRow.confirmed === true) {
      sendJson(res, 200, { ok: true, message: NEUTRAL_SUBSCRIBE_MESSAGE });
      return;
    }

    const confirmToken = generateSecureToken();
    const unsubscribeToken =
      (existingRow?.unsubscribe_token && String(existingRow.unsubscribe_token)) ||
      generateSecureToken();

    if (existingRow && existingRow.confirmed === false) {
      // Case B: Exists but unconfirmed -> refresh confirm_token & interests, then resend confirmation email
      const { error: updateError } = await supabaseAdmin
        .from('subscribers')
        .update({
          interests,
          confirm_token: confirmToken,
          unsubscribe_token: unsubscribeToken,
        })
        .eq('id', existingRow.id);

      if (updateError) {
        console.error('[/api/subscribe] Supabase update unconfirmed error:', updateError);
        sendJson(res, 500, {
          ok: false,
          error: 'Could not refresh your confirmation link. Please try again.',
        });
        return;
      }
    } else {
      // Case C: New subscriber -> insert with confirmed=false, confirm_token, unsubscribe_token
      const { error: insertError } = await supabaseAdmin.from('subscribers').insert({
        email,
        interests,
        confirmed: false,
        confirm_token: confirmToken,
        unsubscribe_token: unsubscribeToken,
      });

      if (insertError) {
        console.error('[/api/subscribe] Supabase insert error:', insertError);
        sendJson(res, 500, {
          ok: false,
          error: 'Could not save your subscription request. Please try again.',
        });
        return;
      }
    }

    // 5. Build and send the confirmation email via Resend
    const emailContent = buildConfirmationEmail({
      email,
      interests,
      confirmToken,
      unsubscribeToken,
      siteUrl,
    });

    const emailResult = await sendResendEmail({
      to: email,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
      unsubscribeUrl: emailContent.unsubscribeUrl,
    });

    if (!emailResult.ok) {
      console.error('[/api/subscribe] Resend delivery error:', emailResult.error);
      sendJson(res, 502, {
        ok: false,
        error: 'We could not send the confirmation email right now. Please try again shortly.',
      });
      return;
    }

    sendJson(res, 200, { ok: true, message: NEUTRAL_SUBSCRIBE_MESSAGE });
  } catch (err) {
    console.error('[/api/subscribe] Unexpected error:', err);
    sendJson(res, 500, {
      ok: false,
      error: 'An unexpected error occurred. Please try again later.',
    });
  }
}
