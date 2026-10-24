import { createClient as createSupabaseJsClient, SupabaseClient } from '@supabase/supabase-js';
import { createBrowserClient } from '@supabase/ssr';

export interface SupabaseEnvConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  isConfigured: boolean;
}

/**
 * Reads NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY / NEXT_PUBLIC_SUPABASE_ANON_KEY
 * (with fallback to VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY).
 */
export function getSupabaseEnvConfig(): SupabaseEnvConfig {
  const metaEnv =
    (typeof import.meta !== 'undefined' &&
      (import.meta as unknown as { env?: Record<string, string | undefined> }).env) ||
    {};

  const procEnv =
    (typeof process !== 'undefined' &&
      (process as unknown as { env?: Record<string, string | undefined> }).env) ||
    {};

  const supabaseUrl = (
    metaEnv.NEXT_PUBLIC_SUPABASE_URL ||
    procEnv.NEXT_PUBLIC_SUPABASE_URL ||
    metaEnv.VITE_SUPABASE_URL ||
    procEnv.VITE_SUPABASE_URL ||
    ''
  ).trim();

  const supabaseAnonKey = (
    metaEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    procEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    metaEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    procEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    metaEnv.VITE_SUPABASE_PUBLISHABLE_KEY ||
    procEnv.VITE_SUPABASE_PUBLISHABLE_KEY ||
    metaEnv.VITE_SUPABASE_ANON_KEY ||
    procEnv.VITE_SUPABASE_ANON_KEY ||
    ''
  ).trim();

  const isPlaceholder =
    !supabaseUrl ||
    !supabaseAnonKey ||
    supabaseUrl.includes('your-project-ref') ||
    supabaseAnonKey.includes('your-public-anon-key');

  return {
    supabaseUrl,
    supabaseAnonKey,
    isConfigured: !isPlaceholder,
  };
}

let cachedClient: SupabaseClient | null = null;

/**
 * Returns a singleton Supabase browser client configured with
 * NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY / NEXT_PUBLIC_SUPABASE_ANON_KEY.
 */
export function getSupabaseClient(): SupabaseClient | null {
  const { supabaseUrl, supabaseAnonKey, isConfigured } = getSupabaseEnvConfig();

  if (!isConfigured) {
    return null;
  }

  if (!cachedClient) {
    if (typeof window !== 'undefined') {
      cachedClient = createBrowserClient(supabaseUrl, supabaseAnonKey);
    } else {
      cachedClient = createSupabaseJsClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });
    }
  }

  return cachedClient;
}

