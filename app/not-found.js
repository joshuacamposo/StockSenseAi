import Link from 'next/link';
import { Boxes, Compass } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center bg-slate-50 px-4">
      <div className="card w-full max-w-md p-8 text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-ink-900 text-white">
          <Boxes size={26} />
        </span>
        <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.18em] text-brand-600">
          404 · Page not found
        </p>
        <h1 className="mt-1 text-2xl font-extrabold text-slate-900">This page is not part of the demo</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">
          StockSense AI only includes the modules documented for the SA101 prefinal defense.
          Head back to the dashboard to continue.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-flex h-10 items-center gap-2 rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white hover:bg-brand-700"
        >
          <Compass size={16} />
          Return to dashboard
        </Link>
      </div>
    </div>
  );
}
