'use client';

import { useMemo, useState } from 'react';
import {
  Activity,
  ArrowRight,
  Clock3,
  FileClock,
  Info,
  Search,
  ShieldAlert,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import { useApp } from '@/context/AppProvider';
import {
  Badge,
  Callout,
  DemoNote,
  EmptyState,
  PageHeader,
  SearchInput,
  SectionCard,
  StatCard,
  Tabs,
  cn,
} from '@/components/ui';
import { formatDateTime, formatNumber } from '@/lib/format';
import { ROLES } from '@/lib/permissions';

const ACTION_TABS = [
  { key: 'all', label: 'All events' },
  { key: 'stocks', label: 'Stock movements' },
  { key: 'products', label: 'Products' },
  { key: 'decisions', label: 'Decisions' },
  { key: 'accounts', label: 'Accounts' },
];

function actionTone(action = '') {
  if (/reject/i.test(action)) return 'rose';
  if (/stock-out|deactivat|delete/i.test(action)) return 'amber';
  if (/stock-in|approv|creat|reactivat/i.test(action)) return 'emerald';
  if (/login|logout|settings|reset/i.test(action)) return 'brand';
  return 'slate';
}

function matchesCategory(action, category) {
  if (category === 'all') return true;
  if (category === 'stocks') return /stock/i.test(action);
  if (category === 'products') return /product|supplier/i.test(action);
  if (category === 'decisions') return /reorder|recommendation|approv|reject/i.test(action);
  if (category === 'accounts') return /login|logout|settings|demo/i.test(action);
  return true;
}

export default function AuditLogsPage() {
  const { auditLogs, settings } = useApp();
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return auditLogs
      .filter((entry) => matchesCategory(entry.action, category))
      .filter((entry) => {
        if (!query) return true;
        return [
          entry.action,
          entry.entity,
          entry.description,
          entry.userName,
          entry.role,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query));
      })
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }, [auditLogs, category, search]);

  const uniqueUsers = new Set(auditLogs.map((entry) => entry.userName)).size;
  const latest = [...auditLogs].sort(
    (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
  )[0];

  return (
    <div data-tour="audit-navigation">
      <PageHeader
        title="Audit Logs"
        eyebrow="Administrator only"
        icon={FileClock}
        subtitle={`${formatNumber(auditLogs.length)} demonstration events recorded for ${settings.businessName}. These records are simulated locally and are not tamper-proof security logs.`}
        badges={
          <>
            <DemoNote />
            <Badge tone="brand">Admin</Badge>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          label="Recorded events"
          value={formatNumber(auditLogs.length)}
          hint="Stored in this browser only"
          icon={FileClock}
          tone="brand"
        />
        <StatCard
          label="Visible events"
          value={formatNumber(filtered.length)}
          hint="Matching the current filters"
          icon={Activity}
          tone="violet"
        />
        <StatCard
          label="Distinct actors"
          value={formatNumber(uniqueUsers)}
          hint="People and system processes"
          icon={UserRound}
          tone="emerald"
        />
        <StatCard
          label="Latest event"
          value={latest ? 'Recorded' : 'None'}
          hint={latest ? formatDateTime(latest.timestamp) : 'No audit entries yet'}
          icon={Clock3}
          tone="amber"
        />
      </div>

      <div className="mt-4 flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs tabs={ACTION_TABS} active={category} onChange={setCategory} />
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search action, user, entity, or description…"
          className="w-full sm:w-80"
        />
      </div>

      <div className="mt-4">
        <SectionCard
          title="Event log"
          subtitle="Newest first · every state-changing action is recorded after it succeeds"
          icon={FileClock}
          bodyClassName="px-0 pb-0"
        >
          {filtered.length === 0 ? (
            <EmptyState
              icon={Search}
              title="No audit entries match"
              message="Try a different category or search term. New events appear here after you use the app."
              className="py-12"
            />
          ) : (
            <div className="table-wrap" data-tour="audit-table">
              <table className="data-table min-w-[980px]">
                <thead>
                  <tr>
                    <th>Date &amp; time</th>
                    <th>Actor</th>
                    <th>Action</th>
                    <th>Entity</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.slice(0, 400).map((entry) => {
                    const role = ROLES[entry.role];
                    return (
                      <tr key={entry.id}>
                        <td className="whitespace-nowrap text-[11.5px] text-slate-500">
                          {formatDateTime(entry.timestamp)}
                        </td>
                        <td>
                          <p className="text-[12px] font-semibold text-slate-700">
                            {entry.userName}
                          </p>
                          <p
                            className={cn(
                              'mt-0.5 inline-flex rounded-full px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wide ring-1 ring-inset',
                              role?.badge || 'bg-slate-100 text-slate-600 ring-slate-200'
                            )}
                          >
                            {role?.label || entry.role || 'system'}
                          </p>
                        </td>
                        <td>
                          <Badge tone={actionTone(entry.action)}>{entry.action}</Badge>
                        </td>
                        <td className="text-[11.5px] font-semibold text-slate-600">
                          {entry.entity || '—'}
                        </td>
                        <td className="max-w-[420px] text-[11.5px] leading-relaxed text-slate-500">
                          {entry.description || '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      </div>

      <Callout tone="warning" className="mt-4" title="Not a security-grade audit trail" icon={ShieldAlert}>
        Audit entries are ordinary localStorage records written by the client. Anyone with access to
        the browser profile can read or modify them, and clearing site data deletes them. A production
        system would store append-only, server-side audit logs with access controls and retention
        policies.
      </Callout>

      <p className="mt-3 flex items-center gap-1.5 text-[10.5px] text-slate-400">
        <ShieldCheck size={12} />
        Only the Administrator role can open this page. Role checks are demonstration controls, not
        a server-side security boundary.
        <ArrowRight size={12} />
        <Info size={12} />
      </p>
    </div>
  );
}
