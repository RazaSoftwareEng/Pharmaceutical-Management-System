// src/context/AuthContext.jsx
// Authentication + role resolution.
// - Supabase mode: email/password via Supabase Auth, role from `public.profiles`.
// - Local mode: one demo account per role so the ERP can be demoed without a backend.
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

const AuthContext = createContext(null);

const DEMO_SESSION_KEY = 'pharmacore_demo_session';
export const DEMO_PASSWORD = 'demo1234';

export const DEMO_ACCOUNTS = [
  { id: 'demo-admin', email: 'owner@demo.pk', fullName: 'Ali Raza', role: 'Admin', designation: 'Managing Director' },
  { id: 'demo-sales', email: 'sales@demo.pk', fullName: 'Farhan Siddiqui', role: 'Sales Manager', designation: 'National Sales Manager' },
  { id: 'demo-acct', email: 'accounts@demo.pk', fullName: 'Sana Malik', role: 'Accountant', designation: 'Finance Manager' },
  { id: 'demo-inv', email: 'inventory@demo.pk', fullName: 'Dr. Tariq Mahmood', role: 'Inventory Manager', designation: 'Head of Warehouse' },
  { id: 'demo-store', email: 'store@demo.pk', fullName: 'Asim Khan', role: 'Storekeeper', designation: 'Senior Storekeeper' },
];

function readDemoSession() {
  try {
    const id = localStorage.getItem(DEMO_SESSION_KEY);
    return DEMO_ACCOUNTS.find((a) => a.id === id) || null;
  } catch {
    return null;
  }
}

function profileToUser(profile, authUser) {
  return {
    id: authUser.id,
    email: authUser.email,
    fullName: profile.full_name || authUser.email,
    role: profile.role,
    designation: profile.designation || profile.role,
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => (isSupabaseConfigured ? null : readDemoSession()));
  const [authUser, setAuthUser] = useState(null); // raw Supabase auth user
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured);
  const [profileError, setProfileError] = useState(null);

  // Track the Supabase session
  useEffect(() => {
    if (!isSupabaseConfigured) return undefined;
    supabase.auth.getSession().then(({ data }) => {
      setAuthUser(data.session?.user || null);
      if (!data.session) setIsLoading(false);
    });
    // Do not call Supabase from inside this callback; profile loading happens in the effect below.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthUser(session?.user || null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // Resolve the role from public.profiles whenever the signed-in user changes
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    if (!authUser) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    supabase
      .from('profiles')
      .select('full_name, role, designation, active')
      .eq('id', authUser.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error || !data) {
          setProfileError(
            error?.message ||
              'No profile found for this account. Run supabase/schema.sql again so existing users get a profile.'
          );
          setUser(null);
        } else if (data.active === false) {
          setProfileError('This account has been deactivated by an administrator.');
          setUser(null);
        } else {
          setProfileError(null);
          setUser(profileToUser(data, authUser));
        }
        setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [authUser]);

  const signIn = useCallback(async (email, password) => {
    if (!isSupabaseConfigured) {
      const account = DEMO_ACCOUNTS.find((a) => a.email.toLowerCase() === email.trim().toLowerCase());
      if (!account || password !== DEMO_PASSWORD) throw new Error('Invalid email or password');
      localStorage.setItem(DEMO_SESSION_KEY, account.id);
      setUser(account);
      return;
    }
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) throw new Error(error.message);
  }, []);

  const signInAsDemo = useCallback((accountId) => {
    const account = DEMO_ACCOUNTS.find((a) => a.id === accountId);
    if (!account) return;
    localStorage.setItem(DEMO_SESSION_KEY, account.id);
    setUser(account);
  }, []);

  /** Returns true when Supabase requires e-mail confirmation before sign-in. */
  const signUp = useCallback(async ({ email, password, fullName }) => {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) throw new Error(error.message);
    return !data.session;
  }, []);

  const signOut = useCallback(async () => {
    if (!isSupabaseConfigured) {
      localStorage.removeItem(DEMO_SESSION_KEY);
      setUser(null);
      return;
    }
    await supabase.auth.signOut();
  }, []);

  // ---- User administration (Admin only; enforced by RLS in Supabase) ----
  const listProfiles = useCallback(async () => {
    if (!isSupabaseConfigured) {
      return DEMO_ACCOUNTS.map((a) => ({ id: a.id, email: a.email, full_name: a.fullName, role: a.role, designation: a.designation, active: true }));
    }
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, role, designation, active, created_at')
      .order('created_at');
    if (error) throw new Error(error.message);
    return data;
  }, []);

  const updateProfile = useCallback(async (id, changes) => {
    const { error } = await supabase.from('profiles').update(changes).eq('id', id);
    if (error) throw new Error(error.message);
  }, []);

  const value = {
    user,
    isLoading,
    profileError,
    isDemoAuth: !isSupabaseConfigured,
    signIn,
    signInAsDemo,
    signUp,
    signOut,
    listProfiles,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
