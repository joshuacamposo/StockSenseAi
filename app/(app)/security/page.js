'use client';

import {
  AlertTriangle,
  Check,
  CircleSlash,
  Database,
  Eye,
  FileLock2,
  Fingerprint,
  KeyRound,
  LockKeyhole,
  ShieldCheck,
  ShieldX,
  UserRound,
  WifiOff,
} from 'lucide-react';
import { useApp } from '@/context/AppProvider';
import {
  Badge,
  Callout,
  DemoNote,
  PageHeader,
  SectionCard,
  StatCard,
  cn,
} from '@/components/ui';
import {
  PERMISSIONS,
  PERMISSION_LABELS,
  ROLES,
  grantedPermissions,
} from '@/lib/permissions';

const LIMITATIONS = [
  {
    title: 'Simulated authentication',
    body: 'Login compares hardcoded public demo credentials in the browser. There is no password hashing, session token, cookie, OAuth, or server verification.',
    icon: KeyRound,
  },
  {
    title: 'Client-side role checks',
    body: 'Buttons, routes, and assistant actions call the same permission matrix, but the matrix ships to the browser and can be bypassed by a technical user.',
    icon: ShieldX,
  },
  {
    title: 'localStorage persistence',
    body: 'Products, transactions, recommendations, settings, audit logs, and the chat history live in this browser profile. Another browser or device sees different data.',
    icon: Database,
  },
  {
    title: 'No multi-user synchronization',
    body: 'Two people using the demo at the same time do not share inventory. There is no server, database, conflict resolution, or real-time update channel.',
    icon: WifiOff,
  },
  {
    title: 'Mutable audit records',
    body: 'Audit logs are ordinary JSON records written by the client. They are not append-only, cryptographically signed, or stored on a trusted server.',
    icon: FileLock2,
  },
  {
    title: 'No production backups',
    body: 'Clearing site data, using private browsing, or switching browsers removes the demonstration state. There is no backup, export history, or recovery workflow.',
    icon: AlertTriangle,
  },
  {
    title: 'Rule-based “AI” assistant',
    body: 'The assistant classifies keywords and templates responses. It is not a large language model, does not call a cloud AI API, and may misunderstand unusual phrasing.',
    icon: Fingerprint,
  },
  {
    title: 'Statistical, not ML, forecasting',
    body: 'Forecasting is a historical moving average over recorded stock-outs. There is no trained model, feature pipeline, confidence score, or production accuracy claim.',
    icon: WifiOff,
  },
];

