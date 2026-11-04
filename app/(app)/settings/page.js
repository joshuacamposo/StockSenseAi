'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  Building2,
  CalendarRange,
  CheckCircle2,
  Coins,
  Database,
  Info,
  Lock,
  RotateCcw,
  Save,
  Settings as SettingsIcon,
  SlidersHorizontal,
  Sparkles,
  UserCog,
} from 'lucide-react';
import { useApp } from '@/context/AppProvider';
import {
  Badge,
  Button,
  Callout,
  DemoNote,
  Field,
  Input,
  LinkButton,
  PageHeader,
  SectionCard,
  Select,
  Toggle,
  cn,
} from '@/components/ui';
import { ROLES } from '@/lib/permissions';
import { formatDateTime } from '@/lib/format';
import { DEMO_ACCOUNTS } from '@/data/demoAccounts';

const CURRENCIES = ['₱', '$', '€', '¥'];
const PERIODS = [14, 30, 60, 90];
const HORIZONS = [7, 14, 30];

export default function SettingsPage() {
  const { settings, updateSettings, user, auditLogs } = useApp();
  const [values, setValues] = useState(settings);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setValues(settings);
  }, [settings]);

  const update = (key, value) => setValues((previous) => ({ ...previous, [key]: value }));

  const handleSubmit = (event) => {
    event.preventDefault();
    const businessName = String(values.businessName || '').trim();
    if (!businessName) {
      toast.error('Business name is required.');
      return;
    }
    setSaving(true);
    const result = updateSettings({
      businessName,
      currency: values.currency,
      forecastPeriodDays: Number(values.forecastPeriodDays),
      forecastHorizonDays: Number(values.forecastHorizonDays),
      lowStockEmailAlerts: Boolean(values.lowStockEmailAlerts),
      demoBanner: Boolean(values.demoBanner),
      compactTables: Boolean(values.compactTables),
    });
    setSaving(false);
    if (result.ok) {
      toast.success('Prototype settings saved locally and written to the audit log.');
    } else {
      toast.error(result.error || 'Settings could not be saved.');
    }
  };

  return (
    <div>
      <PageHeader
        title="Settings"
        eyebrow="Administrator only"
        icon={SettingsIcon}
        subtitle="Manage demonstration workspace preferences. Settings are stored in this browser and have no effect on a server because no server exists."
        badges={
          <>
            <DemoNote />
            <Badge tone="brand">Admin</Badge>
          </>
        }
        actions={
          <LinkButton href="/demo-testing" variant="secondary" icon={RotateCcw}>
            Demo &amp; testing
          </LinkButton>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-2"
          data-tour="settings-form"
        >
          <SectionCard
            title="Workspace settings"
            subtitle="Business profile, forecasting defaults, and interface preferences"
            icon={SlidersHorizontal}
            action={
              <Button type="submit" icon={Save} loading={saving} size="sm">
                Save settings
              </Button>
            }
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Business name"
                htmlFor="business-name"
                required
                hint="Displayed on the dashboard and reports."
              >
                <Input
                  id="business-name"
                  value={values.businessName || ''}
                  onChange={(event) => update('businessName', event.target.value)}
                  maxLength={80}
                />
              </Field>

              <Field
                label="Currency symbol"
                htmlFor="currency"
                hint="Used to display unit price and inventory value."
              >
                <Select
                  id="currency"
                  value={values.currency || '₱'}
                  onChange={(event) => update('currency', event.target.value)}
                >
                  {CURRENCIES.map((currency) => (
                    <option key={currency} value={currency}>
                      {currency}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field
                label="Default forecast history"
                htmlFor="forecast-period"
                hint="Initial historical window on the Forecasting page."
              >
                <Select
                  id="forecast-period"
                  value={values.forecastPeriodDays || 30}
                  onChange={(event) =>
                    update('forecastPeriodDays', Number(event.target.value))
                  }
                >
                  {PERIODS.map((period) => (
                    <option key={period} value={period}>
                      Last {period} days
                    </option>
                  ))}
                </Select>
              </Field>

              <Field
                label="Default forecast horizon"
                htmlFor="forecast-horizon"
                hint="Initial projection window on the Forecasting page."
              >
                <Select
                  id="forecast-horizon"
                  value={values.forecastHorizonDays || 30}
                  onChange={(event) =>
                    update('forecastHorizonDays', Number(event.target.value))
                  }
                >
                  {HORIZONS.map((horizon) => (
                    <option key={horizon} value={horizon}>
                      Next {horizon} days
                    </option>
                  ))}
                </Select>
              </Field>
            </div>

            <div className="mt-5 space-y-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
              <Toggle
                checked={Boolean(values.demoBanner)}
                onChange={(checked) => update('demoBanner', checked)}
                label="Show demonstration notice"
                description="Displays the demo badge in page headers. It does not affect functionality."
              />
              <Toggle
                checked={Boolean(values.compactTables)}
                onChange={(checked) => update('compactTables', checked)}
                label="Prefer compact tables"
                description="Stores a display preference for demonstration purposes. The prototype tables remain responsive."
              />
              <Toggle
                checked={Boolean(values.lowStockEmailAlerts)}
                onChange={(checked) => update('lowStockEmailAlerts', checked)}
                label="Low-stock email alerts (simulation)"
                description="This preference is stored only. The static prototype sends no email and contacts no external service."
              />
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <p className="flex items-center gap-1.5 text-[11px] text-slate-500">
                <CheckCircle2 size={13} className="text-emerald-500" />
                Changes are written to localStorage and the audit log.
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setValues(settings)}
                >
                  Reset form
                </Button>
                <Button type="submit" icon={Save} size="sm" loading={saving}>
                  Save settings
                </Button>
              </div>
            </div>
          </SectionCard>
        </form>

        <div className="space-y-4">
          <SectionCard
            title="Current session"
            subtitle="Demonstration identity"
            icon={UserCog}
          >
            <div className="space-y-3 text-[12px]">
              <div className="flex items-start justify-between gap-3">
                <span className="text-slate-500">Signed in as</span>
                <span className="text-right font-semibold text-slate-800">{user?.name}</span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <span className="text-slate-500">Role</span>
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-[10.5px] font-bold ring-1 ring-inset',
                    ROLES[user?.role]?.badge
                  )}
                >
                  {ROLES[user?.role]?.label || 'Unknown'}
                </span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <span className="text-slate-500">Email</span>
                <span className="break-all text-right font-medium text-slate-700">
                  {user?.email}
                </span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <span className="text-slate-500">Audit entries</span>
                <span className="font-semibold text-slate-800">{auditLogs.length}</span>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Storage details" subtitle="Where the demo data lives" icon={Database}>
            <div className="space-y-2.5 text-[11.5px]">
              <div className="flex items-start justify-between gap-2">
                <span className="text-slate-500">Storage key</span>
                <code className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-700">
                  stocksense-ai:state:v1
                </code>
              </div>
              <div className="flex items-start justify-between gap-2">
                <span className="text-slate-500">Persistence</span>
                <span className="font-semibold text-slate-700">Browser localStorage</span>
              </div>
              <div className="flex items-start justify-between gap-2">
                <span className="text-slate-500">Backend</span>
                <span className="font-semibold text-rose-600">None</span>
              </div>
              <div className="flex items-start justify-between gap-2">
                <span className="text-slate-500">Last audit entry</span>
                <span className="text-right font-medium text-slate-700">
                  {auditLogs[0] ? formatDateTime(auditLogs[0].timestamp) : '—'}
                </span>
              </div>
            </div>
          </SectionCard>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <SectionCard title="Demo accounts" subtitle="Public demonstration credentials" icon={UserCog}>
          <div className="space-y-2">
            {DEMO_ACCOUNTS.map((account) => (
              <div
                key={account.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2"
              >
                <div>
                  <p className="text-[12px] font-bold text-slate-800">{account.email}</p>
                  <p className="text-[10.5px] text-slate-500">{account.title}</p>
                </div>
                <code className="rounded bg-white px-2 py-1 text-[10.5px] font-semibold text-slate-600 ring-1 ring-slate-200">
                  {account.password}
                </code>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Prototype boundaries" subtitle="Settings cannot change these facts" icon={Lock}>
          <ul className="space-y-2 text-[11.5px] leading-relaxed text-slate-600">
            {[
              'No server authentication, database, or cloud AI service is connected.',
              'Role checks and settings are enforced only in the browser and can be bypassed by a technical user.',
              'Clearing site data deletes products, transactions, recommendations, audit logs, and settings.',
              'Low-stock email alerts are a stored preference only — no email is sent.',
              'Settings do not change stock balances; only validated stock-in and stock-out transactions do.',
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <Info size={12} className="mt-0.5 shrink-0 text-brand-500" />
                {item}
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>

      <Callout tone="warning" className="mt-4" title="Demo settings are local only" icon={Sparkles}>
        This Settings page demonstrates preference management, not production configuration. The
        business name and currency symbol immediately affect presentation across the app, but no
        external system is configured.
      </Callout>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <LinkButton href="/dashboard" variant="secondary" icon={Building2} size="sm">
          Back to dashboard
        </LinkButton>
        <LinkButton href="/security" variant="secondary" icon={Coins} size="sm">
          Security &amp; limits
        </LinkButton>
        <Link href="/demo-testing" className="text-[11.5px] font-semibold text-brand-700 hover:underline">
          Run the automated test center
        </Link>
        <span className="flex items-center gap-1 text-[10.5px] text-slate-400">
          <CalendarRange size={12} /> Settings are demonstration preferences
        </span>
      </div>
    </div>
  );
}
