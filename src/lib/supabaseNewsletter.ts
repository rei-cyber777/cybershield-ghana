/**
 * Pure payload validation & Supabase error classification for the "subscribers" table.
 * Table schema columns written on insert: ONLY `email` and `interests`.
 */

export interface SubscriberInsertPayload {
  email: string;
  interests: string;
}

export type SubscriberErrorKind =
  | 'invalid_email'
  | 'duplicate_email'
  | 'network_failure'
  | 'missing_config'
  | 'database_error';

export interface ClassifiedSubscriberError {
  kind: SubscriberErrorKind;
  userMessage: string;
}

const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

/**
 * Validates the email and returns an insert payload containing ONLY the columns
 * that exist in the `subscribers` table: `{ email, interests }`.
 */
export function buildSubscriberInsertPayload(
  rawEmail: string,
  rawInterests: string
): { ok: true; payload: SubscriberInsertPayload } | { ok: false; error: ClassifiedSubscriberError } {
  const email = (rawEmail || '').trim().toLowerCase();
  const interests = (rawInterests || '').trim() || 'Cybersecurity & Ghana Scam Alerts';

  if (!email || !EMAIL_REGEX.test(email)) {
    return {
      ok: false,
      error: {
        kind: 'invalid_email',
        userMessage: 'Please enter a valid email address (for example, student@ug.edu.gh).',
      },
    };
  }

  return {
    ok: true,
    payload: {
      email,
      interests,
    },
  };
}

/**
 * Classifies a Supabase PostgrestError or network Error into a clear, user-friendly
 * message for duplicate email, invalid email, and network failure.
 */
export function classifySupabaseSubscriberError(err: unknown): ClassifiedSubscriberError {
  if (!err) {
    return {
      kind: 'database_error',
      userMessage: 'Could not complete your subscription. Please try again.',
    };
  }

  const errObj = err as {
    code?: string;
    message?: string;
    details?: string;
    hint?: string;
    name?: string;
  };

  const code = String(errObj.code || '');
  const message = String(errObj.message || '');
  const details = String(errObj.details || '');
  const combined = `${code} ${message} ${details}`.toLowerCase();

  // 1. Duplicate email (Postgres unique violation 23505)
  if (
    code === '23505' ||
    combined.includes('duplicate key') ||
    combined.includes('unique constraint') ||
    combined.includes('subscribers_email_key') ||
    combined.includes('already exists')
  ) {
    return {
      kind: 'duplicate_email',
      userMessage:
        'This email address is already subscribed to CyberShield Ghana updates.',
    };
  }

  // 2. Invalid email check constraint (Postgres check_violation 23514 or email format error)
  if (
    code === '23514' ||
    (combined.includes('check constraint') && combined.includes('email')) ||
    combined.includes('invalid email')
  ) {
    return {
      kind: 'invalid_email',
      userMessage: 'Please enter a valid email address (for example, student@ug.edu.gh).',
    };
  }

  // 3. Network failure (Failed to fetch / offline / DNS / timeout)
  if (
    errObj.name === 'TypeError' ||
    combined.includes('failed to fetch') ||
    combined.includes('networkerror') ||
    combined.includes('network request failed') ||
    combined.includes('fetch failed') ||
    combined.includes('load failed')
  ) {
    return {
      kind: 'network_failure',
      userMessage:
        'Network error: Could not reach the subscription server. Please check your internet connection and try again.',
    };
  }

  // 4. Fallback database / RLS error
  return {
    kind: 'database_error',
    userMessage:
      message
        ? `Subscription failed: ${message}`
        : 'Subscription could not be saved to the database. Please try again later.',
  };
}