export default function SecurityPage() {
  const { user } = useApp();
  const roleKeys = Object.keys(ROLES);
  const permissionKeys = Object.keys(PERMISSIONS);

  return (
    <div>
      <PageHeader
        title="Security &amp; Limits"
        eyebrow="Roles, permissions, and honest boundaries"
        icon={ShieldCheck}
        subtitle="StockSense AI demonstrates role-based access control as an academic prototype. The controls are centralized and consistently applied, but they are not a production security boundary."
        badges={
          <>
            <DemoNote />
            <Badge tone="rose">Not production security</Badge>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          label="Demo roles"
          value={roleKeys.length}
          hint="One centralized permission matrix"
          icon={UserRound}
          tone="brand"
        />
        <StatCard
          label="Permission rules"
          value={permissionKeys.length}
          hint="Checked by UI, routes, and assistant"
          icon={LockKeyhole}
          tone="violet"
        />
        <StatCard
          label="Your role"
          value={ROLES[user?.role]?.label || 'Unknown'}
          hint={`${grantedPermissions(user?.role).length} granted permissions`}
          icon={Eye}
          tone="emerald"
        />
        <StatCard
          label="Server trust"
          value="None"
          hint="Everything runs in this browser"
          icon={CircleSlash}
          tone="rose"
        />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {roleKeys.map((key) => {
          const role = ROLES[key];
          const isCurrent = user?.role === key;
          return (
            <div
              key={key}
              className={cn(
                'rounded-xl border bg-white p-3.5 shadow-sm',
                isCurrent ? 'border-brand-300 ring-2 ring-brand-100' : 'border-slate-200'
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10.5px] font-bold ring-1 ring-inset',
                    role.badge
                  )}
                >
                  <span className={cn('h-1.5 w-1.5 rounded-full', role.dot)} />
                  {role.label}
                </span>
                {isCurrent ? <Badge tone="brand">You</Badge> : null}
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-slate-500">{role.description}</p>
              <p className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                {grantedPermissions(key).length} permissions
              </p>
            </div>
          );
        })}
      </div>

      <div className="mt-4" data-tour="security-rbac">
        <SectionCard
          title="Role-based access control matrix"
          subtitle="Every state-changing action and protected route checks this same table"
          icon={ShieldCheck}
          bodyClassName="px-0 pb-0"
        >
          <div className="table-wrap">
            <table className="data-table min-w-[760px]">
              <thead>
                <tr>
                  <th className="sticky left-0 bg-slate-50">Permission</th>
                  {roleKeys.map((key) => (
                    <th key={key} className="text-center">
                      <span className={cn(user?.role === key ? 'text-brand-700' : 'text-slate-500')}>
                        {ROLES[key].label}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {permissionKeys.map((permission) => (
                  <tr key={permission}>
                    <td className="sticky left-0 bg-white">
                      <p className="text-[12px] font-semibold text-slate-700">
                        {PERMISSION_LABELS[permission] || permission}
                      </p>
                      <code className="text-[10px] text-slate-400">{permission}</code>
                    </td>
                    {roleKeys.map((role) => {
                      const allowed = PERMISSIONS[permission].includes(role);
                      return (
                        <td key={role} className="text-center">
                          {allowed ? (
                            <span className="inline-grid h-6 w-6 place-items-center rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200">
                              <Check size={13} />
                              <span className="sr-only">Allowed</span>
                            </span>
                          ) : (
                            <span className="inline-grid h-6 w-6 place-items-center rounded-full bg-slate-50 text-slate-300 ring-1 ring-slate-200">
                              <CircleSlash size={13} />
                              <span className="sr-only">Denied</span>
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      </div>

      <div className="mt-4" data-tour="security-limits">
        <SectionCard
          title="Prototype limitations"
          subtitle="What this system does not provide"
          icon={AlertTriangle}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {LIMITATIONS.map((item) => (
              <div
                key={item.title}
                className="flex items-start gap-2.5 rounded-xl border border-rose-100 bg-rose-50/50 p-3"
              >
                <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white text-rose-500 ring-1 ring-rose-100">
                  <item.icon size={15} />
                </span>
                <div>
                  <p className="text-[12px] font-bold text-slate-800">{item.title}</p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500">{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <SectionCard
          title="What is enforced consistently"
          subtitle="Demonstration controls that really work inside the prototype"
          icon={ShieldCheck}
        >
          <ul className="space-y-2 text-[11.5px] leading-relaxed text-slate-600">
            {[
              'Every state-changing AppProvider action checks a centralized permission before it runs.',
              'Protected routes are guarded by the same permission matrix, and the sidebar hides inaccessible pages.',
              'The chatbot and guided walkthrough engine check the same permissions before offering navigation or a tour.',
              'Approval records a decision only; it never adds stock. Stock changes only through validated transactions.',
              'Duplicate SKUs, invalid quantities, over-issue stock-outs, and assigned-supplier deletion are rejected.',
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <Check size={12} className="mt-0.5 shrink-0 text-emerald-500" />
                {item}
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard
          title="What production would require"
          subtitle="Out of scope for this static academic prototype"
          icon={LockKeyhole}
        >
          <ul className="space-y-2 text-[11.5px] leading-relaxed text-slate-600">
            {[
              'Server-side authentication with hashed passwords, secure sessions, and password reset.',
              'A relational database with transactions, constraints, and server-enforced authorization.',
              'Append-only audit logging with retention, monitoring, and tamper detection.',
              'Multi-user concurrency control, conflict resolution, and real-time updates.',
              'Scheduled backups, disaster recovery, and data export/import workflows.',
              'A genuine forecasting pipeline with validation, measurable accuracy, and monitoring.',
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <CircleSlash size={12} className="mt-0.5 shrink-0 text-rose-400" />
                {item}
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>

      <Callout tone="warning" className="mt-4" title="Do not use real business data" icon={AlertTriangle}>
        This prototype is for academic demonstration only. Passwords are public, data is stored in the
        browser, and a technical user can modify state. Do not enter real supplier contacts, prices,
        credentials, or other confidential business information.
      </Callout>
    </div>
  );
}
