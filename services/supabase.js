import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[Supabase] Missing environment variables. Copy .env.example to .env and fill in your Supabase credentials.'
  );
}

// During Expo static export, code runs in Node.js where `window` doesn't exist.
// This no-op storage shim prevents Supabase from crashing during pre-rendering.
// In the browser and on device, AsyncStorage (which maps to localStorage on web)
// is used as normal.
const isBrowser = typeof window !== 'undefined';

const ssrSafeStorage = isBrowser
  ? AsyncStorage
  : {
      getItem: () => Promise.resolve(null),
      setItem: () => Promise.resolve(),
      removeItem: () => Promise.resolve(),
    };

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder',
  {
    auth: {
      storage: ssrSafeStorage,
      autoRefreshToken: isBrowser,
      persistSession: isBrowser,
      detectSessionInUrl: false,
    },
  }
);

// ─────────────────────────────────────────────
// Auth helpers
// ─────────────────────────────────────────────

export async function signUpWithEmail(email, password) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  return { data, error };
}

export async function signInWithEmail(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  return { data, error };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// ─────────────────────────────────────────────
// Watchlist helpers
// ─────────────────────────────────────────────

export async function addToWatchlist(userId, product) {
  const { data, error } = await supabase
    .from('watchlist')
    .upsert({
      user_id: userId,
      product_id: String(product.id),
      product_data: product,
      source: product.source || 'unknown',
    }, { onConflict: 'user_id,product_id' });
  return { data, error };
}

export async function removeFromWatchlist(userId, productId) {
  const { data, error } = await supabase
    .from('watchlist')
    .delete()
    .eq('user_id', userId)
    .eq('product_id', String(productId));
  return { data, error };
}

export async function getWatchlist(userId) {
  const { data, error } = await supabase
    .from('watchlist')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  return { data, error };
}

// ─────────────────────────────────────────────
// Profile helpers
// ─────────────────────────────────────────────

export async function upsertProfile(userId, updates) {
  const { data, error } = await supabase
    .from('profiles')
    .upsert({ id: userId, ...updates, updated_at: new Date().toISOString() });
  return { data, error };
}

export async function getProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  return { data, error };
}
