import { createClient, SupabaseClient } from '@supabase/supabase-js';

const STORAGE_KEYS = {
  URL: 'taskboard_supabase_url',
  ANON_KEY: 'taskboard_supabase_anon_key',
};

let supabaseClient: SupabaseClient | null = null;

export function getSupabaseCredentials(): { url: string; anonKey: string } {
  const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

  const localUrl = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.URL) || '' : '';
  const localKey = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.ANON_KEY) || '' : '';

  return {
    url: envUrl || localUrl,
    anonKey: envKey || localKey,
  };
}

export function setCustomSupabaseCredentials(url: string, anonKey: string): SupabaseClient | null {
  if (typeof window !== 'undefined') {
    if (url) localStorage.setItem(STORAGE_KEYS.URL, url.trim());
    else localStorage.removeItem(STORAGE_KEYS.URL);

    if (anonKey) localStorage.setItem(STORAGE_KEYS.ANON_KEY, anonKey.trim());
    else localStorage.removeItem(STORAGE_KEYS.ANON_KEY);
  }

  supabaseClient = null;
  return getSupabase();
}

export function getSupabase(): SupabaseClient | null {
  if (supabaseClient) return supabaseClient;

  const { url, anonKey } = getSupabaseCredentials();

  if (url && anonKey) {
    try {
      supabaseClient = createClient(url, anonKey, {
        auth: { persistSession: true },
      });
      return supabaseClient;
    } catch (e) {
      console.warn('Failed to initialize Supabase client:', e);
      return null;
    }
  }

  return null;
}

export function isSupabaseConfigured(): boolean {
  const { url, anonKey } = getSupabaseCredentials();
  return Boolean(url && anonKey);
}
