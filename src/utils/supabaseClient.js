const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

const trimTrailingSlash = (value) => value?.replace(/\/+$/, '');

export async function supabaseRequest(path, options = {}) {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured');
  }

  const headers = {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const response = await fetch(`${trimTrailingSlash(SUPABASE_URL)}/rest/v1/${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    const error = new Error(text || `Supabase request failed: ${response.status}`);
    error.status = response.status;
    error.body = text;
    throw error;
  }

  if (response.status === 204) return null;
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

export const toIsoNow = () => new Date().toISOString();

