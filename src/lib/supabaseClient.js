// src/lib/supabaseClient.js
// Supabase client singleton. When the env vars are absent the app falls back to
// local (in-browser) storage, so the ERP still runs without a backend.
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
// Supabase now issues "publishable" keys; older projects use the anon key. Either works.
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// "Remember me": the session lives in localStorage (survives browser restarts)
// when remembered, otherwise in sessionStorage (cleared when the browser closes).
const REMEMBER_KEY = 'pharmacore_remember_me';

export function getRememberMe() {
  try {
    return localStorage.getItem(REMEMBER_KEY) !== 'false';
  } catch {
    return true;
  }
}

export function setRememberMe(remember) {
  try {
    localStorage.setItem(REMEMBER_KEY, remember ? 'true' : 'false');
  } catch {
    // storage unavailable (private mode) — default behaviour applies
  }
}

const sessionStore = {
  getItem: (key) => {
    try {
      return sessionStorage.getItem(key) ?? localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key, value) => {
    try {
      const keep = getRememberMe();
      (keep ? localStorage : sessionStorage).setItem(key, value);
      (keep ? sessionStorage : localStorage).removeItem(key);
    } catch {
      // ignore
    }
  },
  removeItem: (key) => {
    try {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    } catch {
      // ignore
    }
  },
};

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: true, autoRefreshToken: true, storage: sessionStore },
    })
  : null;

export const supabaseProjectHost = isSupabaseConfigured ? new URL(supabaseUrl).host : null;
