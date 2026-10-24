import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  (typeof import.meta !== "undefined" && import.meta.env?.NEXT_PUBLIC_SUPABASE_URL) ||
  "";
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  (typeof import.meta !== "undefined" &&
    (import.meta.env?.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      import.meta.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY)) ||
  "";

export const createClient = () =>
  createBrowserClient(
    supabaseUrl!,
    supabaseKey!,
  );
