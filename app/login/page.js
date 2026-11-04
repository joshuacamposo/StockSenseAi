'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  ArrowRight,
  BellRing,
  Boxes,
  CheckCircle2,
  ClipboardCheck,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { useApp } from '@/context/AppProvider';
import { Badge, Button, Field, Input, cn } from '@/components/ui';
import { DEMO_PASSWORD_WARNING } from '@/data/demoAccounts';
import { ROLES } from '@/lib/permissions';
import { formatNumber } from '@/lib/format';

export default function LoginPage() {
  const router = useRouter();
  const { ready, user, accounts, login, alerts, pendingRecommendations, products } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    if (ready && user) {
      router.replace('/dashboard');
    }
  }, [ready, user, router]);

  const metrics = useMemo(
    () => [
      { label: 'Products tracked', value: formatNumber(products.length || 7) },
      { label: 'Active alerts', value: formatNumber(alerts.length || 4) },
      { label: 'Pending reorders', value: formatNumber(pendingRecommendations.length || 4) },
    ],
    [products.length, alerts.length, pendingRecommendations.length]
  );

  const fillAccount = (account) => {
    setEmail(account.email);
    setPassword(account.password);
    setSelectedId(account.id);
    setError('');
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setError('');
    if (!email.trim() || !password) {
      setError('Enter both your email and password, or pick a demonstration account below.');
      return;
    }
    setSubmitting(true);
    const result = login(email, password);
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    toast.success(`Welcome, ${result.user.name}. Session saved in this browser.`);
    router.replace('/dashboard');
  };

  return (
    <div className="min-h-screen bg-ink-950 lg:grid lg:grid-cols-[1.08fr_0.92fr]">
      {/* Brand panel */}
      <section className="relative hidden overflow-hidden px-10 py-10 text-white lg:flex lg:flex-col lg:px-14 xl:px-16">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.18]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(148,178,255,0.16) 1px, transparent 1px), linear-gradient(90deg, rgba(148,178,255,0.16) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        <div className="pointer-events-none absolute -left-24 top-24 h-80 w-80 rounded-full bg-brand-600/30 blur-3xl" />
        <div className="pointer-events-none absolute -right-16 bottom-0 h-96 w-96 rounded-full bg-brand-400/10 blur-3xl" />

        <div className="relative flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-700 shadow-lg shadow-brand-900/50">
            <Boxes size={22} strokeWidth={2.2} />
          </span>
          <div>
            <p className="text-[17px] font-extrabold tracking-tight">
              StockSense <span className="text-brand-300">AI</span>
            </p>
            <p className="text-[10.5px] font-medium uppercase tracking-[0.2em] text-slate-400">
              Inventory & Stock Automation
            </p>
          </div>
        </div>

        <div className="relative mt-14 max-w-xl">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] font-semibold text-brand-200">
            <Sparkles size={13} />
            SA101 · Prefinal Defense Prototype
          </span>
          <h1 className="mt-5 text-[40px] font-extrabold leading-[1.08] tracking-tight xl:text-[46px]">
            Smarter inventory decisions,
            <span className="text-brand-300"> all in one place.</span>
          </h1>
          <p className="mt-4 max-w-md text-[13.5px] leading-relaxed text-slate-300">
            Monitor stock, automate low-stock detection, review reorder recommendations, forecast
            demand, and ask the built-in StockSense AI Assistant about real inventory data.
          </p>
        </div>

        <div className="relative mt-8 grid max-w-lg grid-cols-3 gap-3">
          {metrics.map((metric) => (
            <div
              key={metric.label}
              className="rounded-2xl border border-white/10 bg-white/[0.06] p-3.5 backdrop-blur"
            >
              <p className="text-[22px] font-extrabold leading-none">{metric.value}</p>
              <p className="mt-1 text-[10.5px] leading-snug text-slate-400">{metric.label}</p>
            </div>
          ))}
        </div>

        <div className="relative mt-8 max-w-lg space-y-2.5">
          {[
            {
              icon: BellRing,
              title: 'Automated low-stock detection',
              text: 'Status recalculates after every stock-in and stock-out.',
            },
            {
              icon: ClipboardCheck,
              title: 'Rule-based reorder workflow',
              text: 'Recommendations are reviewed and approved — never auto-added to stock.',
            },
            {
              icon: CheckCircle2,
              title: 'Unified assistant',
              text: 'The chatbot reads the same live inventory state as the dashboard.',
            },
          ].map((item) => (
            <div key={item.title} className="flex items-start gap-3">
              <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-500/15 text-brand-300">
                <item.icon size={15} />
              </span>
              <div>
                <p className="text-[12.5px] font-semibold text-white">{item.title}</p>
                <p className="text-[11px] leading-relaxed text-slate-400">{item.text}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="relative mt-auto pt-10">
          <div className="max-w-sm rounded-2xl border border-white/10 bg-white/[0.06] p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                <p className="text-[12px] font-bold">Bond Paper · BP-001</p>
              </div>
              <span className="rounded-full bg-amber-400/15 px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wide text-amber-300">
                Low stock
              </span>
            </div>
            <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-[20%] rounded-full bg-amber-400" />
            </div>
            <div className="mt-2 flex justify-between text-[10px] text-slate-400">
              <span>20 units on hand</span>
              <span>Reorder at 50</span>
            </div>
          </div>
          <p className="mt-4 text-[10px] leading-relaxed text-slate-500">
            Static academic prototype · All data stays in this browser · No server, database, or
            external AI service.
          </p>
        </div>
      </section>

      {/* Form panel */}
      <section className="relative flex min-h-screen flex-col justify-center bg-slate-50 px-4 py-8 sm:px-8 lg:min-h-0 lg:px-10 xl:px-16">
        <div className="mb-6 flex items-center gap-3 lg:hidden">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-700 text-white">
            <Boxes size={20} />
          </span>
          <div>
            <p className="text-[15px] font-extrabold text-slate-900">
              StockSense <span className="text-brand-600">AI</span>
            </p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Inventory automation
            </p>
          </div>
        </div>

        <div className="mx-auto w-full max-w-md">
          <div className="mb-5">
            <h2 className="text-[26px] font-extrabold tracking-tight text-slate-900">
              Sign in to the demo
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-slate-500">
              Choose a demonstration account below, or type the credentials manually. Sessions
              survive a browser refresh.
            </p>
          </div>

          {error ? (
            <div className="mb-4 flex gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs leading-relaxed text-rose-700 animate-fade-in">
              <ShieldAlert size={16} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="card p-5 sm:p-6" noValidate>
            <div className="space-y-4">
              <Field label="Email address" htmlFor="login-email" required>
                <div className="relative">
                  <Mail
                    size={16}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <Input
                    id="login-email"
                    type="email"
                    autoComplete="username"
                    placeholder="admin@stocksense.demo"
                    className="pl-9"
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      setSelectedId(null);
                    }}
                  />
                </div>
              </Field>

              <Field label="Password" htmlFor="login-password" required>
                <div className="relative">
                  <LockKeyhole
                    size={16}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <Input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="Enter demo password"
                    className="pl-9 pr-10"
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      setSelectedId(null);
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-2.5 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </Field>
            </div>

            <Button
              type="submit"
              className="mt-5 w-full"
              size="lg"
              loading={submitting}
              iconRight={ArrowRight}
            >
              Sign in to StockSense AI
            </Button>

            <p className="mt-3 text-center text-[10.5px] leading-relaxed text-slate-400">
              Simulated authentication · Hardcoded demo passwords · Client-side role controls only
            </p>
          </form>

          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
                Demonstration accounts only
              </h3>
              <span className="text-[10px] font-medium text-slate-400">Click to fill</span>
            </div>
            <div className="space-y-2">
              {accounts.map((account) => {
                const roleMeta = ROLES[account.role];
                return (
                  <div
                    key={account.id}
                    className={cn(
                      'flex items-center gap-3 rounded-xl border bg-white p-2.5 transition',
                      selectedId === account.id
                        ? 'border-brand-400 ring-2 ring-brand-500/10'
                        : 'border-slate-200 hover:border-slate-300'
                    )}
                  >
                    <span
                      className={cn(
                        'grid h-9 w-9 shrink-0 place-items-center rounded-full text-[11px] font-bold text-white',
                        account.color
                      )}
                    >
                      {account.initials}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="truncate text-[12px] font-bold text-slate-800">
                          {account.name}
                        </p>
                        <span
                          className={cn(
                            'hidden shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold ring-1 ring-inset sm:inline',
                            roleMeta.badge
                          )}
                        >
                          {roleMeta.label}
                        </span>
                      </div>
                      <p className="truncate text-[10.5px] text-slate-500">
                        {account.email} · <span className="font-mono">{account.password}</span>
                      </p>
                    </div>
                    <Button size="xs" variant="secondary" onClick={() => fillAccount(account)}>
                      Fill
                    </Button>
                  </div>
                );
              })}
            </div>
            <p className="mt-3 rounded-lg bg-amber-50 p-2.5 text-[10px] leading-relaxed text-amber-800 ring-1 ring-inset ring-amber-200">
              {DEMO_PASSWORD_WARNING}
            </p>
          </div>
        </div>

        <p className="mx-auto mt-8 max-w-md text-center text-[10px] leading-relaxed text-slate-400">
          StockSense AI is an interactive academic prototype developed for the SA101 Artificial
          Intelligence Automation System prefinal defense. It does not connect to a backend,
          database, payment system, or external AI service.
        </p>
      </section>
    </div>
  );
}
