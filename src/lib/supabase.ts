import { createClient, SupabaseClient } from '@supabase/supabase-js';

const STORAGE_KEYS = {
  URL: 'taskboard_supabase_url',
  ANON_KEY: 'taskboard_supabase_anon_key',
};

let supabaseClient: SupabaseClient | null = null;
let currentClientKey: string = '';

export function sanitizeSupabaseUrl(rawUrl: string): string {
  let url = (rawUrl || '').trim();
  if (!url) return '';

  // Remove leading/trailing quotes (single, double, backticks)
  url = url.replace(/^['"`]|['"`]$/g, '').trim();

  // Remove trailing slashes
  url = url.replace(/\/+$/, '');

  // If user pasted the REST endpoint URL (e.g. /rest/v1 or /rest/v1/), strip it
  url = url.replace(/\/rest(\/v1)?\/?$/i, '');

  // Remove any remaining trailing slash
  url = url.replace(/\/+$/, '');

  // If user pasted without protocol, prepend https://
  if (url && !/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }

  return url;
}

export function sanitizeSupabaseKey(rawKey: string): string {
  let key = (rawKey || '').trim();
  if (!key) return '';
  // Remove wrapping quotes
  key = key.replace(/^['"`]|['"`]$/g, '').trim();
  return key;
}

export function getSupabaseCredentials(): { url: string; anonKey: string } {
  const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

  const localUrl = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.URL) || '' : '';
  const localKey = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.ANON_KEY) || '' : '';

  const rawUrl = envUrl || localUrl;
  const rawKey = envKey || localKey;

  return {
    url: sanitizeSupabaseUrl(rawUrl),
    anonKey: sanitizeSupabaseKey(rawKey),
  };
}

export function setCustomSupabaseCredentials(url: string, anonKey: string): SupabaseClient | null {
  const cleanUrl = sanitizeSupabaseUrl(url);
  const cleanKey = sanitizeSupabaseKey(anonKey);

  if (typeof window !== 'undefined') {
    if (cleanUrl) localStorage.setItem(STORAGE_KEYS.URL, cleanUrl);
    else localStorage.removeItem(STORAGE_KEYS.URL);

    if (cleanKey) localStorage.setItem(STORAGE_KEYS.ANON_KEY, cleanKey);
    else localStorage.removeItem(STORAGE_KEYS.ANON_KEY);
  }

  supabaseClient = null;
  currentClientKey = '';
  return getSupabase();
}

export function getSupabase(): SupabaseClient | null {
  const { url, anonKey } = getSupabaseCredentials();

  if (!url || !anonKey) {
    supabaseClient = null;
    currentClientKey = '';
    return null;
  }

  const clientKey = `${url}:${anonKey}`;
  if (supabaseClient && currentClientKey === clientKey) {
    return supabaseClient;
  }

  try {
    supabaseClient = createClient(url, anonKey, {
      auth: { persistSession: true },
    });
    currentClientKey = clientKey;
    return supabaseClient;
  } catch (e) {
    console.warn('Failed to initialize Supabase client:', e);
    supabaseClient = null;
    currentClientKey = '';
    return null;
  }
}

export function isSupabaseConfigured(): boolean {
  const { url, anonKey } = getSupabaseCredentials();
  return Boolean(url && anonKey);
}
