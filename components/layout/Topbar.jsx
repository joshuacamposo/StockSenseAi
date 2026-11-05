'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  Bell,
  CalendarDays,
  ChevronDown,
  LogOut,
  Menu,
  ShieldCheck,
  Sparkles,
  FlaskConical,
  UserRound,
} from 'lucide-react';
import { useApp } from '@/context/AppProvider';
import { Avatar, Badge, cn } from '@/components/ui';
import { flattenNav } from './navConfig';
import { ROLES, normalizePath } from '@/lib/permissions';
import { formatLongDate } from '@/lib/format';

export default function Topbar({ onMenu }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, alerts, pendingRecommendations, logout, settings } = useApp();
  const [menuOpen, setMenuOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const menuRef = useRef(null);
  const bellRef = useRef(null);
  const current = normalizePath(pathname);
  const activeItem = flattenNav().find((item) => item.href === current);
  const roleMeta = user ? ROLES[user.role] : null;

  useEffect(() => {
    const handleClick = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setMenuOpen(false);
      if (bellRef.current && !bellRef.current.contains(event.target)) setBellOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setBellOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    logout();
    toast.success('Signed out. Demo data remains saved in this browser.');
    router.replace('/login');
  };

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/85 backdrop-blur-md">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onMenu}
          className="grid h-9 w-9 place-items-center rounded-lg text-slate-600 transition hover:bg-slate-100 lg:hidden"
          aria-label="Open navigation"
        >
          <Menu size={20} />
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-[11px] font-medium text-slate-400">
            <span className="hidden sm:inline">{settings.businessName}</span>
            <span className="hidden sm:inline">/</span>
            <span className="truncate text-slate-500">Demo workspace</span>
          </div>
          <h1 className="truncate text-[15px] font-bold leading-tight text-slate-900">
            {activeItem?.label || 'Workspace'}
          </h1>
        </div>

        <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-semibold text-slate-500 xl:flex">
          <CalendarDays size={13} />
          {formatLongDate()}
        </div>

        <span className="hidden items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wide text-amber-700 ring-1 ring-inset ring-amber-200 sm:inline-flex">
          <Sparkles size={12} />
          Prototype
        </span>

        <div ref={bellRef} className="relative">
          <button
            type="button"
            data-tour="notifications-bell"
            onClick={() => setBellOpen((value) => !value)}
            className="relative grid h-9 w-9 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
            aria-label="Notifications"
          >
            <Bell size={18} />
            {alerts.length > 0 ? (
              <span className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white">
                {alerts.length}
              </span>
            ) : null}
          </button>
          {bellOpen ? (
            <div className="absolute right-0 mt-2 w-80 animate-pop-in overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                <p className="text-sm font-bold text-slate-900">Stock alerts</p>
                <Badge tone={alerts.length ? 'rose' : 'emerald'}>
                  {alerts.length ? `${alerts.length} active` : 'All clear'}
                </Badge>
              </div>
              <div className="max-h-72 overflow-y-auto scroll-thin">
                {alerts.length === 0 ? (
                  <p className="px-4 py-6 text-center text-xs text-slate-500">
                    No low-stock or out-of-stock products.
                  </p>
                ) : (
                  alerts.slice(0, 5).map((alert) => (
                    <Link
                      key={alert.id}
                      href="/alerts"
                      className="block border-b border-slate-100 px-4 py-2.5 last:border-b-0 hover:bg-slate-50"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold text-slate-800">{alert.name}</p>
                        <Badge tone={alert.severity === 'out' ? 'rose' : 'amber'}>
                          {alert.severity === 'out' ? 'Out' : 'Low'}
                        </Badge>
                      </div>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        {alert.stock} units · reorder at {alert.reorderLevel}
                      </p>
                    </Link>
                  ))
                )}
              </div>
              <Link
                href="/alerts"
                className="block bg-slate-50 px-4 py-2.5 text-center text-xs font-semibold text-brand-700 hover:bg-slate-100"
              >
                View all alerts
              </Link>
            </div>
          ) : null}
        </div>

        <div ref={menuRef} className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((value) => !value)}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white py-1 pl-1 pr-2 text-left shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
            aria-label="Account menu"
            aria-expanded={menuOpen}
          >
            <Avatar name={user?.name} initials={user?.initials} color={user?.color} size="sm" />
            <span className="hidden min-w-0 sm:block">
              <span className="block max-w-[130px] truncate text-[12px] font-bold text-slate-800">
                {user?.name}
              </span>
              <span className="block text-[10px] font-medium text-slate-500">
                {roleMeta?.label}
              </span>
            </span>
            <ChevronDown size={14} className="text-slate-400" />
          </button>

          {menuOpen ? (
            <div className="absolute right-0 mt-2 w-72 animate-pop-in overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
              <div className="flex items-center gap-3 border-b border-slate-100 p-4">
                <Avatar name={user?.name} initials={user?.initials} color={user?.color} size="lg" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-slate-900">{user?.name}</p>
                  <p className="truncate text-[11px] text-slate-500">{user?.email}</p>
                  <span
                    className={cn(
                      'mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ring-inset',
                      roleMeta?.badge
                    )}
                  >
                    {roleMeta?.label}
                  </span>
                </div>
              </div>
              <div className="p-1.5">
                <Link
                  href="/security"
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                >
                  <ShieldCheck size={15} /> Security & limitations
                </Link>
                <Link
                  href="/demo-testing"
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                >
                  <FlaskConical size={15} /> Demo & testing center
                </Link>
                <Link
                  href="/settings"
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                >
                  <UserRound size={15} /> Profile & settings
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="mt-1 flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-rose-600 hover:bg-rose-50"
                >
                  <LogOut size={15} /> Sign out
                </button>
              </div>
              <div className="border-t border-slate-100 bg-slate-50 px-4 py-2">
                <p className="text-[10px] leading-relaxed text-slate-500">
                  {pendingRecommendations.length > 0
                    ? `${pendingRecommendations.length} reorder recommendation(s) awaiting review.`
                    : 'No pending reorder recommendations.'}
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
