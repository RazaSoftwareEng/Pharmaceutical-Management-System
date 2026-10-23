// src/pages/auth/LoginPage.jsx
import React, { useState } from 'react';
import {
  Pill,
  ShieldCheck,
  CalendarClock,
  Wallet,
  Users,
  Loader2,
  ArrowRight,
  Crown,
  TrendingUp,
  Calculator,
  Boxes,
  PackageCheck,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useAuth, DEMO_ACCOUNTS, DEMO_PASSWORD } from '../../context/AuthContext';
import { getRememberMe, setRememberMe } from '../../lib/supabaseClient';
import { BRAND_NAME, BRAND_TAGLINE } from '../../config/brand';

const REMEMBERED_EMAIL_KEY = 'pharmacore_last_email';

function readRememberedEmail() {
  try {
    return getRememberMe() ? localStorage.getItem(REMEMBERED_EMAIL_KEY) || '' : '';
  } catch {
    return '';
  }
}

const ROLE_ICONS = {
  Admin: Crown,
  'Sales Manager': TrendingUp,
  Accountant: Calculator,
  'Inventory Manager': Boxes,
  Storekeeper: PackageCheck,
};

const HIGHLIGHTS = [
  { icon: CalendarClock, title: 'Zero expiry losses', text: 'FEFO dispatch and 90-day expiry alerts on every batch.' },
  { icon: Wallet, title: 'Recovery under control', text: 'Customer-wise aging, overdue alerts and WhatsApp reminders.' },
  { icon: Users, title: 'Sales team performance', text: 'Territory targets, bonus schemes and rep-wise collections.' },
  { icon: ShieldCheck, title: 'DRAP-ready records', text: 'Batch traceability, recalls and licensed invoices.' },
];

const inputCls =
  'w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white';

export default function LoginPage() {
  const { signIn, signInAsDemo, signUp, signOut, isDemoAuth, profileError } = useAuth();
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup'
  const [email, setEmail] = useState(readRememberedEmail);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(getRememberMe);
  const [fullName, setFullName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setBusy(true);
    try {
      if (mode === 'signup') {
        if (password.length < 8) throw new Error('Password must be at least 8 characters');
        const needsConfirm = await signUp({ email, password, fullName });
        if (needsConfirm) {
          setInfo('Account created. Check your e-mail to confirm, then sign in.');
          setMode('signin');
        }
      } else {
        // Applied before sign-in so the new session is stored in the right place
        setRememberMe(remember);
        await signIn(email, password);
        try {
          if (remember) localStorage.setItem(REMEMBERED_EMAIL_KEY, email.trim());
          else localStorage.removeItem(REMEMBERED_EMAIL_KEY);
        } catch {
          // storage unavailable
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-white">
      {/* Brand panel */}
      <section className="hidden lg:flex flex-col justify-between bg-slate-950 text-white p-12 relative overflow-hidden">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-teal-500/20 blur-3xl" />
        <div className="relative flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-teal-600 to-teal-400 grid place-items-center">
            <Pill className="w-6 h-6 text-slate-950" />
          </div>
          <div>
            <p className="font-bold text-lg tracking-tight">{BRAND_NAME}</p>
            <p className="text-xs text-slate-400">{BRAND_TAGLINE}</p>
          </div>
        </div>

        <div className="relative">
          <h1 className="text-3xl font-bold leading-tight tracking-tight">
            Stock, sales and recovery
            <br />
            <span className="text-teal-400">in one place.</span>
          </h1>
          <ul className="mt-10 space-y-6">
            {HIGHLIGHTS.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-4">
                <span className="w-10 h-10 rounded-lg bg-white/5 ring-1 ring-white/10 grid place-items-center shrink-0">
                  <Icon className="w-5 h-5 text-teal-400" />
                </span>
                <div>
                  <p className="font-semibold text-sm">{title}</p>
                  <p className="text-sm text-slate-400 mt-0.5">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-slate-500">WHO-cGMP · FEFO · DRAP batch traceability</p>
      </section>

      {/* Form panel */}
      <section className="flex items-center justify-center p-6 sm:p-12 bg-slate-50 lg:bg-white">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="w-10 h-10 rounded-xl bg-teal-600 grid place-items-center">
              <Pill className="w-5 h-5 text-white" />
            </div>
            <p className="font-bold text-lg">{BRAND_NAME}</p>
          </div>

          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            {mode === 'signup' ? 'Create your account' : 'Sign in'}
          </h2>
          <p className="mt-1.5 text-sm text-slate-500">
            {isDemoAuth
              ? 'Demo mode — choose a role to explore what each team member sees.'
              : mode === 'signup'
              ? 'The first account becomes the Admin. Admins assign roles to everyone else.'
              : 'Sign in with the e-mail and password your administrator gave you.'}
          </p>

          {profileError && (
            <div className="mt-5 p-3 rounded-lg bg-rose-50 ring-1 ring-rose-200 text-xs text-rose-700">
              {profileError}{' '}
              <button onClick={signOut} className="underline font-semibold">
                Sign out
              </button>
            </div>
          )}

          {isDemoAuth && (
            <div className="mt-6 grid gap-2">
              {DEMO_ACCOUNTS.map((acc) => {
                const Icon = ROLE_ICONS[acc.role] || Users;
                return (
                  <button
                    key={acc.id}
                    onClick={() => signInAsDemo(acc.id)}
                    className="group flex items-center gap-3 rounded-xl ring-1 ring-slate-200 bg-white px-4 py-3 text-left hover:ring-teal-400 hover:shadow-sm transition"
                  >
                    <span className="w-9 h-9 rounded-lg bg-teal-50 text-teal-700 grid place-items-center shrink-0">
                      <Icon className="w-[18px] h-[18px]" />
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-semibold text-slate-900">{acc.role}</span>
                      <span className="block text-xs text-slate-500 truncate">
                        {acc.fullName} · {acc.designation}
                      </span>
                    </span>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-teal-600" />
                  </button>
                );
              })}
              <p className="mt-2 text-[11px] text-slate-400">
                Or sign in below with any demo e-mail (e.g. owner@demo.pk) and password{' '}
                <span className="font-mono">{DEMO_PASSWORD}</span>.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Full name</label>
                <input required value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputCls} />
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">E-mail</label>
              <input
                type="email"
                required
                name="email"
                placeholder="e.g. admin@yourcompany.com"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  name="password"
                  placeholder="Enter your password"
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${inputCls} pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  title={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute inset-y-0 right-0 px-3 grid place-items-center text-slate-400 hover:text-slate-700"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {mode === 'signin' && (
              <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                />
                Remember me on this device
              </label>
            )}

            {error && <p className="text-xs text-rose-600">{error}</p>}
            {info && <p className="text-xs text-emerald-700">{info}</p>}

            <button
              type="submit"
              disabled={busy}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold py-2.5 disabled:opacity-60"
            >
              {busy && <Loader2 className="w-4 h-4 animate-spin" />}
              {mode === 'signup' ? 'Create account' : 'Sign in'}
            </button>
          </form>

          {!isDemoAuth && (
            <p className="mt-5 text-center text-xs text-slate-500">
              Forgot your password or need an account? Contact your administrator.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
