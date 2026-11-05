'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  CheckCircle2,
  Inbox,
  Info,
  Loader2,
  Search,
  ShieldAlert,
  X,
} from 'lucide-react';
import { getStockStatus, STOCK_STATUS } from '@/lib/inventoryRules';

export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

/* ------------------------------------------------------------------ */
/* Buttons                                                             */
/* ------------------------------------------------------------------ */

const BUTTON_VARIANTS = {
  primary:
    'bg-brand-600 text-white shadow-sm hover:bg-brand-700 focus-visible:ring-brand-500 disabled:bg-brand-300',
  secondary:
    'border border-slate-300 bg-white text-slate-700 shadow-sm hover:bg-slate-50 hover:text-slate-900 focus-visible:ring-slate-300 disabled:text-slate-400',
  success:
    'bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 focus-visible:ring-emerald-500 disabled:bg-emerald-300',
  danger:
    'bg-rose-600 text-white shadow-sm hover:bg-rose-700 focus-visible:ring-rose-500 disabled:bg-rose-300',
  ghost:
    'text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-slate-300',
  subtle:
    'bg-brand-50 text-brand-700 hover:bg-brand-100 focus-visible:ring-brand-300 disabled:text-brand-300',
  dark: 'bg-ink-900 text-white hover:bg-ink-800 focus-visible:ring-ink-700',
};

const BUTTON_SIZES = {
  xs: 'h-8 px-2.5 text-xs gap-1.5 rounded-lg',
  sm: 'h-9 px-3 text-[13px] gap-1.5 rounded-lg',
  md: 'h-10 px-4 text-sm gap-2 rounded-xl',
  lg: 'h-11 px-5 text-sm gap-2 rounded-xl',
};

export function buttonStyles(variant = 'primary', size = 'md', className = '') {
  return cn(
    'inline-flex items-center justify-center font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed',
    BUTTON_VARIANTS[variant] || BUTTON_VARIANTS.primary,
    BUTTON_SIZES[size] || BUTTON_SIZES.md,
    className
  );
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  loading = false,
  icon: Icon,
  iconRight: IconRight,
  type = 'button',
  ...props
}) {
  return (
    <button
      type={type}
      className={buttonStyles(variant, size, className)}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : Icon ? <Icon size={16} /> : null}
      {children}
      {IconRight ? <IconRight size={16} /> : null}
    </button>
  );
}

export function LinkButton({
  href,
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  icon: Icon,
  ...props
}) {
  return (
    <Link href={href} className={buttonStyles(variant, size, className)} {...props}>
      {Icon ? <Icon size={16} /> : null}
      {children}
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/* Badges + status                                                     */
/* ------------------------------------------------------------------ */

const BADGE_TONES = {
  slate: 'bg-slate-100 text-slate-700 ring-slate-200',
  brand: 'bg-brand-50 text-brand-700 ring-brand-200',
  emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  amber: 'bg-amber-50 text-amber-700 ring-amber-200',
  rose: 'bg-rose-50 text-rose-700 ring-rose-200',
  violet: 'bg-violet-50 text-violet-700 ring-violet-200',
};

export function Badge({ children, tone = 'slate', className = '', dot = false }) {
  const dotColor =
    tone === 'rose'
      ? 'bg-rose-500'
      : tone === 'amber'
        ? 'bg-amber-500'
        : tone === 'emerald'
          ? 'bg-emerald-500'
          : tone === 'brand'
            ? 'bg-brand-500'
            : tone === 'violet'
              ? 'bg-violet-500'
              : 'bg-slate-400';
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset',
        BADGE_TONES[tone] || BADGE_TONES.slate,
        className
      )}
    >
      {dot ? <span className={cn('h-1.5 w-1.5 rounded-full', dotColor)} /> : null}
      {children}
    </span>
  );
}

export function StatusBadge({ product, showDot = true, className = '' }) {
  const status = getStockStatus(product);
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset',
        status.badge,
        className
      )}
    >
      {showDot ? <span className={cn('h-1.5 w-1.5 rounded-full', status.dot)} /> : null}
      {status.label}
    </span>
  );
}

