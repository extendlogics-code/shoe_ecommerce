import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type SupabaseInstance = SupabaseClient | null | undefined;

let cachedClient: SupabaseInstance;

const resolveEnv = () => {
  const url = import.meta.env.VITE_SUPABASE_URL?.trim() ?? "";
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? "";

  if (!url || !anonKey) {
    return null;
  }

  return { url, anonKey };
};

export const getSupabaseClient = (): SupabaseClient | null => {
  if (cachedClient !== undefined) {
    return cachedClient ?? null;
  }

  const credentials = resolveEnv();

  if (!credentials) {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.warn(
        "[supabase] VITE_SUPABASE_URL and/or VITE_SUPABASE_ANON_KEY are not configured. Falling back to API routes."
      );
    }

    cachedClient = null;
    return null;
  }

  cachedClient = createClient(credentials.url, credentials.anonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  });

  return cachedClient;
};

export const requireSupabaseClient = (): SupabaseClient => {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error("Supabase client requested but environment variables were not provided.");
  }
  return client;
};

export const isSupabaseConfigured = (): boolean => Boolean(getSupabaseClient());
