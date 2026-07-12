import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || '';
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);
console.log("SUPABASE URL:", supabaseUrl);
console.log("SUPABASE KEY:", supabaseAnonKey ? "CARGADA" : "VACÍA");
console.log("SUPABASE CONFIGURADO:", isSupabaseConfigured);

export let isSupabaseActive = isSupabaseConfigured;

export function setSupabaseActive(active: boolean) {
  isSupabaseActive = active;
}

/**
 * Lazy-initialized Supabase Client.
 * If credentials are not provided, it fails gracefully so the local fallback database
 * handles POS operations without crashing the dev server or application preview.
 */
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

if (!isSupabaseConfigured) {
  console.warn(
    'Supabase no está configurado. El sistema DelightOS se ejecutará utilizando la base de datos local temporal (localStorage + mockData).'
  );
}