export function SeverityBadge({ severity, className = '' }) {
  const status = STOCK_STATUS[severity] || STOCK_STATUS.low;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset',
        status.badge,
        className
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', status.dot)} />
      {status.label}
    </span>
  );
}

export function DemoNote({ className = '' }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600',
        className
      )}
    >
      <Info size={12} />
      Demonstration data
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Layout containers                                                   */
/* ------------------------------------------------------------------ */

export function PageHeader({ title, subtitle, eyebrow, actions, badges, icon: Icon }) {
  return (
    <div
      className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
      data-tour="page-header"
    >
      <div className="flex items-start gap-3">
        {Icon ? (
          <span className="mt-0.5 hidden h-11 w-11 shrink-0 place-items-center rounded-2xl bg-brand-600/10 text-brand-700 sm:grid">
            <Icon size={22} />
          </span>
        ) : null}
        <div>
          {eyebrow ? (
            <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.14em] text-brand-600">
              {eyebrow}
            </p>
          ) : null}
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-[26px] font-extrabold leading-tight tracking-tight text-slate-900 sm:text-[28px]">
              {title}
            </h1>
            {badges}
          </div>
          {subtitle ? (
            <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-slate-500">{subtitle}</p>
          ) : null}
        </div>
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function SectionCard({
  title,
  subtitle,
  action,
  children,
  className = '',
  bodyClassName = 'p-5',
  icon: Icon,
}) {
  return (
    <section className={cn('card overflow-hidden', className)}>
      {title ? (
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div className="flex items-start gap-2.5">
            {Icon ? (
              <span className="mt-0.5 grid h-8 w-8 place-items-center rounded-lg bg-slate-100 text-slate-600">
                <Icon size={16} />
              </span>
            ) : null}
            <div>
              <h2 className="text-[15px] font-bold text-slate-900">{title}</h2>
              {subtitle ? <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p> : null}
            </div>
          </div>
          {action ? <div className="flex flex-wrap items-center gap-2">{action}</div> : null}
        </div>
      ) : null}
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}

const STAT_TONES = {
  brand: 'bg-brand-50 text-brand-600',
  emerald: 'bg-emerald-50 text-emerald-600',
  amber: 'bg-amber-50 text-amber-600',
  rose: 'bg-rose-50 text-rose-600',
  violet: 'bg-violet-50 text-violet-600',
  slate: 'bg-slate-100 text-slate-600',
};

export function StatCard({ label, value, hint, icon: Icon, tone = 'brand', onClick }) {
  const content = (
    <div className="flex h-full items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-[11.5px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
        <p className="mt-2 text-[26px] font-extrabold leading-none tracking-tight text-slate-900">
          {value}
        </p>
        {hint ? <p className="mt-1.5 truncate text-[11.5px] text-slate-500">{hint}</p> : null}
      </div>
      {Icon ? (
        <span
          className={cn(
            'grid h-10 w-10 shrink-0 place-items-center rounded-xl',
            STAT_TONES[tone] || STAT_TONES.brand
          )}
        >
          <Icon size={18} />
        </span>
      ) : null}
    </div>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="card p-4 text-left transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md sm:p-5"
      >
        {content}
      </button>
    );
  }

  return <div className="card p-4 sm:p-5">{content}</div>;
}

export function Avatar({ name, initials: initialsProp, color = 'bg-brand-600', size = 'md' }) {
  const sizes = {
    sm: 'h-8 w-8 text-[11px]',
    md: 'h-9 w-9 text-xs',
    lg: 'h-11 w-11 text-sm',
  };
  const letters =
    initialsProp ||
    (name || '?')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('');
  return (
    <span
      className={cn(
        'inline-grid shrink-0 place-items-center rounded-full font-bold text-white ring-2 ring-white/20',
        sizes[size],
        color
      )}
    >
      {letters || '?'}
    </span>
  );
}

export function ProgressBar({ value = 0, tone = 'emerald', className = '' }) {
  const tones = {
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    rose: 'bg-rose-500',
    brand: 'bg-brand-500',
  };
  return (
    <div className={cn('h-2 w-full overflow-hidden rounded-full bg-slate-100', className)}>
      <div
        className={cn('h-full rounded-full transition-all duration-500', tones[tone] || tones.brand)}
        style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Form controls                                                       */
/* ------------------------------------------------------------------ */

export function Field({ label, htmlFor, error, hint, required, children, className = '' }) {
  return (
    <div className={className}>
      {label ? (
        <label htmlFor={htmlFor} className="field-label">
          {label}
          {required ? <span className="ml-0.5 text-rose-500">*</span> : null}
        </label>
      ) : null}
      {children}
      {error ? <p className="field-error">{error}</p> : null}
      {!error && hint ? <p className="field-hint">{hint}</p> : null}
    </div>
  );
}

export function Input({ className = '', invalid = false, ...props }) {
  return (
    <input
      className={cn('field-input', invalid && 'border-rose-400 focus:border-rose-500', className)}
      {...props}
    />
  );
}

export function Select({ className = '', invalid = false, children, ...props }) {
  return (
    <select
      className={cn('field-input pr-8', invalid && 'border-rose-400 focus:border-rose-500', className)}
      {...props}
    >
      {children}
    </select>
  );
}

export function Textarea({ className = '', invalid = false, ...props }) {
  return (
    <textarea
      className={cn('field-input min-h-[84px] resize-y', invalid && 'border-rose-400', className)}
      {...props}
    />
  );
}

export function SearchInput({ value, onChange, placeholder = 'Search…', className = '', ...props }) {
  return (
    <div className={cn('relative', className)}>
      <Search
        size={16}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
      />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="field-input pl-9"
        {...props}
      />
    </div>
  );
}

export function Toggle({ checked, onChange, label, description, disabled }) {
  return (
    <label className={cn('flex cursor-pointer items-start justify-between gap-4', disabled && 'cursor-not-allowed opacity-60')}>
      <span>
        <span className="block text-sm font-semibold text-slate-800">{label}</span>
        {description ? <span className="mt-0.5 block text-xs text-slate-500">{description}</span> : null}
      </span>
      <span
        className={cn(
          'relative mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full transition',
          checked ? 'bg-brand-600' : 'bg-slate-300'
        )}
      >
        <input
          type="checkbox"
          className="sr-only"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          disabled={disabled}
        />
        <span
          className="inline-block rounded-full bg-white shadow transition-transform"
          style={{ height: 18, width: 18, transform: checked ? 'translateX(22px)' : 'translateX(4px)' }}
        />
      </span>
    </label>
  );
}

/* ------------------------------------------------------------------ */
/* Tabs                                                                */
/* ------------------------------------------------------------------ */

export function Tabs({ tabs, active, onChange, className = '' }) {
  return (
    <div className={cn('flex flex-wrap gap-1.5 rounded-xl bg-slate-100 p-1', className)}>
      {tabs.map((tab) => {
        const isActive = tab.key === active;
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[12.5px] font-semibold transition',
              isActive
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            )}
          >
            {tab.icon ? <tab.icon size={14} /> : null}
            {tab.label}
            {typeof tab.count === 'number' ? (
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.5 text-[10px] font-bold',
                  isActive ? 'bg-brand-50 text-brand-700' : 'bg-slate-200 text-slate-600'
                )}
              >
                {tab.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Modal + confirm                                                     */
/* ------------------------------------------------------------------ */

const MODAL_SIZES = {
  sm: 'sm:max-w-md',
  md: 'sm:max-w-lg',
  lg: 'sm:max-w-2xl',
  xl: 'sm:max-w-4xl',
};

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  icon: Icon,
  bodyClassName = 'px-5 py-5 sm:px-6',
}) {
  useEffect(() => {
    if (!open) return undefined;
    const handleKey = (event) => {
      if (event.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', handleKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-4">
      <div
        className="absolute inset-0 animate-fade-in bg-slate-950/55 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : 'Dialog'}
        className={cn(
          'relative z-10 flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl animate-pop-in sm:rounded-2xl',
          MODAL_SIZES[size] || MODAL_SIZES.md
        )}
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
          <div className="flex items-start gap-3">
            {Icon ? (
              <span className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
                <Icon size={18} />
              </span>
            ) : null}
            <div>
              <h2 className="text-base font-bold text-slate-900">{title}</h2>
              {description ? (
                <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{description}</p>
              ) : null}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>
        <div className={cn('overflow-y-auto scroll-thin', bodyClassName)}>{children}</div>
        {footer ? (
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/80 px-5 py-3.5 sm:px-6">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'primary',
  loading = false,
  icon = AlertTriangle,
  children,
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      icon={icon}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant={tone === 'danger' ? 'danger' : tone === 'success' ? 'success' : 'primary'}
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="text-sm leading-relaxed text-slate-600">
        {message ? <p>{message}</p> : null}
        {children}
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* Empty / access denied / spinner                                     */
/* ------------------------------------------------------------------ */

export function EmptyState({ icon: Icon = Inbox, title = 'Nothing here yet', message, action, className = '' }) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 py-12 text-center', className)}>
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-400">
        <Icon size={22} />
      </span>
      <h3 className="mt-3 text-sm font-bold text-slate-800">{title}</h3>
      {message ? <p className="mt-1 max-w-sm text-xs leading-relaxed text-slate-500">{message}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function AccessDeniedState({ message }) {
  return (
    <div className="card mx-auto mt-10 max-w-xl p-8 text-center">
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-rose-50 text-rose-500">
        <ShieldAlert size={26} />
      </span>
      <h1 className="mt-4 text-xl font-extrabold text-slate-900">Access Denied</h1>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">
        {message ||
          'Access Denied — Your demo role does not have permission to perform this action.'}
      </p>
      <p className="mt-3 rounded-xl bg-slate-50 p-3 text-xs leading-relaxed text-slate-500">
        Role permissions in StockSense AI are client-side demonstration controls. They show how a
        production system would enforce authorization, but they are not a security boundary.
      </p>
      <LinkButton href="/dashboard" variant="secondary" className="mt-5">
        Return to dashboard
      </LinkButton>
    </div>
  );
}

export function FullScreenLoader({ label = 'Loading demonstration workspace…' }) {
  return (
    <div className="grid min-h-screen place-items-center bg-slate-50">
      <div className="flex flex-col items-center gap-3">
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-ink-900 text-white">
          <Loader2 size={24} className="animate-spin" />
        </span>
        <p className="text-sm font-medium text-slate-500">{label}</p>
      </div>
    </div>
  );
}

export function Callout({ tone = 'info', title, children, icon: Icon, className = '' }) {
  const tones = {
    info: {
      wrap: 'border-brand-200 bg-brand-50/70 text-brand-900',
      icon: 'text-brand-600',
      defaultIcon: Info,
    },
    success: {
      wrap: 'border-emerald-200 bg-emerald-50/70 text-emerald-900',
      icon: 'text-emerald-600',
      defaultIcon: CheckCircle2,
    },
    warning: {
      wrap: 'border-amber-200 bg-amber-50/80 text-amber-900',
      icon: 'text-amber-600',
      defaultIcon: AlertTriangle,
    },
    danger: {
      wrap: 'border-rose-200 bg-rose-50/70 text-rose-900',
      icon: 'text-rose-600',
      defaultIcon: AlertTriangle,
    },
  };
  const style = tones[tone] || tones.info;
  const IconComponent = Icon || style.defaultIcon;
  return (
    <div className={cn('flex gap-3 rounded-xl border p-3.5', style.wrap, className)}>
      <IconComponent size={17} className={cn('mt-0.5 shrink-0', style.icon)} />
      <div className="text-xs leading-relaxed">
        {title ? <p className="font-bold">{title}</p> : null}
        <div className={title ? 'mt-0.5' : ''}>{children}</div>
      </div>
    </div>
  );
}
