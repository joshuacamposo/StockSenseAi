'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Boxes, LogOut, ShieldCheck, X } from 'lucide-react';
import { useApp } from '@/context/AppProvider';
import { NAV_SECTIONS } from './navConfig';
import { Avatar, cn } from '@/components/ui';
import { ROLES, normalizePath, roleLabel } from '@/lib/permissions';

export default function Sidebar({ open, onClose }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, canDo, alerts, pendingRecommendations, logout, settings } = useApp();
  const current = normalizePath(pathname);
  const roleMeta = user ? ROLES[user.role] : null;

  const badgeCount = {
    alerts: alerts.length,
    recommendations: pendingRecommendations.length,
  };

  const handleLogout = () => {
    logout();
    toast.success('Signed out. Demo data remains saved in this browser.');
    router.replace('/login');
  };

  return (
    <>
      <div
        className={cn(
          'fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm transition-opacity lg:hidden',
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-[272px] flex-col bg-ink-950 text-white transition-transform duration-300 lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
        aria-label="Primary navigation"
      >
        <div className="flex items-center justify-between gap-2 px-4 pb-4 pt-5">
          <Link href="/dashboard" className="flex items-center gap-3" onClick={onClose}>
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-700 shadow-lg shadow-brand-900/40">
              <Boxes size={20} strokeWidth={2.2} />
            </span>
            <span>
              <span className="block text-[15px] font-extrabold leading-tight tracking-tight">
                StockSense <span className="text-brand-300">AI</span>
              </span>
              <span className="block text-[10.5px] font-medium uppercase tracking-[0.16em] text-slate-400">
                Inventory Automation
              </span>
            </span>
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-white lg:hidden"
            aria-label="Close navigation"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mx-4 mb-4 flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2">
          <span className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-slate-400">
            Demo workspace
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/10 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            LOCAL
          </span>
        </div>

        <nav className="flex-1 space-y-5 overflow-y-auto scroll-thin px-3 pb-4">
          {NAV_SECTIONS.map((section) => {
            const items = section.items.filter((item) => canDo(item.permission));
            if (items.length === 0) return null;
            return (
              <div key={section.label}>
                <p className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                  {section.label}
                </p>
                <div className="space-y-0.5">
                  {items.map((item) => {
                    const active = current === item.href;
                    const count = item.badge ? badgeCount[item.badge] : 0;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={onClose}
                        data-tour={item.tour}
                        className={cn('nav-link group', active && 'nav-link-active')}
                        aria-current={active ? 'page' : undefined}
                      >
                        <item.icon
                          size={17}
                          className={cn(
                            'shrink-0',
                            active ? 'text-white' : 'text-slate-400 group-hover:text-white'
                          )}
                        />
                        <span className="flex-1 leading-snug">{item.label}</span>
                        {count > 0 ? (
                          <span
                            className={cn(
                              'min-w-[20px] rounded-full px-1.5 py-0.5 text-center text-[10px] font-bold',
                              active
                                ? 'bg-white/20 text-white'
                                : item.badge === 'alerts'
                                  ? 'bg-rose-500/20 text-rose-300'
                                  : 'bg-amber-400/20 text-amber-300'
                            )}
                          >
                            {count}
                          </span>
                        ) : null}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        <div className="space-y-3 border-t border-white/10 p-3">
          <div className="rounded-xl border border-white/10 bg-gradient-to-br from-white/10 to-white/0 p-3">
            <div className="flex items-center gap-2 text-[11px] font-bold text-brand-200">
              <ShieldCheck size={14} />
              Interactive academic prototype
            </div>
            <p className="mt-1 text-[10.5px] leading-relaxed text-slate-400">
              {settings.businessName} · SA101 Prefinal Defense. Data is stored only in this browser.
            </p>
          </div>

          {user ? (
            <div className="flex items-center gap-2.5 rounded-xl bg-white/5 p-2.5">
              <Avatar
                name={user.name}
                initials={user.initials}
                color={user.color}
                size="sm"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12.5px] font-semibold text-white">{user.name}</p>
                <p className="truncate text-[10.5px] text-slate-400">
                  {roleMeta?.label || roleLabel(user.role)}
                </p>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition hover:bg-rose-500/20 hover:text-rose-300"
                title="Sign out"
                aria-label="Sign out"
              >
                <LogOut size={15} />
              </button>
            </div>
          ) : null}
        </div>
      </aside>
    </>
  );
}
