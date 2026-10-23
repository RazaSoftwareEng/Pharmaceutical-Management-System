// src/pages/auth/LoginPage.jsx
import React, { useState } from 'react';
import {
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
  Mail,
  Lock,
} from 'lucide-react';
import { useAuth, DEMO_ACCOUNTS, DEMO_PASSWORD } from '../../context/AuthContext';
import { getRememberMe, setRememberMe } from '../../lib/supabaseClient';
import { BRAND_LEGAL_NAME, BRAND_TAGLINE } from '../../config/brand';

const LOGO_SRC = '/star-laboratories-logo.png';

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
  'w-full h-12 lg:h-11 rounded-xl border border-slate-200 bg-slate-50/60 pl-10 pr-3 text-base lg:text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:bg-white focus:ring-4 focus:ring-[#E8302A]/15 focus:border-[#E8302A]';

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
    <div className="min-h-[100dvh] flex flex-col lg:grid lg:grid-cols-2 bg-gradient-to-b from-[#1C1348] via-[#2E206B] to-[#2E206B] lg:bg-none lg:bg-white">
      {/* Brand panel */}
      <section className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-[#1C1348] via-[#2E206B] to-[#1C1348] text-white p-12 relative overflow-hidden">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-[#E8302A]/25 blur-3xl" />
        <div className="absolute -bottom-40 -left-24 w-96 h-96 rounded-full bg-[#4A3AA8]/30 blur-3xl" />
        <div className="relative flex items-center gap-4">
          <div className="bg-white rounded-xl px-4 py-2.5 shadow-lg shadow-black/30">
            <img src={LOGO_SRC} alt={BRAND_LEGAL_NAME} width="160" height="80" className="h-16 w-auto" />
          </div>
          <p className="text-sm font-medium text-slate-300">{BRAND_TAGLINE}</p>
        </div>

        <div className="relative">
          <h1 className="text-3xl font-bold leading-tight tracking-tight">
            Stock, sales and recovery
            <br />
            <span className="text-[#FF6A5F]">in one place.</span>
          </h1>
          <ul className="mt-10 space-y-6">
            {HIGHLIGHTS.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-4">
                <span className="w-10 h-10 rounded-lg bg-white/5 ring-1 ring-white/10 grid place-items-center shrink-0">
                  <Icon className="w-5 h-5 text-[#FF6A5F]" />
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

      {/* Mobile hero */}
      <section className="lg:hidden relative overflow-hidden px-6 pt-10 pb-14 text-white text-center">
        <div className="absolute -top-24 -right-20 w-72 h-72 rounded-full bg-[#E8302A]/30 blur-3xl" />
        <div className="absolute -bottom-24 -left-16 w-64 h-64 rounded-full bg-[#4A3AA8]/40 blur-3xl" />
        <div className="relative">
          <div className="inline-block bg-white rounded-2xl px-5 py-3 shadow-xl shadow-black/30">
            <img src={LOGO_SRC} alt={BRAND_LEGAL_NAME} width="160" height="80" className="h-16 w-auto" />
          </div>
          <h1 className="mt-6 whitespace-nowrap text-[clamp(13px,4.2vw,22px)] font-bold leading-tight tracking-tight">
            Stock, sales and recovery <span className="text-[#FF6A5F]">in one place.</span>
          </h1>
        </div>
      </section>

      {/* Form panel: rounded sheet over the hero on mobile, plain column on desktop */}
      <section className="relative -mt-8 lg:mt-0 flex-1 flex lg:items-center justify-center rounded-t-[28px] lg:rounded-none bg-white px-6 pt-8 pb-10 sm:px-12 lg:p-12 shadow-[0_-12px_40px_rgba(0,0,0,0.25)] lg:shadow-none">
        <div className="w-full max-w-md">
          <div className="lg:hidden mx-auto -mt-4 mb-6 h-1 w-10 rounded-full bg-slate-200" aria-hidden="true" />

          <h2 className="text-2xl font-bold text-[#2E206B] tracking-tight">
            {mode === 'signup' ? 'Create your account' : 'Welcome back'}
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
                    className="group flex items-center gap-3 rounded-xl ring-1 ring-slate-200 bg-white px-4 py-3 text-left hover:ring-[#E8302A] hover:shadow-sm transition"
                  >
                    <span className="w-9 h-9 rounded-lg bg-[#2E206B]/10 text-[#2E206B] grid place-items-center shrink-0">
                      <Icon className="w-[18px] h-[18px]" />
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-semibold text-slate-900">{acc.role}</span>
                      <span className="block text-xs text-slate-500 truncate">
                        {acc.fullName} · {acc.designation}
                      </span>
                    </span>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#E8302A]" />
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
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
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
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
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
                  className="absolute inset-y-0 right-0 px-3.5 grid place-items-center text-slate-400 hover:text-[#2E206B]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {mode === 'signin' && (
              <label className="flex items-center gap-2.5 py-1 text-sm lg:text-xs text-slate-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 accent-[#E8302A] text-[#E8302A] focus:ring-[#E8302A]"
                />
                Remember me on this device
              </label>
            )}

            {error && <p className="text-xs text-rose-600">{error}</p>}
            {info && <p className="text-xs text-emerald-700">{info}</p>}

            <button
              type="submit"
              disabled={busy}
              className="w-full h-12 lg:h-11 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#E8302A] to-[#D42620] hover:from-[#D42620] hover:to-[#B01F1A] active:scale-[0.99] transition text-white text-base lg:text-sm font-semibold shadow-lg shadow-[#E8302A]/30 disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2E206B]"
            >
              {busy && <Loader2 className="w-4 h-4 animate-spin" />}
              {mode === 'signup' ? 'Create account' : 'Sign in'}
              {!busy && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          {!isDemoAuth && (
            <p className="mt-5 text-center text-xs text-slate-500">
              Forgot your password or need an account? Contact your administrator.
            </p>
          )}

          <footer className="mt-10 pt-5 border-t border-slate-100 text-center">
            <p className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
              <ShieldCheck className="w-3.5 h-3.5 text-[#2E206B]" />
              Secure, encrypted sign-in
            </p>
            <p className="mt-1.5 text-[11px] text-slate-400">
              © {new Date().getFullYear()} {BRAND_LEGAL_NAME} · Serving healthcare since 1960
            </p>
            <div
              className="mt-4 mx-auto h-1 w-24 rounded-full bg-gradient-to-r from-[#2E206B] via-[#E8302A] to-[#2E206B]"
              aria-hidden="true"
            />
          </footer>
        </div>
      </section>
    </div>
  );
}
