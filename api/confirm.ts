import { isValidHexToken } from '../src/lib/doubleOptInCore';
import {
  ApiRequest,
  ApiResponse,
  createServerSupabaseAdmin,
  getQueryParam,
  sendJson,
  sendRedirect,
} from './_utils';

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'GET') {
    sendJson(res, 405, { ok: false, error: 'Method Not Allowed. Use GET.' });
    return;
  }

  const token = getQueryParam(req, 'token');
  if (!isValidHexToken(token)) {
    sendRedirect(res, '/confirmed?status=invalid');
    return;
  }

  const supabaseAdmin = createServerSupabaseAdmin();
  if (!supabaseAdmin) {
    console.error('[/api/confirm] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    sendRedirect(res, '/confirmed?status=error');
    return;
  }

  try {
    const { data: subscriber, error: findError } = await supabaseAdmin
      .from('subscribers')
      .select('id, confirmed')
      .eq('confirm_token', token)
      .maybeSingle();

    if (findError || !subscriber) {
      sendRedirect(res, '/confirmed?status=invalid');
      return;
    }

    const { error: updateError } = await supabaseAdmin
      .from('subscribers')
      .update({
        confirmed: true,
        confirmed_at: new Date().toISOString(),
        confirm_token: null,
      })
      .eq('id', subscriber.id);

    if (updateError) {
      console.error('[/api/confirm] Failed to confirm subscriber:', updateError);
      sendRedirect(res, '/confirmed?status=error');
      return;
    }

    sendRedirect(res, '/confirmed');
  } catch (err) {
    console.error('[/api/confirm] Unexpected error:', err);
    sendRedirect(res, '/confirmed?status=error');
  }
}
