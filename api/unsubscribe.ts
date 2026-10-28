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
  if (req.method !== 'GET' && req.method !== 'POST') {
    sendJson(res, 405, { ok: false, error: 'Method Not Allowed. Use GET or POST.' });
    return;
  }

  const token = getQueryParam(req, 'token');
  if (!isValidHexToken(token)) {
    sendRedirect(res, '/unsubscribed?status=invalid');
    return;
  }

  const supabaseAdmin = createServerSupabaseAdmin();
  if (!supabaseAdmin) {
    console.error('[/api/unsubscribe] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    sendRedirect(res, '/unsubscribed?status=error');
    return;
  }

  try {
    const { data: deletedRows, error: deleteError } = await supabaseAdmin
      .from('subscribers')
      .delete()
      .eq('unsubscribe_token', token)
      .select('id');

    if (deleteError) {
      console.error('[/api/unsubscribe] Failed to delete subscriber:', deleteError);
      sendRedirect(res, '/unsubscribed?status=error');
      return;
    }

    if (!deletedRows || deletedRows.length === 0) {
      sendRedirect(res, '/unsubscribed?status=already');
      return;
    }

    sendRedirect(res, '/unsubscribed');
  } catch (err) {
    console.error('[/api/unsubscribe] Unexpected error:', err);
    sendRedirect(res, '/unsubscribed?status=error');
  }
}
